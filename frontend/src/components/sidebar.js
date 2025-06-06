// Pobieranie elementów DOM dla sidebara
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const resetStatsBtn = document.getElementById('resetStatsBtn');
const sidebarTimerBtn = document.getElementById('sidebarTimerBtn');
const sidebarCorrect = document.getElementById('sidebarCorrect');
const sidebarIncorrect = document.getElementById('sidebarIncorrect');
const sidebarAccuracy = document.getElementById('sidebarAccuracy');
const recentWordsList = document.getElementById('recentWords');

// Nie importujemy vocabulary - będziemy korzystać z globalnego kontekstu
// ponieważ app.js załaduje się wcześniej niż sidebar.js

// Maksymalna liczba ostatnio wyświetlanych słów
const MAX_RECENT_WORDS = 5;
// Tablica do przechowywania historii ostatnich słów
let recentWords = [];

// Funkcja do przełączania sidebara
function toggleSidebar() {
    sidebar.classList.toggle('active');
    document.body.classList.toggle('sidebar-open');
}

// Funkcja do zamykania sidebara
function closeSidebar() {
    sidebar.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

// Funkcja do aktualizacji statystyk w sidebarze
function updateSidebarStats(correct, incorrect) {
    sidebarCorrect.textContent = correct;
    sidebarIncorrect.textContent = incorrect;
    
    // Obliczanie dokładności
    const totalAttempts = correct + incorrect;
    const accuracy = totalAttempts > 0 ? Math.round((correct / totalAttempts) * 100) : 0;
    sidebarAccuracy.textContent = `${accuracy}%`;
}

// Funkcja do dodawania nowego słowa do historii
function addWordToHistory(germanWord, polishWord, isCorrect) {
    // Tworzenie nowego obiektu z informacjami o słowie
    const wordEntry = {
        german: germanWord,
        polish: polishWord,
        correct: isCorrect,
        timestamp: new Date().getTime()
    };
    
    // Dodanie na początek tablicy
    recentWords.unshift(wordEntry);
    
    // Ograniczenie liczby przechowywanych słów
    if (recentWords.length > MAX_RECENT_WORDS) {
        recentWords.pop();
    }
    
    // Aktualizacja listy w interfejsie
    renderRecentWords();
    
    // Zapisanie historii w localStorage
    saveRecentWords();
}

// Funkcja do renderowania listy ostatnich słów
function renderRecentWords() {
    // Wyczyszczenie obecnej listy
    recentWordsList.innerHTML = '';
    
    // Jeśli nie ma żadnych słów, wyświetl komunikat
    if (recentWords.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Brak historii słów';
        emptyMessage.style.color = 'var(--text-secondary)';
        recentWordsList.appendChild(emptyMessage);
        return;
    }
    
    // Generowanie elementów listy dla każdego słowa
    recentWords.forEach(word => {
        const listItem = document.createElement('li');
        
        // Dodanie niemieckiego słowa
        const germanSpan = document.createElement('span');
        germanSpan.textContent = word.german;
        germanSpan.className = 'word-german';
        
        // Dodanie polskiego tłumaczenia
        const polishSpan = document.createElement('span');
        polishSpan.textContent = word.polish;
        polishSpan.className = 'word-polish';
        
        // Dodanie wyniku (poprawne/niepoprawne)
        const resultSpan = document.createElement('span');
        resultSpan.className = `word-result ${word.correct ? 'correct' : 'incorrect'}`;
        resultSpan.textContent = word.correct ? '✓' : '✗';
        
        // Komponowanie elementu listy
        const wordInfo = document.createElement('div');
        wordInfo.appendChild(germanSpan);
        wordInfo.innerHTML += ' → ';
        wordInfo.appendChild(polishSpan);
        
        listItem.appendChild(wordInfo);
        listItem.appendChild(resultSpan);
        
        recentWordsList.appendChild(listItem);
    });
}

// Funkcje do zapisywania i wczytywania historii z localStorage
function saveRecentWords() {
    localStorage.setItem('recentWords', JSON.stringify(recentWords));
}

function loadRecentWords() {
    const saved = localStorage.getItem('recentWords');
    if (saved) {
        recentWords = JSON.parse(saved);
        renderRecentWords();
    }
}

// Funkcja do resetowania statystyk
function resetStats() {
    // Resetowanie statystyk w głównej aplikacji
    document.getElementById('correctCount').textContent = '0';
    document.getElementById('incorrectCount').textContent = '0';
    document.getElementById('accuracy').textContent = '0%';
    
    // Resetowanie statystyk w sidebarze
    sidebarCorrect.textContent = '0';
    sidebarIncorrect.textContent = '0';
    sidebarAccuracy.textContent = '0%';
    
    // Wyczyszczenie historii słów
    recentWords = [];
    renderRecentWords();
    saveRecentWords();
    
    // Zapisanie zresetowanych wartości w localStorage
    localStorage.setItem('correctCount', '0');
    localStorage.setItem('incorrectCount', '0');
    
    // Animacja potwierdzająca reset
    resetStatsBtn.classList.add('reset-animation');
    setTimeout(() => {
        resetStatsBtn.classList.remove('reset-animation');
    }, 500);
}

// Funkcja obsługi klawisza Esc
function handleEscKey(event) {
    if (event.key === 'Escape' && sidebar.classList.contains('active')) {
        closeSidebar();
    }
}

// Event listenery
sidebarToggle.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
resetStatsBtn.addEventListener('click', resetStats);

// Nasłuchiwanie klawisza Esc
document.addEventListener('keydown', handleEscKey);

// Event listener dla przycisku trybu czasu w sidebarze
sidebarTimerBtn.addEventListener('click', () => {
    // Zamknięcie sidebara
    closeSidebar();
    
    // Otwarcie modalu z ustawieniami trybu czasowego
    document.getElementById('timerModal').classList.add('active');
});

// Nasłuchiwanie zdarzeń z głównej aplikacji
document.addEventListener('wordAttempt', (event) => {
    const { germanWord, polishWord, isCorrect, correctCount, incorrectCount } = event.detail;
    
    // Dodanie słowa do historii
    addWordToHistory(germanWord, polishWord, isCorrect);
    
    // Aktualizacja statystyk
    updateSidebarStats(correctCount, incorrectCount);
});

// Inicjalizacja - wczytanie danych z localStorage
document.addEventListener('DOMContentLoaded', () => {
    loadRecentWords();
    
    // Wczytanie statystyk z localStorage
    const correctCount = localStorage.getItem('correctCount') || '0';
    const incorrectCount = localStorage.getItem('incorrectCount') || '0';
    
    updateSidebarStats(parseInt(correctCount), parseInt(incorrectCount));
});

// Eksport funkcji i zmiennych, które mogą być używane w innych modułach
export {
    updateSidebarStats,
    addWordToHistory,
    resetStats,
    closeSidebar
};

// Logowanie dla debugowania
console.log('Sidebar module loaded!');