/* ============================================================
   Number Guessing Game – Game Logic
   St. George's College Aruvithura | Semester IV Micro Project
   Team: Albin Mathews & Muhammed Nihal
   ============================================================ */

"use strict";

/* ── DOM References ── */
const playerNameInput = document.getElementById("player-name");
const lockBtn         = document.getElementById("lock-btn");
const nameHint        = document.getElementById("name-hint");
const guessInput      = document.getElementById("guess-input");
const submitBtn       = document.getElementById("submit-btn");
const feedbackMsg     = document.getElementById("feedback-message");
const attemptsCounter = document.getElementById("attempts-counter");
const winOverlay      = document.getElementById("win-overlay");
const winSub          = document.getElementById("win-sub");
const playAgainBtn    = document.getElementById("play-again-btn");
const scoreTbody      = document.getElementById("score-tbody");
const emptyBoardMsg   = document.getElementById("empty-board-msg");
const clearBtn        = document.getElementById("clear-btn");
const bgParticles     = document.getElementById("bg-particles");

/* ── Game State ── */
let secretNumber   = 0;
let attempts       = 0;
let nameLocked     = false;
let gameOver       = false;

const STORAGE_KEY = "ngg_scores_v1";   // localStorage key
const MAX_SCORES  = 10;                // show top 10

/* ── Initialise ── */
function init() {
  secretNumber = Math.floor(Math.random() * 100) + 1;
  attempts     = 0;
  gameOver     = false;

  clearFeedback();
  winOverlay.classList.add("hidden");
  guessInput.value = "";

  // Enable / disable inputs based on lock state
  if (nameLocked) {
    guessInput.disabled = false;
    submitBtn.disabled  = false;
  }

  renderScoreboard();
  buildParticles();
}

/* ── Name Locking ── */
function lockName() {
  const name = playerNameInput.value.trim();
  if (!name) {
    showFeedback("⚠️  Please enter your name first.", "error");
    playerNameInput.focus();
    return;
  }

  nameLocked = true;
  playerNameInput.disabled = true;
  playerNameInput.classList.add("locked");
  lockBtn.textContent = "🔒";
  lockBtn.disabled    = true;
  nameHint.textContent = `Playing as "${name}" — good luck! 🎮`;
  nameHint.style.color = "var(--clr-gold)";

  guessInput.disabled = false;
  submitBtn.disabled  = false;
  guessInput.focus();
  clearFeedback();
}

lockBtn.addEventListener("click", lockName);

playerNameInput.addEventListener("keydown", e => {
  if (e.key === "Enter") lockName();
});

/* ── Guess Submission ── */
submitBtn.addEventListener("click", handleGuess);

guessInput.addEventListener("keydown", e => {
  if (e.key === "Enter") handleGuess();
});

function handleGuess() {
  if (!nameLocked || gameOver) return;

  const raw   = guessInput.value.trim();
  const guess = parseInt(raw, 10);

  // Validation
  if (raw === "" || isNaN(guess) || guess < 1 || guess > 100) {
    showFeedback("⚠️  Enter a valid number between 1 and 100.", "error");
    guessInput.select();
    return;
  }

  attempts++;
  guessInput.value = "";
  guessInput.focus();

  if (guess < secretNumber) {
    showFeedback("📈  Try a higher number!", "higher");
    updateAttemptsCounter();
  } else if (guess > secretNumber) {
    showFeedback("📉  Try a lower number!", "lower");
    updateAttemptsCounter();
  } else {
    // Correct!
    showFeedback(`✅  Correct! The number was ${secretNumber}.`, "correct");
    gameOver = true;
    guessInput.disabled = true;
    submitBtn.disabled  = true;

    saveScore(playerNameInput.value.trim(), attempts);
    renderScoreboard();
    showWinOverlay();
  }
}

/* ── Feedback helpers ── */
function showFeedback(text, type) {
  feedbackMsg.className = `feedback-message show ${type}`;
  feedbackMsg.textContent = text;
}

function clearFeedback() {
  feedbackMsg.className = "feedback-message";
  feedbackMsg.textContent = "";
  attemptsCounter.textContent = "";
}

