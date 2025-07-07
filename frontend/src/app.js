import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { auth } from "../../../backend/config/firebase-config.js";
import { initializeFlashcard } from "./components/flashcard.js";
import "./modes.js";
import "./components/profile.js";
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
  if (!page || page.querySelector(".page-loader")) return;

  const loader = document.createElement("div");
  loader.className = "page-loader";
  loader.innerHTML = `
    <div class="loader-spinner">
      <div class="spinner"></div>
      <p>Ładowanie...</p>
    </div>
  `;

  page.appendChild(loader);
}

function initializeLoaders() {
  const pageIds = [
    "dashboardPage",
    "modesPage",
    "profilePage",
    "statisticsPage",
  ];
  pageIds.forEach((pageId) => {
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
    showNotification(`Błąd ładowania strony: ${error.message}`, "error");
  } finally {
    hideLoader(pageId);
  }
}

async function loadPageData(pageId) {
  const user = auth.currentUser;

  if (
    !user &&
    (pageId === "dashboardPage" ||
      pageId === "profilePage" ||
      pageId === "statisticsPage")
  ) {
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
      await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

async function loadModesPage() {
  await new Promise((resolve) => setTimeout(resolve, 500));

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
    const response = await fetch(`http://localhost:5000/api/user/${user.uid}`);
    if (!response.ok) throw new Error("Nie można pobrać danych profilu.");

    const profileData = await response.json();
    console.log("Dane profilu załadowane:", profileData);

    // Wypełnij pola formularza
    const profileNameInput = document.getElementById("profileName");
    const profileEmailInput = document.getElementById("profileEmail");

    if (profileNameInput) {
      profileNameInput.value =
        profileData.user.profile?.displayName ||
        profileData.user.username ||
        "";
      updateInputIcon(profileNameInput);
    }

    if (profileEmailInput) {
      profileEmailInput.value = profileData.user.email || "";
      updateInputIcon(profileEmailInput);
    }
  } catch (error) {
    console.error("Błąd ładowania profilu:", error);
    showNotification(`Błąd ładowania profilu: ${error.message}`, "error");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

// profile update
async function updateUserProfile() {
  const user = auth.currentUser;

  if (!user) {
    showNotification(
      "Musisz być zalogowany, aby zaktualizować profil",
      "error"
    );
    return;
  }

  try {
    const profileNameInput = document.getElementById("profileName");
    const displayName = profileNameInput?.value.trim();

    if (!displayName) {
      showNotification("Nazwa użytkownika nie może być pusta", "error");
      return;
    }

    const response = await fetch(`http://localhost:5000/api/user/${user.uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        displayName: displayName,
        photoURL: null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Profil zaktualizowany pomyślnie:", data);

    showNotification("Profil został zaktualizowany pomyślnie", "success");
  } catch (error) {
    console.error("Błąd podczas aktualizacji profilu:", error);
    showNotification("Nie udało się zaktualizować profilu", "error");
  }
}

async function loadStatisticsPage(user) {
  if (!user) {
    console.log("Brak użytkownika - pomijanie ładowania statystyk");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/user/${user.uid}/statistics`
    );
    if (!response.ok) throw new Error("Nie można pobrać statystyk.");

    const statsData = await response.json();
    console.log("Statystyki załadowane:", statsData);
  } catch (error) {
    console.error("Błąd ładowania statystyk:", error);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

window.showPage = showPage;
window.setDailyGoal = setDailyGoal;
window.setCustomDailyGoal = setCustomDailyGoal;
window.closeDailyGoalModal = closeDailyGoalModal;
window.updateUserProfile = updateUserProfile;

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
      const displayName =
        data.user.profile?.displayName || data.user.username || "Użytkowniku";
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

// Function to update icon state
function updateInputIcon(inputElement) {
  const inputGroup = inputElement.closest(".input-group");
  const icon = inputGroup.querySelector(".input-icon");

  if (inputElement.value.trim() !== "") {
    inputGroup.classList.add("filled");
    icon.classList.add("animate");

    // Usuń animację po zakończeniu
    setTimeout(() => {
      icon.classList.remove("animate");
    }, 600);
  } else {
    inputGroup.classList.remove("filled");
    icon.classList.remove("animate");
  }
}

// Add event listeners for inputs
document.addEventListener("DOMContentLoaded", function () {
  const inputs = document.querySelectorAll(".input-group input");

  inputs.forEach((input) => {
    input.addEventListener("input", () => updateInputIcon(input));
    input.addEventListener("blur", () => updateInputIcon(input));
  });
});

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
