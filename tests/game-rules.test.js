import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, createGame, makeExport, normalizeGame } from "../src/game-rules.js";

function playMarks(game, marks) {
  let next = game;
  for (const [player, key] of marks) {
    next.currentPlayer = player;
    next = applyAction(next, player, { type: "mark", key });
  }
  return next;
}

test("line scoring awards one point and ends the Original preset", () => {
  let game = createGame({
    targetScore: 1,
    lineLength: 4,
    blockersEnabled: true,
    startingBlockersX: -1,
    startingBlockersO: -1,
  });
  game = playMarks(game, [["X", "-1,-1"], ["X", "0,-1"], ["X", "1,-1"]]);
  game.cells.push(["2,-1", null]);
  game.currentPlayer = "X";
  game = applyAction(game, "X", { type: "mark", key: "2,-1" });
  assert.equal(game.scores.X, 1);
  assert.equal(game.winner, "X");
});

test("token scoring counts five unique qualifying tokens", () => {
  let game = createGame({ targetScore: 20, lineLength: 4, scoringMethod: "tokens" });
  game.cells = [["0,0", "X"], ["1,0", "X"], ["2,0", null], ["3,0", "X"], ["4,0", "X"]];
  game.currentPlayer = "X";
  game = applyAction(game, "X", { type: "mark", key: "2,0" });
  assert.equal(game.scores.X, 5);
});

test("token scoring counts crossed lines as seven unique tokens", () => {
  let game = createGame({ targetScore: 20, lineLength: 4, scoringMethod: "tokens" });
  game.cells = [
    ["0,0", null], ["-1,0", "X"], ["-2,0", "X"], ["-3,0", "X"],
    ["0,-1", "X"], ["0,-2", "X"], ["0,-3", "X"],
  ];
  game.currentPlayer = "X";
  game = applyAction(game, "X", { type: "mark", key: "0,0" });
  assert.equal(game.scores.X, 7);
});

test("blocker rewards honor the points interval", () => {
  let game = createGame({
    targetScore: 20,
    lineLength: 4,
    scoringMethod: "tokens",
    startingBlockersX: 1,
    startingBlockersO: 1,
    blockersAwarded: 1,
    pointsPerAward: 4,
  });
  game.cells = [["0,0", "X"], ["1,0", "X"], ["2,0", null], ["3,0", "X"], ["4,0", "X"]];
  game.currentPlayer = "X";
  game = applyAction(game, "X", { type: "mark", key: "2,0" });
  assert.equal(game.scores.X, 5);
  assert.equal(game.blockers.O, 2);
});

test("unlimited blockers remain unlimited after use", () => {
  let game = createGame({ startingBlockersX: -1 });
  game = applyAction(game, "X", { type: "blocker", key: "0,0" });
  assert.equal(game.blockers.X, -1);
});

test("import validation rejects duplicate board coordinates", () => {
  assert.throws(
    () => normalizeGame({ cells: [["0,0", null], ["0,0", "X"]] }),
    /duplicate/i
  );
});

test("exported games round-trip through import normalization", () => {
  const original = createGame({ targetScore: 20, scoringMethod: "tokens" });
  original.scores.X = 7;
  original.scoredTokens.X = ["-1,-1", "0,-1"];
  const restored = normalizeGame(makeExport(original));
  assert.deepEqual(restored, original);
});
