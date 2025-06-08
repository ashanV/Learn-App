import { auth } from "../config/firebase-config.js";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.querySelector("form");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;
      const rememberMe = document.getElementById("remember-me").checked;

      // Form validation
      if (!email || !password) {
        showMessage("Email i hasło są wymagane!", "error");
        return;
      }

      try {
        // Disabling the button when logging in
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "Logowanie...";

        // Set session persistence
        const persistence = rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence;
        await setPersistence(auth, persistence);

        // Login to Firebase
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        const firebaseUser = userCredential.user;

        // Update last login in MongoDB
        const response = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
          }),
        });

        if (response.ok) {
          showMessage("Logowanie pomyślne!", "success");

          // Redirect to the main application page
          setTimeout(() => {
            window.location.href = "/frontend/public/dashboard.html"; // or another home page
          }, 1500);
        } else {
          let errorMessage = "Błąd podczas aktualizacji danych użytkownika";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (jsonError) {
            console.error("Błąd parsowania JSON:", jsonError);
          }
          console.error("Błąd aktualizacji użytkownika:", errorMessage);
          // Despite the error in MongoDB, the user is logged in to Firebase
          showMessage("Logowanie pomyślne!", "success");
          setTimeout(() => {
            window.location.href = ".";
          }, 1500);
        }
      } catch (error) {
        console.error("Błąd logowania:", error);
        let errorMessage = "Wystąpił błąd podczas logowania";

        if (error.code === "auth/invalid-email") {
          errorMessage = "Nieprawidłowy adres email";
        } else if (error.code === "auth/user-disabled") {
          errorMessage = "Konto zostało zablokowane";
        } else if (error.code === "auth/user-not-found") {
          errorMessage = "Nie znaleziono użytkownika o podanym adresie email";
        } else if (error.code === "auth/wrong-password") {
          errorMessage = "Nieprawidłowe hasło";
        } else if (error.code === "auth/invalid-credential") {
          errorMessage = "Nieprawidłowe dane logowania";
        } else if (error.code === "auth/too-many-requests") {
          errorMessage = "Zbyt wiele prób logowania. Spróbuj ponownie później";
        }

        showMessage(errorMessage, "error");
      } finally {
        // Restore button
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = "Zaloguj się";
      }
    });
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
