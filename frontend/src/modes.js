import { initializeFlashcard } from "./components/flashcard.js";
import { initializeQuiz, stopQuizTimer } from "./components/quiz.js";

// Main function to start modes
export function startMode(modeType) {
  // Check if the mode is available
  const modeElement = document.querySelector(
    `[onclick="startMode('${modeType}')"]`
  );
  if (modeElement && modeElement.classList.contains("coming-soon")) {
    showComingSoonModal(modeType);
    return;
  }

  hideAllPages();
  hideModeContainers();

  switch (modeType) {
    case "flashcards":
      startFlashcardsMode();
      break;
    case "quiz":
      startQuizMode();
      break;
    case "writing":
      startWritingMode();
      break;
    case "speed":
      startSpeedMode();
      break;
    default:
      console.error("Nieznany tryb:", modeType);
      showPage("modesPage");
  }
}

// Function to hide all pages
function hideAllPages() {
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => {
    page.style.display = "none";
  });
}

// function to hide all mode containers
function hideModeContainers() {
  const modeContainers = document.querySelectorAll(
    "#flashcard-container, #quiz-container, #writing-mode-container, .mode-interface, .flashcard-card, .quiz-card"
  );
  modeContainers.forEach((container) => {
    container.style.display = "none";
  });
}

// Flashcards Mode (Classic Flashcards)
function startFlashcardsMode() {
  document.getElementById("modesPage").style.display = "block";

  const modesGrid = document.querySelector(".modes-grid");
  const pageHeader = document.querySelector("#modesPage .page-header");

  if (modesGrid) modesGrid.style.display = "none";
  if (pageHeader) pageHeader.style.display = "none";

  // Create or show flashcard container
  let flashcardContainer = document.getElementById("flashcard-container");
  if (!flashcardContainer) {
    flashcardContainer = createFlashcardInterface();
    document.getElementById("modesPage").appendChild(flashcardContainer);
  }

  flashcardContainer.style.display = "block";

  initializeFlashcard();
}

// Function to create flashcard interface
function createFlashcardInterface() {
  const container = document.createElement("div");
  container.id = "flashcard-container";
  container.className = "flashcard-card";

  container.innerHTML = `
        <div class="mode-header">
            <button class="back-button" onclick="returnToModes()">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Powrót do trybów
            </button>
            <h1>🃏 Fiszki Klasyczne</h1>
        </div>

        <div class="flashcard-start-container" id="initialView">
            <p>Rozpocznij nową sesję nauki z fiszkami.</p>
            <button class="btn btn-start" id="startButton">START</button>
        </div>

        <div id="flashcardView" style="display: none">
            <div class="progress-container">
                <div class="progress-bar" id="progressBar"></div>
                <span id="progressText">Słowo 0/0</span>
            </div>
            
            
            <div class="word-card" id="wordCard">
                <p class="word-label">Przetłumacz słowo:</p>
                <p class="english-word" id="sourceWord">Loading...</p>
            </div>

            <input type="text" class="translation-input" id="translationInput"
                placeholder="Wpisz tłumaczenie po polsku..." />

            <div class="button-group">
                <button class="btn btn-check" id="checkButton">
                    ✓ Sprawdź
                </button>
                <button class="btn btn-next" id="nextButton">
                    ➜ Pomiń / Następne
                </button>
            </div>

            <div class="feedback-area" id="feedbackArea"></div>

            <div class="session-stats">
                <h3>📊 Statystyki Sesji</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">Poprawne</div>
                        <div class="stat-value correct-count" id="sessionCorrectCount">0</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Błędne</div>
                        <div class="stat-value incorrect-count" id="sessionIncorrectCount">0</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Dokładność</div>
                        <div class="stat-value accuracy-count" id="sessionAccuracy">0%</div>
                    </div>
                </div>
            </div>
        </div>

        <div id="resultsView" style="display: none">
            <h2>Wyniki Sesji</h2>
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Słowo</th>
                        <th>Twoja odpowiedź</th>
                        <th>Poprawna odpowiedź</th>
                        <th>Wynik</th>
                    </tr>
                </thead>
                <tbody id="resultsTableBody"></tbody>
            </table>
            <div class="results-actions">
                <button class="btn btn-start" id="playAgainButton">Zagraj Ponownie</button>
                <button class="btn btn-secondary" onclick="returnToModes()">Powrót do trybów</button>
            </div>
        </div>
    `;

  return container;
}

