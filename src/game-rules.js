export const GAME_FORMAT = "expanded-tic-tac-toe";
export const GAME_FORMAT_VERSION = 1;

const DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const NEIGHBORS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],            [1, 0],
  [-1, 1],  [0, 1],   [1, 1],
];

function keyOf(x, y) {
  return `${x},${y}`;
}

function parseKey(key) {
  if (typeof key !== "string" || !/^-?\d+,-?\d+$/.test(key)) {
    throw new Error("Invalid board coordinate.");
  }
  const [x, y] = key.split(",").map(Number);
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    throw new Error("Invalid board coordinate.");
  }
  return [x, y];
}

function integer(value, minimum, maximum, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed)
    ? Math.min(maximum, Math.max(minimum, parsed))
    : fallback;
}

export function normalizeConfig(input = {}) {
  return {
    targetScore: integer(input.targetScore, 1, 999, 1),
    lineLength: integer(input.lineLength, 3, 50, 4),
    expansionSize: integer(input.expansionSize, 1, 50, 4),
    scoringMethod: input.scoringMethod === "tokens" ? "tokens" : "lines",
    blockersEnabled: input.blockersEnabled !== false,
    startingBlockersX: integer(input.startingBlockersX, -1, 999, -1),
    startingBlockersO: integer(input.startingBlockersO, -1, 999, -1),
    blockersAwarded: integer(input.blockersAwarded, 0, 99, 0),
    pointsPerAward: integer(input.pointsPerAward, 1, 999, 1),
    preset: typeof input.preset === "string" ? input.preset.slice(0, 40) : "custom",
  };
}

export function createGame(configInput = {}) {
  const config = normalizeConfig(configInput);
  const cells = [];
  for (let y = -1; y <= 1; y += 1) {
    for (let x = -1; x <= 1; x += 1) cells.push([keyOf(x, y), null]);
  }
  return {
    config,
    cells,
    currentPlayer: "X",
    scores: { X: 0, O: 0 },
    blockers: { X: config.startingBlockersX, O: config.startingBlockersO },
    scoredLines: [],
    scoredTokens: { X: [], O: [] },
    winner: null,
    winningKeys: [],
    stateVersion: 0,
  };
}

function normalizeCells(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > 10000) {
    throw new Error("The imported board has an invalid size.");
  }
  const cells = new Map();
  for (const entry of input) {
    if (!Array.isArray(entry) || entry.length !== 2) throw new Error("Invalid cell data.");
    const key = entry[0];
    parseKey(key);
    const value = entry[1];
    if (![null, "X", "O", "B"].includes(value)) throw new Error("Invalid cell value.");
    if (cells.has(key)) throw new Error("The imported board contains duplicate cells.");
    cells.set(key, value);
  }
  return [...cells.entries()];
}

export function normalizeGame(input) {
  const source = input?.game ?? input?.state ?? input;
  if (!source || typeof source !== "object") throw new Error("No game state was provided.");
  const config = normalizeConfig(source.config ?? source);
  const game = createGame(config);
  game.cells = normalizeCells(source.cells);
  game.currentPlayer = source.currentPlayer === "O" ? "O" : "X";
  game.scores = {
    X: integer(source.scores?.X, 0, 999999, 0),
    O: integer(source.scores?.O, 0, 999999, 0),
  };
  game.blockers = {
    X: integer(source.blockers?.X, -1, 999999, config.startingBlockersX),
    O: integer(source.blockers?.O, -1, 999999, config.startingBlockersO),
  };
  game.scoredLines = Array.isArray(source.scoredLines)
    ? source.scoredLines.filter((value) => typeof value === "string").slice(0, 50000)
    : [];
  game.scoredTokens = {
    X: Array.isArray(source.scoredTokens?.X) ? source.scoredTokens.X.filter((v) => typeof v === "string") : [],
    O: Array.isArray(source.scoredTokens?.O) ? source.scoredTokens.O.filter((v) => typeof v === "string") : [],
  };
  game.winner = source.winner === "X" || source.winner === "O" ? source.winner : null;
  game.winningKeys = Array.isArray(source.winningKeys)
    ? source.winningKeys.filter((value) => typeof value === "string")
    : [];
  game.stateVersion = integer(source.stateVersion, 0, Number.MAX_SAFE_INTEGER, 0);
  return game;
}

export function makeExport(game) {
  return {
    format: GAME_FORMAT,
    version: GAME_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    game: normalizeGame(game),
  };
}

function getExpansionCandidates(cells) {
  const candidates = new Set();
  for (const key of cells.keys()) {
    const [x, y] = parseKey(key);
    for (const [dx, dy] of NEIGHBORS) {
      const next = keyOf(x + dx, y + dy);
      if (!cells.has(next)) candidates.add(next);
    }
  }
  return candidates;
}

