// Baza słówek: niemieckie słowo -> polskie tłumaczenie
const vocabulary = [
    { german: "Hund", polish: "pies" },
    { german: "Katze", polish: "kot" },
    { german: "Haus", polish: "dom" },
    { german: "Auto", polish: "samochód" },
    { german: "Baum", polish: "drzewo" },
    { german: "Wasser", polish: "woda" },
    { german: "Brot", polish: "chleb" },
    { german: "Buch", polish: "książka" },
    { german: "Tisch", polish: "stół" },
    { german: "Stuhl", polish: "krzesło" },
    { german: "Fenster", polish: "okno" },
    { german: "Tür", polish: "drzwi" },
    { german: "Stadt", polish: "miasto" },
    { german: "Land", polish: "kraj" },
    { german: "Mensch", polish: "człowiek" },
    { german: "Kind", polish: "dziecko" },
    { german: "Arbeit", polish: "praca" },
    { german: "Schule", polish: "szkoła" },
    { german: "Tag", polish: "dzień" },
    { german: "Nacht", polish: "noc" },
    { german: "Sonne", polish: "słońce" },
    { german: "Mond", polish: "księżyc" },
    { german: "Zeit", polish: "czas" },
    { german: "Leben", polish: "życie" },
    { german: "Freund", polish: "przyjaciel" }
  ];
  
  // Eksportujemy słownik do użycia w innych modułach
  export { vocabulary };
  
  // Pobieranie elementów DOM
  const germanWordElement = document.getElementById('germanWord');
  const translationInput = document.getElementById('translation');
  const checkButton = document.getElementById('checkButton');
  const nextButton = document.getElementById('nextButton');
  const feedbackElement = document.getElementById('feedback');
  const correctCountElement = document.getElementById('correctCount');
  const incorrectCountElement = document.getElementById('incorrectCount');
  const accuracyElement = document.getElementById('accuracy');
  const timerButton = document.getElementById('timerButton');
  const timerModal = document.getElementById('timerModal');
  const closeModalButton = document.querySelector('.close-modal');
  const timeOptions = document.querySelectorAll('.time-option');
  const startTimerButton = document.querySelector('.start-timer-btn');
  const timerDisplay = document.getElementById('timerDisplay');
  const timeLeftElement = document.getElementById('timeLeft');
  const container = document.querySelector('.container');
  const summaryContainer = document.getElementById('summaryContainer');
  const summaryCorrect = document.getElementById('summaryCorrect');
  const summaryIncorrect = document.getElementById('summaryIncorrect');
  const summaryAccuracy = document.getElementById('summaryAccuracy');
  const wordSpeed = document.getElementById('wordSpeed');
  const performanceMsg = document.getElementById('performanceMsg');
  const restartButton = document.getElementById('restartButton');
  
  // Zmienne do śledzenia statystyk
  let correctCount = 0;
  let incorrectCount = 0;
  let currentWordIndex = 0;
  let usedWords = [];
  
  // Zmienne do obsługi timera
  let timerActive = false;
  let timeLeft = 60;
  let selectedTime = 60;
  let timerInterval;
  let sessionStartTime;
  let wordsAttempted = 0;
  
  // Funkcja do tworzenia niestandardowych zdarzeń
  function createWordAttemptEvent(germanWord, polishWord, isCorrect) {
    return new CustomEvent('wordAttempt', {
      detail: {
        germanWord,
        polishWord,
        isCorrect,
        correctCount,
        incorrectCount
      }
    });
  }

  // Funkcja do zapisywania statystyk w localStorage
  function saveStats() {
    localStorage.setItem('correctCount', correctCount);
    localStorage.setItem('incorrectCount', incorrectCount);
  }

  // Funkcja do wczytywania statystyk z localStorage
  function loadStats() {
    const savedCorrect = localStorage.getItem('correctCount');
    const savedIncorrect = localStorage.getItem('incorrectCount');
    
    if (savedCorrect !== null) {
      correctCount = parseInt(savedCorrect);
      correctCountElement.textContent = correctCount;
    }
    
    if (savedIncorrect !== null) {
      incorrectCount = parseInt(savedIncorrect);
      incorrectCountElement.textContent = incorrectCount;
    }
    
    // Obliczanie dokładności
    const totalAttempts = correctCount + incorrectCount;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
    accuracyElement.textContent = `${accuracy}%`;
  }
  
  // Funkcja do losowania słowa
  function getRandomWord() {
      // Resetowanie użytych słów, jeśli wszystkie zostały wykorzystane
      if (usedWords.length === vocabulary.length) {
          usedWords = [];
      }
      
      // Filtrowanie słów, które jeszcze nie były używane w tej rundzie
      const availableWords = vocabulary.filter(word => !usedWords.includes(word));
      
      // Losowanie słowa
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const word = availableWords[randomIndex];
      
      // Dodanie do użytych słów
      usedWords.push(word);
      
      return word;
  }
  
  // Funkcja do wyświetlania nowego słowa
  function displayNewWord() {
      const wordObj = getRandomWord();
      currentWordIndex = vocabulary.findIndex(item => item.german === wordObj.german);
      
      // Animacja zmiany słowa
      germanWordElement.style.opacity = 0;
      setTimeout(() => {
          germanWordElement.textContent = wordObj.german;
          germanWordElement.style.opacity = 1;
      }, 200);
      
      translationInput.value = '';
      translationInput.focus();
      
      // Ukryj przycisk "Następne słowo" i feedback
      nextButton.classList.add('hidden');
      checkButton.classList.remove('hidden');
      feedbackElement.classList.add('hidden');
  }
  
  // Funkcja do sprawdzania tłumaczenia
  function checkTranslation() {
      const userTranslation = translationInput.value.trim().toLowerCase();
      const correctTranslation = vocabulary[currentWordIndex].polish.toLowerCase();
      const germanWord = vocabulary[currentWordIndex].german;
      
      // Zwiększenie licznika prób
      if (timerActive) {
          wordsAttempted++;
      }
      
      // Sprawdzenie czy tłumaczenie jest poprawne
      let isCorrect = false;
      if (userTranslation === correctTranslation) {
          feedbackElement.textContent = "Poprawnie! 👍";
          feedbackElement.classList.remove('incorrect');
          feedbackElement.classList.add('correct');
          correctCount++;
          correctCountElement.textContent = correctCount;
          isCorrect = true;
      } else {
          feedbackElement.textContent = `Niepoprawnie! Prawidłowa odpowiedź to: ${correctTranslation}`;
          feedbackElement.classList.remove('correct');
          feedbackElement.classList.add('incorrect');
          incorrectCount++;
          incorrectCountElement.textContent = incorrectCount;
      }
      
      // Obliczanie dokładności
      const totalAttempts = correctCount + incorrectCount;
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
      accuracyElement.textContent = `${accuracy}%`;
      
      // Pokazanie feedbacku
      feedbackElement.classList.remove('hidden');
      
      // Wysłanie informacji o próbie do sidebara
      document.dispatchEvent(createWordAttemptEvent(germanWord, correctTranslation, isCorrect));
      
      // Zapisanie statystyk
      saveStats();
      
      // W trybie normalnym pokazujemy przycisk do następnego słowa
      if (!timerActive) {
          checkButton.classList.add('hidden');
          nextButton.classList.remove('hidden');
      } else {
          // W trybie czasowym od razu przechodzimy do następnego słowa
          setTimeout(() => {
              displayNewWord();
          }, 1000); // Pokazanie feedbacku na 1 sekundę
      }
  }
  
  // Funkcja do obsługi końca sesji czasowej
  function endTimerSession() {
      clearInterval(timerInterval);
      timerActive = false;
      
      // Zatrzymaj działanie aplikacji
      checkButton.disabled = true;
      translationInput.disabled = true;
      
      // Aktualizacja podsumowania
      summaryCorrect.textContent = correctCount;
      summaryIncorrect.textContent = incorrectCount;
      
      const totalAttempts = correctCount + incorrectCount;
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
      summaryAccuracy.textContent = `${accuracy}%`;
      
      // Obliczanie słów na minutę
      const sessionDurationMinutes = selectedTime / 60;
      const wordsPerMinute = Math.round(wordsAttempted / sessionDurationMinutes);
      wordSpeed.textContent = `${wordsPerMinute} słów/min`;
      
      // Komunikat o wynikach
      if (accuracy >= 90) {
          performanceMsg.textContent = "Wspaniale! Twoja dokładność jest bardzo wysoka!";
      } else if (accuracy >= 70) {
          performanceMsg.textContent = "Dobra robota! Stale doskonalą się Twoje umiejętności!";
      } else if (accuracy >= 50) {
          performanceMsg.textContent = "Nieźle! Kontynuuj naukę dla lepszych wyników!";
      } else {
          performanceMsg.textContent = "Nie poddawaj się! Systematyczna nauka przyniesie efekty!";
      }
      
      // Pokazanie podsumowania
      summaryContainer.classList.add('active');
  }
  
  // Funkcja do startowania sesji timera
  function startTimerSession() {
      // Resetowanie statystyk sesji
      correctCount = 0;
      incorrectCount = 0;
      wordsAttempted = 0;
      correctCountElement.textContent = '0';
      incorrectCountElement.textContent = '0';
      accuracyElement.textContent = '0%';
      
      // Zapisz zresetowane statystyki
      saveStats();
      
      // Powiadom sidebar o zresetowanych statystykach
      document.dispatchEvent(createWordAttemptEvent('', '', false));
      
      // Resetuj stan interfejsu
      checkButton.disabled = false;
      translationInput.disabled = false;
      
      // Ustawienie czasu
      timeLeft = selectedTime;
      timeLeftElement.textContent = timeLeft;
      
      // Aktywacja trybu czasowego
      timerActive = true;
      timerDisplay.classList.add('active');
      container.classList.add('time-mode-active');
      
      // Ukryj przycisk trybu czasu
      timerButton.style.display = 'none'
      
      // Zapamiętanie czasu rozpoczęcia
      sessionStartTime = new Date();
      
      // Wyświetlenie nowego słowa
      displayNewWord();
      
      // Uruchomienie timera
      timerInterval = setInterval(() => {
          timeLeft--;
          timeLeftElement.textContent = timeLeft;
          
          // Ostrzeżenie gdy zostało mało czasu
          if (timeLeft <= 10) {
              timerDisplay.classList.add('warning');
          }
          
          // Koniec czasu
          if (timeLeft <= 0) {
              endTimerSession();
          }
      }, 1000);
      
      // Ukrycie modalu
      timerModal.classList.remove('active');
  }
  
  // Funkcja do resetowania aplikacji
  function resetApp() {
      // Ukrycie podsumowania
      summaryContainer.classList.remove('active');
      
      // Dezaktywacja trybu czasowego
      timerDisplay.classList.remove('active');
      timerDisplay.classList.remove('warning');
      container.classList.remove('time-mode-active');
      
      // Pokaż ponownie przycisk trybu czasu
      timerButton.classList.remove('hidden');
      timerButton.style.display = ''
      
      // Resetowanie statystyk
      correctCount = 0;
      incorrectCount = 0;
      correctCountElement.textContent = '0';
      incorrectCountElement.textContent = '0';
      accuracyElement.textContent = '0%';
      
      // Zapisz zresetowane statystyki
      saveStats();
      
      // Powiadom sidebar o zresetowanych statystykach
      document.dispatchEvent(createWordAttemptEvent('', '', false));
      
      // Resetowanie interfejsu
      checkButton.disabled = false;
      translationInput.disabled = false;
      feedbackElement.classList.add('hidden');
      nextButton.classList.add('hidden');
      checkButton.classList.remove('hidden');
      
      // Wyświetlenie nowego słowa
      displayNewWord();
  }
  
  // Event listenery
  checkButton.addEventListener('click', checkTranslation);
  
  // Dodany event listener dla przycisku "Następne słowo"
  nextButton.addEventListener('click', displayNewWord);
  
  // Obsługa przycisku "Tryb czasu"
  timerButton.addEventListener('click', function() {
      timerModal.classList.add('active');
  });
  
  // Obsługa przycisku zamykania modalu
  closeModalButton.addEventListener('click', function() {
      timerModal.classList.remove('active');
  });
  
  // Obsługa opcji wyboru czasu
  timeOptions.forEach(option => {
      option.addEventListener('click', function() {
          // Usunięcie klasy 'selected' z wszystkich opcji
          timeOptions.forEach(opt => opt.classList.remove('selected'));
          
          // Dodanie klasy 'selected' do klikniętej opcji
          this.classList.add('selected');
          
          // Zapisanie wybranego czasu
          selectedTime = parseInt(this.getAttribute('data-time'));
      });
  });
  
  // Obsługa przycisku startowania trybu czasowego
  startTimerButton.addEventListener('click', startTimerSession);
  
  // Obsługa przycisku restartu
  restartButton.addEventListener('click', resetApp);
  
  // Obsługa klawisza Enter w polu tekstowym
  translationInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
          if (!checkButton.classList.contains('hidden')) {
              checkTranslation();
          } else if (!nextButton.classList.contains('hidden')) {
              displayNewWord();
          }
      }
  });
  
  // Inicjalizacja aplikacji
  document.addEventListener('DOMContentLoaded', () => {
    // Wczytanie zapisanych statystyk
    loadStats();
    
    // Wyświetlenie pierwszego słowa
    displayNewWord();
  });