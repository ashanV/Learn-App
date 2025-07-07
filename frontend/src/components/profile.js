// Funkcja do pobierania i wyświetlania danych użytkownika w profilu
async function loadUserProfile() {
  try {
    // Pobierz Firebase UID z localStorage lub sessionStorage
    const firebaseUid =
      localStorage.getItem("firebaseUid") ||
      sessionStorage.getItem("firebaseUid");

    if (!firebaseUid) {
      console.error("Brak Firebase UID użytkownika");
      return;
    }

    // Pobierz dane użytkownika z API
    const response = await fetch(
      `http://localhost:5000/api/user/${firebaseUid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const user = data.user;

    // Wypełnij pola formularza
    const profileNameInput = document.getElementById("profileName");
    const profileEmailInput = document.getElementById("profileEmail");

    if (profileNameInput) {
      profileNameInput.value = user.profile?.displayName || user.username || "";
    }

    if (profileEmailInput) {
      profileEmailInput.value = user.email || "";
    }

    console.log("Dane użytkownika załadowane pomyślnie");
  } catch (error) {
    console.error("Błąd podczas ładowania profilu użytkownika:", error);

    // Opcjonalnie: wyświetl komunikat błędu użytkownikowi
    showErrorMessage("Nie udało się załadować danych profilu");
  }
}

// Funkcja do wyświetlania komunikatu błędu (opcjonalna)
function showErrorMessage(message) {
  // Możesz dostosować tę funkcję do swojego systemu powiadomień
  console.error(message);

  // Przykład prostego powiadomienia
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;

  document.body.appendChild(errorDiv);

  // Usuń komunikat po 5 sekundach
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

// Funkcja do aktualizacji profilu (opcjonalna)
async function updateUserProfile() {
  try {
    const firebaseUid =
      localStorage.getItem("firebaseUid") ||
      sessionStorage.getItem("firebaseUid");

    if (!firebaseUid) {
      console.error("Brak Firebase UID użytkownika");
      return;
    }

    const profileNameInput = document.getElementById("profileName");
    const displayName = profileNameInput?.value.trim();

    if (!displayName) {
      showErrorMessage("Nazwa użytkownika nie może być pusta");
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/user/${firebaseUid}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: displayName,
          photoURL: null, // Możesz dodać obsługę zdjęcia profilowego
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Profil zaktualizowany pomyślnie:", data);

    // Opcjonalnie: wyświetl komunikat sukcesu
    showSuccessMessage("Profil został zaktualizowany pomyślnie");
  } catch (error) {
    console.error("Błąd podczas aktualizacji profilu:", error);
    showErrorMessage("Nie udało się zaktualizować profilu");
  }
}

// Funkcja do wyświetlania komunikatu sukcesu (opcjonalna)
function showSuccessMessage(message) {
  const successDiv = document.createElement("div");
  successDiv.className = "success-message";
  successDiv.textContent = message;
  successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;

  document.body.appendChild(successDiv);

  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 3000);
}

// Załaduj profil użytkownika gdy strona się załaduje
document.addEventListener("DOMContentLoaded", function () {
  loadUserProfile();
});

// Przykład użycia - dodaj event listener do przycisku zapisz (jeśli istnieje)
document.addEventListener("DOMContentLoaded", function () {
  const saveButton = document.getElementById("saveProfileButton"); // Dostosuj ID do swojego przycisku

  if (saveButton) {
    saveButton.addEventListener("click", function (e) {
      e.preventDefault();
      updateUserProfile();
    });
  }
});
