document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://localhost:3000/notifications";

  const notificationsTbody = document.getElementById("notifications-tbody");
  const messageDiv = document.getElementById("message-notification");

  // --- Fonctions de communication avec l'API ---

  const api = {
    async get() {
      const response = await fetch(apiUrl);
      if (!response.ok)
        throw new Error(
          "Erreur serveur lors de la récupération des notifications."
        );
      return response.json();
    },
    async markAsRead(id) {
      const response = await fetch(`${apiUrl}/${id}/lue`, { method: "POST" });
      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour de la notification.");
      return response.json();
    },
  };

  // --- Fonctions d'affichage ---

  function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = isError ? "message-error" : "message-success";
    setTimeout(() => {
      messageDiv.textContent = "";
      messageDiv.className = "";
    }, 4000);
  }

  function renderNotifications(notifications) {
    notificationsTbody.innerHTML = "";
    if (notifications.length === 0) {
      notificationsTbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">Aucune notification de paiement en retard.</td></tr>';
      return;
    }

    notifications.forEach((notif) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${notif.compte}</td>
        <td>${notif.message}</td>
        <td>${new Date(notif.date_echeance).toLocaleDateString("fr-FR")}</td>
        <td>
          <button class="btn-supprimer" data-id="${notif.id}">Lue</button>
        </td>
      `;
      notificationsTbody.appendChild(tr);
    });
  }

  // --- Gestionnaires d'événements ---

  async function handleLoadNotifications() {
    try {
      const notifications = await api.get();
      renderNotifications(notifications);
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  async function handleMarkAsRead(e) {
    if (e.target.classList.contains("btn-supprimer")) {
      const notifId = e.target.dataset.id;
      if (confirm("Marquer cette notification comme lue ?")) {
        try {
          const result = await api.markAsRead(notifId);
          showMessage(result.message || "Notification marquée comme lue.");
          handleLoadNotifications();
        } catch (error) {
          showMessage(error.message, true);
        }
      }
    }
  }

  // --- Initialisation ---

  notificationsTbody.addEventListener("click", handleMarkAsRead);
  handleLoadNotifications();
});
