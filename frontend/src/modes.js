import { initializeFlashcard } from './components/flashcard.js';

// Main function to start modes
export function startMode(modeType) {
   // Check if the mode is available
    const modeElement = document.querySelector(`[onclick="startMode('${modeType}')"]`);
    if (modeElement && modeElement.classList.contains('coming-soon')) {
        showComingSoonModal(modeType);
        return;
    }

    hideAllPages();
    
    switch(modeType) {
        case 'flashcards':
            startFlashcardsMode();
            break;
        case 'quiz':
            startQuizMode();
            break;
        case 'writing':
            startWritingMode();
            break;
        case 'speed':
            startSpeedMode();
            break;
        default:
            console.error('Nieznany tryb:', modeType);
            showPage('modesPage');
    }
}

// Function to hide all pages
function hideAllPages() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });
}

// Flashcards Mode (Classic Flashcards)
function startFlashcardsMode() {
    document.getElementById('modesPage').style.display = 'block';
    
    const modesGrid = document.querySelector('.modes-grid');
    const pageHeader = document.querySelector('#modesPage .page-header');
    
    if (modesGrid) modesGrid.style.display = 'none';
    if (pageHeader) pageHeader.style.display = 'none';
    
    // Create or show flashcard container
    let flashcardContainer = document.getElementById('flashcard-container');
    if (!flashcardContainer) {
        flashcardContainer = createFlashcardInterface();
        document.getElementById('modesPage').appendChild(flashcardContainer);
    }
    
    flashcardContainer.style.display = 'block';
    
    initializeFlashcard();
}

// Function to create flashcard interface
function createFlashcardInterface() {
    const container = document.createElement('div');
    container.id = 'flashcard-container';
    container.className = 'flashcard-card';
    
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

// Quiz Mode (placeholder for now)
function startQuizMode() {
    document.getElementById('modesPage').style.display = 'block';
    showModeInterface('quiz', '❓ Quiz Wielokrotnego Wyboru', createQuizInterface());
}

function createQuizInterface() {
    return `
        <div class="quiz-container">
            <h2>Quiz będzie dostępny wkrótce!</h2>
            <p>Tryb wielokrotnego wyboru jest w trakcie tworzenia.</p>
            <button class="btn btn-primary" onclick="returnToModes()">Powrót do trybów</button>
        </div>
    `;
}

// Writing mode (placeholder for now)
function startWritingMode() {
    document.getElementById('modesPage').style.display = 'block';
    showModeInterface('writing', '✍️ Pisanie z Pamięci', createWritingInterface());
}

function createWritingInterface() {
    return `
        <div class="writing-container">
            <h2>Tryb pisania będzie dostępny wkrótce!</h2>
            <p>Zaawansowany tryb pisania z pamięci jest w przygotowaniu.</p>
            <button class="btn btn-primary" onclick="returnToModes()">Powrót do trybów</button>
        </div>
    `;
}

// Speed ​​mode (placeholder for now)
function startSpeedMode() {
    document.getElementById('modesPage').style.display = 'block';
    showModeInterface('speed', '⚡ Wyzwanie Szybkości', createSpeedInterface());
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
    const modesGrid = document.querySelector('.modes-grid');
    const pageHeader = document.querySelector('#modesPage .page-header');
    
    if (modesGrid) modesGrid.style.display = 'none';
    if (pageHeader) pageHeader.style.display = 'none';

    let modeContainer = document.getElementById(`${modeType}-mode-container`);
    if (!modeContainer) {
        modeContainer = document.createElement('div');
        modeContainer.id = `${modeType}-mode-container`;
        modeContainer.className = 'mode-interface';
        document.getElementById('modesPage').appendChild(modeContainer);
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
    
    modeContainer.style.display = 'block';
}

// Return to modes function
window.returnToModes = function() {
    const modeContainers = document.querySelectorAll('.mode-interface, .flashcard-card');
    modeContainers.forEach(container => {
        container.style.display = 'none';
    });
    
    const modesGrid = document.querySelector('.modes-grid');
    const pageHeader = document.querySelector('#modesPage .page-header');
    
    if (modesGrid) modesGrid.style.display = 'grid';
    if (pageHeader) pageHeader.style.display = 'block';
};

// Function for "coming soon" modes
function showComingSoonModal(modeType) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    
    const modeNames = {
        'audio': 'Nauka przez Słuch',
        'memory-palace': 'Pałac Pamięci'
    };
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2>🚧 Tryb w przygotowaniu</h2>
            <p><strong>${modeNames[modeType] || 'Ten tryb'}</strong> będzie dostępny wkrótce!</p>
            <p>Pracujemy nad implementacją tej funkcji. Tymczasem sprawdź inne dostępne tryby nauki.</p>
            <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                Rozumiem
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close the modal when clicking on the background
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Additional features for a quick start from the main dashboard
window.startNewSession = function() {
    showPage('modesPage');
};

window.reviewDifficultWords = function() {
    showPage('modesPage');
    // logic for difficult words
    setTimeout(() => {
        alert('Funkcja powtórki trudnych słówek będzie dostępna wkrótce!');
    }, 300);
};

window.startMode = startMode;