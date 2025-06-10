document.addEventListener("DOMContentLoaded", function () {
  const languageCards = document.querySelectorAll(".langueage-card");
  const continueBtn = document.getElementById("continueBtn");
  const skipBtn = document.getElementById("skipBtn");
  let selectedLanguage = null;

  // Check if the user came from registration
  const tempFirebaseUid = localStorage.getItem("tempFirebaseUid");
  if (!tempFirebaseUid) {
    // If there is no firebase Uid, redirect to login page
    window.location.href = "./login.html";
    return;
  }

  // Handle language card selection
  languageCards.forEach((card) => {
    card.addEventListener("click", function () {
      // Remove selected class from all cards
      languageCards.forEach((c) => c.classList.remove("selected"));

      // Add selected class to clicked card
      this.classList.add("selected");

      // Store selected language
      selectedLanguage = this.dataset.language;

      // Enable continue button
      continueBtn.classList.add("active");
    });
  });

  // Handle continue button
  continueBtn.addEventListener("click", async function () {
    if (selectedLanguage && tempFirebaseUid) {
      try {
        // Send selected language to server
        const response = await fetch("http://localhost:5000/api/user/set-language", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: tempFirebaseUid,
            selectedLanguage: selectedLanguage
          }),
        });

        if (response.ok) {
          // Remove temporary firebase Uid
          localStorage.removeItem("tempFirebaseUid");
          
          // Show success message
          showMessage(
            `Wybrałeś ${
              selectedLanguage === "english" ? "Angielski" : "Niemiecki"
            }! Przekierowywanie na stronę logowania...`,
            "success"
          );

          // Redirect to login page
          setTimeout(() => {
            window.location.href = "./login.html";
          }, 2000);
        } else {
          throw new Error("Błąd podczas zapisywania języka");
        }
      } catch (error) {
        console.error("Błąd zapisywania języka:", error);
        showMessage("Wystąpił błąd podczas zapisywania języka", "error");
      }
    }
  });

  // Handle skip button
  skipBtn.addEventListener("click", async function () {
    if (tempFirebaseUid) {
      try {
        // Save information about skipping language selection
        const response = await fetch("http://localhost:5000/api/user/set-language", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firebaseUid: tempFirebaseUid,
            selectedLanguage: null // or "none"
          }),
        });

        if (response.ok) {
          // Remove temporary firebaseUid
          localStorage.removeItem("tempFirebaseUid");
        }
      } catch (error) {
        console.error("Błąd podczas pominięcia wyboru języka:", error);
      }
    }

    showMessage("Możesz wybrać język później w ustawieniach.", "info");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  });
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
  const colors = {
    success: "#4CAF50",
    error: "#f44336",
    info: "#2196F3",
  };

  messageDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 1000;
                max-width: 300px;
                background-color: ${colors[type] || colors.info};
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease-out;
            `;

  // Add animation
  const style = document.createElement("style");
  style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
  document.head.appendChild(style);

  document.body.appendChild(messageDiv);

  // Delete message after 5 seconds
  setTimeout(() => {
    messageDiv.style.animation = "slideIn 0.3s ease-out reverse";
    setTimeout(() => messageDiv.remove(), 300);
  }, 7000);
}