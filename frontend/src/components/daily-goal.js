import { auth } from '../../../backend/config/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// Function to set daily goal
export async function setDailyGoal() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('Musisz być zalogowany, aby ustawić cel dzienny');
    return;
  }

  // Get current target
  const currentGoal = await getCurrentDailyGoal();
  
  showDailyGoalModal(currentGoal);
}

// Function to display daily goal modal
function showDailyGoalModal(currentGoal = 10) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content daily-goal-modal">
      <h2>🎯 Ustaw cel dzienny słówek</h2>
      <p>Ile słówek chcesz uczyć się codziennie?</p>
      <p class="current-goal">Obecny cel: <strong>${currentGoal} słówek</strong></p>
      
      <div class="goal-options">
        <button class="goal-option-btn" data-goal="5">
          <span class="goal-number">5</span>
          <span class="goal-desc">Łagodny start</span>
        </button>
        <button class="goal-option-btn" data-goal="10">
          <span class="goal-number">10</span>
          <span class="goal-desc">Standardowy</span>
        </button>
        <button class="goal-option-btn" data-goal="20">
          <span class="goal-number">20</span>
          <span class="goal-desc">Ambitny</span>
        </button>
        <button class="goal-option-btn" data-goal="30">
          <span class="goal-number">30</span>
          <span class="goal-desc">Intensywny</span>
        </button>
      </div>
      
      <div class="custom-goal-section">
        <label for="customGoal">Lub ustaw własny cel:</label>
        <input type="number" id="customGoal" min="1" max="100" value="${currentGoal}" />
        <button class="btn btn-goal" onclick="setCustomDailyGoal()">Ustaw własny cel</button>
      </div>
      
      <button class="btn-close-modal" onclick="closeDailyGoalModal()">×</button>
    </div>
  `;


  
  document.body.appendChild(modal);
  
  modal.querySelectorAll('.goal-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const goal = parseInt(btn.dataset.goal);
      updateDailyGoal(goal);
    });
  });
  
  const currentBtn = modal.querySelector(`[data-goal="${currentGoal}"]`);
  if (currentBtn) {
    currentBtn.classList.add('active');
  }
}

// Function to close the daily goal modal
export function closeDailyGoalModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

// Function to set your own goal
export async function setCustomDailyGoal() {
  const customGoalInput = document.getElementById('customGoal');
  const customGoal = parseInt(customGoalInput.value);
  
  if (customGoal < 1 || customGoal > 100) {
    alert('Cel musi być między 1 a 100 słówkami');
    return;
  }
  
  await updateDailyGoal(customGoal);
}

// Function to update daily goal in database
 export async function updateDailyGoal(newGoal) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:5000/api/user/${currentUser.uid}/daily-goal`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dailyGoal: newGoal
      })
    });

    const data = await response.json();

    if (response.ok) {
      updateDailyGoalUI(newGoal);
      closeDailyGoalModal();
      
      showNotification(`Cel dzienny został ustawiony na ${newGoal} słówek! 🎯`, 'success');
      
      await loadDailyStats();
    } else {
      alert(data.message || 'Błąd podczas zapisywania celu dziennego');
    }
  } catch (error) {
    console.error('Błąd aktualizacji celu dziennego:', error);
    alert('Błąd podczas zapisywania celu dziennego');
  }
}

// Function to get current daily goal
async function getCurrentDailyGoal() {
  const currentUser = getCurrentUser();
  if (!currentUser) return 10;

  try {
    const response = await fetch(`http://localhost:5000/api/user/${currentUser.uid}/daily-stats`);
    const data = await response.json();
    
    if (response.ok) {
      return data.dailyGoal || 10;
    }
    return 10;
  } catch (error) {
    console.error('Błąd pobierania celu dziennego:', error);
    return 10;
  }
}

// Function to load daily statistics
export async function loadDailyStats() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:5000/api/user/${currentUser.uid}/daily-stats`);
    const data = await response.json();
    
    if (response.ok) {
      updateDailyStatsUI(data);
    }
  } catch (error) {
    console.error('Błąd ładowania statystyk dziennych:', error);
  }
}

// Function to update daily statistics UI
export function updateDailyStatsUI(stats) {
  const dailyGoalElement = document.getElementById('dailyGoal');
  if (dailyGoalElement) {
    dailyGoalElement.textContent = stats.dailyGoal;
  }
  
  const completedWordsElement = document.getElementById('completedWords');
  if (completedWordsElement) {
    completedWordsElement.textContent = stats.completedWords;
  }
  
  const goalPercentageElement = document.getElementById('goalPercentage');
  if (goalPercentageElement) {
    goalPercentageElement.textContent = `${stats.progressPercentage}%`;
  }
  
  const progressBar = document.getElementById('goalProgressBar');
  if (progressBar) {
    progressBar.style.width = `${stats.progressPercentage}%`;
  }
  
  const dailyStreakElement = document.getElementById('dailyStreak');
  if (dailyStreakElement) {
    dailyStreakElement.textContent = `🔥 ${stats.streak}`;
  }
  
  if (stats.goalAchieved && stats.progressPercentage >= 100) {
    const dailyGoalCard = document.querySelector('.daily-goal-card');
    if (dailyGoalCard && !dailyGoalCard.classList.contains('goal-achieved')) {
      dailyGoalCard.classList.add('goal-achieved');
      showNotification('🎉 Gratulacje! Osiągnąłeś dzienny cel słówek!', 'success');
    }
  }
}

// Function to update progress after correct answer
export async function updateDailyProgress() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:5000/api/user/${currentUser.uid}/update-daily-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      updateDailyStatsUI(data);
      
      if (data.goalJustAchieved) {
        showNotification('🎉 Brawo! Właśnie osiągnąłeś dzienny cel słówek!', 'success');
      }
      
      return data;
    }
  } catch (error) {
    console.error('Błąd aktualizacji postępu dziennego:', error);
  }
}

// Function to display notifications
export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Style for notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 1000;
    max-width: 350px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    ${type === 'success' ? 'background-color: #22c55e;' : 
      type === 'error' ? 'background-color: #ef4444;' : 
      'background-color: #3b82f6;'}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Function to update daily goal UI
function updateDailyGoalUI(newGoal) {
  const dailyGoalElement = document.getElementById('dailyGoal');
  if (dailyGoalElement) {
    dailyGoalElement.textContent = newGoal;
  }
}

// Function to get current user from Firebase Auth
export function getCurrentUser() {
  return auth.currentUser;
}

// Make functions globally available for onclick handlers
window.setCustomDailyGoal = setCustomDailyGoal;
window.closeDailyGoalModal = closeDailyGoalModal;

// Initialization after page load
document.addEventListener('DOMContentLoaded', () => {
  // Wait for auth state and load daily stats
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadDailyStats();
    }
  });
});