const boardElement = document.querySelector("#board");
const viewport = document.querySelector("#boardViewport");
const markModeButton = document.querySelector("#markMode");
const expandModeButton = document.querySelector("#expandMode");
const blockerModeButton = document.querySelector("#blockerMode");
const expandControls = document.querySelector("#expandControls");
const blockerControls = document.querySelector("#blockerControls");
const expandLegend = document.querySelector("#expandLegend");
const blockLegend = document.querySelector("#blockLegend");
const confirmExpandButton = document.querySelector("#confirmExpand");
const cancelExpandButton = document.querySelector("#cancelExpand");
const confirmBlockerButton = document.querySelector("#confirmBlocker");
const cancelBlockerButton = document.querySelector("#cancelBlocker");
const selectionText = document.querySelector("#selectionText");
const progressDotsElement = document.querySelector("#progressDots");
let progressDots = [...progressDotsElement.querySelectorAll("i")];
const blockerSelectionText = document.querySelector("#blockerSelectionText");
const blockerProgressDots = [...document.querySelectorAll("#blockerProgressDots i")];
const gameTypeButton = document.querySelector("#gameTypeButton");
const gameTypeLabel = document.querySelector("#gameTypeLabel");
const setupModal = document.querySelector("#setupModal");
const setupForm = document.querySelector("#setupForm");
const closeSetupButton = document.querySelector("#closeSetup");
const gameSettings = document.querySelector("#gameSettings");
const targetScoreInput = document.querySelector("#targetScoreInput");
const scoringMethodInput = document.querySelector("#scoringMethodInput");
const blockersAwardedInput = document.querySelector("#blockersAwardedInput");
const pointsPerAwardInput = document.querySelector("#pointsPerAwardInput");
const lineLengthInput = document.querySelector("#lineLengthInput");
const expansionSizeInput = document.querySelector("#expansionSizeInput");
const blockersEnabledInput = document.querySelector("#blockersEnabledInput");
const startingBlockersXInput = document.querySelector("#startingBlockersXInput");
const startingBlockersOInput = document.querySelector("#startingBlockersOInput");
const presetButtons = [...document.querySelectorAll(".preset-button")];
const gameDescription = document.querySelector("#gameDescription");
const expandActionHint = document.querySelector("#expandActionHint");
const blockerActionHint = document.querySelector("#blockerActionHint");
const rulesExpansionCount = document.querySelector("#rulesExpansionCount");
const rulesBlockerText = document.querySelector("#rulesBlockerText");
const blockerRule = document.querySelector("#blockerRule");
const rulesGoal = document.querySelector("#rulesGoal");
const rulesGoalNumber = document.querySelector("#rulesGoalNumber");
const playerXStats = document.querySelector("#playerXStats");
const playerOStats = document.querySelector("#playerOStats");
const scoreXElement = document.querySelector("#scoreX");
const scoreOElement = document.querySelector("#scoreO");
const blockersXElement = document.querySelector("#blockersX");
const blockersOElement = document.querySelector("#blockersO");
const scoreStatElements = [...document.querySelectorAll(".score-stat")];
const blockerStatElements = [...document.querySelectorAll(".blocker-stat")];
const winnerMessage = document.querySelector("#winnerMessage");
const turnTitle = document.querySelector("#turnTitle");
const turnHint = document.querySelector("#turnHint");
const turnToken = document.querySelector("#turnToken");
const boardStatus = document.querySelector("#boardStatus");
const squareCount = document.querySelector("#squareCount");
const playerXCard = document.querySelector("#playerX");
const playerOCard = document.querySelector("#playerO");
const rulesModal = document.querySelector("#rulesModal");
const resultModal = document.querySelector("#resultModal");
const winnerToken = document.querySelector("#winnerToken");
const winnerTitle = document.querySelector("#winnerTitle");
const undoButton = document.querySelector("#undoButton");
const redoButton = document.querySelector("#redoButton");
const zoomOutButton = document.querySelector("#zoomOutButton");
const zoomInButton = document.querySelector("#zoomInButton");
const resetViewButton = document.querySelector("#resetViewButton");
const newGameButton = document.querySelector("#newGameButton");
const onlineButton = document.querySelector("#onlineButton");
const exportButton = document.querySelector("#exportButton");
const importButton = document.querySelector("#importButton");
const importFileInput = document.querySelector("#importFileInput");
const onlineModal = document.querySelector("#onlineModal");
const closeOnlineButton = document.querySelector("#closeOnline");
const createRoomButton = document.querySelector("#createRoomButton");
const joinRoomForm = document.querySelector("#joinRoomForm");
const roomCodeInput = document.querySelector("#roomCodeInput");
const onlineMessage = document.querySelector("#onlineMessage");
const roomBanner = document.querySelector("#roomBanner");
const roomStatus = document.querySelector("#roomStatus");
const roomCodeDisplay = document.querySelector("#roomCodeDisplay");
const connectionDot = document.querySelector("#connectionDot");
const copyRoomButton = document.querySelector("#copyRoomButton");
const leaveRoomButton = document.querySelector("#leaveRoomButton");
const toastElement = document.querySelector("#toast");

const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

const NEIGHBORS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.6;
const PRESETS = {
  original: {
    targetScore: 1,
    lineLength: 4,
    expansionSize: 4,
    scoringMethod: "lines",
    blockersEnabled: true,
    startingBlockersX: -1,
    startingBlockersO: -1,
    blockersAwarded: 0,
    pointsPerAward: 1,
  },
  five: {
    targetScore: 1,
    lineLength: 5,
    expansionSize: 4,
    scoringMethod: "lines",
    blockersEnabled: false,
    startingBlockersX: 0,
    startingBlockersO: 0,
    blockersAwarded: 0,
    pointsPerAward: 1,
  },
  twenty: {
    targetScore: 20,
    lineLength: 4,
    expansionSize: 4,
    scoringMethod: "tokens",
    blockersEnabled: true,
    startingBlockersX: 1,
    startingBlockersO: 1,
    blockersAwarded: 1,
    pointsPerAward: 4,
  },
};