function updateAttemptsCounter() {
  attemptsCounter.textContent = `Attempts so far: ${attempts}`;
}

/* ── Win overlay ── */
function showWinOverlay() {
  winSub.textContent = `${playerNameInput.value.trim()} guessed it in ${attempts} ${attempts === 1 ? "attempt" : "attempts"}!`;
  winOverlay.classList.remove("hidden");
}

playAgainBtn.addEventListener("click", () => {
  // Unlock player name for new session
  nameLocked = false;
  playerNameInput.disabled = false;
  playerNameInput.classList.remove("locked");
  playerNameInput.value = "";
  lockBtn.textContent  = "🔓";
  lockBtn.disabled     = false;
  nameHint.textContent = "Enter your name and press Enter or the lock icon to start";
  nameHint.style.color = "";

  guessInput.disabled = true;
  submitBtn.disabled  = true;

  init();
  playerNameInput.focus();
});

/* ── LocalStorage Scoreboard ── */
function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveScore(name, attempts) {
  const scores = loadScores();

  // Update existing player if fewer attempts, otherwise add new
  const existing = scores.findIndex(s => s.name.toLowerCase() === name.toLowerCase());
  if (existing !== -1) {
    if (attempts < scores[existing].attempts) {
      scores[existing].attempts = attempts;
    }
  } else {
    scores.push({ name, attempts });
  }

  // Sort by attempts (ascending) and keep top MAX_SCORES
  scores.sort((a, b) => a.attempts - b.attempts);
  const trimmed = scores.slice(0, MAX_SCORES);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

function renderScoreboard() {
  const scores = loadScores();
  scoreTbody.innerHTML = "";

  if (scores.length === 0) {
    emptyBoardMsg.style.display = "block";
    return;
  }

  emptyBoardMsg.style.display = "none";

  scores.forEach((entry, idx) => {
    const rank = idx + 1;
    const tr   = document.createElement("tr");
    tr.classList.add("score-row-new");

    // Rank cell
    const rankTd = document.createElement("td");
    const badge  = document.createElement("span");
    badge.classList.add("rank-badge");
    if      (rank === 1) badge.classList.add("rank-1");
    else if (rank === 2) badge.classList.add("rank-2");
    else if (rank === 3) badge.classList.add("rank-3");
    else                 badge.classList.add("rank-other");
    badge.textContent = rank;
    rankTd.appendChild(badge);

    // Name cell
    const nameTd = document.createElement("td");
    nameTd.classList.add("player-cell");
    if (rank === 1) nameTd.classList.add("top");
    nameTd.textContent = entry.name;

    // Attempts cell
    const attTd = document.createElement("td");
    attTd.classList.add("attempts-cell");
    attTd.textContent = entry.attempts;

    tr.appendChild(rankTd);
    tr.appendChild(nameTd);
    tr.appendChild(attTd);
    scoreTbody.appendChild(tr);
  });
}

/* ── Clear Scoreboard ── */
clearBtn.addEventListener("click", () => {
  if (confirm("Clear all scores? This cannot be undone.")) {
    localStorage.removeItem(STORAGE_KEY);
    renderScoreboard();
  }
});

/* ── Background Particles ── */
function buildParticles() {
  bgParticles.innerHTML = "";
  const colors = ["#c0392b", "#e74c3c", "#f4c03f", "#8e44ad", "#2c3e50"];
  const count  = 22;

  for (let i = 0; i < count; i++) {
    const el   = document.createElement("div");
    el.classList.add("particle");

    const size     = Math.random() * 10 + 4;          // 4–14 px
    const left     = Math.random() * 100;              // % from left
    const duration = Math.random() * 14 + 10;         // 10–24 s
    const delay    = Math.random() * -20;              // stagger
    const color    = colors[Math.floor(Math.random() * colors.length)];

    Object.assign(el.style, {
      width:                `${size}px`,
      height:               `${size}px`,
      left:                 `${left}%`,
      background:           color,
      animationDuration:    `${duration}s`,
      animationDelay:       `${delay}s`,
    });

    bgParticles.appendChild(el);
  }
}

/* ── Kick-off ── */
init();
playerNameInput.focus();
