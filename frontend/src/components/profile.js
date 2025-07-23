import { auth } from "../../../backend/config/firebase-config.js";
import {
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Cloudinary Configuration
const CLOUDINARY_CONFIG = {
  cloudName: "db1arvunk",
  uploadPreset: "learn app",
  apiKey: "451551355969186",
};

// Global variable to store Firebase UID
let currentFirebaseUid = null;

// Function to get Firebase UID safely
function getFirebaseUid() {
  // Return cached UID if available
  if (currentFirebaseUid) {
    return currentFirebaseUid;
  }

  // Try to get from localStorage first
  const localStorageUid = localStorage.getItem("firebaseUid");
  if (localStorageUid) {
    currentFirebaseUid = localStorageUid;
    return localStorageUid;
  }

  // Try to get from sessionStorage
  const sessionStorageUid = sessionStorage.getItem("firebaseUid");
  if (sessionStorageUid) {
    currentFirebaseUid = sessionStorageUid;
    return sessionStorageUid;
  }

  // If not found in either storage, try to get from URL params or other sources
  const urlParams = new URLSearchParams(window.location.search);
  const urlUid = urlParams.get("uid");
  if (urlUid) {
    currentFirebaseUid = urlUid;
    return urlUid;
  }

  return null;
}

// Function to wait for Firebase Auth state and get UID
function waitForFirebaseAuth() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        currentFirebaseUid = user.uid;
        // Store in appropriate storage
        if (
          localStorage.getItem("firebaseUid") ||
          !sessionStorage.getItem("firebaseUid")
        ) {
          localStorage.setItem("firebaseUid", user.uid);
        } else {
          sessionStorage.setItem("firebaseUid", user.uid);
        }
        resolve(user.uid);
      } else {
        resolve(null);
      }
    });
  });
}

// Function to retrieve and display user profile data
async function loadUserProfile() {
  try {
    let firebaseUid = getFirebaseUid();

    // If no UID found in storage, wait for Firebase Auth state
    if (!firebaseUid) {
      console.log("No UID in storage, waiting for Firebase Auth...");
      firebaseUid = await waitForFirebaseAuth();
    }

    if (!firebaseUid) {
      console.error("Brak Firebase UID użytkownika");
      showErrorMessage(
        "Nie można załadować profilu - brak identyfikatora użytkownika. Spróbuj się ponownie zalogować."
      );
      // Redirect to login page after a delay
      setTimeout(() => {
        window.location.href = "/frontend/public/login.html";
      }, 3000);
      return;
    }

    console.log("Loading profile for UID:", firebaseUid);

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
      if (response.status === 404) {
        throw new Error("Użytkownik nie został znaleziony");
      }
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
    showErrorMessage(
      "Nie udało się załadować danych profilu: " + error.message
    );
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

// Function to check password strength
function checkPasswordStrength() {
  const passwordInput = document.getElementById("newPassword");
  const strengthBar = document.getElementById("passwordStrengthBar");

  if (!passwordInput || !strengthBar) return;

  const password = passwordInput.value;
  let strength = 0;
  let strengthText = "";
  let strengthColor = "";

  if (password.length >= 6) strength += 1;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  switch (strength) {
    case 0:
    case 1:
      strengthText = "Bardzo słabe";
      strengthColor = "#ff4444";
      break;
    case 2:
    case 3:
      strengthText = "Słabe";
      strengthColor = "#ff8800";
      break;
    case 4:
      strengthText = "Średnie";
      strengthColor = "#ffaa00";
      break;
    case 5:
      strengthText = "Silne";
      strengthColor = "#88cc00";
      break;
    case 6:
      strengthText = "Bardzo silne";
      strengthColor = "#00cc44";
      break;
  }

  const strengthPercent = (strength / 6) * 100;
  strengthBar.style.width = strengthPercent + "%";
  strengthBar.style.backgroundColor = strengthColor;
  strengthBar.textContent = strengthText;
}

// Function to validate password change form
function validatePasswordChange() {
  const currentPassword = document
    .getElementById("currentPassword")
    ?.value.trim();
  const newPassword = document.getElementById("newPassword")?.value.trim();
  const confirmNewPassword = document
    .getElementById("confirmNewPassword")
    ?.value.trim();

  // Check if any password field is filled
  const hasPasswordFields =
    currentPassword || newPassword || confirmNewPassword;

  if (!hasPasswordFields) {
    return { isValid: true, shouldChangePassword: false };
  }

  // If any password field is filled, all must be filled
  if (!currentPassword) {
    throw new Error("Aktualne hasło jest wymagane");
  }

  if (!newPassword) {
    throw new Error("Nowe hasło jest wymagane");
  }

  if (!confirmNewPassword) {
    throw new Error("Potwierdzenie nowego hasła jest wymagane");
  }

  // Validate new password strength
  if (newPassword.length < 6) {
    throw new Error("Nowe hasło musi mieć co najmniej 6 znaków");
  }

  // Check if passwords match
  if (newPassword !== confirmNewPassword) {
    throw new Error("Nowe hasła nie są identyczne");
  }

  // Check if new password is different from current
  if (currentPassword === newPassword) {
    throw new Error("Nowe hasło musi być różne od aktualnego");
  }

  return { isValid: true, shouldChangePassword: true };
}

// Function to change user password
async function changeUserPassword(currentPassword, newPassword) {
  try {
    let firebaseUid = getFirebaseUid();
    if (!firebaseUid) {
      firebaseUid = await waitForFirebaseAuth();
    }

    if (!firebaseUid) {
      throw new Error("Brak identyfikatora użytkownika");
    }

    // Get current Firebase user
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Użytkownik nie jest zalogowany w Firebase");
    }

    // Reauthenticate user with current password
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    try {
      await reauthenticateWithCredential(user, credential);
      console.log("Ponowne uwierzytelnienie zakończone sukcesem");
    } catch (reauthError) {
      console.error("Błąd ponownego uwierzytelnienia:", reauthError);
      if (reauthError.code === "auth/wrong-password") {
        throw new Error("Aktualne hasło jest nieprawidłowe");
      } else if (reauthError.code === "auth/too-many-requests") {
        throw new Error("Zbyt wiele prób. Spróbuj ponownie później");
      } else {
        throw new Error("Nie udało się zweryfikować aktualnego hasła");
      }
    }

    // Update password in Firebase Auth
    try {
      await updatePassword(user, newPassword);
      console.log("Hasło w Firebase Auth zaktualizowane pomyślnie");
    } catch (updateError) {
      console.error("Błąd aktualizacji hasła w Firebase:", updateError);
      if (updateError.code === "auth/weak-password") {
        throw new Error("Nowe hasło jest za słabe");
      } else if (updateError.code === "auth/requires-recent-login") {
        throw new Error("Wymagane ponowne zalogowanie. Zaloguj się ponownie");
      } else {
        throw new Error("Nie udało się zaktualizować hasła w Firebase");
      }
    }

    // Update password in backend database
    const response = await fetch(
      `http://localhost:5000/api/user/${firebaseUid}/password`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword,
        }),
      }
    );

    if (!response.ok) {
      // If backend update fails, we should notify but Firebase password is already changed
      const errorData = await response.json().catch(() => ({}));
      console.error("Backend update failed:", errorData);

      // Still return success since Firebase password was updated
      console.warn(
        "Hasło w Firebase zostało zmienione, ale aktualizacja w bazie danych nie powiodła się"
      );
      return {
        message:
          "Hasło zostało zmienione, ale mogą wystąpić problemy z synchronizacją",
        warning: true,
      };
    }

    const data = await response.json();
    console.log("Hasło zmienione pomyślnie w Firebase i bazie danych:", data);

    return data;
  } catch (error) {
    console.error("Błąd podczas zmiany hasła:", error);
    throw error;
  }
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
  } finally {
    hideLoadingMessage();
  }
}