function validateExpansion(cells, keys, requiredSize) {
  if (!Array.isArray(keys) || keys.length !== requiredSize) {
    throw new Error(`An expansion must contain exactly ${requiredSize} squares.`);
  }
  const selected = new Set(keys);
  if (selected.size !== keys.length) throw new Error("Expansion squares must be unique.");
  for (const key of selected) {
    parseKey(key);
    if (cells.has(key)) throw new Error("An expansion square already exists.");
  }

  const queue = [];
  const reachable = new Set();
  for (const key of selected) {
    const [x, y] = parseKey(key);
    if (NEIGHBORS.some(([dx, dy]) => cells.has(keyOf(x + dx, y + dy)))) queue.push(key);
  }
  while (queue.length) {
    const key = queue.pop();
    if (reachable.has(key)) continue;
    reachable.add(key);
    const [x, y] = parseKey(key);
    for (const [dx, dy] of NEIGHBORS) {
      const next = keyOf(x + dx, y + dy);
      if (selected.has(next) && !reachable.has(next)) queue.push(next);
    }
  }
  if (reachable.size !== selected.size) {
    throw new Error("Every expansion square must connect to the board or this expansion.");
  }
}

function completedLines(cells, lastKey, player, length) {
  const [originX, originY] = parseKey(lastKey);
  const lines = [];
  for (const [dx, dy] of DIRECTIONS) {
    for (let offset = -(length - 1); offset <= 0; offset += 1) {
      const line = [];
      for (let step = 0; step < length; step += 1) {
        line.push(keyOf(originX + (offset + step) * dx, originY + (offset + step) * dy));
      }
      if (line.every((key) => cells.get(key) === player)) lines.push(line);
    }
  }
  return lines;
}

export function applyAction(gameInput, player, action) {
  const game = normalizeGame(gameInput);
  if (game.winner) throw new Error("This game is already over.");
  if (player !== game.currentPlayer) throw new Error("It is not your turn.");
  if (!action || typeof action !== "object") throw new Error("Invalid action.");

  const cells = new Map(game.cells);
  game.winningKeys = [];

  if (action.type === "mark") {
    const key = action.key;
    parseKey(key);
    if (!cells.has(key) || cells.get(key) !== null) throw new Error("That square is not empty.");
    cells.set(key, player);
    const lines = completedLines(cells, key, player, game.config.lineLength);
    let points = 0;
    if (game.config.scoringMethod === "lines") {
      const scored = new Set(game.scoredLines);
      const fresh = lines.filter((line) => {
        const id = `${player}:${line.join("|")}`;
        if (scored.has(id)) return false;
        scored.add(id);
        return true;
      });
      game.scoredLines = [...scored];
      points = fresh.length;
      game.winningKeys = [...new Set(fresh.flat())];
    } else {
      const scored = new Set(game.scoredTokens[player]);
      const qualifying = new Set(lines.flat());
      for (const token of qualifying) {
        if (!scored.has(token)) {
          scored.add(token);
          points += 1;
        }
      }
      game.scoredTokens[player] = [...scored];
      game.winningKeys = [...qualifying];
    }

    if (points > 0) {
      const oldScore = game.scores[player];
      game.scores[player] += points;
      const opponent = player === "X" ? "O" : "X";
      const awards =
        Math.floor(game.scores[player] / game.config.pointsPerAward) -
        Math.floor(oldScore / game.config.pointsPerAward);
      if (game.config.blockersEnabled && game.blockers[opponent] !== -1) {
        game.blockers[opponent] += awards * game.config.blockersAwarded;
      }
      if (game.scores[player] >= game.config.targetScore) game.winner = player;
    }
  } else if (action.type === "expand") {
    validateExpansion(cells, action.keys, game.config.expansionSize);
    for (const key of action.keys) cells.set(key, null);
  } else if (action.type === "blocker") {
    if (!game.config.blockersEnabled) throw new Error("Blockers are disabled.");
    if (game.blockers[player] !== -1 && game.blockers[player] <= 0) {
      throw new Error("You have no blockers remaining.");
    }
    const key = action.key;
    parseKey(key);
    if (cells.has(key)) {
      if (cells.get(key) !== null) throw new Error("That square is occupied.");
    } else if (!getExpansionCandidates(cells).has(key)) {
      throw new Error("A new blocker must touch the current board.");
    }
    cells.set(key, "B");
    if (game.blockers[player] !== -1) game.blockers[player] -= 1;
  } else {
    throw new Error("Unknown action type.");
  }

  game.cells = [...cells.entries()];
  if (!game.winner) game.currentPlayer = player === "X" ? "O" : "X";
  game.stateVersion += 1;
  return game;
}
