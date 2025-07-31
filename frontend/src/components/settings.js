import { auth } from '../../../backend/config/firebase-config.js';
import { showNotification } from './daily-goal.js';
import { updateDailyGoal } from './daily-goal.js';

let reminderIntervalId = null;
const API_BASE_URL = 'http://localhost:5000';

/**
 * Saves all settings from the page.
 */
async function saveAllSettings() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    showNotification('Musisz być zalogowany, aby zapisać ustawienia.', 'error');
    return;
  }

  // Save your reminder settings
  const reminderToggle = document.getElementById('reminderToggle');
  const reminderTimeInput = document.getElementById('reminderTime');
  const reminderPromise = fetch(`${API_BASE_URL}/api/settings/${currentUser.uid}/reminder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reminderEnabled: reminderToggle.classList.contains('active'),
      reminderTime: reminderTimeInput.value,
    }),
  });

  // Write down your daily goal
  const dailyGoalSlider = document.getElementById('settingsDailyGoalSlider');
  const newGoal = parseInt(dailyGoalSlider.value, 10);
  const dailyGoalPromise = updateDailyGoal(newGoal); // updateDailyGoal already reports success

  // Wait for both operations, but do not show double notifications
  try {
    const [reminderResponse] = await Promise.all([reminderPromise, dailyGoalPromise]);
    if (reminderResponse.ok) {
      console.log('Ustawienia przypomnień zapisane.');
      await checkReminder(true); // Restart the checking loop
    } else {
      showNotification('Błąd zapisu ustawień przypomnień.', 'error');
    }
  } catch (error) {
    console.error('Błąd zapisu ustawień:', error);
    showNotification('Wystąpił błąd serwera podczas zapisu.', 'error');
  }
}

/**
 * Checks to see if it's time for a reminder.
 */
async function checkReminder(forceRestart = false) {
  if (reminderIntervalId && forceRestart) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
  if (reminderIntervalId) return;

  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const response = await fetch(`${API_BASE_URL}/api/user/${currentUser.uid}`);
  const data = await response.json();
  const prefs = data.user.learningPreferences;

  if (prefs.reminderEnabled && prefs.reminderTime) {
    reminderIntervalId = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const lastReminderShown = localStorage.getItem('lastReminderShown');
      const today = now.toISOString().split('T')[0];

      if (currentTime === prefs.reminderTime && lastReminderShown !== today) {
        showNotification(`⏰ Czas na naukę! Zaczynamy?`, 'info');
        localStorage.setItem('lastReminderShown', today);
      }
    }, 60000);
  }
}

/**
 * Synchronizes the UI on the settings page with the data from the database.
 */
export async function syncSettingsUI() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  // Find items only when you need them
  const reminderTimeInput = document.getElementById('reminderTime');
  const reminderToggle = document.getElementById('reminderToggle');

  // Check if the elements exist before you start working on them
  if (!reminderTimeInput || !reminderToggle) {
    console.warn("Elementy ustawień nie zostały znalezione w DOM. Prawdopodobnie strona nie jest widoczna.");
    return;
  }

  const response = await fetch(`${API_BASE_URL}/api/user/${currentUser.uid}`);
  const data = await response.json();

  if (response.ok) {
    const prefs = data.user.learningPreferences;
    reminderTimeInput.value = prefs.reminderTime || '18:00';
    reminderToggle.classList.toggle('active', prefs.reminderEnabled);
  }
}

/**
 * Initialize font size functionality
 */
function initializeFontSize() {
  // Find the specific font size selector in the appearance card
  const appearanceCard = document.querySelector('.settings-card .card-icon').closest('.settings-card');
  if (!appearanceCard) return;

  const fontSizeSelector = appearanceCard.querySelector('.dropdown-select:nth-of-type(2)'); // Second dropdown in appearance card

  if (!fontSizeSelector) {
    console.warn('Font size selector not found');
    return;
  }

  // Function to apply the font size
  const applyFontSize = (size) => {
    const root = document.documentElement;

    switch (size) {
      case 'small':
        root.style.fontSize = '14px';
        break;
      case 'large':
        root.style.fontSize = '18px';
        break;
      default: // medium
        root.style.fontSize = '16px';
        break;
    }

    fontSizeSelector.value = size;
    localStorage.setItem('fontSize', size);
    console.log(`Font size applied: ${size}`);
  };

  // Load saved font size
  const savedFontSize = localStorage.getItem('fontSize') || 'medium';
  applyFontSize(savedFontSize);

  // Add event listener
  fontSizeSelector.addEventListener('change', function (e) {
    const selectedSize = e.target.value;
    applyFontSize(selectedSize);
    showNotification(`Rozmiar czcionki zmieniony na: ${selectedSize}`, 'success');
  });
}

/**
 * Alternative approach - add ID to the font size selector in HTML and use that
 */
function initializeFontSizeById() {
  // First, let's try to find the font size selector by looking for the one with font size options
  const allSelects = document.querySelectorAll('.dropdown-select');
  let fontSizeSelector = null;

  // Find the select that has small/medium/large options
  allSelects.forEach(select => {
    const options = select.querySelectorAll('option');
    if (options.length === 3) {
      const values = Array.from(options).map(opt => opt.value);
      if (values.includes('small') && values.includes('medium') && values.includes('large')) {
        fontSizeSelector = select;
      }
    }
  });

  if (!fontSizeSelector) {
    console.warn('Font size selector not found by options');
    return;
  }

  // Add an ID for easier targeting
  fontSizeSelector.id = 'fontSizeSelector';

  // Function to apply the font size
  const applyFontSize = (size) => {
    // Apply to root element for global effect
    document.documentElement.style.fontSize = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px';

    // Also apply to body for cascading
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${size}`);

    fontSizeSelector.value = size;
    localStorage.setItem('fontSize', size);

    console.log(`Font size applied: ${size}`);
  };

  // Load saved font size
  const savedFontSize = localStorage.getItem('fontSize') || 'medium';
  applyFontSize(savedFontSize);

  // Add event listener
  fontSizeSelector.addEventListener('change', function (e) {
    const selectedSize = e.target.value;
    applyFontSize(selectedSize);

    // Show feedback to user
    if (typeof showNotification === 'function') {
      const sizeLabels = { small: 'Mała', medium: 'Średnia', large: 'Duża' };
      showNotification(`Rozmiar czcionki zmieniony na: ${sizeLabels[selectedSize]}`, 'success');
    }
  });
}