// Function to update avatar
async function updateAvatar(imageUrl) {
  try {
    const firebaseUid = getFirebaseUid();

    if (!firebaseUid) {
      throw new Error("Brak Firebase UID użytkownika");
    }

    console.log("Updating avatar for UID:", firebaseUid);

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
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

  // Validate Firebase UID before proceeding
  let firebaseUid = getFirebaseUid();
  if (!firebaseUid) {
    firebaseUid = await waitForFirebaseAuth();
  }

  if (!firebaseUid) {
    showErrorMessage(
      "Brak identyfikatora użytkownika. Spróbuj się ponownie zalogować."
    );
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
    let firebaseUid = getFirebaseUid();
    if (!firebaseUid) {
      firebaseUid = await waitForFirebaseAuth();
    }

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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
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

    showSuccessMessage("Awatar został usunięty pomyślnie");
  } catch (error) {
    console.error("Błąd podczas usuwania avatara:", error);
    showErrorMessage(error.message || "Nie udało się usunąć avatara");
  } finally {
    hideLoadingMessage();
  }
}

// Updated profile
async function updateUserProfile() {
  try {
    let firebaseUid = getFirebaseUid();
    if (!firebaseUid) {
      firebaseUid = await waitForFirebaseAuth();
    }

    if (!firebaseUid) {
      showErrorMessage(
        "Brak identyfikatora użytkownika. Spróbuj się ponownie zalogować."
      );
      return;
    }

    const profileNameInput = document.getElementById("profileName");
    const displayName = profileNameInput?.value.trim();

    if (!displayName) {
      showErrorMessage("Nazwa użytkownika nie może być pusta");
      return;
    }

    // Validate password change if password fields are filled
    let passwordChangeData;
    try {
      passwordChangeData = validatePasswordChange();
    } catch (passwordError) {
      showErrorMessage(passwordError.message);
      return;
    }

    showLoadingMessage("Aktualizowanie profilu...");

    let profileUpdated = false;
    let passwordUpdated = false;

    try {
      // Update profile name
      const profileResponse = await fetch(
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

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${profileResponse.status}`
        );
      }

      const profileData = await profileResponse.json();
      console.log("Profil zaktualizowany pomyślnie:", profileData);
      profileUpdated = true;

      // Change password if requested
      if (passwordChangeData.shouldChangePassword) {
        const currentPassword = document
          .getElementById("currentPassword")
          .value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();

        try {
          const passwordResult = await changeUserPassword(
            currentPassword,
            newPassword
          );
          passwordUpdated = true;

          if (passwordResult.warning) {
            showSuccessMessage(
              "Profil zaktualizowany. " + passwordResult.message
            );
          } else {
            showSuccessMessage(
              "Profil i hasło zostały zaktualizowane pomyślnie"
            );
          }
        } catch (passwordError) {
          console.error("Password change error:", passwordError);
          showErrorMessage(
            "Profil zaktualizowany, ale wystąpił błąd z hasłem: " +
              passwordError.message
          );
          // Don't return here - still clear fields
        }
      } else {
        showSuccessMessage("Profil został zaktualizowany pomyślnie");
      }
    } catch (error) {
      console.error("Błąd podczas aktualizacji profilu:", error);
      showErrorMessage(error.message || "Nie udało się zaktualizować profilu");
      return; // Don't clear fields on error
    } finally {
      hideLoadingMessage();
    }

    // Reset password fields only after successful operations
    if (profileUpdated) {
      resetPasswordFields();
    }
  } catch (error) {
    console.error("Błąd podczas aktualizacji profilu:", error);
    showErrorMessage(error.message || "Nie udało się zaktualizować profilu");
    hideLoadingMessage();
  }
}

// Function to reset password fields and strength indicator
function resetPasswordFields() {
  const currentPasswordInput = document.getElementById("currentPassword");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmNewPasswordInput = document.getElementById("confirmNewPassword");
  const strengthBar = document.getElementById("passwordStrengthBar");

  if (currentPasswordInput) {
    currentPasswordInput.value = "";
  }

  if (newPasswordInput) {
    newPasswordInput.value = "";
  }

  if (confirmNewPasswordInput) {
    confirmNewPasswordInput.value = "";
  }

  if (strengthBar) {
    strengthBar.style.width = "0%";
    strengthBar.style.backgroundColor = "";
    strengthBar.textContent = "";
  }

  console.log("Pola hasła zostały zresetowane");
}

// Function to display error message
function showErrorMessage(message) {
  console.error(message);

  // Remove existing error messages
  const existingError = document.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

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
    max-width: 400px;
    word-wrap: break-word;
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
  // Remove existing success messages
  const existingSuccess = document.querySelector(".success-message");
  if (existingSuccess) {
    existingSuccess.remove();
  }

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
    max-width: 400px;
    word-wrap: break-word;
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
    max-width: 400px;
    word-wrap: break-word;
  `;

  // Add spinner styles if not already present
  if (!document.querySelector("#spinner-styles")) {
    const style = document.createElement("style");
    style.id = "spinner-styles";
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
  }

  document.body.appendChild(loadingDiv);
}

// Function to remove the loading message
function hideLoadingMessage() {
  const loadingDiv = document.querySelector(".loading-message");
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

// Function to initialize Firebase UID on page load
async function initializeFirebaseUid() {
  let firebaseUid = getFirebaseUid();

  if (!firebaseUid) {
    console.log("No UID found in storage, checking Firebase Auth state...");
    firebaseUid = await waitForFirebaseAuth();
  }

  if (firebaseUid) {
    console.log("Firebase UID initialized:", firebaseUid);
    return true;
  } else {
    console.error("Nie można zainicjalizować Firebase UID");
    showErrorMessage(
      "Nie można załadować identyfikatora użytkownika. Przekierowywanie do strony logowania..."
    );
    setTimeout(() => {
      window.location.href = "/frontend/public/login.html";
    }, 3000);
    return false;
  }
}

// Context menu for avatar
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firebase UID
  initializeFirebaseUid().then((success) => {
    if (success) {
      // Load user profile after successful initialization
      loadUserProfile();
    }
  });

  // Delete avatar button
  const removeAvatarButton = document.getElementById("removeAvatarButton");
  if (removeAvatarButton) {
    removeAvatarButton.addEventListener("click", function (e) {
      e.preventDefault();
      removeAvatar();
    });
  }

  // Password strength checker
  const newPasswordInput = document.getElementById("newPassword");
  if (newPasswordInput) {
    newPasswordInput.addEventListener("input", checkPasswordStrength);
  }

  // Context menu on right click of the avatar
  const avatarPreview = document.getElementById("avatarPreview");
  if (avatarPreview) {
    avatarPreview.addEventListener("contextmenu", function (e) {
      e.preventDefault();

      // Check if the user has an avatar
      if (!avatarPreview.src.includes("cloudinary.com")) {
        return;
      }

      // Show context menu
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

  // Drag & drop support for avatar
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

// Make checkPasswordStrength globally available for inline oninput calls
window.checkPasswordStrength = checkPasswordStrength;