let cells;
let currentPlayer;
let mode;
let expansionSelection;
let blockerSelection;
let winner;
let winningKeys;
let activePreset = "original";
let selectedPreset = "original";
let targetScore = 1;
let scoringMethod = "lines";
let blockersAwarded = 1;
let pointsPerAward = 1;
let startingBlockersX = -1;
let startingBlockersO = -1;
let lineLength = 4;
let expansionSize = 4;
let blockersEnabled = true;
let scores;
let blockers;
let scoredLines;
let scoredTokens;
let pan = { x: 0, y: 0 };
let zoom = 1;
let history;
let historyIndex;
let winnerTimer = null;
let wheelEndTimer = null;
let gestureStartZoom = 1;
let dragState = null;
let suppressClick = false;
let onlineSession = null;
let roomSocket = null;
let reconnectTimer = null;
let toastTimer = null;

function keyOf(x, y) {
  return `${x},${y}`;
}

function parseKey(key) {
  return key.split(",").map(Number);
}

function positionElement(element, x, y) {
  element.style.left = `calc(${x} * (var(--cell-size) + var(--gap)))`;
  element.style.top = `calc(${y} * (var(--cell-size) + var(--gap)))`;
}

function getLineLength() {
  return lineLength;
}

function getExpansionSize() {
  return expansionSize;
}

function blockersAreAvailable() {
  return blockersEnabled && (
    blockers[currentPlayer] === -1 || blockers[currentPlayer] > 0
  );
}

function canCurrentPlayerAct() {
  if (!onlineSession) return true;
  return Boolean(
    onlineSession.connected &&
    !onlineSession.pending &&
    onlineSession.players?.O &&
    onlineSession.player === currentPlayer
  );
}

function getGameConfig() {
  return {
    targetScore,
    lineLength,
    expansionSize,
    scoringMethod,
    blockersEnabled,
    startingBlockersX,
    startingBlockersO,
    blockersAwarded,
    pointsPerAward,
    preset: activePreset,
  };
}

function getPortableGame() {
  return {
    config: getGameConfig(),
    cells: [...cells.entries()],
    currentPlayer,
    scores: { ...scores },
    blockers: { ...blockers },
    scoredLines: [...scoredLines],
    scoredTokens: { X: [...scoredTokens.X], O: [...scoredTokens.O] },
    winner,
    winningKeys: [...winningKeys],
    stateVersion: onlineSession?.stateVersion ?? Math.max(0, historyIndex),
  };
}

function makeGameExport() {
  return {
    format: "expanded-tic-tac-toe",
    version: 1,
    exportedAt: new Date().toISOString(),
    game: getPortableGame(),
  };
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add("visible");
  toastTimer = window.setTimeout(() => toastElement.classList.remove("visible"), 2800);
}

function formatBlockers(value) {
  return value === -1 ? "∞" : String(value);
}

function resetGame() {
  window.clearTimeout(winnerTimer);
  winnerTimer = null;
  cells = new Map();
  for (let y = -1; y <= 1; y += 1) {
    for (let x = -1; x <= 1; x += 1) {
      cells.set(keyOf(x, y), null);
    }
  }

  currentPlayer = "X";
  mode = "mark";
  expansionSelection = new Set();
  blockerSelection = null;
  winner = null;
  winningKeys = new Set();
  scores = { X: 0, O: 0 };
  blockers = { X: startingBlockersX, O: startingBlockersO };
  scoredLines = new Set();
  scoredTokens = { X: new Set(), O: new Set() };
  pan = { x: 0, y: 0 };
  zoom = 1;
  history = [];
  historyIndex = -1;
  syncExpansionDots();
  updateGameCopy();
  recordHistory();
  setMode("mark");
  resultModal.close();
}

function applyPortableGame(payload, fromRoom = false) {
  const source = payload?.game ?? payload?.state?.game ?? payload?.state ?? payload;
  if (!source || typeof source !== "object" || !Array.isArray(source.cells)) {
    throw new Error("This file does not contain a valid game.");
  }
  const config = source.config ?? {};
  targetScore = clampInteger(config.targetScore, 1, 999, 1);
  lineLength = clampInteger(config.lineLength, 3, 50, 4);
  expansionSize = clampInteger(config.expansionSize, 1, 50, 4);
  scoringMethod = config.scoringMethod === "tokens" ? "tokens" : "lines";
  blockersEnabled = config.blockersEnabled !== false;
  startingBlockersX = clampInteger(config.startingBlockersX, -1, 999, -1);
  startingBlockersO = clampInteger(config.startingBlockersO, -1, 999, -1);
  blockersAwarded = clampInteger(config.blockersAwarded, 0, 99, 0);
  pointsPerAward = clampInteger(config.pointsPerAward, 1, 999, 1);
  activePreset = typeof config.preset === "string" ? config.preset : "custom";

  const importedCells = new Map();
  for (const entry of source.cells) {
    if (!Array.isArray(entry) || entry.length !== 2) throw new Error("Invalid board data.");
    const [key, value] = entry;
    if (
      typeof key !== "string" ||
      !/^-?\d+,-?\d+$/.test(key) ||
      ![null, "X", "O", "B"].includes(value)
    ) {
      throw new Error("Invalid board data.");
    }
    if (importedCells.has(key)) throw new Error("The board contains duplicate squares.");
    importedCells.set(key, value);
  }
  if (importedCells.size === 0 || importedCells.size > 10000) {
    throw new Error("The imported board size is invalid.");
  }

  window.clearTimeout(winnerTimer);
  winnerTimer = null;
  cells = importedCells;
  currentPlayer = source.currentPlayer === "O" ? "O" : "X";
  scores = {
    X: clampInteger(source.scores?.X, 0, 999999, 0),
    O: clampInteger(source.scores?.O, 0, 999999, 0),
  };
  blockers = {
    X: clampInteger(source.blockers?.X, -1, 999999, startingBlockersX),
    O: clampInteger(source.blockers?.O, -1, 999999, startingBlockersO),
  };
  scoredLines = new Set(Array.isArray(source.scoredLines) ? source.scoredLines : []);
  scoredTokens = {
    X: new Set(Array.isArray(source.scoredTokens?.X) ? source.scoredTokens.X : []),
    O: new Set(Array.isArray(source.scoredTokens?.O) ? source.scoredTokens.O : []),
  };
  winner = source.winner === "X" || source.winner === "O" ? source.winner : null;
  winningKeys = new Set(Array.isArray(source.winningKeys) ? source.winningKeys : []);
  expansionSelection = new Set();
  blockerSelection = null;
  if (fromRoom && onlineSession) {
    onlineSession.stateVersion = clampInteger(source.stateVersion, 0, Number.MAX_SAFE_INTEGER, 0);
  }
  syncExpansionDots();
  updateGameCopy();
  history = [];
  historyIndex = -1;
  recordHistory();
  resultModal.close();
  setMode("mark", true);
  if (winner) winnerTimer = window.setTimeout(showWinner, 350);
}

