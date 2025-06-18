import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { auth } from '../../../backend/config/firebase-config.js';
import { initializeFlashcard } from "./components/flashcard.js";
import {
  setDailyGoal,
  loadDailyStats,
  updateDailyProgress,
  setCustomDailyGoal,
  closeDailyGoalModal,
  showNotification,
} from "./components/daily-goal.js";

const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".dashboard-nav a");

if (document.getElementById("dashboardPage")) {
  initializeFlashcard();
}

console.log("Główny skrypt aplikacji załadowany.");

function showPage(pageId) {
  // Hide all pages
  pages.forEach((page) => {
    page.style.display = "none";
  });

  // Show selected page
  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.style.display = "block";
  }

  // Manage 'active' class in navigation menu
  navLinks.forEach((link) => {
    // Check if the href in the link matches the onclick call
    if (link.getAttribute("onclick") === `showPage('${pageId}')`) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

// Make functions globally available
window.showPage = showPage;
window.setDailyGoal = setDailyGoal;
window.setCustomDailyGoal = setCustomDailyGoal;
window.closeDailyGoalModal = closeDailyGoalModal;

// Show default page on load
document.addEventListener("DOMContentLoaded", () => {
  showPage("dashboardPage");
});

document.addEventListener("DOMContentLoaded", () => {
  const setGoalButton = document.querySelector(".daily-goal-card .goal-btn");
  const userNameEl = document.getElementById("userName");
  const overallAccuracyEl = document.getElementById("accuracy");
  const masteredWordsEl = document.getElementById("masteredWords");

  if (setGoalButton) {
    setGoalButton.addEventListener("click", setDailyGoal);
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in.
      await loadDashboardData(user);
      initializeFlashcard();
    } else {
      // User is signed out.
      window.location.href = "/frontend/public/index.html"; // Redirect to login page
    }
  });

  async function loadDashboardData(user) {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/user/${user.uid}`
      );
      if (!response.ok) {
        throw new Error("Could not fetch user profile.");
      }
      const data = await response.json();

      // Update UI with user data
      if (userNameEl) {
        userNameEl.textContent = user.displayName || "Użytkowniku";
      }
      if (overallAccuracyEl) {
        overallAccuracyEl.textContent = `🎯 ${data.user.overallAccuracy}%`;
      }
      if (masteredWordsEl) {
        masteredWordsEl.textContent = `🏆 ${data.user.masteredWords}`;
      }

      // Load daily stats
      await loadDailyStats();
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }
});

// Make functions globally available for onclick handlers in HTML
window.logout = () => {
  signOut(auth).catch((error) => console.error("Logout Error:", error));
};

