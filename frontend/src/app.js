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

function showLoader(pageId) {
  const loader = document.querySelector(`#${pageId} .page-loader`);
  if (loader) {
    loader.style.display = "flex";
  }
}

function hideLoader(pageId) {
  const loader = document.querySelector(`#${pageId} .page-loader`);
  if (loader) {
    loader.style.display = "none";
  }
}

function createLoader(pageId) {
  const page = document.getElementById(pageId);
  if (!page || page.querySelector('.page-loader')) return;

  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.innerHTML = `
    <div class="loader-spinner">
      <div class="spinner"></div>
      <p>Ładowanie...</p>
    </div>
  `;

  page.appendChild(loader);
}

function initializeLoaders() {
  const pageIds = ['dashboardPage', 'modesPage', 'profilePage', 'statisticsPage'];
  pageIds.forEach(pageId => {
    createLoader(pageId);
  });
}

async function showPage(pageId) {
  pages.forEach((page) => (page.style.display = "none"));

  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.style.display = "block";
    showLoader(pageId);
  }

  navLinks.forEach((link) => {
    const isActive = link.getAttribute("onclick") === `showPage('${pageId}')`;
    link.classList.toggle("active", isActive);
  });

  try {
    await loadPageData(pageId);
  } catch (error) {
    console.error(`Błąd ładowania strony ${pageId}:`, error);
    showNotification(`Błąd ładowania strony: ${error.message}`, 'error');
  } finally {
    hideLoader(pageId);
  }
}

async function loadPageData(pageId) {
  const user = auth.currentUser;

  if (!user && (pageId === "dashboardPage" || pageId === "profilePage" || pageId === "statisticsPage")) {
    console.log("Oczekiwanie na uwierzytelnienie użytkownika...");
    return;
  }
  
  switch (pageId) {
    case "dashboardPage":
      await loadDashboardData(user);
      break;
      
    case "modesPage":
      await loadModesPage();
      break;
      
    case "profilePage":
      await loadProfilePage(user);
      break;
      
    case "statisticsPage":
      await loadStatisticsPage(user);
      break;
      
    default:
      await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function loadModesPage() {
  await new Promise(resolve => setTimeout(resolve, 500));
  
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

async function loadProfilePage(user) {
  if (!user) {
    console.log("Brak użytkownika - pomijanie ładowania profilu");
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/user/${user.uid}/profile`);
    if (!response.ok) throw new Error("Nie można pobrać danych profilu.");
    
    const profileData = await response.json();
    console.log("Dane profilu załadowane:", profileData);
    
  } catch (error) {
    console.error("Błąd ładowania profilu:", error);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

async function loadStatisticsPage(user) {
  if (!user) {
    console.log("Brak użytkownika - pomijanie ładowania statystyk");
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:5000/api/user/${user.uid}/statistics`);
    if (!response.ok) throw new Error("Nie można pobrać statystyk.");
    
    const statsData = await response.json();
    console.log("Statystyki załadowane:", statsData);
    
  } catch (error) {
    console.error("Błąd ładowania statystyk:", error);
    await new Promise(resolve => setTimeout(resolve, 300));
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
  if (!user) {
    console.log("Brak użytkownika - pomijanie ładowania danych dashboardu");
    return;
  }

  const userNameEl = document.getElementById("userName");
  const overallAccuracyEl = document.getElementById("accuracy");
  const masteredWordsEl = document.getElementById("masteredWords");

  try {
    const response = await fetch(`http://localhost:5000/api/user/${user.uid}`);
    if (!response.ok) throw new Error("Nie można pobrać profilu użytkownika.");

    const data = await response.json();

    if (userNameEl) {
      const displayName = data.user.profile?.displayName || data.user.username || "Użytkowniku";
      userNameEl.textContent = displayName;
    }
    
    if (overallAccuracyEl)
      overallAccuracyEl.textContent = `🎯 ${data.user.overallAccuracy}%`;
    if (masteredWordsEl)
      masteredWordsEl.textContent = `🏆 ${data.user.masteredWords}`;

    await loadDailyStats();
  } catch (error) {
    console.error("Błąd ładowania danych dashboardu:", error);
    throw error;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeLoaders();
  
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      showPage("dashboardPage");
      setupDashboardEvents();
      initializeFlashcard();
    } else {
      window.location.href = "/frontend/public/index.html";
    }
  });
});

window.logout = () => {
  signOut(auth).catch((error) => console.error("Błąd wylogowania:", error));
};