function setMode(nextMode, force = false) {
  if (winner && !force) return;
  if (nextMode === "blocker" && !blockersAreAvailable()) return;
  mode = nextMode;
  expansionSelection.clear();
  blockerSelection = null;
  markModeButton.classList.toggle("active", mode === "mark");
  expandModeButton.classList.toggle("active", mode === "expand");
  blockerModeButton.classList.toggle("active", mode === "blocker");
  expandControls.classList.toggle("hidden", mode !== "expand");
  blockerControls.classList.toggle("hidden", mode !== "blocker");
  expandLegend.classList.toggle("hidden", mode !== "expand");
  blockLegend.classList.toggle("hidden", mode !== "blocker");
  render();
}

function createSnapshot() {
  return {
    cells: [...cells.entries()],
    currentPlayer,
    winner,
    winningKeys: [...winningKeys],
    scores: { ...scores },
    blockers: { ...blockers },
    scoredLines: [...scoredLines],
    scoredTokens: {
      X: [...scoredTokens.X],
      O: [...scoredTokens.O],
    },
  };
}

function recordHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(createSnapshot());
  historyIndex = history.length - 1;
}

function restoreHistory(nextIndex) {
  if (nextIndex < 0 || nextIndex >= history.length) return;
  window.clearTimeout(winnerTimer);
  winnerTimer = null;
  historyIndex = nextIndex;
  const snapshot = history[historyIndex];
  cells = new Map(snapshot.cells);
  currentPlayer = snapshot.currentPlayer;
  winner = snapshot.winner;
  winningKeys = new Set(snapshot.winningKeys);
  scores = { ...snapshot.scores };
  blockers = { ...snapshot.blockers };
  scoredLines = new Set(snapshot.scoredLines);
  scoredTokens = {
    X: new Set(snapshot.scoredTokens.X),
    O: new Set(snapshot.scoredTokens.O),
  };
  expansionSelection = new Set();
  blockerSelection = null;
  resultModal.close();
  setMode("mark", true);
  if (winner) winnerTimer = window.setTimeout(showWinner, 250);
}

function undoMove() {
  restoreHistory(historyIndex - 1);
}

function redoMove() {
  restoreHistory(historyIndex + 1);
}

function setZoom(nextZoom, focalPoint = { x: 0, y: 0 }) {
  const previousZoom = zoom;
  const clampedZoom = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, Math.round(nextZoom * 100) / 100)
  );
  if (clampedZoom === previousZoom) return;

  const worldX = (focalPoint.x - pan.x) / previousZoom;
  const worldY = (focalPoint.y - pan.y) / previousZoom;
  pan.x = focalPoint.x - worldX * clampedZoom;
  pan.y = focalPoint.y - worldY * clampedZoom;
  zoom = clampedZoom;
  renderBoardTransform();
  updateViewControls();
}

function resetView() {
  pan = { x: 0, y: 0 };
  zoom = 1;
  renderBoardTransform();
  updateViewControls();
}

function renderBoardTransform() {
  boardElement.style.setProperty("--pan-x", `${pan.x}px`);
  boardElement.style.setProperty("--pan-y", `${pan.y}px`);
  boardElement.style.setProperty("--zoom", zoom);
}

function blockerMarkup() {
  return '<span class="blocker-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
}

function getExpansionCandidates() {
  const candidates = new Set();
  const anchors = new Set([...cells.keys(), ...expansionSelection]);

  for (const key of anchors) {
    const [x, y] = parseKey(key);
    for (const [dx, dy] of NEIGHBORS) {
      const neighborKey = keyOf(x + dx, y + dy);
      if (!cells.has(neighborKey) && !expansionSelection.has(neighborKey)) {
        candidates.add(neighborKey);
      }
    }
  }

  return candidates;
}

