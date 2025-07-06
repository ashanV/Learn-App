import { auth } from "../config/firebase-config.js";
import { fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

// Checks if email is already registered
export async function checkEmailExists(email) {
  try {
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    return signInMethods.length > 0;
  } catch (error) {
    console.error("Błąd sprawdzania email:", error);
    return false;
  }
}

// Password Validation
export function validatePassword(password) {
  const errors = [];

  if (password.length < 6) {
    errors.push("Hasło musi mieć co najmniej 6 znaków");
  }

  if (!/[A-Za-z]/.test(password)) {
    errors.push("Hasło musi zawierać co najmniej jedną literę");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Hasło powinno zawierać co najmniej jedną cyfrę");
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// Email Validation
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Username Validation
export function validateUsername(username) {
  const errors = [];

  if (!username) {
    errors.push("Nazwa użytkownika jest wymagana");
  } else if (username.length < 3) {
    errors.push("Nazwa użytkownika musi mieć co najmniej 3 znaki");
  } else if (username.length > 20) {
    errors.push("Nazwa użytkownika może mieć maksymalnie 20 znaków");
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push(
      "Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia"
    );
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}

// Check if username exists
export async function checkUsernameExists(username) {
  try {
    const response = await fetch("http://localhost:5000/api/check-username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (response.ok) {
      return true; 
    } else if (response.status === 404) {
      return false; 
    } else {
      console.error(
        "Błąd sprawdzania nazwy użytkownika:",
        response.status,
        response.statusText
      );
      return false;
    }
  } catch (error) {
    console.error("Błąd sprawdzania nazwy użytkownika:", error);
    return false;
  }
}
