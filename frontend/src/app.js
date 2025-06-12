import { initializeFlashcard } from './components/flashcard.js';

if (document.getElementById('dashboardPage')) {
    initializeFlashcard();
}

console.log("Główny skrypt aplikacji załadowany.");