function render() {
  boardElement.innerHTML = "";
  renderBoardTransform();

  for (const [key, mark] of cells) {
    const [x, y] = parseKey(key);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    positionElement(cell, x, y);
    cell.dataset.key = key;
    cell.setAttribute("role", "gridcell");
    cell.setAttribute(
      "aria-label",
      mark ? `Square ${x}, ${y}: ${mark}` : `Empty square ${x}, ${y}`
    );

    if (mark === "B") {
      cell.classList.add("marked", "blocked");
      cell.innerHTML = blockerMarkup();
      cell.setAttribute("aria-label", `Blocked square ${x}, ${y}`);
    } else if (mark) {
      cell.classList.add("marked", `mark-${mark.toLowerCase()}`);
      cell.innerHTML = `<span class="mark">${mark}</span>`;
    }
    if (mode === "blocker" && mark === null) {
      cell.classList.add("blocker-target");
      if (blockerSelection === key) {
        cell.classList.add("blocker-preview");
        cell.innerHTML = blockerMarkup();
        cell.setAttribute("aria-label", `Selected blocker at ${x}, ${y}`);
      }
    }
    if (winningKeys.has(key)) cell.classList.add("winner");
    cell.addEventListener("click", handleBoardClick);
    boardElement.append(cell);
  }

  if ((mode === "expand" || mode === "blocker") && !winner) {
    const visibleKeys = new Set([
      ...expansionSelection,
      ...getExpansionCandidates(),
    ]);
    if (blockerSelection && !cells.has(blockerSelection)) {
      visibleKeys.add(blockerSelection);
    }
    for (const key of visibleKeys) {
      const [x, y] = parseKey(key);
      const ghost = document.createElement("button");
      ghost.type = "button";
      ghost.className = "ghost-cell";
      positionElement(ghost, x, y);
      ghost.dataset.key = key;
      const isExpansionSquare = expansionSelection.has(key);
      const isBlockerChoice = mode === "blocker";
      ghost.setAttribute("aria-label", isExpansionSquare
        ? `Remove new square at ${x}, ${y}`
        : isBlockerChoice
          ? `Place blocker at ${x}, ${y}`
          : `Add new square at ${x}, ${y}`);
      if (isExpansionSquare) ghost.classList.add("selected");
      if (isBlockerChoice) ghost.classList.add("blocker-ghost");
      if (blockerSelection === key) ghost.classList.add("blocker-selected");
      ghost.addEventListener(
        "click",
        mode === "expand" ? handleExpansionClick : handleBlockerClick
      );
      boardElement.append(ghost);
    }
  }

  updateInterface();
}

function handleBoardClick(event) {
  if (suppressClick || winner || !canCurrentPlayerAct()) return;
  const key = event.currentTarget.dataset.key;

  if (mode === "blocker") {
    if (cells.get(key) !== null) return;
    blockerSelection = blockerSelection === key ? null : key;
    render();
    return;
  }

  if (mode !== "mark") return;
  if (cells.get(key)) return;

  if (onlineSession) {
    submitOnlineAction({ type: "mark", key });
    return;
  }

  cells.set(key, currentPlayer);
  const completedLines = getCompletedLines(
    key,
    currentPlayer,
    getLineLength()
  );
  let pointsScored = 0;

  if (scoringMethod === "lines") {
    const newLines = completedLines.filter((line) => {
      const lineId = getLineId(currentPlayer, line);
      if (scoredLines.has(lineId)) return false;
      scoredLines.add(lineId);
      return true;
    });
    pointsScored = newLines.length;
    winningKeys = new Set(newLines.flat());
  } else {
    const qualifyingTokens = new Set(completedLines.flat());
    for (const tokenKey of qualifyingTokens) {
      if (!scoredTokens[currentPlayer].has(tokenKey)) {
        scoredTokens[currentPlayer].add(tokenKey);
        pointsScored += 1;
      }
    }
    winningKeys = qualifyingTokens;
  }

  if (pointsScored > 0) {
    const previousScore = scores[currentPlayer];
    scores[currentPlayer] += pointsScored;
    const opponent = currentPlayer === "X" ? "O" : "X";
    const awardsEarned =
      Math.floor(scores[currentPlayer] / pointsPerAward) -
      Math.floor(previousScore / pointsPerAward);
    if (
      blockersEnabled &&
      blockers[opponent] !== -1 &&
      awardsEarned > 0
    ) {
      blockers[opponent] += awardsEarned * blockersAwarded;
    }

    if (scores[currentPlayer] >= targetScore) {
      winner = currentPlayer;
      recordHistory();
      render();
      winnerTimer = window.setTimeout(showWinner, 500);
      return;
    }
  } else {
    winningKeys.clear();
  }

  endTurn();
}

function handleExpansionClick(event) {
  if (suppressClick || winner || mode !== "expand" || !canCurrentPlayerAct()) return;
  const key = event.currentTarget.dataset.key;

  if (expansionSelection.has(key)) {
    expansionSelection.delete(key);
    pruneDisconnectedSelection();
  } else if (
    expansionSelection.size < getExpansionSize() &&
    getExpansionCandidates().has(key)
  ) {
    expansionSelection.add(key);
  }

  render();
}

function handleBlockerClick(event) {
  if (suppressClick || winner || mode !== "blocker" || !canCurrentPlayerAct()) return;
  const key = event.currentTarget.dataset.key;

  if (getExpansionCandidates().has(key)) {
    blockerSelection = blockerSelection === key ? null : key;
  }

  render();
}

function pruneDisconnectedSelection() {
  if (expansionSelection.size === 0) return;

  const connectedToBoard = [];
  const reachable = new Set();

  for (const key of expansionSelection) {
    const [x, y] = parseKey(key);
    if (NEIGHBORS.some(([dx, dy]) => cells.has(keyOf(x + dx, y + dy)))) {
      connectedToBoard.push(key);
    }
  }

  while (connectedToBoard.length) {
    const key = connectedToBoard.pop();
    if (reachable.has(key)) continue;
    reachable.add(key);
    const [x, y] = parseKey(key);
    for (const [dx, dy] of NEIGHBORS) {
      const adjacent = keyOf(x + dx, y + dy);
      if (expansionSelection.has(adjacent) && !reachable.has(adjacent)) {
        connectedToBoard.push(adjacent);
      }
    }
  }

  expansionSelection = reachable;
}

