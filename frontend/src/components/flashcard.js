export function initializeFlashcard() {
    // Views
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

    // Flashcard elements
    const sourceWordEl = document.getElementById("sourceWord");
    const translationInput = document.getElementById("translationInput");
    const feedbackArea = document.getElementById("feedbackArea");

    // Statistics and progress
    const correctCountEl = document.getElementById("correctCount");
    const incorrectCountEl = document.getElementById("incorrectCount");
    const accuracyEl = document.getElementById("accuracy");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const resultsTableBody = document.getElementById("resultsTableBody");
    
    // Sounds
    const correctSound = new Audio("/frontend/public/assets/sound/correct.mp3");
    const incorrectSound = new Audio("/frontend/public/assets/sound/incorrect.mp3");

    let currentWord = null;
    let wordLimit = 0;
    let wordsCompleted = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let sessionResults = []; 
    const selectedLanguage = "english";
    let wordChecked = false;

    /**
     * Shows a popup to select the number of words.
     */
    function showWordLimitModal() {
        wordLimitModal.style.display = "flex";
    }

    function hideWordLimitModal() {
        wordLimitModal.style.display = "none";
    }

    /**
     *Starts a new learning session after selecting a word limit.
     * The selected number of words.
     */
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

    /**
     * Fetches a new word from the server and updates the interface.
     */
    async function displayNewWord() {
        if (wordsCompleted >= wordLimit) {
            endGame();
            return;
        }

        wordChecked = false;
        sourceWordEl.textContent = "Ładowanie...";
        translationInput.value = "";
        translationInput.disabled = false;
        checkButton.disabled = false;
        checkButton.textContent = "✓ Sprawdź";
        nextButton.style.display = 'inline-block'; 

        feedbackArea.classList.remove("feedback", "correct", "incorrect");
        feedbackArea.innerHTML = "";
        updateProgressBar();

        try {
            const response = await fetch(`http://localhost:5000/api/words/random?lang=${selectedLanguage}`);
            if (!response.ok) throw new Error("Błąd pobierania słówka");
            
            currentWord = await response.json();
            sourceWordEl.textContent = currentWord.sourceWord;
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
        if (!currentWord || !translationInput.value.trim() || wordChecked) return;

        wordChecked = true;
        const userAnswer = translationInput.value.trim();

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
            
            feedbackArea.classList.remove("correct", "incorrect");

            if (result.correct) {
                feedbackArea.classList.add("feedback", "correct");
                feedbackArea.innerHTML = "✔ Dobrze!";
                correctAnswers++;
                correctSound.play();
            } else {
                feedbackArea.classList.add("feedback", "incorrect");
                feedbackArea.innerHTML = `✘ Źle. Poprawna odpowiedź: <strong>${result.correctAnswer}</strong>`;
                incorrectAnswers++;
                incorrectSound.play();
            }
            
            // Save result to session history
            sessionResults.push({
                source: currentWord.sourceWord,
                user: userAnswer,
                correct: result.correctAnswer,
                wasCorrect: result.correct
            });

            translationInput.disabled = true;
            checkButton.textContent = "➜ Następne";
            nextButton.style.display = 'none';
            checkButton.focus();
            updateStats();

        } catch (error) {
            feedbackArea.textContent = "Błąd sprawdzania odpowiedzi.";
            console.error("Błąd w checkTranslation:", error);
        }
    }
    
    /**
     * Moves to the next word or ends the game.
     */
    function advanceToNextWord() {
        wordsCompleted++;
        if (wordsCompleted < wordLimit) {
            displayNewWord();
        } else {
            endGame();
        }
    }

    /**
     * Updates session statistics (correct, incorrect, accuracy).
     */
    function updateStats() {
        correctCountEl.textContent = correctAnswers;
        incorrectCountEl.textContent = incorrectAnswers;
        const total = correctAnswers + incorrectAnswers;
        const accuracy = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;
        accuracyEl.textContent = `${accuracy}%`;
    }

    /**
     * Updates the visual progress bar.
     */
    function updateProgressBar() {
        const percentage = wordLimit > 0 ? (wordsCompleted / wordLimit) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `Słowo ${wordsCompleted + 1} / ${wordLimit}`;
    }

    /**
     * Ends the session and displays the results screen.
     */
    function endGame() {
        flashcardView.style.display = "none";
        displayResults();
        resultsView.style.display = "block";
    }

    /**
     * Generates and displays a table with the session results.
     */
    function displayResults() {
        resultsTableBody.innerHTML = "";
        sessionResults.forEach(res => {
            const row = document.createElement("tr");
            const icon = res.wasCorrect 
                ? '<span class="result-icon correct">✓</span>' 
                : '<span class="result-icon incorrect">✘</span>';
            
            row.innerHTML = `
                <td>${res.source}</td>
                <td>${res.user}</td>
                <td>${res.wasCorrect ? '-' : res.correct}</td>
                <td>${icon}</td>
            `;
            resultsTableBody.appendChild(row);
        });
    }
    
    /**
     * Resets the interface to its initial state.
     */
    function resetToInitialView() {
        resultsView.style.display = "none";
        initialView.style.display = "block";
    }


    startButton.addEventListener("click", showWordLimitModal);
    closeModalButton.addEventListener("click", hideWordLimitModal);
    
    // Event delegation for buttons in modal
    modalButtons.addEventListener("click", (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.dataset.limit) {
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

    nextButton.addEventListener("click", () => {
        // Omitting a word counts as an error
        incorrectAnswers++;
        sessionResults.push({
                source: currentWord.sourceWord,
                user: '(pominięto)',
                correct: currentWord.translations.polish[0], 
                wasCorrect: false
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