// Quiz Mode
function startQuizMode() {
  document.getElementById("modesPage").style.display = "block";

  const modesGrid = document.querySelector(".modes-grid");
  const pageHeader = document.querySelector("#modesPage .page-header");

  if (modesGrid) modesGrid.style.display = "none";
  if (pageHeader) pageHeader.style.display = "none";

  let quizContainer = document.getElementById("quiz-container");
  if (quizContainer) {
    quizContainer.remove(); // Zawsze usuwamy stary kontener, by zapewnić czysty stan
  }

  quizContainer = createQuizInterface();
  document.getElementById("modesPage").appendChild(quizContainer);
  quizContainer.style.display = "block";

  // Inicjalizujemy quiz, który sam zarządza swoim stanem
  initializeQuiz();
}

// Function to create quiz interface
function createQuizInterface() {
  const quizContainer = document.createElement("div");
  quizContainer.id = "quiz-container";
  quizContainer.className = "quiz-card";

  quizContainer.innerHTML = `
    <div class="quiz-container">
        <div class="mode-header">
            <button class="back-button" onclick="returnToModes()">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Powrót do trybów
            </button>
            <h1>🧠 Quiz Wielokrotnego Wyboru</h1>
            <p class="quiz-subtitle">Testuj swoją wiedzę wybierając poprawną odpowiedź spośród kilku opcji</p>
        </div>

        <div class="progress-bar">
            <div class="progress" id="progress"></div>
        </div>

        <div class="quiz-stats">
            <div class="quiz-stat">
                <div class="quiz-stat-label">Pytanie</div>
                <div class="quiz-stat-value" id="questionCount">1/10</div>
            </div>
            <div class="quiz-stat">
                <div class="quiz-stat-label">Punkty</div>
                <div class="quiz-stat-value" id="score">0</div>
            </div>
            <div class="quiz-stat">
                <div class="quiz-stat-label">Czas</div>
                <div class="quiz-stat-value quiz-timer" id="timer">30s</div>
            </div>
        </div>

        <div class="question-container" id="questionContainer">
            <div class="question-number" id="questionNumber">Pytanie 1</div>
            <div class="question" id="question">Ładowanie pytań...</div>
            
            <div class="quiz-options" id="options">
                <!-- Options will be populated by QuizManager -->
            </div>

            <div class="feedback" id="feedback"></div>
        </div>

        <div class="controls">
            <button class="quiz-btn" id="nextBtn" disabled>Następne pytanie</button>
            <button class="quiz-btn" id="restartBtn">Restart</button>
        </div>
    </div>
    `;
  return quizContainer;
}

// Writing mode (placeholder for now)
function startWritingMode() {
  document.getElementById("modesPage").style.display = "block";

  const modesGrid = document.querySelector(".modes-grid");
  const pageHeader = document.querySelector("#modesPage .page-header");

  if (modesGrid) modesGrid.style.display = "none";
  if (pageHeader) pageHeader.style.display = "none";

  let writingContainer = document.getElementById("quiz-container");
  if (writingContainer) {
    writingContainer.remove(); // Zawsze usuwamy stary kontener, by zapewnić czysty stan
  }

  writingContainer = createWritingInterface();
  document.getElementById("modesPage").appendChild(writingContainer);
  writingContainer.style.display = "block";
}