function confirmExpansion() {
  if (expansionSelection.size !== getExpansionSize() || winner) return;
  if (onlineSession) {
    submitOnlineAction({ type: "expand", keys: [...expansionSelection] });
    return;
  }
  for (const key of expansionSelection) cells.set(key, null);
  expansionSelection.clear();
  winningKeys.clear();
  endTurn();
}

function confirmBlockerMove() {
  if (!blockerSelection || winner || !blockersAreAvailable()) return;
  if (onlineSession) {
    submitOnlineAction({ type: "blocker", key: blockerSelection });
    return;
  }
  cells.set(blockerSelection, "B");
  if (blockers[currentPlayer] !== -1) blockers[currentPlayer] -= 1;
  winningKeys.clear();
  blockerSelection = null;
  endTurn();
}

function endTurn() {
  currentPlayer = currentPlayer === "X" ? "O" : "X";
  recordHistory();
  setMode("mark");
}

function findWinningLine(lastKey, player) {
  const [originX, originY] = parseKey(lastKey);

  for (const [dx, dy] of DIRECTIONS) {
    const line = [lastKey];

    for (const sign of [-1, 1]) {
      let distance = 1;
      while (true) {
        const nextKey = keyOf(
          originX + dx * distance * sign,
          originY + dy * distance * sign
        );
        if (cells.get(nextKey) !== player) break;
        sign === -1 ? line.unshift(nextKey) : line.push(nextKey);
        distance += 1;
      }
    }

    if (line.length >= getLineLength()) return line;
  }

  return null;
}

function getCompletedLines(lastKey, player, length) {
  const [originX, originY] = parseKey(lastKey);
  const lines = [];

  for (const [dx, dy] of DIRECTIONS) {
    for (let startOffset = -(length - 1); startOffset <= 0; startOffset += 1) {
      const line = [];
      for (let step = 0; step < length; step += 1) {
        line.push(
          keyOf(
            originX + (startOffset + step) * dx,
            originY + (startOffset + step) * dy
          )
        );
      }
      if (line.every((cellKey) => cells.get(cellKey) === player)) lines.push(line);
    }
  }

  return lines;
}

function getLineId(player, line) {
  return `${player}:${line.join("|")}`;
}

function getPlayerName(player) {
  return player === "X" ? "Player 1" : "Player 2";
}

function syncExpansionDots() {
  const count = getExpansionSize();
  progressDotsElement.innerHTML = "";
  for (let index = 0; index < count; index += 1) {
    progressDotsElement.append(document.createElement("i"));
  }
  progressDots = [...progressDotsElement.querySelectorAll("i")];
}

function updateGameCopy() {
  const expansionSize = getExpansionSize();
  const lineLength = getLineLength();
  const expansionWords = `${expansionSize} connected square${expansionSize === 1 ? "" : "s"}`;
  const presetNames = {
    original: "Original",
    five: "Five in a row",
    twenty: "First to 20",
    custom: "Custom",
  };
  gameTypeLabel.textContent = presetNames[activePreset];
  expandActionHint.textContent = `Add ${expansionWords}`;
  rulesExpansionCount.textContent = `exactly ${expansionSize} empty square${expansionSize === 1 ? "" : "s"}`;
  blockerRule.classList.toggle(
    "hidden",
    !blockersEnabled
  );
  rulesGoalNumber.textContent = blockersEnabled ? "05" : "04";

  gameDescription.textContent = `Complete ${lineLength}-in-a-rows to score. First to ${targetScore} point${targetScore === 1 ? "" : "s"} wins.`;
  const scoringText = scoringMethod === "lines"
    ? "Each newly completed line scores one point"
    : "Each newly qualifying token scores one point";
  const blockerAwardText = blockersEnabled && blockersAwarded > 0
    ? ` The opponent receives ${blockersAwarded} blocker${blockersAwarded === 1 ? "" : "s"} every ${pointsPerAward} point${pointsPerAward === 1 ? "" : "s"}.`
    : "";
  rulesGoal.innerHTML = `${scoringText}. First to <strong>${targetScore}</strong> wins.${blockerAwardText}`;
  rulesBlockerText.textContent = "one available blocker";
}

