import { initializeFlashcard } from './components/flashcard.js';

const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.dashboard-nav a');

if (document.getElementById('dashboardPage')) {
    initializeFlashcard();
}

console.log("Główny skrypt aplikacji załadowany.");

function showPage(pageId) {
 // Hide all pages
    pages.forEach(page => {
        page.style.display = 'none';
    });

    // Show selected page
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.style.display = 'block';
    }

    // Manage 'active' class in navigation menu
    navLinks.forEach(link => {
        // Check if the href in the link matches the onclick call
        if (link.getAttribute('onclick') === `showPage('${pageId}')`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
window.showPage = showPage;

// Show default page on load
document.addEventListener('DOMContentLoaded', () => {
    showPage('dashboardPage');
});