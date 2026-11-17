# Expanded Tic Tac Toe

A configurable expanded tic-tac-toe game with local play, private online rooms,
real-time synchronization, reconnection, and portable game files.

## Play

Install dependencies and start the Cloudflare development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Wrangler. Directly opening `index.html` still supports
local play, but rooms require the Worker server.

## Online rooms

- Create a room from the current game and share its seven-character code.
- Player 1 is X and Player 2 is O.
- Each browser receives a private session token; the room code alone cannot
  impersonate a player.
- The Durable Object validates moves, turns, expansion connectivity, blockers,
  scoring, and victory before broadcasting state.
- Room state is stored in Durable Object storage and reconnects after refresh.
- Player 1 can import a game into a live room; either player can export it.

## Import and export

Use the Export button to download a versioned JSON save. Import restores the board,
settings, turn, scores, inventories, previously scored lines/tokens, and winner.
Malformed files and duplicate board coordinates are rejected.

## Deploy

```sh
npm run deploy
```

`wrangler.jsonc` serves `public/` and routes `/api/*` through the Worker. The
`GameRoom` Durable Object uses SQLite-backed storage declared through Wrangler's
`exports` configuration.

## Rules implemented

- Player X goes first.
- A mark can be placed on any empty square already on the board.
- An expansion uses the entire turn and adds a connected group of squares.
- Each expansion is one connected group that touches the existing board by an edge
  or corner.
- A blocker move places one neutral blocker and adds no regular expansion squares.
- The blocker may occupy an existing empty square or a new square touching the board.
- Blockers are permanent occupied squares and interrupt winning lines.

### Custom game settings

- Target score, required line length, and squares per expansion are configurable.
- Scoring can count newly completed line segments or newly qualifying unique tokens.
- Blocker moves can be enabled or disabled.
- Player 1 and Player 2 have independently configurable starting blocker inventories.
- A starting inventory of `-1` means unlimited blockers.
- Blocker placement consumes one blocker and is unavailable at zero.
- Blocker rewards support a configurable amount and point interval.

### Presets

- **Original:** first to 1 point, four in a row, four-square expansions, unlimited blockers.
- **Five in a row:** first to 1 point, five in a row, four-square expansions, no blockers.
- **First to 20:** four in a row, four-square expansions, one starting blocker each, and one blocker awarded to the opponent every four points.

## Board controls

- Use the minus and plus buttons to zoom from 20% to 160%.
- Select the percentage between them to reset zoom and board position.
- The back and forward arrows undo or redo complete turns.
- Drag empty space in the board area to pan around the grid.
- On a trackpad, two-finger scrolling pans and pinching zooms around the pointer.