function updateInterface() {
  const isX = currentPlayer === "X";
  playerXCard.classList.toggle("active", isX && !winner);
  playerOCard.classList.toggle("active", !isX && !winner);
  turnTitle.textContent = winner
    ? `${getPlayerName(winner)} wins`
    : `${getPlayerName(currentPlayer)} · ${currentPlayer}`;
  turnToken.textContent = currentPlayer;
  turnToken.className = `large-turn-token ${isX ? "x-token" : "o-token"}`;
  document.querySelector(".status-pulse").style.background = isX
    ? "var(--x)"
    : "var(--o)";

  if (winner) {
    turnHint.textContent = `${scores[winner]} point${scores[winner] === 1 ? "" : "s"} reached!`;
    boardStatus.textContent = `${getPlayerName(winner)} won the game`;
  } else if (mode === "expand") {
    const remaining = getExpansionSize() - expansionSelection.size;
    turnHint.textContent =
      remaining === 0 ? "Ready to expand." : `Choose ${remaining} more square${remaining === 1 ? "" : "s"}.`;
    boardStatus.textContent = `${getPlayerName(currentPlayer)} is growing the board`;
  } else if (mode === "blocker") {
    turnHint.textContent = blockerSelection
      ? "Ready to place the blocker."
      : "Choose an empty or connected square.";
    boardStatus.textContent = `${getPlayerName(currentPlayer)} is placing a blocker`;
  } else {
    turnHint.textContent = "Choose any empty square.";
    boardStatus.textContent = `${getPlayerName(currentPlayer)} is choosing a move`;
  }

  if (onlineSession && !onlineSession.players?.O && !winner) {
    turnHint.textContent = "Waiting for Player 2 to join.";
    boardStatus.textContent = "Share the room code with another player";
  } else if (onlineSession && onlineSession.player !== currentPlayer && !winner) {
    turnHint.textContent = "Waiting for the other player.";
  }

  const count = cells.size;
  squareCount.textContent = `${count} square${count === 1 ? "" : "s"}`;
  const expansionSize = getExpansionSize();
  selectionText.textContent = `${expansionSelection.size} of ${expansionSize} selected`;
  progressDots.forEach((dot, index) => {
    dot.classList.toggle("filled", index < expansionSelection.size);
  });
  const canAct = canCurrentPlayerAct();
  confirmExpandButton.disabled = expansionSelection.size !== expansionSize || !canAct;
  blockerSelectionText.textContent = blockerSelection
    ? "Blocker selected"
    : "Choose one blocker";
  blockerProgressDots[0].classList.toggle("filled", Boolean(blockerSelection));
  confirmBlockerButton.disabled = !blockerSelection || !canAct;
  playerXStats.classList.remove("hidden");
  playerOStats.classList.remove("hidden");
  scoreStatElements.forEach((element) => {
    element.classList.remove("hidden");
  });
  blockerStatElements.forEach((element) => {
    element.classList.toggle("hidden", !blockersEnabled);
  });
  scoreXElement.textContent = scores.X;
  scoreOElement.textContent = scores.O;
  blockersXElement.textContent = formatBlockers(blockers.X);
  blockersOElement.textContent = formatBlockers(blockers.O);
  const blockerAvailable = blockersAreAvailable();
  markModeButton.disabled = !canAct;
  expandModeButton.disabled = !canAct;
  blockerModeButton.disabled = !blockerAvailable || !canAct;
  blockerActionHint.textContent = blockersEnabled
    ? blockers[currentPlayer] === -1
      ? "Unlimited blockers remaining"
      : `${blockers[currentPlayer]} blocker${blockers[currentPlayer] === 1 ? "" : "s"} remaining`
    : "Disabled for this game";
  newGameButton.disabled = Boolean(onlineSession);
  gameTypeButton.disabled = Boolean(onlineSession);
  onlineButton.disabled = Boolean(onlineSession);
  updateViewControls();
}

function updateViewControls() {
  undoButton.disabled = Boolean(onlineSession) || historyIndex <= 0;
  redoButton.disabled = Boolean(onlineSession) || historyIndex >= history.length - 1;
  zoomOutButton.disabled = zoom <= MIN_ZOOM;
  zoomInButton.disabled = zoom >= MAX_ZOOM;
  resetViewButton.textContent = `${Math.round(zoom * 100)}%`;
}

function showWinner() {
  if (!winner) return;
  winnerTimer = null;
  winnerToken.textContent = winner;
  winnerToken.parentElement.style.color = winner === "X" ? "var(--x)" : "var(--o)";
  winnerToken.parentElement.style.background =
    winner === "X" ? "var(--x-soft)" : "var(--o-soft)";
  winnerTitle.textContent = `${getPlayerName(winner)} wins!`;
  winnerMessage.textContent = `${scores[winner]} point${scores[winner] === 1 ? "" : "s"} reached. What a run.`;
  resultModal.showModal();
}

function clampInteger(value, minimum, maximum, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function updateSetupFields() {
  const blockerOptionsDisabled = !blockersEnabledInput.checked;
  startingBlockersXInput.disabled = blockerOptionsDisabled;
  startingBlockersOInput.disabled = blockerOptionsDisabled;
  blockersAwardedInput.disabled = blockerOptionsDisabled;
  pointsPerAwardInput.disabled = blockerOptionsDisabled;
  gameSettings.classList.toggle("blockers-disabled", blockerOptionsDisabled);
}

function updatePresetButtons() {
  presetButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === selectedPreset);
  });
}

function setFormValues(settings) {
  targetScoreInput.value = settings.targetScore;
  lineLengthInput.value = settings.lineLength;
  expansionSizeInput.value = settings.expansionSize;
  scoringMethodInput.value = settings.scoringMethod;
  blockersEnabledInput.checked = settings.blockersEnabled;
  startingBlockersXInput.value = settings.startingBlockersX;
  startingBlockersOInput.value = settings.startingBlockersO;
  blockersAwardedInput.value = settings.blockersAwarded;
  pointsPerAwardInput.value = settings.pointsPerAward;
  updateSetupFields();
}

function applyPreset(presetName) {
  selectedPreset = presetName;
  setFormValues(PRESETS[presetName]);
  updatePresetButtons();
}

function openSetup() {
  selectedPreset = activePreset;
  setFormValues({
    targetScore,
    lineLength,
    expansionSize,
    scoringMethod,
    blockersEnabled,
    startingBlockersX,
    startingBlockersO,
    blockersAwarded,
    pointsPerAward,
  });
  updatePresetButtons();
  setupModal.showModal();
}

function startConfiguredGame(event) {
  event.preventDefault();
  activePreset = selectedPreset;
  startingBlockersX = clampInteger(startingBlockersXInput.value, -1, 999, -1);
  startingBlockersO = clampInteger(startingBlockersOInput.value, -1, 999, -1);
  targetScore = clampInteger(targetScoreInput.value, 1, 999, 1);
  blockersAwarded = clampInteger(blockersAwardedInput.value, 0, 99, 1);
  pointsPerAward = clampInteger(pointsPerAwardInput.value, 1, 999, 1);
  lineLength = clampInteger(lineLengthInput.value, 3, 50, 4);
  expansionSize = clampInteger(expansionSizeInput.value, 1, 50, 4);
  scoringMethod = scoringMethodInput.value === "tokens" ? "tokens" : "lines";
  blockersEnabled = blockersEnabledInput.checked;
  setupModal.close();
  resetGame();
}

function openRules() {
  rulesModal.showModal();
}

function closeRules() {
  rulesModal.close();
}