/**
 * Exports user data including progress and statistics
 */
async function exportData() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    showNotification('Musisz być zalogowany, aby eksportować dane.', 'error');
    return;
  }

  try {
    showNotification('Przygotowywanie danych do eksportu...', 'info');

    const response = await fetch(`${API_BASE_URL}/api/settings/${currentUser.uid}/export`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Błąd podczas eksportu danych');
    }

    const data = await response.json();

    // Create JSON file with user data
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moje_dane_${new Date().toISOString().split('T')[0]}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('Dane zostały pomyślnie wyeksportowane!', 'success');
  } catch (error) {
    console.error('Błąd eksportu danych:', error);
    showNotification('Wystąpił błąd podczas eksportu danych.', 'error');
  }
}

/**
 * Main initialization function for the settings page.
 */
export function initializeSettings() {
  const saveButton = document.querySelector('.settings-container .save-button');
  if (saveButton) {
    saveButton.onclick = saveAllSettings;
  }

  syncSettingsUI();
  checkReminder();

  // Initialize font size functionality
  setTimeout(() => {
    initializeFontSizeById();
  }, 100); // Small delay to ensure DOM is ready

  // Global functions for HTML onclick handlers
  window.toggleSwitch = (element) => element.classList.toggle('active');
  window.updateRangeValue = (slider, outputId) => {
    document.getElementById(outputId).textContent = slider.value;
  };
  window.saveSettings = saveAllSettings;
  window.exportData = exportData;
}