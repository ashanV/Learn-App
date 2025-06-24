class QuizManager {
  constructor() {
    this.questions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedAnswers = [];
    this.timeLimit = 30; 
    this.timeRemaining = this.timeLimit;
    this.timer = null;
    this.isQuizActive = false;
    this.startTime = null;
    this.userAnswers = [];
  }

  // Initializing the quiz
  async init() {
    try {
      await this.loadQuestions();
      this.setupEventListeners();
      this.startQuiz();
    } catch (error) {
      console.error('Błąd inicjalizacji quizu:', error);
      this.showError('Nie udało się załadować pytań quizu');
    }
  }

  // Load questions from server
  async loadQuestions() {
    try {
      const selectedLanguage = localStorage.getItem('selectedLanguage') || 'en';
      const questionsCount = 10;
      
      const response = await fetch(`http://localhost:5000/api/quiz/questions?lang=${selectedLanguage}&count=${questionsCount}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.questions = data.questions;
      
      if (this.questions.length === 0) {
        throw new Error('Brak pytań dla wybranego języka');
      }
    } catch (error) {
      console.error('Błąd ładowania pytań:', error);
      throw error;
    }
  }

  // Setting up event listeners
  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quiz-option') && this.isQuizActive) {
        this.selectAnswer(e.target);
      }
    });

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }

    const restartBtn = document.querySelector('[onclick="restartQuiz()"]');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartQuiz());
    }
  }

  // Start quiz
  startQuiz() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedAnswers = [];
    this.userAnswers = [];
    this.isQuizActive = true;
    this.startTime = new Date();
    
    this.displayQuestion();
    this.updateStats();
    this.startTimer();
  }

  // View current question
  displayQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endQuiz();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    
    // Update interface
    const questionNumberEl = document.getElementById('questionNumber');
    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const feedbackEl = document.getElementById('feedback');
    
    if (questionNumberEl) {
      questionNumberEl.textContent = `Pytanie ${this.currentQuestionIndex + 1}`;
    }
    
    if (questionEl) {
      questionEl.textContent = question.question;
    }
    
    if (optionsEl) {
      optionsEl.innerHTML = '';
      question.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'quiz-option';
        optionEl.setAttribute('data-answer', index);
        optionEl.textContent = option;
        optionsEl.appendChild(optionEl);
      });
    }
    
    if (feedbackEl) {
      feedbackEl.innerHTML = '';
      feedbackEl.style.display = 'none';
    }

    // Reset timer
    this.timeRemaining = this.timeLimit;
    this.updateTimer();

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.disabled = true;
    }
  }

  // Select an answer
  selectAnswer(selectedOption) {
    if (!this.isQuizActive) return;

    // Delete previous selections
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
      option.classList.remove('selected', 'correct', 'incorrect');
    });

    // Mark selected option
    selectedOption.classList.add('selected');
    
    const selectedIndex = parseInt(selectedOption.getAttribute('data-answer'));
    const question = this.questions[this.currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswer;

    // Stop timer
    this.stopTimer();

    // Show feedback
    this.showFeedback(isCorrect, selectedIndex, question.correctAnswer);

    // Save the response
    this.userAnswers.push({
      questionId: question.id,
      questionText: question.question,
      selectedAnswer: selectedIndex,
      selectedText: question.options[selectedIndex],
      correctAnswer: question.correctAnswer,
      correctText: question.options[question.correctAnswer],
      isCorrect: isCorrect,
      timeSpent: this.timeLimit - this.timeRemaining
    });

    if (isCorrect) {
      this.score++;
      selectedOption.classList.add('correct');
    } else {
      selectedOption.classList.add('incorrect');
      options[question.correctAnswer].classList.add('correct');
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.disabled = false;
    }

    this.updateStats();
  }

  // Show feedback
  showFeedback(isCorrect, selectedIndex, correctIndex) {
    const feedbackEl = document.getElementById('feedback');
    if (!feedbackEl) return;

    const question = this.questions[this.currentQuestionIndex];
    
    if (isCorrect) {
      feedbackEl.innerHTML = `
        <div class="feedback-correct">
          <span class="feedback-icon">✅</span>
          <span class="feedback-text">Brawo! To jest poprawna odpowiedź.</span>
        </div>
      `;
    } else {
      feedbackEl.innerHTML = `
        <div class="feedback-incorrect">
          <span class="feedback-icon">❌</span>
          <span class="feedback-text">
            Niepoprawnie. Poprawna odpowiedź to: <strong>${question.options[correctIndex]}</strong>
          </span>
        </div>
      `;
    }
    
    feedbackEl.style.display = 'block';
  }

  // Next question
  nextQuestion() {
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endQuiz();
    } else {
      this.displayQuestion();
      this.startTimer();
    }
  }

  // Start timer
  startTimer() {
    this.timeRemaining = this.timeLimit;
    this.updateTimer();
    
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.updateTimer();
      
      if (this.timeRemaining <= 0) {
        this.timeUp();
      }
    }, 1000);
  }

  // Stop timer
  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // Update timer display
  updateTimer() {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.textContent = `${this.timeRemaining}s`;
      
      // Change color when time runs out
      if (this.timeRemaining <= 5) {
        timerEl.classList.add('timer-warning');
      } else {
        timerEl.classList.remove('timer-warning');
      }
    }
  }

 // Time is up
  timeUp() {
    this.stopTimer();
    
    const question = this.questions[this.currentQuestionIndex];
    if (!question || typeof question.id === 'undefined') {
      console.error('Błąd: Brak pytania lub właściwości id w timeUp');
      this.nextQuestion();
      return;
    }

    const correctAnswerIndex = question.correctAnswer;
    
    // Save no response
    this.userAnswers.push({
      questionId: question.id,
      questionText: question.question,
      selectedAnswer: -1,
      selectedText: 'Brak odpowiedzi',
      correctAnswer: correctAnswerIndex,
      correctText: question.options[correctAnswerIndex],
      isCorrect: false,
      timeSpent: this.timeLimit
    });

    // Show feedback about time
    const feedbackEl = document.getElementById('feedback');
    if (feedbackEl) {
      feedbackEl.innerHTML = `
        <div class="feedback-timeout">
          <span class="feedback-icon">⏰</span>
          <span class="feedback-text">
            Czas się skończył! Poprawna odpowiedź to: <strong>${question.options[correctAnswerIndex]}</strong>
          </span>
        </div>
      `;
      feedbackEl.style.display = 'block';
    }

    const options = document.querySelectorAll('.quiz-option');
    if (options[correctAnswerIndex]) {
      options[correctAnswerIndex].classList.add('correct');
    }

    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
      nextBtn.disabled = false;
    }

    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  // Update statistics
  updateStats() {
   // Current question number
    const questionCountEl = document.getElementById('questionCount');
    if (questionCountEl) {
      questionCountEl.textContent = `${this.currentQuestionIndex + 1}/${this.questions.length}`;
    }

  // Points
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      scoreEl.textContent = this.score;
    }

    // Progress bar
    const progressEl = document.getElementById('progress');
    if (progressEl) {
      const progressPercent = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
      progressEl.style.width = `${progressPercent}%`;
    }
  }

  // End quiz
  async endQuiz() {
    this.isQuizActive = false;
    this.stopTimer();
    
    const endTime = new Date();
    const totalTimeSpent = Math.round((endTime - this.startTime) / 1000); // w sekundach
    
   // Show results
    await this.showResults(totalTimeSpent);
    
    // Save results to server
    await this.saveResults(totalTimeSpent);
  }

  // Show results
  async showResults(totalTimeSpent) {
    const accuracy = Math.round((this.score / this.questions.length) * 100);
    
    const questionContainer = document.getElementById('questionContainer');
    const controls = document.querySelector('.controls');
    
    if (questionContainer) questionContainer.style.display = 'none';
    if (controls) controls.style.display = 'none';

   // Create and show results
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'quiz-results';
    resultsContainer.innerHTML = `
      <div class="results-header">
        <h2>🎉 Quiz Zakończony!</h2>
        <div class="final-score">
          <div class="score-circle">
            <span class="score-percentage">${accuracy}%</span>
            <span class="score-text">Dokładność</span>
          </div>
        </div>
      </div>
      
      <div class="results-stats">
        <div class="result-stat">
          <span class="stat-label">Poprawne odpowiedzi</span>
          <span class="stat-value">${this.score}/${this.questions.length}</span>
        </div>
        <div class="result-stat">
          <span class="stat-label">Czas całkowity</span>
          <span class="stat-value">${Math.floor(totalTimeSpent / 60)}:${(totalTimeSpent % 60).toString().padStart(2, '0')}</span>
        </div>
        <div class="result-stat">
          <span class="stat-label">Średni czas na pytanie</span>
          <span class="stat-value">${Math.round(totalTimeSpent / this.questions.length)}s</span>
        </div>
      </div>

      <div class="results-actions">
        <button class="quiz-btn quiz-btn-primary" onclick="quizManager.restartQuiz()">
          🔄 Spróbuj ponownie
        </button>
        <button class="quiz-btn quiz-btn-secondary" onclick="returnToModes()">
          🏠 Powrót do trybów
        </button>
        <button class="quiz-btn quiz-btn-secondary" onclick="quizManager.showDetailedResults()">
          📊 Szczegółowe wyniki
        </button>
      </div>
    `;

    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
      quizContainer.appendChild(resultsContainer);
    }
  }

  // Show detailed results
  showDetailedResults() {
    const detailedContainer = document.createElement('div');
    detailedContainer.className = 'detailed-results';
    
    let detailedHTML = `
      <div class="detailed-header">
        <button class="back-btn" onclick="this.parentElement.parentElement.remove()">← Powrót</button>
        <h3>📋 Szczegółowe Wyniki</h3>
      </div>
      <div class="detailed-questions">
    `;

    this.userAnswers.forEach((answer, index) => {
      const statusClass = answer.isCorrect ? 'correct' : 'incorrect';
      const statusIcon = answer.isCorrect ? '✅' : '❌';
      
      detailedHTML += `
        <div class="detailed-question ${statusClass}">
          <div class="question-header">
            <span class="question-num">Pytanie ${index + 1}</span>
            <span class="question-status">${statusIcon}</span>
          </div>
          <div class="question-text">${answer.questionText}</div>
          <div class="answer-comparison">
            <div class="user-answer">
              <strong>Twoja odpowiedź:</strong> ${answer.selectedText}
            </div>
            ${!answer.isCorrect ? `
              <div class="correct-answer">
                <strong>Poprawna odpowiedź:</strong> ${answer.correctText}
              </div>
            ` : ''}
          </div>
          <div class="time-spent">Czas: ${answer.timeSpent}s</div>
        </div>
      `;
    });

    detailedHTML += `
      </div>
    `;

    detailedContainer.innerHTML = detailedHTML;
    
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
      quizContainer.appendChild(detailedContainer);
    }
  }

  // Save results to server
  async saveResults(totalTimeSpent) {
    try {
      const firebaseUid = localStorage.getItem('firebaseUid');
      if (!firebaseUid) {
        console.warn('Brak firebaseUid - nie można zapisać wyników');
        return;
      }

      const resultsData = {
        firebaseUid: firebaseUid,
        results: this.userAnswers,
        totalQuestions: this.questions.length,
        correctAnswers: this.score,
        timeSpent: totalTimeSpent
      };

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultsData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Wyniki zapisane pomyślnie:', data);
      
    } catch (error) {
      console.error('Błąd zapisywania wyników:', error);
    }
  }

  // Restart quiz
  restartQuiz() {
    const resultsContainers = document.querySelectorAll('.quiz-results, .detailed-results');
    resultsContainers.forEach(container => container.remove());
    
    const questionContainer = document.getElementById('questionContainer');
    const controls = document.querySelector('.controls');
    
    if (questionContainer) questionContainer.style.display = 'block';
    if (controls) controls.style.display = 'flex';

    this.init();
  }

  // Show error
  showError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'quiz-error';
    errorContainer.innerHTML = `
      <div class="error-content">
        <h3>❌ Błąd</h3>
        <p>${message}</p>
        <button class="quiz-btn" onclick="returnToModes()">Powrót do trybów</button>
      </div>
    `;

    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
      quizContainer.innerHTML = '';
      quizContainer.appendChild(errorContainer);
    }
  }
}

// Global quiz instance
let quizManager = null;

// Global functions for compatibility with existing code
window.restartQuiz = function() {
  if (quizManager) {
    quizManager.restartQuiz();
  }
};

window.nextQuestion = function() {
  if (quizManager) {
    quizManager.nextQuestion();
  }
};

// Initialize the quiz when the interface is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we are in quiz mode
  const quizContainer = document.getElementById('quiz-container');
  if (quizContainer && quizContainer.style.display !== 'none') {
    initializeQuiz();
  }
});

window.initializeQuiz = function() {
  quizManager = new QuizManager();
  quizManager.init();
};

export { QuizManager };