import { auth } from "../config/firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  checkEmailExists,
  checkUsernameExists,
  validatePassword,
  validateEmail,
  validateUsername,
} from "./auth-utlis.js";

document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.querySelector("#registerPage form");

  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("register-username").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const confirmPassword = document.getElementById(
        "register-password-confirm"
      ).value;
      const termsAccepted = document.getElementById("terms").checked;

      // Form validation
      if (!username || !email || !password || !confirmPassword) {
        showMessage("Wszystkie pola są wymagane!", "error");
        return;
      }

      // Username validation
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        showMessage(usernameValidation.errors[0], "error");
        return;
      }

      if (!validateEmail(email)) {
        showMessage("Nieprawidłowy format adresu email!", "error");
        return;
      }

      if (password !== confirmPassword) {
        showMessage("Hasła nie są identyczne!", "error");
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        showMessage(passwordValidation.errors[0], "error");
        return;
      }

      if (!termsAccepted) {
        showMessage("Musisz zaakceptować regulamin!", "error");
        return;
      }

      // Check if username already exists
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        showMessage(
          "Ta nazwa użytkownika jest już zajęta. Wybierz inną.",
          "error"
        );
        return;
      }

      // Check if email already exists
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        showMessage(
          "Ten adres email jest już zarejestrowany. Spróbuj się zalogować.",
          "error"
        );
        return;
      }

      try {
        // Disabling the button during registration
        const submitButton = registerForm.querySelector(
          'button[type="submit"]'
        );
        submitButton.disabled = true;
        submitButton.textContent = "Rejestrowanie...";

        // Firebase Registration
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = userCredential.user;

        // Sending data to MongoDB server
        console.log("Wysyłanie danych do serwera:", {
          firebaseUid: firebaseUser.uid,
          username: username,
          email: firebaseUser.email,
        });

        const response = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: firebaseUser.uid,
            username: username,
            email: firebaseUser.email,
          }),
        });

        console.log("Odpowiedź serwera:", response.status, response.statusText);

        if (response.ok) {
          showMessage("Rejestracja zakończona pomyślnie!", "success");

          // Save firebase Uid in local storage as per language page
          localStorage.setItem("tempFirebaseUid", firebaseUser.uid);

          setTimeout(() => {
            window.location.href = "./language.html";
          }, 2000);
        } else {
          let errorMessage = "Błąd podczas zapisywania użytkownika";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Błąd parsowania JSON:", jsonError);
            errorMessage = `Błąd serwera (${response.status})`;
          }
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("Błąd rejestracji:", error);
        let errorMessage = "Wystąpił błąd podczas rejestracji";

        // Firebase Auth error handling
        if (error.code === "auth/email-already-in-use") {
          errorMessage =
            "Ten adres email jest już zarejestrowany. Spróbuj się zalogować.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Nieprawidłowy format adresu email";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "Hasło jest zbyt słabe. Użyj co najmniej 6 znaków.";
        } else if (error.code === "auth/operation-not-allowed") {
          errorMessage = "Rejestracja przez email jest wyłączona";
        } else if (error.code === "auth/too-many-requests") {
          errorMessage =
            "Zbyt wiele prób rejestracji. Spróbuj ponownie później";
        } else if (error.message) {
          errorMessage = error.message;
        }

        showMessage(errorMessage, "error");
      } finally {
        // Restore button
        const submitButton = registerForm.querySelector(
          'button[type="submit"]'
        );
        submitButton.disabled = false;
        submitButton.textContent = "Zarejestruj się";
      }
    });

    const togglePasswordButton = document.querySelector(".password-toggle");
    if (togglePasswordButton) {
      togglePasswordButton.addEventListener("click", function () {
        togglePassword("register-password", this);
      });
    }
  }
});

function showMessage(message, type) {
  // Delete previous messages
  const existingMessage = document.querySelector(".message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create a new message
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;

  // Add inline styles for the message
  messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        max-width: 300px;
        ${
          type === "success"
            ? "background-color: #4CAF50;"
            : "background-color: #f44336;"
        }
    `;

  document.body.appendChild(messageDiv);

  // Delete message after 7 seconds
  setTimeout(() => {
    messageDiv.remove();
  }, 7000);
}

function togglePassword(inputId, button) {
  const input = document.getElementById("register-password");
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.className = "bx bx-show";
  } else {
    input.type = "password";
    icon.className = "bx bx-hide";
  }
}
