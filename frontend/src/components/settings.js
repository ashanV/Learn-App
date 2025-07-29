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
 * Main initialization function for the settings page.
 */
export function initializeSettings() {
  const saveButton = document.querySelector('.settings-container .save-button');
  if (saveButton) {
    saveButton.onclick = saveAllSettings;
  }

  syncSettingsUI();
  checkReminder();

  window.toggleSwitch = (element) => element.classList.toggle('active');
  window.updateRangeValue = (slider, outputId) => {
    document.getElementById(outputId).textContent = slider.value;
  };
}