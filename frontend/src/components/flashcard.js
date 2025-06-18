import { updateDailyProgress, getCurrentUser } from "./daily-goal.js";

export function initializeFlashcard() {
  // View
  const initialView = document.getElementById("initialView");
  const flashcardView = document.getElementById("flashcardView");
  const resultsView = document.getElementById("resultsView");

  // Buttons
  const startButton = document.getElementById("startButton");
  const checkButton = document.getElementById("checkButton");
  const nextButton = document.getElementById("nextButton");
  const playAgainButton = document.getElementById("playAgainButton");

  // Modal
  const wordLimitModal = document.getElementById("wordLimitModal");
  const closeModalButton = document.getElementById("closeModalButton");
  const modalButtons = document.querySelector(".modal-buttons");

  // Interface elements
  const sourceWordEl = document.getElementById("sourceWord");
  const translationInput = document.getElementById("translationInput");
  const feedbackArea = document.getElementById("feedbackArea");

  // Statistics
  const correctCountEl = document.getElementById("sessionCorrectCount");
  const incorrectCountEl = document.getElementById("sessionIncorrectCount");
  const accuracyEl = document.getElementById("sessionAccuracy");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const resultsTableBody = document.getElementById("resultsTableBody");

  // Sounds
  const correctSound = new Audio("/frontend/public/assets/sound/correct.mp3");
  const incorrectSound = new Audio(
    "/frontend/public/assets/sound/incorrect.mp3"
  );

  let currentWord = null;
  let wordLimit = 0;
  let wordsCompleted = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let sessionResults = [];
  const selectedLanguage = "english";
  let wordChecked = false;
  let currentCorrectAnswer = null;

  function showWordLimitModal() {
    wordLimitModal.style.display = "flex";
  }

  function hideWordLimitModal() {
    wordLimitModal.style.display = "none";
  }

  function startGame(limit) {
    wordLimit = limit;
    wordsCompleted = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    sessionResults = [];
    updateStats();
    hideWordLimitModal();
    initialView.style.display = "none";
    resultsView.style.display = "none";
    flashcardView.style.display = "block";
    displayNewWord();
  }

  async function displayNewWord() {
    if (wordsCompleted >= wordLimit) {
      endGame();
      return;
    }

    wordChecked = false;
    currentCorrectAnswer = null; 
    sourceWordEl.textContent = "Ładowanie...";
    translationInput.value = "";
    checkButton.textContent = "✓ Sprawdź";
    nextButton.style.display = "inline-block";
    feedbackArea.classList.remove("feedback", "correct", "incorrect");
    feedbackArea.innerHTML = "";
    updateProgressBar();

    translationInput.disabled = true;
    checkButton.disabled = true;
    nextButton.disabled = true;

    try {
      const response = await fetch(
        `http://localhost:5000/api/words/random?lang=${selectedLanguage}`
      );
      if (!response.ok) throw new Error("Błąd pobierania słówka");

      currentWord = await response.json();
      sourceWordEl.textContent = currentWord.sourceWord;
      translationInput.focus();
    } catch (error) {
      sourceWordEl.textContent = "Błąd!";
      feedbackArea.textContent = error.message;
    } finally {
      translationInput.disabled = false;
      checkButton.disabled = false;
      nextButton.disabled = false;
    }
  }

  async function checkTranslation() {
    if (!currentWord || !translationInput.value.trim() || wordChecked) return;

    wordChecked = true;
    const userAnswer = translationInput.value.trim();

    checkButton.disabled = true;
    nextButton.disabled = true;

    try {
      const response = await fetch("http://localhost:5000/api/words/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceWord: currentWord.sourceWord,
          userAnswer: userAnswer,
          language: selectedLanguage,
        }),
      });

      const result = await response.json();
      currentCorrectAnswer = result.correctAnswer; 
      feedbackArea.classList.remove("correct", "incorrect");

      if (result.correct) {
        feedbackArea.classList.add("feedback", "correct");
        feedbackArea.innerHTML = "✔ Dobrze!";
        correctAnswers++;
        correctSound.play();
        await updateDailyProgress();
      } else {
        feedbackArea.classList.add("feedback", "incorrect");
        feedbackArea.innerHTML = `✘ Źle. Poprawna odpowiedź: <strong>${result.correctAnswer}</strong>`;
        incorrectAnswers++;
        incorrectSound.play();
      }

      sessionResults.push({
        source: currentWord.sourceWord,
        user: userAnswer,
        correct: result.correctAnswer,
        wasCorrect: result.correct,
      });

      translationInput.disabled = true;
      checkButton.textContent = "➜ Następne";
      nextButton.style.display = "none";
      updateStats();
    } catch (error) {
      feedbackArea.textContent = "Błąd sprawdzania odpowiedzi.";
    } finally {
      checkButton.disabled = false;
      checkButton.focus();
    }
  }

  function advanceToNextWord() {
    wordsCompleted++;
    if (wordsCompleted < wordLimit) {
      displayNewWord();
    } else {
      endGame();
    }
  }

  function updateStats() {
    correctCountEl.textContent = correctAnswers;
    incorrectCountEl.textContent = incorrectAnswers;
    const total = correctAnswers + incorrectAnswers;
    const accuracy = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;
    accuracyEl.textContent = `${accuracy}%`;
  }

  function updateProgressBar() {
    const percentage = wordLimit > 0 ? (wordsCompleted / wordLimit) * 100 : 0;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Słowo ${wordsCompleted + 1} / ${wordLimit}`;
  }

  async function endGame() {
    flashcardView.style.display = "none";
    await updateOverallStatsOnServer();
    displayResults();
    resultsView.style.display = "block";
  }

  function displayResults() {
    resultsTableBody.innerHTML = "";
    sessionResults.forEach((res) => {
      const row = document.createElement("tr");
      const icon = res.wasCorrect
        ? '<span class="result-icon correct">✓</span>'
        : '<span class="result-icon incorrect">✘</span>';
      row.innerHTML = `
                <td>${res.source}</td>
                <td>${res.user}</td>
                <td>${res.wasCorrect ? "-" : res.correct}</td>
                <td>${icon}</td>
            `;
      resultsTableBody.appendChild(row);
    });
  }

  function resetToInitialView() {
    resultsView.style.display = "none";
    initialView.style.display = "block";
  }

  async function updateOverallStatsOnServer() {
    const currentUser = getCurrentUser();
    if (!currentUser || (correctAnswers === 0 && incorrectAnswers === 0))
      return;
    try {
      await fetch(
        `http://localhost:5000/api/user/${currentUser.uid}/update-overall-stats`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            correctAnswers: correctAnswers,
            incorrectAnswers: incorrectAnswers,
          }),
        }
      );
    } catch (error) {
      console.error("Failed to update overall stats:", error);
    }
  }

  // Event Listeners
  startButton.addEventListener("click", showWordLimitModal);
  closeModalButton.addEventListener("click", hideWordLimitModal);

  modalButtons.addEventListener("click", (event) => {
    if (event.target.tagName === "BUTTON" && event.target.dataset.limit) {
      const limit = parseInt(event.target.dataset.limit, 10);
      startGame(limit);
    }
  });

  checkButton.addEventListener("click", () => {
    if (!wordChecked) {
      checkTranslation();
    } else {
      advanceToNextWord();
    }
  });

  nextButton.addEventListener("click", async () => {
    if (!wordChecked && currentWord) {
      try {
        const response = await fetch("http://localhost:5000/api/words/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceWord: currentWord.sourceWord,
            userAnswer: "", 
            language: selectedLanguage,
          }),
        });
        const result = await response.json();
        currentCorrectAnswer = result.correctAnswer;
      } catch (error) {
        console.error("Błąd pobierania poprawnej odpowiedzi:", error);
        currentCorrectAnswer = "Nieznana"; // fallback
      }
    }

    incorrectAnswers++;
    sessionResults.push({
      source: currentWord.sourceWord,
      user: "(pominięto)",
      correct: currentCorrectAnswer || "Nieznana", 
      wasCorrect: false,
    });
    updateStats();
    advanceToNextWord();
  });

  playAgainButton.addEventListener("click", resetToInitialView);

  translationInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      if (!wordChecked) {
        checkTranslation();
      } else {
        advanceToNextWord();
      }
    }
  });
}
