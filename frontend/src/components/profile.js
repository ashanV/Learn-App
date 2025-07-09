// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: "db1arvunk",
  uploadPreset: "learn app",
  apiKey: "451551355969186",
};

// Function to retrieve and display user profile data
async function loadUserProfile() {
  try {
    const firebaseUid =
      localStorage.getItem("firebaseUid") ||
      sessionStorage.getItem("firebaseUid");

    if (!firebaseUid) {
      console.error("Brak Firebase UID użytkownika");
      return;
    }

    // Get user data from API
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

    const profileNameInput = document.getElementById("profileName");
    const profileEmailInput = document.getElementById("profileEmail");
    const avatarPreview = document.getElementById("avatarPreview");

    if (profileNameInput) {
      profileNameInput.value = user.profile?.displayName || user.username || "";
    }

    if (profileEmailInput) {
      profileEmailInput.value = user.email || "";
    }

    // Display user avatar
    if (avatarPreview) {
      if (user.profile?.photoURL) {
        avatarPreview.src = user.profile.photoURL;
      } else {
        const initials = getInitials(
          user.profile?.displayName || user.username || user.email
        );
        avatarPreview.src = `https://placehold.co/160x160/004d40/FFFFFF?text=${initials}&font=Inter`;
      }
    }

    console.log("Dane użytkownika załadowane pomyślnie");
  } catch (error) {
    console.error("Błąd podczas ładowania profilu użytkownika:", error);
    showErrorMessage("Nie udało się załadować danych profilu");
  }
}

