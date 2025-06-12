export function initializeFiszki() {
  const sourceWordEl = document.getElementById("sourceWord");
  const translationInput = document.getElementById("translationInput");
  const checkButton = document.getElementById("checkButton");
  const nextButton = document.getElementById("nextButton");
  const feedbackArea = document.getElementById("feedbackArea");
  const correctCountEl = document.getElementById("correctCount");
  const incorrectCountEl = document.getElementById("incorrectCount");
  const accuracyEl = document.getElementById("accuracy");

  let currentWord = null;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  const selectedLanguage = "english";

  /**
   * Downloads a new word from the server and updates the UI.
   */
  async function displayNewWord() {
    try {
      // Loading message
      sourceWordEl.textContent = "Ładowanie...";
      feedbackArea.textContent = "";
      translationInput.value = "";
      translationInput.disabled = true;
      checkButton.disabled = true;

      const response = await fetch(
        `http://localhost:5000/api/words/random?lang=${selectedLanguage}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Błąd pobierania słówka");
      }

      currentWord = await response.json();

      // UI update with new word
      sourceWordEl.textContent = currentWord.sourceWord;
      translationInput.disabled = false;
      checkButton.disabled = false;
      translationInput.focus();
    } catch (error) {
      sourceWordEl.textContent = "Błąd!";
      feedbackArea.textContent = error.message;
      console.error("Błąd w displayNewWord:", error);
    }
  }

  /**
   * Checks the translation provided by the user.
   */
  async function checkTranslation() {
    if (!currentWord || !translationInput.value) return;

    const userAnswer = translationInput.value;

    try {
      const response = await fetch("http://localhost:5000/api/words/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceWord: currentWord.sourceWord,
          userAnswer: userAnswer,
          language: selectedLanguage,
        }),
      });

      const result = await response.json();

      if (result.correct) {
        feedbackArea.innerHTML = '<span style="color: green;">✔ Dobrze!</span>';
        correctAnswers++;
      } else {
        feedbackArea.innerHTML = `<span style="color: red;">✘ Źle. Poprawna odpowiedź: <strong>${result.correctAnswer}</strong></span>`;
        incorrectAnswers++;
      }
      updateStats();
    } catch (error) {
      feedbackArea.textContent = "Błąd sprawdzania odpowiedzi.";
      console.error("Błąd w checkTranslation:", error);
    }
  }

  /**
   * Updates session statistics.
   */
  function updateStats() {
    correctCountEl.textContent = correctAnswers;
    incorrectCountEl.textContent = incorrectAnswers;
    const total = correctAnswers + incorrectAnswers;
    const accuracy = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;
    accuracyEl.textContent = `${accuracy}%`;
  }


  checkButton.addEventListener("click", checkTranslation);
  nextButton.addEventListener("click", displayNewWord);

  // Allows checking by pressing Enter in the input field
  translationInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      checkTranslation();
    }
  });

  displayNewWord();
}