function startDrag(event) {
  if (event.button !== 0) return;
  if (event.target.closest(".cell, .ghost-cell, .board-tools")) return;
  dragState = {
    startX: event.clientX,
    startY: event.clientY,
    panX: pan.x,
    panY: pan.y,
    moved: false,
  };
  viewport.classList.add("dragging");
  viewport.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!dragState) return;
  const dx = event.clientX - dragState.startX;
  const dy = event.clientY - dragState.startY;
  if (Math.abs(dx) + Math.abs(dy) > 5) dragState.moved = true;
  pan.x = dragState.panX + dx;
  pan.y = dragState.panY + dy;
  boardElement.style.setProperty("--pan-x", `${pan.x}px`);
  boardElement.style.setProperty("--pan-y", `${pan.y}px`);
}

function endDrag(event) {
  if (!dragState) return;
  suppressClick = dragState.moved;
  dragState = null;
  viewport.classList.remove("dragging");
  if (viewport.hasPointerCapture(event.pointerId)) {
    viewport.releasePointerCapture(event.pointerId);
  }
  window.setTimeout(() => {
    suppressClick = false;
  }, 0);
}

function markViewportGestureActive() {
  window.clearTimeout(wheelEndTimer);
  viewport.classList.add("scrolling");
  wheelEndTimer = window.setTimeout(() => {
    viewport.classList.remove("scrolling");
  }, 140);
}

function getViewportFocalPoint(event) {
  const rect = viewport.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - rect.width / 2,
    y: event.clientY - rect.top - rect.height / 2,
  };
}

function handleWheel(event) {
  event.preventDefault();
  markViewportGestureActive();
  const rect = viewport.getBoundingClientRect();
  const focalPoint = getViewportFocalPoint(event);

  if (event.ctrlKey || event.metaKey) {
    const zoomFactor = Math.exp(-event.deltaY * 0.012);
    setZoom(zoom * zoomFactor, focalPoint);
    return;
  }

  const deltaScale =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 18
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? rect.height
        : 1;
  pan.x -= event.deltaX * deltaScale;
  pan.y -= event.deltaY * deltaScale;
  renderBoardTransform();
}

function handleGestureStart(event) {
  event.preventDefault();
  gestureStartZoom = zoom;
  markViewportGestureActive();
}

function handleGestureChange(event) {
  event.preventDefault();
  markViewportGestureActive();
  setZoom(gestureStartZoom * event.scale, getViewportFocalPoint(event));
}

function updateRoomUi() {
  const isOnline = Boolean(onlineSession);
  roomBanner.classList.toggle("hidden", !isOnline);
  if (!isOnline) return;
  roomCodeDisplay.textContent = onlineSession.code;
  connectionDot.classList.toggle("connected", onlineSession.connected);
  connectionDot.classList.toggle("disconnected", !onlineSession.connected);
  if (!onlineSession.connected) {
    roomStatus.textContent = "Reconnecting…";
  } else if (!onlineSession.players?.O) {
    roomStatus.textContent = "Waiting for Player 2";
  } else {
    roomStatus.textContent = `Connected as ${getPlayerName(onlineSession.player)}`;
  }
}

function saveRoomSession() {
  if (!onlineSession) return;
  localStorage.setItem("expandedTicTacToeRoom", JSON.stringify({
    code: onlineSession.code,
    token: onlineSession.token,
    player: onlineSession.player,
  }));
}

function clearSavedRoom() {
  localStorage.removeItem("expandedTicTacToeRoom");
}

function applyRoomState(state) {
  if (!onlineSession || !state?.game) return;
  onlineSession.players = state.players ?? onlineSession.players;
  onlineSession.pending = false;
  applyPortableGame(state.game, true);
  updateRoomUi();
}

function connectToRoom() {
  if (!onlineSession || onlineSession.leaving) return;
  window.clearTimeout(reconnectTimer);
  if (roomSocket) roomSocket.close();
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socketUrl = `${protocol}//${location.host}/api/rooms/${onlineSession.code}/connect?token=${encodeURIComponent(onlineSession.token)}`;
  roomSocket = new WebSocket(socketUrl);
  onlineSession.connected = false;
  updateRoomUi();
  updateInterface();

  roomSocket.addEventListener("open", () => {
    if (!onlineSession) return;
    onlineSession.connected = true;
    updateRoomUi();
    updateInterface();
  });
  roomSocket.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message.player && onlineSession) onlineSession.player = message.player;
    if (message.state) applyRoomState(message.state);
    if (message.type === "action_rejected") {
      if (onlineSession) onlineSession.pending = false;
      showToast(message.error || "That action was rejected.");
      updateInterface();
    }
  });
  roomSocket.addEventListener("close", () => {
    if (!onlineSession || onlineSession.leaving) return;
    onlineSession.connected = false;
    onlineSession.pending = false;
    updateRoomUi();
    updateInterface();
    reconnectTimer = window.setTimeout(connectToRoom, 1500);
  });
  roomSocket.addEventListener("error", () => roomSocket.close());
}

function beginOnlineSession(result, code) {
  onlineSession = {
    code,
    token: result.token,
    player: result.player,
    players: result.state?.players ?? { X: true, O: result.player === "O" },
    stateVersion: result.state?.game?.stateVersion ?? 0,
    connected: false,
    pending: false,
    leaving: false,
  };
  saveRoomSession();
  if (result.state) applyRoomState(result.state);
  onlineModal.close();
  connectToRoom();
}

async function createRoom() {
  onlineMessage.textContent = "Creating room…";
  createRoomButton.disabled = true;
  try {
    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: getPortableGame() }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not create the room.");
    beginOnlineSession(result, result.code);
    showToast(`Room ${result.code} created.`);
  } catch (error) {
    onlineMessage.textContent = error.message;
  } finally {
    createRoomButton.disabled = false;
  }
}