// Function to generate initials
function getInitials(name) {
  if (!name) return "U";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Function to upload a photo to Cloudinary
async function uploadImageToCloudinary(file) {
  try {
    // File validation
    if (!file) {
      throw new Error("Nie wybrano pliku");
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Plik musi być obrazem");
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Plik jest za duży. Maksymalny rozmiar to 5MB");
    }

    // Show loading
    showLoadingMessage("Przesyłanie zdjęcia...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    formData.append("folder", "avatars");

    // Uploading to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Błąd przesyłania: ${response.status}`);
    }

    const data = await response.json();

    // Return secure_url (HTTPS image link)
    return data.secure_url;
  } catch (error) {
    console.error("Błąd przesyłania zdjęcia:", error);
    throw error;
  }
}

// Function to update avatar
async function updateAvatar(imageUrl) {
  try {
    const firebaseUid =
      localStorage.getItem("firebaseUid") ||
      sessionStorage.getItem("firebaseUid");

    if (!firebaseUid) {
      throw new Error("Brak Firebase UID użytkownika");
    }

    const response = await fetch(
      `http://localhost:5000/api/user/${firebaseUid}/avatar`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photoURL: imageUrl,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Awatar zaktualizowany pomyślnie:", data);

    // Update avatar preview
    const avatarPreview = document.getElementById("avatarPreview");
    if (avatarPreview) {
      avatarPreview.src = imageUrl;
    }

    showSuccessMessage("Awatar został zaktualizowany pomyślnie");

    return data;
  } catch (error) {
    console.error("Błąd podczas aktualizacji avatara:", error);
    throw error;
  }
}

// Function to handle avatar change
async function handleAvatarChange(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  try {
    // Show preview locally (optional)
    const reader = new FileReader();
    reader.onload = function (e) {
      const avatarPreview = document.getElementById("avatarPreview");
      if (avatarPreview) {
        avatarPreview.src = e.target.result;
      }
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    const imageUrl = await uploadImageToCloudinary(file);

    // Update in database
    await updateAvatar(imageUrl);
  } catch (error) {
    console.error("Błąd podczas zmiany avatara:", error);
    showErrorMessage(error.message || "Nie udało się zaktualizować avatara");

    // Restore previous avatar on error
    loadUserProfile();
  }
}

// Function to remove avatar
async function removeAvatar() {
  try {
    const firebaseUid =
      localStorage.getItem("firebaseUid") ||
      sessionStorage.getItem("firebaseUid");

    if (!firebaseUid) {
      throw new Error("Brak Firebase UID użytkownika");
    }

    if (!confirm("Czy na pewno chcesz usunąć swój awatar?")) {
      return;
    }

    showLoadingMessage("Usuwanie avatara...");

    const response = await fetch(
      `http://localhost:5000/api/user/${firebaseUid}/avatar`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Awatar usunięty pomyślnie:", data);

    const avatarPreview = document.getElementById("avatarPreview");
    const profileNameInput = document.getElementById("profileName");

    if (avatarPreview) {
      const displayName = profileNameInput?.value || "User";
      const initials = getInitials(displayName);
      avatarPreview.src = `https://placehold.co/160x160/004d40/FFFFFF?text=${initials}&font=Inter`;
    }

    hideLoadingMessage();
    showSuccessMessage("Awatar został usunięty pomyślnie");
  } catch (error) {
    console.error("Błąd podczas usuwania avatara:", error);
    hideLoadingMessage();
    showErrorMessage(error.message || "Nie udało się usunąć avatara");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Delete avatar button
  const removeAvatarButton = document.getElementById("removeAvatarButton");
  if (removeAvatarButton) {
    removeAvatarButton.addEventListener("click", function (e) {
      e.preventDefault();
      removeAvatar();
    });
  }

  // Or add a context menu on the right click of the avatar
  const avatarPreview = document.getElementById("avatarPreview");
  if (avatarPreview) {
    avatarPreview.addEventListener("contextmenu", function (e) {
      e.preventDefault();

      // Check if the user has an avatar
      if (!avatarPreview.src.includes("cloudinary.com")) {
        return;
      }

      // Pokaż menu kontekstowe
      const menu = document.createElement("div");
      menu.style.cssText = `
        position: fixed;
        top: ${e.pageY}px;
        left: ${e.pageX}px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1000;
        min-width: 120px;
      `;

      const removeOption = document.createElement("div");
      removeOption.textContent = "Usuń awatar";
      removeOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        color: #f44336;
        transition: background-color 0.2s;
      `;
      removeOption.addEventListener("mouseenter", () => {
        removeOption.style.backgroundColor = "#f5f5f5";
      });
      removeOption.addEventListener("mouseleave", () => {
        removeOption.style.backgroundColor = "transparent";
      });
      removeOption.addEventListener("click", () => {
        removeAvatar();
        document.body.removeChild(menu);
      });

      menu.appendChild(removeOption);
      document.body.appendChild(menu);

      // Remove the menu when clicking elsewhere
      const removeMenu = (e) => {
        if (!menu.contains(e.target)) {
          document.body.removeChild(menu);
          document.removeEventListener("click", removeMenu);
        }
      };

      setTimeout(() => {
        document.addEventListener("click", removeMenu);
      }, 100);
    });
  }
});

// Profile update function (extended)
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
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Profil zaktualizowany pomyślnie:", data);

    showSuccessMessage("Profil został zaktualizowany pomyślnie");
  } catch (error) {
    console.error("Błąd podczas aktualizacji profilu:", error);
    showErrorMessage("Nie udało się zaktualizować profilu");
  }
}

// Function to display error message
function showErrorMessage(message) {
  console.error(message);

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
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(errorDiv);

  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

// Function to display success message
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
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(successDiv);

  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 3000);
}

// Function to display the loading message
function showLoadingMessage(message) {
  const existingLoading = document.querySelector(".loading-message");
  if (existingLoading) {
    existingLoading.remove();
  }

  const loadingDiv = document.createElement("div");
  loadingDiv.className = "loading-message";
  loadingDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div class="spinner"></div>
      <span>${message}</span>
    </div>
  `;
  loadingDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2196F3;
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;

  const style = document.createElement("style");
  style.textContent = `
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff33;
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(loadingDiv);

  setTimeout(() => {
    if (loadingDiv.parentNode) {
      loadingDiv.parentNode.removeChild(loadingDiv);
    }
  }, 10000);
}

// Function to remove the loading message
function hideLoadingMessage() {
  const loadingDiv = document.querySelector(".loading-message");
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Initialization after page load
document.addEventListener("DOMContentLoaded", function () {
  // Load user profile
  loadUserProfile();

  const avatarUpload = document.getElementById("avatarUpload");
  if (avatarUpload) {
    avatarUpload.addEventListener("change", handleAvatarChange);
  }

  const saveButton = document.getElementById("saveProfileButton");
  if (saveButton) {
    saveButton.addEventListener("click", function (e) {
      e.preventDefault();
      updateUserProfile();
    });
  }

  // drag & drop support for avatar (optional)
  const avatarPreview = document.getElementById("avatarPreview");
  if (avatarPreview) {
    avatarPreview.addEventListener("dragover", function (e) {
      e.preventDefault();
      e.stopPropagation();
      avatarPreview.style.opacity = "0.7";
    });

    avatarPreview.addEventListener("dragleave", function (e) {
      e.preventDefault();
      e.stopPropagation();
      avatarPreview.style.opacity = "1";
    });

    avatarPreview.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      avatarPreview.style.opacity = "1";

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          const avatarUpload = document.getElementById("avatarUpload");
          if (avatarUpload) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            avatarUpload.files = dataTransfer.files;

            handleAvatarChange({ target: { files: [file] } });
          }
        }
      }
    });
  }
});
