import { auth } from "../../../backend/config/firebase-config.js";

let activeTimer = null;

export function stopQuizTimer() {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
}

export function initializeQuiz() {
  // DOM Elements
  const quizContainer = document.getElementById("quiz-container");
  const questionContainer = document.getElementById("questionContainer");
  const controls = document.querySelector(".controls");

  const questionNumberEl = document.getElementById("questionNumber");
  const questionEl = document.getElementById("question");
  const optionsEl = document.getElementById("options");
  const feedbackEl = document.getElementById("feedback");

  const questionCountEl = document.getElementById("questionCount");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const progressEl = document.getElementById("progress");

  const nextBtn = document.getElementById("nextBtn");
  const restartBtn = document.getElementById("restartBtn");

  const correctSound = new Audio("/frontend/public/assets/sound/correct.mp3");
  const incorrectSound = new Audio(
    "/frontend/public/assets/sound/incorrect.mp3"
  );

  // Quiz State
  let questions = [],
    userAnswers = [],
    currentQuestionIndex = 0,
    score = 0;
  const timeLimit = 30;
  let timeRemaining = timeLimit,
    isQuizActive = false,
    startTime = null;

  // --- Initialization ---
  async function init() {
    try {
      setupEventListeners();
      await restartQuiz();
    } catch (error) {
      console.error("Init error:", error);
      showError(
        "Nie udało się załadować pytań quizu. Spróbuj ponownie później."
      );
    }
  }

  async function loadQuestions() {
    const lang = localStorage.getItem("selectedLanguage") || "en";
    try {
      const res = await fetch(
        `http://localhost:5000/api/quiz/questions?lang=${lang}&count=10`
      );
      const data = await res.json();
      if (!res.ok || !data.questions?.length) throw new Error("Brak pytań.");
      questions = data.questions;
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  }

  function startQuiz() {
    if (!questions.length) return showError("Brak pytań do rozpoczęcia quizu.");
    isQuizActive = true;
    startTime = new Date();
    showQuizInterface();
    displayQuestion();
    updateStats();
    startTimer();
  }

  function displayQuestion() {
    if (currentQuestionIndex >= questions.length) return endQuiz();
    const question = questions[currentQuestionIndex];

    questionNumberEl.textContent = `Pytanie ${currentQuestionIndex + 1}`;
    questionEl.textContent = question.question;

    optionsEl.innerHTML = "";
    question.options.forEach((opt, idx) => {
      const el = document.createElement("div");
      el.className = "quiz-option";
      el.dataset.answer = idx;
      el.textContent = opt;
      optionsEl.appendChild(el);
    });

    feedbackEl.innerHTML = "";
    feedbackEl.style.display = "none";
    nextBtn.disabled = true;
    resetTimer();
    updateTimerDisplay();
  }

  async function selectAnswer(selectedOption) {
    if (!isQuizActive) return;
    stopQuizTimer();
    isQuizActive = false;

    const idx = +selectedOption.dataset.answer;
    const q = questions[currentQuestionIndex];
    const correct = idx === q.correctAnswer;

    userAnswers.push({
      questionId: q.id,
      questionText: q.question,
      selectedAnswer: idx,
      selectedText: q.options[idx],
      correctAnswer: q.correctAnswer,
      correctText: q.options[q.correctAnswer],
      isCorrect: correct,
      timeSpent: timeLimit - timeRemaining,
    });

    if (correct) {
      score++;
      selectedOption.classList.add("correct");
      correctSound.play();
      await updateUserStats();
    } else {
      selectedOption.classList.add("incorrect");
      [...optionsEl.children].forEach((el, i) => {
        el.classList.add(i === q.correctAnswer ? "correct" : "incorrect");
      });
      incorrectSound.play();
    }

    showFeedback(correct, q.options[q.correctAnswer]);
    updateStats();
    nextBtn.disabled = false;
  }

  async function updateUserStats() {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await fetch(
        `http://localhost:5000/api/user/${user.uid}/update-daily-progress`,
        { method: "POST" }
      );
      await fetch(
        `http://localhost:5000/api/user/${user.uid}/update-overall-stats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correctAnswers: 1, incorrectAnswers: 0 }),
        }
      );
    } catch (err) {
      console.error("Stat update error:", err);
    }
  }

  function nextQuestion() {
    currentQuestionIndex++;
    isQuizActive = true;
    if (currentQuestionIndex < questions.length) {
      displayQuestion();
      updateStats();
      startTimer();
    } else endQuiz();
  }

  async function endQuiz() {
    stopQuizTimer();
    const timeSpent = Math.round((new Date() - startTime) / 1000);
    await submitQuizResults(timeSpent);
    await showResults(timeSpent);
  }

  async function submitQuizResults(timeSpent) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await fetch("http://localhost:5000/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          results: userAnswers,
          totalQuestions: questions.length,
          correctAnswers: userAnswers.filter((a) => a.isCorrect).length,
          timeSpent,
        }),
      });
    } catch (err) {
      console.error("Submit error:", err);
    }
  }

  function startTimer() {
    stopQuizTimer();
    timeRemaining = timeLimit;
    updateTimerDisplay();
    activeTimer = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) timeUp();
    }, 1000);
  }

  function resetTimer() {
    timeRemaining = timeLimit;
  }

  function timeUp() {
    stopQuizTimer();
    isQuizActive = false;
    const q = questions[currentQuestionIndex];

    userAnswers.push({
      questionId: q.id,
      questionText: q.question,
      selectedAnswer: -1,
      selectedText: "Brak odpowiedzi",
      correctAnswer: q.correctAnswer,
      correctText: q.options[q.correctAnswer],
      isCorrect: false,
      timeSpent: timeLimit,
    });

    showFeedback(false, q.options[q.correctAnswer], true);
    optionsEl.children[q.correctAnswer]?.classList.add("correct");
    nextBtn.disabled = false;
  }

  function showQuizInterface() {
    questionContainer.style.display = "block";
    controls.style.display = "flex";
    clearPreviousResults();
  }

  function showFeedback(correct, correctText, timeout = false) {
    feedbackEl.innerHTML = timeout
      ? `<div class="feedback-timeout"><span class="feedback-icon">⏰</span><span>Czas się skończył! Poprawna odpowiedź: <strong>${correctText}</strong></span></div>`
      : correct
      ? `<div class="quiz-feedback-correct"><span class="feedback-icon">✅</span><span>Brawo! Poprawna odpowiedź.</span></div>`
      : `<div class="quiz-feedback-incorrect"><span class="feedback-icon">❌</span><span>Niepoprawnie. Poprawna odpowiedź: <strong>${correctText}</strong></span></div>`;
    feedbackEl.style.display = "block";
  }

  async function showResults(timeSpent) {
    clearPreviousResults();
    questionContainer.style.display = "none";
    controls.style.display = "none";

    const accuracy = questions.length
      ? Math.round((score / questions.length) * 100)
      : 0;
    const res = document.createElement("div");
    res.className = "quiz-results";
    res.innerHTML = `
      <div class="results-header">
        <h2>🎉 Quiz Zakończony!</h2>
        <div class="score-circle"><span class="score-percentage">${accuracy}%</span><span>Dokładność</span></div>
      </div>
      <div class="results-stats">
        <div class="result-stat">Poprawne ✅: ${score}/${questions.length}</div>
        <div class="result-stat">Czas ⌛️: ${Math.floor(timeSpent / 60)}:${(
      timeSpent % 60
    )
      .toString()
      .padStart(2, "0")}</div>
      </div>
      <div class="results-actions">
        <button class="quiz-btn quiz-btn-primary" id="tryAgainBtn">🔄 Spróbuj ponownie</button>
        <button class="quiz-btn quiz-btn-secondary" onclick="returnToModes()">🏠 Powrót do trybów</button>
      </div>`;
    quizContainer.appendChild(res);
    document
      .getElementById("tryAgainBtn")
      .addEventListener("click", restartQuiz);
  }

  function updateStats() {
    questionCountEl.textContent = `${currentQuestionIndex + 1}/${
      questions.length
    }`;
    scoreEl.textContent = score;
    progressEl.style.width = `${
      ((currentQuestionIndex + 1) / questions.length) * 100
    }%`;
  }

  function updateTimerDisplay() {
    timerEl.textContent = `${timeRemaining}s`;
    timerEl.classList.toggle("timer-warning", timeRemaining <= 5);
  }

  function showError(msg) {
    quizContainer.innerHTML = `<div class="quiz-error"><h3>❌ Błąd</h3><p>${msg}</p><button class="quiz-btn" onclick="returnToModes()">Powrót do trybów</button></div>`;
  }

  async function restartQuiz() {
    stopQuizTimer();
    isQuizActive = false;
    try {
      await loadQuestions();
      resetQuizState();
      clearPreviousResults();
      startQuiz();
    } catch (err) {
      console.error("Restart error:", err);
      showError("Nie udało się załadować pytań.");
    }
  }

  function resetQuizState() {
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = [];
    timeRemaining = timeLimit;
  }

  function clearPreviousResults() {
    quizContainer
      .querySelectorAll(".quiz-results, .quiz-error")
      .forEach((el) => el.remove());
  }

  function setupEventListeners() {
    optionsEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("quiz-option") && isQuizActive)
        selectAnswer(e.target);
    });
    nextBtn.addEventListener("click", nextQuestion);
    restartBtn.addEventListener("click", restartQuiz);
  }

  init();
}
