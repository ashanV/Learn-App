import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { auth } from "../../../backend/config/firebase-config.js";
import { initializeFlashcard } from "./components/flashcard.js";
import "./modes.js";
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

function showPage(pageId) {
  pages.forEach((page) => (page.style.display = "none"));

  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.style.display = "block";
  }

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("onclick") === `showPage('${pageId}')`;
    link.classList.toggle("active", isActive);
  });

  if (pageId === "modesPage") {
    setTimeout(() => {
      const modesGrid = document.querySelector(".modes-grid");
      const pageHeader = document.querySelector("#modesPage .page-header");
      if (modesGrid) modesGrid.style.display = "grid";
      if (pageHeader) pageHeader.style.display = "block";

      const modeContainers = document.querySelectorAll(
        ".mode-interface, .flashcard-card"
      );
      modeContainers.forEach((container) => {
        container.style.display = "none";
      });
    }, 50);
  }
}

window.showPage = showPage;
window.setDailyGoal = setDailyGoal;
window.setCustomDailyGoal = setCustomDailyGoal;
window.closeDailyGoalModal = closeDailyGoalModal;

function setupDashboardEvents() {
  const setGoalButton = document.querySelector(".daily-goal-card .goal-btn");
  if (setGoalButton) {
    setGoalButton.addEventListener("click", setDailyGoal);
  }
}

async function loadDashboardData(user) {
  const userNameEl = document.getElementById("userName");
  const overallAccuracyEl = document.getElementById("accuracy");
  const masteredWordsEl = document.getElementById("masteredWords");

  try {
    const response = await fetch(`http://localhost:5000/api/user/${user.uid}`);
    if (!response.ok) throw new Error("Nie można pobrać profilu użytkownika.");

    const data = await response.json();

    if (userNameEl) userNameEl.textContent = user.displayName || "Użytkowniku";
    if (overallAccuracyEl)
      overallAccuracyEl.textContent = `🎯 ${data.user.overallAccuracy}%`;
    if (masteredWordsEl)
      masteredWordsEl.textContent = `🏆 ${data.user.masteredWords}`;

    await loadDailyStats();
  } catch (error) {
    console.error("Błąd ładowania danych dashboardu:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showPage("dashboardPage");
  setupDashboardEvents();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await loadDashboardData(user);
      initializeFlashcard();
    } else {
      window.location.href = "/frontend/public/index.html";
    }
  });
});

window.logout = () => {
  signOut(auth).catch((error) => console.error("Błąd wylogowania:", error));
};
