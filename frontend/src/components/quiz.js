let activeTimer = null;
export function stopQuizTimer() {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
}

export function initializeQuiz() {
  // --- Interface elements ---
  const quizContainer = document.getElementById("quiz-container");
  const questionContainer = document.getElementById("questionContainer");
  const controls = document.querySelector(".controls");

  // Header and Statistics
  const questionNumberEl = document.getElementById("questionNumber");
  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");
  const feedbackEl = document.getElementById("feedback");

  // Statistics
  const questionCountEl = document.getElementById("questionCount");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const progressEl = document.getElementById("progress");

  // Buttons
  const nextBtn = document.getElementById("nextBtn");
  const restartBtn = document.getElementById("restartBtn");

  // Sounds
  const correctSound = new Audio("/frontend/public/assets/sound/correct.mp3");
  const incorrectSound = new Audio(
    "/frontend/public/assets/sound/incorrect.mp3"
  );

  // --- State variables ---
  let questions = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let timeLimit = 30;
  let timeRemaining = timeLimit;
  let isQuizActive = false;
  let startTime = null;
  let userAnswers = [];

  // Initialization

  async function init() {
    try {
      setupEventListeners();
      await restartQuiz();
    } catch (error) {
      console.error("Błąd inicjalizacji quizu:", error);
      showError(
        "Nie udało się załadować pytań quizu. Spróbuj ponownie później."
      );
    }
  }

  // Quiz Logic

  async function loadQuestions() {
    // This function now ONLY takes questions
    try {
      const selectedLanguage = localStorage.getItem("selectedLanguage") || "en";
      const questionsCount = 10;
      const response = await fetch(
        `http://localhost:5000/api/quiz/questions?lang=${selectedLanguage}&count=${questionsCount}`
      );

      if (!response.ok) {
        throw new Error(`Błąd serwera: ${response.status}`);
      }
      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("Brak pytań dla wybranego języka.");
      }
      questions = data.questions; // We update the question pool
    } catch (error) {
      console.error("Błąd ładowania pytań:", error);
      throw error;
    }
  }

  // Starting the Quiz
  function startQuiz() {
    if (questions.length === 0) {
      showError("Brak pytań do rozpoczęcia quizu.");
      return;
    }
    isQuizActive = true;
    startTime = new Date();
    showQuizInterface();
    displayQuestion();
    updateStats();
    startTimer();
  }

  // Displaying Questions
  function displayQuestion() {
    if (currentQuestionIndex >= questions.length) {
      endQuiz();
      return;
    }

    const question = questions[currentQuestionIndex];
    if (questionNumberEl)
      questionNumberEl.textContent = `Pytanie ${currentQuestionIndex + 1}`;
    if (questionEl) questionEl.textContent = question.question;

    if (optionsEl) {
      optionsEl.innerHTML = "";
      question.options.forEach((option, index) => {
        const optionEl = document.createElement("div");
        optionEl.className = "quiz-option";
        optionEl.setAttribute("data-answer", index);
        optionEl.textContent = option;
        optionsEl.appendChild(optionEl);
      });
    }

    if (feedbackEl) {
      feedbackEl.innerHTML = "";
      feedbackEl.style.display = "none";
    }

    if (nextBtn) nextBtn.disabled = true;

    resetTimer();
    updateTimerDisplay();
  }

  // Answer Selection
  function selectAnswer(selectedOption) {
    if (!isQuizActive) return;

    isQuizActive = false;
    stopQuizTimer();

    const selectedIndex = parseInt(selectedOption.dataset.answer, 10);
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;

    userAnswers.push({
      questionId: question.id,
      questionText: question.question,
      selectedAnswer: selectedIndex,
      selectedText: question.options[selectedIndex],
      correctAnswer: question.correctAnswer,
      correctText: question.options[question.correctAnswer],
      isCorrect: isCorrect,
      timeSpent: timeLimit - timeRemaining,
    });

    if (isCorrect) {
      score++;
      selectedOption.classList.add("correct");
      correctSound.play();
    } else {
      selectedOption.classList.add("incorrect");
      const correctOption = optionsEl.children[question.correctAnswer];
      incorrectSound.play();
      if (correctOption) correctOption.classList.add("correct");
      for (let i = 0; i < optionsEl.children.length; i++) {
        if (i !== question.correctAnswer) {
          optionsEl.children[i].classList.add("incorrect");
        }
      }
      selectedOption.classList.add("incorrect");
      selectedOption.classList.remove("correct");
      if (correctOption) {
        correctOption.classList.add("correct");
      }
      selectedOption.classList.remove("incorrect");
      selectedOption.classList.remove("correct");
      selectedOption.classList.add("incorrect");
      incorrectSound.play();
    }

    showFeedback(isCorrect, question.options[question.correctAnswer]);
    updateStats();
    if (nextBtn) nextBtn.disabled = false;
  }

  function nextQuestion() {
    currentQuestionIndex++;
    isQuizActive = true;
    if (currentQuestionIndex < questions.length) {
      displayQuestion();
      updateStats();
      startTimer();
    } else {
      endQuiz();
    }
  }

  async function endQuiz() {
    isQuizActive = false;
    stopQuizTimer();
    const endTime = new Date();
    const totalTimeSpent = Math.round((endTime - startTime) / 1000);

    await showResults(totalTimeSpent);
  }

  // Time

  function startTimer() {
    stopQuizTimer();
    timeRemaining = timeLimit;
    updateTimerDisplay();
    activeTimer = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        timeUp();
      }
    }, 1000);
  }

  function resetTimer() {
    timeRemaining = timeLimit;
  }

  function timeUp() {
    stopQuizTimer();
    isQuizActive = false;

    const question = questions[currentQuestionIndex];
    userAnswers.push({
      questionId: question.id,
      questionText: question.question,
      selectedAnswer: -1,
      selectedText: "Brak odpowiedzi",
      correctAnswer: question.correctAnswer,
      correctText: question.options[question.correctAnswer],
      isCorrect: false,
      timeSpent: timeLimit,
    });

    showFeedback(false, question.options[question.correctAnswer], true);
    const correctOption = optionsEl.children[question.correctAnswer];
    if (correctOption) correctOption.classList.add("correct");

    if (nextBtn) nextBtn.disabled = false;
  }

  // Interface and Results

  function showQuizInterface() {
    if (questionContainer) questionContainer.style.display = "block";
    if (controls) controls.style.display = "flex";
    clearPreviousResults();
  }

  function showFeedback(isCorrect, correctAnswerText, isTimeout = false) {
    if (!feedbackEl) return;
    if (isTimeout) {
      feedbackEl.innerHTML = `
        <div class="feedback-timeout">
          <span class="feedback-icon">⏰</span>
          <span class="feedback-text">
            Czas się skończył! Poprawna odpowiedź to: <strong>${correctAnswerText}</strong>
          </span>
        </div>`;
    } else if (isCorrect) {
      feedbackEl.innerHTML = `
        <div class="quiz-feedback-correct">
          <span class="feedback-icon">✅</span>
          <span class="feedback-text">Brawo! To jest poprawna odpowiedź.</span>
        </div>`;
    } else {
      feedbackEl.innerHTML = `
        <div class="quiz-feedback-incorrect">
          <span class="feedback-icon">❌</span>
          <span class="feedback-text">
            Niepoprawnie. Poprawna odpowiedź to: <strong>${correctAnswerText}</strong>
          </span>
        </div>`;
    }
    feedbackEl.style.display = "block";
  }

  async function showResults(totalTimeSpent) {
    clearPreviousResults();
    if (questionContainer) questionContainer.style.display = "none";
    if (controls) controls.style.display = "none";

    const accuracy =
      questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const resultsContainer = document.createElement("div");
    resultsContainer.className = "quiz-results";
    resultsContainer.innerHTML = `
      <div class="results-header">
        <h2>🎉 Quiz Zakończony!</h2>
        <div class="final-score"><div class="score-circle">
            <span class="score-percentage">${accuracy}%</span>
            <span class="score-text">Dokładność</span>
        </div></div>
      </div>
      <div class="results-stats">
        <div class="result-stat"><span class="quiz-result-stat-label">Poprawne ✅</span><span class="quiz-result-stat-value">${score}/${
      questions.length
    }</span></div>
        <div class="result-stat"><span class="quiz-result-stat-label">Czas ⌛️</span><span class="quiz-result-stat-value">${Math.floor(
          totalTimeSpent / 60
        )}:${(totalTimeSpent % 60).toString().padStart(2, "0")}</span></div>
      </div>
      <div class="results-actions">
        <button class="quiz-btn quiz-btn-primary" id="tryAgainBtn">🔄 Spróbuj ponownie</button>
        <button class="quiz-btn quiz-btn-secondary" onclick="returnToModes()">🏠 Powrót do trybów</button>
      </div>`;

    quizContainer.appendChild(resultsContainer);
    document
      .getElementById("tryAgainBtn")
      .addEventListener("click", restartQuiz);
  }

  function updateStats() {
    if (questionCountEl)
      questionCountEl.textContent = `${currentQuestionIndex + 1}/${
        questions.length
      }`;
    if (scoreEl) scoreEl.textContent = score;
    if (progressEl) {
      const progressPercent =
        questions.length > 0
          ? ((currentQuestionIndex + 1) / questions.length) * 100
          : 0;
      progressEl.style.width = `${progressPercent}%`;
    }
  }

  function updateTimerDisplay() {
    if (timerEl) {
      timerEl.textContent = `${timeRemaining}s`;
      if (timeRemaining <= 5) {
        timerEl.classList.add("timer-warning");
      } else {
        timerEl.classList.remove("timer-warning");
      }
    }
  }

  function showError(message) {
    quizContainer.innerHTML = `
      <div class="quiz-error">
        <h3>❌ Błąd</h3>
        <p>${message}</p>
        <button class="quiz-btn" onclick="returnToModes()">Powrót do trybów</button>
      </div>`;
  }

  // Auxiliary

  async function restartQuiz() {
    stopQuizTimer();
    isQuizActive = false;

    try {
      await loadQuestions();

      resetQuizState();
      clearPreviousResults();

      startQuiz();
    } catch (error) {
      console.error("Nie udało się zrestartować quizu:", error);
      showError(
        "Nie udało się załadować nowych pytań. Sprawdź połączenie i spróbuj ponownie."
      );
    }
  }

  function resetQuizState() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    timeRemaining = timeLimit;
  }

  function clearPreviousResults() {
    const resultsContainers = quizContainer.querySelectorAll(
      ".quiz-results, .detailed-results, .quiz-error"
    );
    resultsContainers.forEach((el) => el.remove());
  }

  function setupEventListeners() {
    if (optionsEl) {
      optionsEl.addEventListener("click", (e) => {
        if (e.target.classList.contains("quiz-option") && isQuizActive) {
          selectAnswer(e.target);
        }
      });
    }
    if (nextBtn) nextBtn.addEventListener("click", nextQuestion);
    if (restartBtn) restartBtn.addEventListener("click", restartQuiz);
  }

  init();
}