function createWritingInterface() {
  const writingContainer = document.createElement("div");
  writingContainer.id = "writing-mode-container";
  writingContainer.className = "writing-card";

  writingContainer.innerHTML = `<div class="writing-container">
  <div class="mode-header">
            <button class="back-button" onclick="returnToModes()">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Powrót do trybów
            </button>
            <h1>✍️ Pisanie z Pamięci</h1>
            <p class="quiz-subtitle">Wpisz tłumaczenie z pamięci. Najskuteczniejszy sposób na zapamiętanie słów.</p>
        </div>

        <div class="writing-mode-selector">
            <button class="writing-mode-btn active" data-mode="standard">Standardowy</button>
            <button class="writing-mode-btn" data-mode="timed">Czasowy</button>
            <button class="writing-mode-btn" data-mode="hardcore">Hardcore</button>
        </div>

        <div class="writing-difficulty-bar">
            <div class="writing-difficulty-level">Poziom trudności: <span id="currentLevel">Początkujący</span></div>
            <div class="writing-progress-indicators">
                <div class="writing-progress-dot filled"></div>
                <div class="writing-progress-dot filled"></div>
                <div class="writing-progress-dot"></div>
                <div class="writing-progress-dot"></div>
                <div class="writing-progress-dot"></div>
            </div>
        </div>

        <div class="writing-learning-path">
            <div class="writing-path-progress">
                <div class="writing-mastery-level">Stopień opanowania: <span id="masteryLevel">0%</span></div>
                <div class="writing-mastery-level">Słowa do powtórki: <span id="reviewWords">0</span></div>
            </div>
            <div style="background: rgba(255,255,255,0.5); height: 8px; border-radius: 10px; overflow: hidden;">
                <div id="masteryBar" style="background: linear-gradient(90deg, #ba68c8, #9c27b0); height: 100%; width: 0%; border-radius: 10px; transition: width 0.5s ease;"></div>
            </div>
        </div>

        <div class="writing-time-pressure" id="timePressure">
            <div class="writing-timer" id="timer">30</div>
            <div class="writing-timer-label">Pozostały czas</div>
        </div>

        <div class="writing-word-section">
            <div class="writing-word-context">
                <div class="writing-context-label">Kontekst w zdaniu</div>
                <div class="writing-context-sentence" id="contextSentence"></div>
            </div>

            <div class="writing-word-display">
                <div class="writing-source-word" id="sourceWord"></div>
                <div class="writing-pronunciation" id="pronunciation"></div>
                <div class="writing-word-details">
                    <div class="writing-word-type" id="wordType"></div>
                    <div class="writing-word-level" id="wordLevel"></div>
                    <div class="writing-word-frequency" id="wordFrequency"></div>
                </div>
            </div>

            <div class="writing-area" id="writingArea">
                <div class="writing-label">Wpisz tłumaczenie po polsku:</div>
                <textarea 
                    id="translationInput" 
                    class="translation-input" 
                    placeholder="Zacznij pisać tłumaczenie..."
                    rows="2"
                    autocomplete="off"
                    spellcheck="false"
                ></textarea>
                <div class="writing-character-counter">
                    <span id="charCount">0</span> / <span id="expectedLength">0</span> znaków
                </div>
            </div>

            <div class="writing-smart-feedback">
                <div class="writing-typo-indicator" id="typoIndicator">
                    <div class="writing-feedback-label">Możliwy błąd ortograficzny</div>
                    <div class="writing-feedback-content" id="typoText"></div>
                </div>
                
                <div class="writing-similarity-meter" id="similarityMeter">
                    <div class="writing-similarity-bar">
                        <div class="writing-similarity-fill" id="similarityFill" style="width: 0%"></div>
                    </div>
                    <div class="writing-similarity-text" id="similarityText">Podobieństwo: 0%</div>
                </div>
            </div>

            <div class="writing-hint-system" id="hintSection">
                </div>

            <div class="writing-buttons">
                <button class="writing-btn writing-btn-primary" id="checkBtn">Sprawdź odpowiedź</button>
                <button class="writing-btn writing-btn-hint" id="hintBtn">Podpowiedź</button>
                <button class="writing-btn writing-btn-skip" id="skipBtn">Pomiń słowo</button>
                <button class="writing-btn writing-btn-secondary" id="nextBtn" style="display: none;">Następne słowo</button>
            </div>

            <div class="writing-feedback" id="feedback"></div>
        </div>

        <div class="writing-streak-indicator">
            <div class="writing-streak-flame">🔥</div>
            <div class="writing-streak-text">Seria poprawnych odpowiedzi: <span id="streakCount">0</span></div>
        </div>

        <div class="writing-stats-panel">
            <div class="writing-stat-card">
                <span class="writing-stat-number" id="correctCount">0</span>
                <span class="writing-stat-label">Poprawne</span>
            </div>
            <div class="writing-stat-card">
                <span class="writing-stat-number" id="totalCount">0</span>
                <span class="writing-stat-label">Razem</span>
            </div>
            <div class="writing-stat-card">
                <span class="writing-stat-number" id="accuracy">0%</span>
                <span class="writing-stat-label">Skuteczność</span>
            </div>
            <div class="writing-stat-card">
                <span class="writing-stat-number" id="avgTime">0s</span>
                <span class="writing-stat-label">Śr. czas</span>
            </div>
        </div>
    </div>`;
  return writingContainer;
}

