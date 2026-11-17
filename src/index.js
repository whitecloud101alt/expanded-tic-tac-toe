import { DurableObject } from "cloudflare:workers";
import { applyAction, createGame, makeExport, normalizeGame } from "./game-rules.js";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function roomCode() {
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return [...bytes].map((value) => ROOM_ALPHABET[value % ROOM_ALPHABET.length]).join("");
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    try {
      if (request.method === "POST" && url.pathname === "/api/rooms") {
        const body = await parseJson(request);
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const code = roomCode();
          const stub = env.GAME_ROOM.getByName(code);
          const response = await stub.fetch("https://room/create", {
            method: "POST",
            body: JSON.stringify({ code, game: body.game, config: body.config }),
          });
          if (response.status === 409) continue;
          const result = await response.json();
          return json({ ...result, code });
        }
        return json({ error: "Could not allocate a room code. Try again." }, 503);
      }

      const match = url.pathname.match(/^\/api\/rooms\/([A-Z2-9]{7})(?:\/(join|connect|import))?$/);
      if (!match) return json({ error: "Not found." }, 404);
      const [, code, operation] = match;
      const stub = env.GAME_ROOM.getByName(code);

      if (request.method === "POST" && operation === "join") {
        return stub.fetch("https://room/join", { method: "POST", body: await request.text() });
      }
      if (request.method === "GET" && operation === "connect") {
        return stub.fetch(new Request(`https://room/connect${url.search}`, request));
      }
      if (request.method === "POST" && operation === "import") {
        return stub.fetch(`https://room/import${url.search}`, { method: "POST", body: await request.text() });
      }
      if (request.method === "GET" && !operation) return stub.fetch("https://room/status");
      return json({ error: "Method not allowed." }, 405);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
    }
  },
};

export class GameRoom extends DurableObject {
  async getRoom() {
    return (await this.ctx.storage.get("room")) ?? null;
  }

  async saveRoom(room) {
    await this.ctx.storage.put("room", room);
  }

  publicState(room) {
    return {
      code: room.code,
      game: room.game,
      players: {
        X: true,
        O: Boolean(room.guestToken),
      },
    };
  }

  playerForToken(room, token) {
    if (token === room.hostToken) return "X";
    if (token && token === room.guestToken) return "O";
    return null;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const room = await this.getRoom();

    if (request.method === "POST" && url.pathname === "/create") {
      if (room) return json({ error: "Room already exists." }, 409);
      const body = await parseJson(request);
      const hostToken = crypto.randomUUID();
      const game = body.game ? normalizeGame(body.game) : createGame(body.config);
      const created = {
        code: body.code,
        hostToken,
        guestToken: null,
        game,
        recentActionIds: [],
        createdAt: Date.now(),
      };
      await this.saveRoom(created);
      return json({ token: hostToken, player: "X", state: this.publicState(created) }, 201);
    }

    if (!room) return json({ error: "Room not found." }, 404);

    if (request.method === "POST" && url.pathname === "/join") {
      const body = await parseJson(request);
      if (body.token && this.playerForToken(room, body.token)) {
        const player = this.playerForToken(room, body.token);
        return json({ token: body.token, player, state: this.publicState(room) });
      }
      if (room.guestToken) return json({ error: "This room already has two players." }, 409);
      room.guestToken = crypto.randomUUID();
      await this.saveRoom(room);
      this.broadcast(room, "player_joined");
      return json({ token: room.guestToken, player: "O", state: this.publicState(room) });
    }

    if (request.method === "GET" && url.pathname === "/status") {
      return json(this.publicState(room));
    }

    if (request.method === "POST" && url.pathname === "/import") {
      const token = url.searchParams.get("token");
      if (token !== room.hostToken) return json({ error: "Only Player 1 can import a room game." }, 403);
      const body = await parseJson(request);
      room.game = normalizeGame(body);
      room.game.stateVersion += 1;
      room.recentActionIds = [];
      await this.saveRoom(room);
      this.broadcast(room, "game_state");
      return json({ state: this.publicState(room) });
    }

    if (request.method === "GET" && url.pathname === "/connect") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return json({ error: "Expected a WebSocket upgrade." }, 426);
      }
      const token = url.searchParams.get("token");
      const player = this.playerForToken(room, token);
      if (!player) return json({ error: "Invalid room session." }, 403);
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server, [player]);
      server.serializeAttachment({ token, player });
      server.send(JSON.stringify({ type: "game_state", state: this.publicState(room), player }));
      return new Response(null, { status: 101, webSocket: client });
    }

    return json({ error: "Not found." }, 404);
  }

  async webSocketMessage(socket, message) {
    let payload;
    try {
      payload = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      socket.send(JSON.stringify({ type: "action_rejected", error: "Invalid message." }));
      return;
    }
    if (payload.type === "ping") {
      socket.send(JSON.stringify({ type: "pong" }));
      return;
    }
    if (payload.type !== "submit_action") return;

    const room = await this.getRoom();
    if (!room) return;
    const attachment = socket.deserializeAttachment();
    const player = this.playerForToken(room, attachment?.token);
    if (!player) {
      socket.send(JSON.stringify({ type: "action_rejected", error: "Your room session is no longer valid." }));
      return;
    }
    if (!room.guestToken) {
      socket.send(JSON.stringify({ type: "action_rejected", error: "Wait for Player 2 to join." }));
      return;
    }
    const actionId = typeof payload.actionId === "string" ? payload.actionId.slice(0, 100) : "";
    if (actionId && room.recentActionIds.includes(actionId)) {
      socket.send(JSON.stringify({ type: "game_state", state: this.publicState(room), player }));
      return;
    }
    if (payload.expectedVersion !== room.game.stateVersion) {
      socket.send(JSON.stringify({ type: "action_rejected", error: "The room changed; your board has been refreshed.", state: this.publicState(room) }));
      return;
    }

    try {
      room.game = applyAction(room.game, player, payload.action);
      if (actionId) room.recentActionIds = [...room.recentActionIds.slice(-99), actionId];
      await this.saveRoom(room);
      this.broadcast(room, room.game.winner ? "game_over" : "game_state");
    } catch (error) {
      socket.send(JSON.stringify({
        type: "action_rejected",
        error: error instanceof Error ? error.message : "That action was rejected.",
        state: this.publicState(room),
      }));
    }
  }

  webSocketClose() {}
  webSocketError() {}

  broadcast(room, type) {
    const message = JSON.stringify({ type, state: this.publicState(room) });
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        // Closed sockets disappear from getWebSockets after the close is observed.
      }
    }
  }
}
