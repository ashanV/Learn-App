export function initializeWriting() {
  // --- CONFIGURATION ---
  const API_BASE_URL = 'http://localhost:5000/api/writing';
  
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
    loadingIndicator: document.getElementById("loadingIndicator"),
    errorMessage: document.getElementById("errorMessage"),
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
    isLoading: false,
    selectedLevel: null,
    selectedDifficulty: null,
  };

  // --- API FUNCTIONS ---
  async function fetchWords(level = null, difficulty = null, limit = 20) {
    try {
      state.isLoading = true;
      showLoading(true);
      
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (difficulty) params.append('difficulty', difficulty);
      if (limit) params.append('limit', limit);
      
      const response = await fetch(`${API_BASE_URL}/words?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch words');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching words:', error);
      showError('Błąd podczas pobierania słów. Spróbuj ponownie.');
      return [];
    } finally {
      state.isLoading = false;
      showLoading(false);
    }
  }

  async function fetchRandomWord(level = null, difficulty = null) {
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (difficulty) params.append('difficulty', difficulty);
      
      const response = await fetch(`${API_BASE_URL}/words/random?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch random word');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching random word:', error);
      return null;
    }
  }

  async function checkAnswerWithBackend(wordId, userAnswer) {
    try {
      const response = await fetch(`${API_BASE_URL}/check-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wordId: wordId,
          userAnswer: userAnswer
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to check answer');
      }
      
      return data;
    } catch (error) {
      console.error('Error checking answer:', error);
      return null;
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch stats');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return null;
    }
  }

  // --- MAIN LOGIC ---
  async function init() {
    console.log('Initializing writing module...');
    
    // Check if required DOM elements exist
    const requiredElements = ['checkBtn', 'translationInput', 'sourceWord', 'feedback'];
    const missingElements = requiredElements.filter(id => !dom[id]);
    
    if (missingElements.length > 0) {
      console.error(
        `Błąd inicjalizacji: Nie znaleziono elementów DOM: ${missingElements.join(', ')}. 
         Upewnij się, że HTML zawiera wszystkie wymagane elementy.`
      );
      showError(`Błąd inicjalizacji: Brakuje elementów HTML: ${missingElements.join(', ')}`);
      return;
    }

    console.log('DOM elements found, fetching words...');
    
    // Load initial words from backend
    const words = await fetchWords();
    
    if (words.length === 0) {
      console.error('No words fetched from backend');
      showError('Nie udało się załadować słów. Sprawdź połączenie z serwerem.');
      return;
    }

    console.log(`Loaded ${words.length} words from backend`);

    // Transform backend data to match frontend structure
    state.wordDataWithProgress = words.map((word) => ({
      _id: word._id,
      word: word.word,
      pronunciation: word.pronunciation || '',
      context: word.context || '',
      type: word.type || '',
      level: word.level || '',
      frequency: word.frequency || '',
      translations: word.translations || [],
      hints: word.hints || [],
      difficulty: word.difficulty || '',
      mastery: 0,
      lastAnswerCorrect: true,
    }));

    console.log('Words transformed, adding event listeners...');
    addEventListeners();
    
    console.log('Loading first word...');
    await loadNextWord();
  }

  function addEventListeners() {
    // Add null checks for each element
    if (dom.checkBtn) {
      dom.checkBtn.addEventListener("click", checkAnswer);
    }
    
    if (dom.nextBtn) {
      dom.nextBtn.addEventListener("click", loadNextWord);
    }
    
    if (dom.hintBtn) {
      dom.hintBtn.addEventListener("click", showHint);
    }
    
    if (dom.skipBtn) {
      dom.skipBtn.addEventListener("click", skipWord);
    }
    
    if (dom.translationInput) {
      dom.translationInput.addEventListener("input", updateInputFeedback);
      dom.translationInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (dom.checkBtn) {
            dom.checkBtn.click();
          }
        }
      });
      dom.translationInput.addEventListener("focus", () => {
        if (dom.writingArea) {
          dom.writingArea.classList.add("focused");
        }
      });
      dom.translationInput.addEventListener("blur", () => {
        if (dom.writingArea) {
          dom.writingArea.classList.remove("focused");
        }
      });
    }

    if (dom.modeSelector) {
      dom.modeSelector.addEventListener("click", (e) => {
        if (e.target.classList.contains("writing-mode-btn")) {
          changeMode(e.target.dataset.mode);
        }
      });
    }
  }

  async function loadNextWord() {
    console.log('Loading next word...');
    
    if (state.wordDataWithProgress.length === 0) {
      console.log('No words available, fetching more...');
      // Try to fetch more words if we run out
      const newWords = await fetchWords(state.selectedLevel, state.selectedDifficulty);
      
      if (newWords.length === 0) {
        console.log('No more words available, showing final score');
        showFinalScore();
        return;
      }
      
      // Add new words to the existing array
      const transformedWords = newWords.map((word) => ({
        _id: word._id,
        word: word.word,
        pronunciation: word.pronunciation || '',
        context: word.context || '',
        type: word.type || '',
        level: word.level || '',
        frequency: word.frequency || '',
        translations: word.translations || [],
        hints: word.hints || [],
        difficulty: word.difficulty || '',
        mastery: 0,
        lastAnswerCorrect: true,
      }));
      
      state.wordDataWithProgress = [...state.wordDataWithProgress, ...transformedWords];
    }

    // Sort by mastery to prioritize difficult words
    state.wordDataWithProgress.sort((a, b) => a.mastery - b.mastery);
    state.currentWord = state.wordDataWithProgress[0];

    console.log('Current word:', state.currentWord);

    const word = state.currentWord;
    
    // Update DOM elements with null checks
    if (dom.sourceWord) dom.sourceWord.textContent = word.word;
    if (dom.pronunciation) dom.pronunciation.textContent = word.pronunciation;
    if (dom.contextSentence) dom.contextSentence.innerHTML = word.context;
    if (dom.wordType) dom.wordType.textContent = word.type;
    if (dom.wordLevel) dom.wordLevel.textContent = word.level;
    if (dom.wordFrequency) dom.wordFrequency.textContent = word.frequency;

    resetUIForNewWord();
    updateStatsUI();

    if (state.mode === "timed") startTimer();
    state.startTime = Date.now();
    
    console.log('Word loaded successfully');
  }

  // --- ANSWER CHECKING AND FEEDBACK ---
  async function checkAnswer() {
    console.log('Checking answer...');
    
    clearInterval(state.timerInterval);
    
    if (!dom.translationInput) {
      console.error('Translation input not found');
      return;
    }
    
    const userInput = dom.translationInput.value.trim();
    if (userInput.length === 0) {
      console.log('Empty input, skipping check');
      return;
    }

    state.stats.total++;
    state.stats.totalTime += (Date.now() - state.startTime) / 1000;
    state.stats.answersCount++;

    console.log('User input:', userInput);
    console.log('Checking with backend...');

    // Use backend to check answer
    const result = await checkAnswerWithBackend(state.currentWord._id, userInput);
    
    if (result) {
      console.log('Backend result:', result);
      // Use backend result
      if (result.correct) {
        state.stats.correct++;
        state.stats.streak++;
        state.currentWord.mastery = Math.min(100, state.currentWord.mastery + 25);
        showFeedback(true, result.feedback);
      } else {
        state.stats.streak = 0;
        state.currentWord.mastery = Math.max(0, state.currentWord.mastery - 20);
        if (result.similarity > 70) {
          showFeedback("partial", result.feedback, result.correctAnswers);
        } else {
          showFeedback(false, result.feedback, result.correctAnswers);
        }
      }
    } else {
      console.log('Backend check failed, using fallback');
      // Fallback to frontend checking if backend fails
      const correctAnswers = state.currentWord.translations.map((t) => t.toLowerCase());
      const userInputLower = userInput.toLowerCase();
      
      if (correctAnswers.includes(userInputLower)) {
        state.stats.correct++;
        state.stats.streak++;
        state.currentWord.mastery = Math.min(100, state.currentWord.mastery + 25);
        showFeedback(true, `Doskonale!`);
      } else {
        state.stats.streak = 0;
        state.currentWord.mastery = Math.max(0, state.currentWord.mastery - 20);
        const similarity = getHighestSimilarity(userInputLower, correctAnswers);
        if (similarity > 0.7) {
          showFeedback("partial", `Prawie dobrze! Sprawdź pisownię.`, state.currentWord.translations);
        } else {
          showFeedback(false, `Niestety, to nie to.`, state.currentWord.translations);
        }
      }
    }
    
    updateUIafterAnswer();
    updateStatsUI();
  }

  // --- SKIP AND HINT FUNCTIONS ---
  function skipWord() {
    console.log('Skipping word...');
    clearInterval(state.timerInterval);
    state.stats.total++;
    state.stats.streak = 0;
    state.currentWord.mastery = Math.max(0, state.currentWord.mastery - 10);
    showFeedback(false, `Pominięto słowo.`, state.currentWord.translations);
    updateUIafterAnswer();
    updateStatsUI();
  }

  function showHint() {
    console.log('Showing hint...');
    const { hints, mastery } = state.currentWord;
    if (!hints || hints.length === 0) {
      console.log('No hints available');
      return;
    }
    
    if (!dom.hintSection) {
      console.error('Hint section not found');
      return;
    }
    
    const existingHintsCount = dom.hintSection.querySelectorAll(".hint").length;
    if (existingHintsCount >= hints.length) {
      console.log('All hints already shown');
      return;
    }

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
  async function changeMode(newMode) {
    console.log('Changing mode to:', newMode);
    if (state.mode === newMode) return;
    state.mode = newMode;

    document.querySelectorAll(".writing-mode-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === newMode);
    });
    await resetGame();
  }

  function startTimer() {
    console.log('Starting timer...');
    state.timeLeft = 30;
    if (dom.timer) dom.timer.textContent = state.timeLeft;
    if (dom.timePressure) dom.timePressure.classList.add("active");
    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      if (dom.timer) dom.timer.textContent = state.timeLeft;
      if (state.timeLeft <= 0) {
        clearInterval(state.timerInterval);
        timeUp();
      }
    }, 1000);
  }

  function timeUp() {
    console.log('Time up!');
    showFeedback(false, "Czas minął!", state.currentWord.translations);
    updateUIafterAnswer();
    updateStatsUI();
  }

  async function resetGame() {
    console.log('Resetting game...');
    clearInterval(state.timerInterval);
    state.stats = {
      correct: 0,
      total: 0,
      streak: 0,
      totalTime: 0,
      answersCount: 0,
    };
    
    // Reset mastery for existing words
    state.wordDataWithProgress.forEach((word) => (word.mastery = 0));
    
    // Reload words from backend
    const words = await fetchWords(state.selectedLevel, state.selectedDifficulty);
    
    if (words.length > 0) {
      state.wordDataWithProgress = words.map((word) => ({
        _id: word._id,
        word: word.word,
        pronunciation: word.pronunciation || '',
        context: word.context || '',
        type: word.type || '',
        level: word.level || '',
        frequency: word.frequency || '',
        translations: word.translations || [],
        hints: word.hints || [],
        difficulty: word.difficulty || '',
        mastery: 0,
        lastAnswerCorrect: true,
      }));
    }
    
    if (dom.timePressure) dom.timePressure.classList.remove("active");
    await loadNextWord();
  }

  // --- UI UPDATE FUNCTIONS ---
  function resetUIForNewWord() {
    if (dom.feedback) {
      dom.feedback.style.display = "none";
      dom.feedback.className = "feedback";
    }
    
    if (dom.translationInput) {
      dom.translationInput.value = "";
      dom.translationInput.disabled = false;
      dom.translationInput.focus();
    }
    
    if (dom.hintSection) {
      dom.hintSection.innerHTML = "";
    }
    
    if (dom.checkBtn) {
      dom.checkBtn.style.display = "inline-block";
    }
    
    if (dom.hintBtn) {
      dom.hintBtn.style.display = "inline-block";
      dom.hintBtn.disabled = state.mode === "hardcore";
    }
    
    if (dom.skipBtn) {
      dom.skipBtn.style.display = "inline-block";
    }
    
    if (dom.nextBtn) {
      dom.nextBtn.style.display = "none";
    }
    
    updateInputFeedback();
  }

  function updateUIafterAnswer() {
    if (dom.translationInput) {
      dom.translationInput.disabled = true;
    }
    
    if (dom.checkBtn) {
      dom.checkBtn.style.display = "none";
    }
    
    if (dom.hintBtn) {
      dom.hintBtn.style.display = "none";
    }
    
    if (dom.skipBtn) {
      dom.skipBtn.style.display = "none";
    }
    
    if (dom.nextBtn) {
      dom.nextBtn.style.display = "inline-block";
      dom.nextBtn.focus();
    }
  }

  // --- FEEDBACK AND STATISTICS FUNCTIONS ---
  function showFeedback(type, message, correctAnswers = []) {
    if (!dom.feedback) {
      console.error('Feedback element not found');
      return;
    }
    
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
    if (dom.correctCount) dom.correctCount.textContent = state.stats.correct;
    if (dom.totalCount) dom.totalCount.textContent = state.stats.total;
    if (dom.streakCount) dom.streakCount.textContent = state.stats.streak;
    
    const accuracy = state.stats.total > 0 ? Math.round((state.stats.correct / state.stats.total) * 100) : 0;
    if (dom.accuracy) dom.accuracy.textContent = `${accuracy}%`;
    
    const avgTime = state.stats.answersCount > 0 ? (state.stats.totalTime / state.stats.answersCount).toFixed(1) : 0;
    if (dom.avgTime) dom.avgTime.textContent = `${avgTime}s`;
    
    const totalMastery = state.wordDataWithProgress.reduce((sum, word) => sum + word.mastery, 0);
    const maxMastery = state.wordDataWithProgress.length * 100;
    const masteryPercentage = maxMastery > 0 ? Math.round((totalMastery / maxMastery) * 100) : 0;
    
    if (dom.masteryLevel) dom.masteryLevel.textContent = `${masteryPercentage}%`;
    if (dom.masteryBar) dom.masteryBar.style.width = `${masteryPercentage}%`;
    
    const reviewCount = state.wordDataWithProgress.filter((word) => word.mastery < 80).length;
    if (dom.reviewWords) dom.reviewWords.textContent = reviewCount;
  }

  function updateInputFeedback() {
    if (!state.currentWord || !dom.translationInput) return;
    
    const userInput = dom.translationInput.value;
    const correctAnswers = state.currentWord.translations;
    
    if (dom.charCount) dom.charCount.textContent = userInput.length;
    if (dom.expectedLength && correctAnswers.length > 0) {
      dom.expectedLength.textContent = correctAnswers[0].length;
    }
    
    if (userInput.length > 0 && correctAnswers.length > 0) {
      const similarity = getHighestSimilarity(userInput, correctAnswers);
      const percentage = Math.round(similarity * 100);
      
      if (dom.similarityMeter) {
        dom.similarityMeter.classList.add("show");
      }
      
      if (dom.similarityFill) {
        dom.similarityFill.style.width = `${percentage}%`;
      }
      
      if (dom.similarityText) {
        dom.similarityText.textContent = `Podobieństwo: ${percentage}%`;
      }
      
      if (percentage > 70 && percentage < 100) {
        if (dom.typoIndicator) {
          dom.typoIndicator.classList.add("show");
        }
        if (dom.typoText) {
          dom.typoText.textContent = `Czy chodziło Ci o: ${findClosestAnswer(userInput, correctAnswers)}?`;
        }
      } else {
        if (dom.typoIndicator) {
          dom.typoIndicator.classList.remove("show");
        }
      }
    } else {
      if (dom.similarityMeter) {
        dom.similarityMeter.classList.remove("show");
      }
      if (dom.typoIndicator) {
        dom.typoIndicator.classList.remove("show");
      }
    }
  }

  // --- UI HELPER FUNCTIONS ---
  function showLoading(show) {
    if (dom.loadingIndicator) {
      dom.loadingIndicator.style.display = show ? "block" : "none";
    }
  }

  function showError(message) {
    console.error('Error:', message);
    if (dom.errorMessage) {
      dom.errorMessage.textContent = message;
      dom.errorMessage.style.display = "block";
      setTimeout(() => {
        dom.errorMessage.style.display = "none";
      }, 5000);
    } else {
      alert(message);
    }
  }

  // --- FINAL SCORE DISPLAY ---
  function showFinalScore() {
    console.log('Showing final score');
    const wordSection = document.getElementById("word-section-id");
    if (wordSection) {
      wordSection.innerHTML = `
        <div class="header">
          <h2 class="title">Koniec!</h2>
          <p class="subtitle">Oto Twoje końcowe statystyki. Świetna robota!</p>
        </div>
        <button class="btn btn-primary" onclick="location.reload()">Zagraj jeszcze raz</button>
      `;
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
    if (!answers || answers.length === 0) return 0;
    return Math.max(...answers.map((answer) => getSimilarity(input.toLowerCase(), answer.toLowerCase())));
  }

  function findClosestAnswer(input, answers) {
    if (!answers || answers.length === 0) return '';
    return answers.reduce((best, current) =>
      getSimilarity(input.toLowerCase(), current.toLowerCase()) > getSimilarity(input.toLowerCase(), best.toLowerCase())
        ? current
        : best
    );
  }

  // --- PUBLIC API ---
  const api = {
    setLevel: (level) => {
      state.selectedLevel = level;
      resetGame();
    },
    setDifficulty: (difficulty) => {
      state.selectedDifficulty = difficulty;
      resetGame();
    },
    getStats: () => state.stats,
    fetchBackendStats: fetchStats,
  };

  // Initialize the game
  init().catch(error => {
    console.error('Failed to initialize writing module:', error);
    showError('Nie udało się zainicjalizować modułu pisania.');
  });
  
  return api;
}