// Speed ​​mode (placeholder for now)
function startSpeedMode() {
  document.getElementById("modesPage").style.display = "block";
  showModeInterface("speed", "⚡ Wyzwanie Szybkości", createSpeedInterface());
}

function createSpeedInterface() {
  return `
        <div class="speed-container">
            <h2>Wyzwanie szybkości będzie dostępne wkrótce!</h2>
            <p>Tryb na czas jest w trakcie implementacji.</p>
            <button class="btn btn-primary" onclick="returnToModes()">Powrót do trybów</button>
        </div>
    `;
}

// Auxiliary function for displaying the mode interface
function showModeInterface(modeType, title, content) {
  const modesGrid = document.querySelector(".modes-grid");
  const pageHeader = document.querySelector("#modesPage .page-header");

  if (modesGrid) modesGrid.style.display = "none";
  if (pageHeader) pageHeader.style.display = "none";

  let modeContainer = document.getElementById(`${modeType}-mode-container`);
  if (!modeContainer) {
    modeContainer = document.createElement("div");
    modeContainer.id = `${modeType}-mode-container`;
    modeContainer.className = "mode-interface";
    document.getElementById("modesPage").appendChild(modeContainer);
  }

  modeContainer.innerHTML = `
        <div class="mode-header">
            <button class="back-button" onclick="returnToModes()">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Powrót do trybów
            </button>
            <h1>${title}</h1>
        </div>
        ${content}
    `;

  modeContainer.style.display = "block";
}

// Return to modes function
window.returnToModes = function () {
  if (window.quizManager) {
    if (window.quizManager.stopTimer) {
      window.quizManager.stopTimer();
    }
    if (window.quizManager.cleanUpQuiz) {
      window.quizManager.cleanUpQuiz();
    }
    window.quizManager = null;
  }

  const containersToRemove = document.querySelectorAll(
    "#flashcard-container, #quiz-container, .mode-interface"
  );
  containersToRemove.forEach((container) => container.remove());

  const modesGrid = document.querySelector(".modes-grid");
  const pageHeader = document.querySelector("#modesPage .page-header");

  if (modesGrid) modesGrid.style.display = "grid";
  if (pageHeader) pageHeader.style.display = "block";
};

// Function for "coming soon" modes
function showComingSoonModal(modeType) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.style.display = "flex";

  const modeNames = {
    audio: "Nauka przez Słuch",
    "memory-palace": "Pałac Pamięci",
  };

  modal.innerHTML = `
        <div class="modal-content">
            <h2>🚧 Tryb w przygotowaniu</h2>
            <p><strong>${
              modeNames[modeType] || "Ten tryb"
            }</strong> będzie dostępny wkrótce!</p>
            <p>Pracujemy nad implementacją tej funkcji. Tymczasem sprawdź inne dostępne tryby nauki.</p>
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                Rozumiem
            </button>
        </div>
    `;

  document.body.appendChild(modal);

  // Close the modal when clicking on the background
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Additional features for a quick start from the main dashboard
window.startNewSession = function () {
  showPage("modesPage");
};

window.reviewDifficultWords = function () {
  showPage("modesPage");
  // logic for difficult words
  setTimeout(() => {
    alert("Funkcja powtórki trudnych słówek będzie dostępna wkrótce!");
  }, 300);
};

// Make sure the showPage function is available
if (typeof window.showPage !== "function") {
  window.showPage = function (pageId) {
    // Hide all pages
    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => (page.style.display = "none"));

    // Show selected page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.style.display = "block";
    }
  };
}

// Export the startMode function
window.startMode = startMode;
