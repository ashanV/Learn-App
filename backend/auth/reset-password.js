import { auth } from "../config/firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// DOM elements
const resetForm = document.querySelector("#resetPasswordPage form");
const emailInput = document.getElementById("reset-email");
const submitButton = document.querySelector(".form-button");

// Show loading state
function setLoadingState(isLoading) {
  if (isLoading) {
    submitButton.disabled = true;
    submitButton.textContent = 'Wysyłanie...';
  } else {
    submitButton.disabled = false;
    submitButton.textContent = 'Wyślij link do resetu';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="bx ${type === 'success' ? 'bx-check-circle' : type === 'error' ? 'bx-error-circle' : 'bx-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
    min-width: 300px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if email exists in database
async function checkEmailExists(email) {
  try {
    const response = await fetch('http://localhost:5000/api/check-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return {
      exists: response.ok,
      message: data.message
    };
  } catch (error) {
    console.error('Error checking email:', error);
    throw new Error('Błąd połączenia z serwerem');
  }
}

// Handle password reset
async function handlePasswordReset(email) {
  try {
    setLoadingState(true);

    // First, check if email exists in our database
    const emailCheck = await checkEmailExists(email);
    
    if (!emailCheck.exists) {
      showNotification('Podany adres email nie jest zarejestrowany w systemie.', 'error');
      return;
    }

    // If email exists, send password reset email via Firebase
    await sendPasswordResetEmail(auth, email);
    
    showNotification('Link do resetowania hasła został wysłany na Twój adres email.', 'success');
    
    // Clear the form
    emailInput.value = '';
    
    // Optional: redirect to login page after success
    setTimeout(() => {
      window.location.href = './login.html';
    }, 3000);

  } catch (error) {
    console.error('Password reset error:', error);
    
    // Handle Firebase Auth errors
    let errorMessage = 'Wystąpił błąd podczas wysyłania linku resetującego.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Użytkownik z tym adresem email nie istnieje.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Podany adres email jest nieprawidłowy.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Zbyt wiele prób. Spróbuj ponownie za chwilę.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Błąd połączenia sieciowego. Sprawdź połączenie internetowe.';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    setLoadingState(false);
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing reset password functionality');
  
  // Re-select elements after DOM is loaded
  const resetForm = document.querySelector('#resetPasswordPage form');
  const emailInput = document.getElementById('reset-email');
  const submitButton = document.querySelector('.form-button');
  
  if (!resetForm || !emailInput || !submitButton) {
    console.error('Required elements not found:', {
      resetForm: !!resetForm,
      emailInput: !!emailInput,
      submitButton: !!submitButton
    });
    return;
  }
  
  console.log('All elements found, adding event listeners');
  
  // Form submission handler
  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const email = emailInput.value.trim();
    console.log('Email entered:', email);
    
    // Validate email format
    if (!email) {
      showNotification('Proszę podać adres email.', 'error');
      emailInput.focus();
      return false;
    }
    
    if (!validateEmail(email)) {
      showNotification('Proszę podać prawidłowy adres email.', 'error');
      emailInput.focus();
      return false;
    }
    
    // Handle password reset
    await handlePasswordReset(email);
    return false;
  });
  
  // Also handle button click directly
  submitButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Trigger form submission
    resetForm.dispatchEvent(new Event('submit'));
    return false;
  });
  
  // Add input validation on blur
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !validateEmail(email)) {
      emailInput.style.borderColor = '#f44336';
      showNotification('Nieprawidłowy format adresu email.', 'error');
    } else {
      emailInput.style.borderColor = '';
    }
  });

  // Clear error styling on input
  emailInput.addEventListener('input', () => {
    emailInput.style.borderColor = '';
  });
});

// Add input validation on blur
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !validateEmail(email)) {
      emailInput.style.borderColor = '#f44336';
      showNotification('Nieprawidłowy format adresu email.', 'error');
    } else {
      emailInput.style.borderColor = '';
    }
  });

  // Clear error styling on input
  emailInput.addEventListener('input', () => {
    emailInput.style.borderColor = '';
  });