async function joinRoom(event) {
  event.preventDefault();
  const code = roomCodeInput.value.toUpperCase().replace(/[^A-Z2-9]/g, "");
  if (code.length !== 7) {
    onlineMessage.textContent = "Enter a seven-character room code.";
    return;
  }
  onlineMessage.textContent = "Joining room…";
  try {
    const response = await fetch(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not join the room.");
    beginOnlineSession(result, code);
  } catch (error) {
    onlineMessage.textContent = error.message;
  }
}

function submitOnlineAction(action) {
  if (!onlineSession || !roomSocket || roomSocket.readyState !== WebSocket.OPEN) {
    showToast("The room is reconnecting. Try again in a moment.");
    return;
  }
  onlineSession.pending = true;
  roomSocket.send(JSON.stringify({
    type: "submit_action",
    action,
    actionId: crypto.randomUUID(),
    expectedVersion: onlineSession.stateVersion,
  }));
  updateInterface();
}

function leaveRoom() {
  window.clearTimeout(reconnectTimer);
  if (onlineSession) onlineSession.leaving = true;
  if (roomSocket) roomSocket.close(1000, "Left room");
  roomSocket = null;
  onlineSession = null;
  clearSavedRoom();
  roomBanner.classList.add("hidden");
  history = [];
  historyIndex = -1;
  recordHistory();
  render();
  showToast("You left the online room. The current board is now local.");
}

async function resumeSavedRoom(saved) {
  try {
    const response = await fetch(`/api/rooms/${saved.code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: saved.token }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The saved room is no longer available.");
    beginOnlineSession(result, saved.code);
  } catch (error) {
    onlineSession = null;
    clearSavedRoom();
    openSetup();
    showToast(error.message);
  }
}

function restoreRoomSession() {
  try {
    const saved = JSON.parse(localStorage.getItem("expandedTicTacToeRoom"));
    if (!saved?.code || !saved?.token) return false;
    resumeSavedRoom(saved);
    return true;
  } catch {
    clearSavedRoom();
    return false;
  }
}

function exportGame() {
  const blob = new Blob([JSON.stringify(makeGameExport(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expanded-tic-tac-toe-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("Game exported.");
}

async function importGameFile(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload.format && payload.format !== "expanded-tic-tac-toe") {
      throw new Error("This is not an Expanded Tic Tac Toe game file.");
    }
    if (onlineSession) {
      if (onlineSession.player !== "X") throw new Error("Only Player 1 can import into an online room.");
      const response = await fetch(`/api/rooms/${onlineSession.code}/import?token=${encodeURIComponent(onlineSession.token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Import failed.");
      if (result.state) applyRoomState(result.state);
    } else {
      applyPortableGame(payload);
    }
    showToast("Game imported successfully.");
  } catch (error) {
    showToast(error.message || "Could not import that game.");
  } finally {
    importFileInput.value = "";
  }
}

undoButton.addEventListener("click", undoMove);
redoButton.addEventListener("click", redoMove);
zoomOutButton.addEventListener("click", () => setZoom(zoom - 0.1));
zoomInButton.addEventListener("click", () => setZoom(zoom + 0.1));
resetViewButton.addEventListener("click", resetView);
markModeButton.addEventListener("click", () => setMode("mark"));
expandModeButton.addEventListener("click", () => setMode("expand"));
blockerModeButton.addEventListener("click", () => setMode("blocker"));
confirmExpandButton.addEventListener("click", confirmExpansion);
cancelExpandButton.addEventListener("click", () => setMode("mark"));
confirmBlockerButton.addEventListener("click", confirmBlockerMove);
cancelBlockerButton.addEventListener("click", () => setMode("mark"));
newGameButton.addEventListener("click", openSetup);
gameTypeButton.addEventListener("click", openSetup);
for (const button of presetButtons) {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
}
setupForm.addEventListener("change", (event) => {
  if (event.target.closest(".preset-button")) return;
  selectedPreset = "custom";
  updatePresetButtons();
  if (event.target === blockersEnabledInput) updateSetupFields();
});
setupForm.addEventListener("submit", startConfiguredGame);
closeSetupButton.addEventListener("click", () => setupModal.close());
onlineButton.addEventListener("click", () => {
  onlineMessage.textContent = "";
  roomCodeInput.value = "";
  onlineModal.showModal();
});
closeOnlineButton.addEventListener("click", () => onlineModal.close());
createRoomButton.addEventListener("click", createRoom);
joinRoomForm.addEventListener("submit", joinRoom);
roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z2-9]/g, "");
});
copyRoomButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(onlineSession?.code ?? "");
  showToast("Room code copied.");
});
leaveRoomButton.addEventListener("click", leaveRoom);
exportButton.addEventListener("click", exportGame);
importButton.addEventListener("click", () => importFileInput.click());
importFileInput.addEventListener("change", () => importGameFile(importFileInput.files[0]));
document.querySelector("#rulesButton").addEventListener("click", openRules);
document.querySelector("#closeRules").addEventListener("click", closeRules);
document.querySelector("#gotItButton").addEventListener("click", closeRules);
document.querySelector("#playAgainButton").addEventListener("click", resetGame);
rulesModal.addEventListener("click", (event) => {
  if (event.target === rulesModal) closeRules();
});
resultModal.addEventListener("click", (event) => {
  if (event.target === resultModal) resultModal.close();
});
viewport.addEventListener("pointerdown", startDrag);
viewport.addEventListener("pointermove", moveDrag);
viewport.addEventListener("pointerup", endDrag);
viewport.addEventListener("pointercancel", endDrag);
viewport.addEventListener("wheel", handleWheel, { passive: false });
viewport.addEventListener("gesturestart", handleGestureStart, { passive: false });
viewport.addEventListener("gesturechange", handleGestureChange, { passive: false });

resetGame();
if (!restoreRoomSession()) openSetup();
