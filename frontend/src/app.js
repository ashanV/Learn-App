import { initializeFiszki } from './components/fiszki.js';

if (document.getElementById('dashboardPage')) {
    initializeFiszki();
}

console.log("Główny skrypt aplikacji załadowany.");