export function initializeWriting() {
 

  // --- ELEMENTS DOM ---
  const dom = {
    sourceWord: document.getElementById("sourceWord"),
    pronunciation: document.getElementById("pronunciation"),
    contextSentence: document.getElementById("contextSentence"),
    wordType: document.getElementById("wordType"),
    wordLevel: document.getElementById("wordLevel"),
    wordFrequency: document.getElementById("wordFrequency"),
    translationInput: document.getElementById("translationInput"),
    writingArea: document.getElementById("writingArea"),
    charCount: document.getElementById("charCount"),
    expectedLength: document.getElementById("expectedLength"),
    checkBtn: document.getElementById("checkBtn"),
    hintBtn: document.getElementById("hintBtn"),
    skipBtn: document.getElementById("skipBtn"),
    nextBtn: document.getElementById("nextBtn"),
    feedback: document.getElementById("feedback"),
    hintSection: document.getElementById("hintSection"),
    modeSelector: document.querySelector(".writing-mode-selector"), 
    timePressure: document.getElementById("timePressure"),
    timer: document.getElementById("timer"),
    streakCount: document.getElementById("streakCount"),
    correctCount: document.getElementById("correctCount"),
    totalCount: document.getElementById("totalCount"),
    accuracy: document.getElementById("accuracy"),
    avgTime: document.getElementById("avgTime"),
    typoIndicator: document.getElementById("typoIndicator"),
    typoText: document.getElementById("typoText"),
    similarityMeter: document.getElementById("similarityMeter"),
    similarityFill: document.getElementById("similarityFill"),
    similarityText: document.getElementById("similarityText"),
    masteryBar: document.getElementById("masteryBar"),
    masteryLevel: document.getElementById("masteryLevel"),
    reviewWords: document.getElementById("reviewWords"),
  };

  // --- GAME STATE ---
  let state = {
    currentWordIndex: -1,
    currentWord: null,
    mode: "standard", 
    stats: { correct: 0, total: 0, streak: 0, totalTime: 0, answersCount: 0 },
    timerInterval: null,
    timeLeft: 30,
    startTime: 0,
    wordDataWithProgress: [],
  };

  // --- MAIN LOGIC ---

  function init() {
    if (!dom.checkBtn) {
      console.error(
        "Błąd inicjalizacji: Nie znaleziono kluczowych elementów DOM. Upewnij się, że skrypt jest uruchamiany po załadowaniu HTML (np. wewnątrz 'DOMContentLoaded')."
      );
      return;
    }

    state.wordDataWithProgress = wordsData.map((word) => ({
      ...word,
      mastery: 0,
      lastAnswerCorrect: true,
    }));
    addEventListeners();
    loadNextWord();
  }


  function addEventListeners() {
    dom.checkBtn.addEventListener("click", checkAnswer);
    dom.nextBtn.addEventListener("click", loadNextWord);
    dom.hintBtn.addEventListener("click", showHint);
    dom.skipBtn.addEventListener("click", skipWord);
    dom.translationInput.addEventListener("input", updateInputFeedback);
    dom.translationInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        dom.checkBtn.click();
      }
    });
    dom.translationInput.addEventListener("focus", () =>
      dom.writingArea.classList.add("focused")
    );
    dom.translationInput.addEventListener("blur", () =>
      dom.writingArea.classList.remove("focused")
    );

    if (dom.modeSelector) {
      dom.modeSelector.addEventListener("click", (e) => {
        if (e.target.classList.contains("writing-mode-btn")) {
          changeMode(e.target.dataset.mode);
        }
      });
    }
  }


  function loadNextWord() {
    if (state.wordDataWithProgress.length === 0) {
      showFinalScore();
      return;
    }

    state.wordDataWithProgress.sort((a, b) => a.mastery - b.mastery);
    state.currentWord = state.wordDataWithProgress[0];

    const word = state.currentWord;
    dom.sourceWord.textContent = word.word;
    dom.pronunciation.textContent = word.pronunciation;
    dom.contextSentence.innerHTML = word.context;
    dom.wordType.textContent = word.type;
    dom.wordLevel.textContent = word.level;
    dom.wordFrequency.textContent = word.frequency;

    resetUIForNewWord();
    updateStatsUI();

    if (state.mode === "timed") startTimer();
    state.startTime = Date.now();
  }

    // --- ANSWER CHECKING AND FEEDBACK ---
  function checkAnswer() {
    clearInterval(state.timerInterval);
    const userInput = dom.translationInput.value.trim().toLowerCase();
    if (userInput.length === 0) return;

    const correctAnswers = state.currentWord.translations.map((t) =>
      t.toLowerCase()
    );

    state.stats.total++;
    state.stats.totalTime += (Date.now() - state.startTime) / 1000;
    state.stats.answersCount++;

    if (correctAnswers.includes(userInput)) {
      state.stats.correct++;
      state.stats.streak++;
      state.currentWord.mastery = Math.min(100, state.currentWord.mastery + 25);
      showFeedback(true, `Doskonale!`);
    } else {
      state.stats.streak = 0;
      state.currentWord.mastery = Math.max(0, state.currentWord.mastery - 20);
      const similarity = getHighestSimilarity(userInput, correctAnswers);
      if (similarity > 0.7) {
        showFeedback(
          "partial",
          `Prawie dobrze! Sprawdź pisownię.`,
          correctAnswers
        );
      } else {
        showFeedback(false, `Niestety, to nie to.`, correctAnswers);
      }
    }
    updateUIafterAnswer();
    updateStatsUI();
  }

    // --- SKIP AND HINT FUNCTIONS ---
  function skipWord() {
    clearInterval(state.timerInterval);
    state.stats.total++;
    state.stats.streak = 0;
    state.currentWord.mastery = Math.max(0, state.currentWord.mastery - 10);
    showFeedback(false, `Pominięto słowo.`, state.currentWord.translations);
    updateUIafterAnswer();
    updateStatsUI();
  }

  function showHint() {
    const { hints, mastery } = state.currentWord;
    if (!hints || hints.length === 0) return;
    const existingHintsCount = dom.hintSection.querySelectorAll(".hint").length;
    if (existingHintsCount >= hints.length) return;

    const hintElement = document.createElement("div");
    hintElement.className = "hint";
    hintElement.textContent = hints[existingHintsCount];
    dom.hintSection.appendChild(hintElement);

    if (state.mode === "hardcore") {
      state.currentWord.mastery = Math.max(0, mastery - 5);
      updateStatsUI();
    }
  }

    // --- MODE CHANGE AND TIMER FUNCTIONS ---
  function changeMode(newMode) {
    if (state.mode === newMode) return;
    state.mode = newMode;

    document.querySelectorAll(".writing-mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === newMode);
    });
    resetGame();
  }

  function startTimer() {
    state.timeLeft = 30;
    dom.timer.textContent = state.timeLeft;
    dom.timePressure.classList.add("active");
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      dom.timer.textContent = state.timeLeft;
      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        timeUp();
      }
    }, 1000);
  }

  function timeUp() {
    showFeedback(false, "Czas minął!", state.currentWord.translations);
    updateUIafterAnswer();
    updateStatsUI();
  }

  function resetGame() {
    clearInterval(state.timerInterval);
    state.stats = {
      correct: 0,
      total: 0,
      streak: 0,
      totalTime: 0,
      answersCount: 0,
    };
    state.wordDataWithProgress.forEach((word) => (word.mastery = 0));
    dom.timePressure.classList.remove("active");
    loadNextWord();
  }

    // --- UI UPDATE FUNCTIONS ---
  function resetUIForNewWord() {
    dom.feedback.style.display = "none";
    dom.feedback.className = "feedback";
    dom.translationInput.value = "";
    dom.translationInput.disabled = false;
    dom.translationInput.focus();
    dom.hintSection.innerHTML = "";
    dom.checkBtn.style.display = "inline-block";
    dom.hintBtn.style.display = "inline-block";
    dom.skipBtn.style.display = "inline-block";
    dom.nextBtn.style.display = "none";
    dom.hintBtn.disabled = state.mode === "hardcore";
    updateInputFeedback();
  }

  function updateUIafterAnswer() {
    dom.translationInput.disabled = true;
    dom.checkBtn.style.display = "none";
    dom.hintBtn.style.display = "none";
    dom.skipBtn.style.display = "none";
    dom.nextBtn.style.display = "inline-block";
    dom.nextBtn.focus();
  }

    // --- FEEDBACK AND STATISTICS FUNCTIONS ---
  function showFeedback(type, message, correctAnswers = []) {
    dom.feedback.style.display = "block";
    dom.feedback.innerHTML = "";
    const messageElement = document.createElement("span");
    messageElement.textContent = message;
    dom.feedback.appendChild(messageElement);
    dom.feedback.className = `feedback ${
      type === true ? "correct" : type === "partial" ? "partial" : "incorrect"
    }`;

    if (type !== true && correctAnswers.length > 0) {
      const detailedFeedback = document.createElement("div");
      detailedFeedback.className = "detailed-feedback";
      detailedFeedback.innerHTML = `<div class="feedback-label">Poprawne odpowiedzi:</div><div class="feedback-content">${correctAnswers.join(
        ", "
      )}</div>`;
      dom.feedback.appendChild(detailedFeedback);
    }
  }

  function updateStatsUI() {
    dom.correctCount.textContent = state.stats.correct;
    dom.totalCount.textContent = state.stats.total;
    dom.streakCount.textContent = state.stats.streak;
    const accuracy =
      state.stats.total > 0
        ? Math.round((state.stats.correct / state.stats.total) * 100)
        : 0;
    dom.accuracy.textContent = `${accuracy}%`;
    const avgTime =
      state.stats.answersCount > 0
        ? (state.stats.totalTime / state.stats.answersCount).toFixed(1)
        : 0;
    dom.avgTime.textContent = `${avgTime}s`;
    const totalMastery = state.wordDataWithProgress.reduce(
      (sum, word) => sum + word.mastery,
      0
    );
    const maxMastery = state.wordDataWithProgress.length * 100;
    const masteryPercentage =
      maxMastery > 0 ? Math.round((totalMastery / maxMastery) * 100) : 0;
    dom.masteryLevel.textContent = `${masteryPercentage}%`;
    dom.masteryBar.style.width = `${masteryPercentage}%`;
    const reviewCount = state.wordDataWithProgress.filter(
      (word) => word.mastery < 80
    ).length;
    dom.reviewWords.textContent = reviewCount;
  }

  function updateInputFeedback() {
    if (!state.currentWord) return;
    const userInput = dom.translationInput.value;
    const correctAnswers = state.currentWord.translations;
    dom.charCount.textContent = userInput.length;
    dom.expectedLength.textContent = correctAnswers[0].length;
    if (userInput.length > 0) {
      const similarity = getHighestSimilarity(userInput, correctAnswers);
      const percentage = Math.round(similarity * 100);
      dom.similarityMeter.classList.add("show");
      dom.similarityFill.style.width = `${percentage}%`;
      dom.similarityText.textContent = `Podobieństwo: ${percentage}%`;
      if (percentage > 70 && percentage < 100) {
        dom.typoIndicator.classList.add("show");
        dom.typoText.textContent = `Czy chodziło Ci o: ${findClosestAnswer(
          userInput,
          correctAnswers
        )}?`;
      } else {
        dom.typoIndicator.classList.remove("show");
      }
    } else {
      dom.similarityMeter.classList.remove("show");
      dom.typoIndicator.classList.remove("show");
    }
  }

    // --- FINAL SCORE DISPLAY ---
  function showFinalScore() {
    const wordSection = document.getElementById("word-section-id");
    if (wordSection) {
      wordSection.innerHTML = `<div class="header"><h2 class="title">Koniec!</h2><p class="subtitle">Oto Twoje końcowe statystyki. Świetna robota!</p></div><button class="btn btn-primary" onclick="location.reload()">Zagraj jeszcze raz</button>`;
    }
  }

    // --- UTILITY FUNCTIONS ---
  function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    return matrix[b.length][a.length];
  }

  function getSimilarity(s1, s2) {
    const longer = s1.length > s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    return (longer.length - levenshteinDistance(s1, s2)) / longer.length;
  }

  function getHighestSimilarity(input, answers) {
    return Math.max(...answers.map((answer) => getSimilarity(input, answer)));
  }

  function findClosestAnswer(input, answers) {
    return answers.reduce((best, current) =>
      getSimilarity(input, current) > getSimilarity(input, best)
        ? current
        : best
    );
  }

  init();
}
