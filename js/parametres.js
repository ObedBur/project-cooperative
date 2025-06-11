/**
 * Fichier JS centralisé pour la gestion des pages de paramètres
 * Ce fichier sera importé par toutes les pages dans Html/parametres/
 */

document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const apiUrl = 'http://localhost:3000';
  
  // Identifier la page actuelle
  const currentPage = window.location.pathname.split('/').pop();
  
  // Fonctions communes
  
  /**
   * Affiche un message à l'utilisateur
   * @param {string} type - Type de message ('success' ou 'error')
   * @param {string} text - Texte du message
   * @param {string} containerId - ID du conteneur où afficher le message (optionnel)
   */
  function showMessage(type, text, containerId = 'message') {
    const messageDiv = document.getElementById(containerId);
    if (!messageDiv) return;
    
    messageDiv.style.display = 'block';
    messageDiv.innerHTML = `<div class="message ${type}"><i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${text}</div>`;
    messageDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Masquer le message après un délai
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }
  
  /**
   * Envoie une requête à l'API
   * @param {string} endpoint - Point d'entrée de l'API
   * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
   * @param {Object} data - Données à envoyer (pour POST et PUT)
   * @returns {Promise} - Promesse avec la réponse
   */
  async function fetchAPI(endpoint, method = 'GET', data = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${apiUrl}${endpoint}`, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Une erreur est survenue');
      }
      
      return result;
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }
  
  // Fonctions spécifiques aux pages
  
  /**
   * Initialise la page de gestion des administrateurs
   */
  function initGererAdmin() {
    if (currentPage !== 'gerer-admin.html') return;
    
    console.log('Initialisation de la page gestion des administrateurs');
    
    // Amélioration du filtrage
    const filterBtn = document.getElementById('filter-btn');
    const searchInput = document.getElementById('search');
    const roleFilter = document.getElementById('role-filter');
    
    // Filtrage en temps réel
    [searchInput, roleFilter].forEach(el => {
      el.addEventListener('input', filterAdmins);
    });
    
    if (filterBtn) {
      filterBtn.addEventListener('click', filterAdmins);
    }
    
    // Formulaire de suppression
    const deleteForm = document.getElementById('admin-delete-form');
    if (deleteForm) {
      deleteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const adminId = document.getElementById('delete-admin').value;
        if (!adminId) {
          showMessage('error', 'Veuillez sélectionner un administrateur à supprimer.');
          return;
        }
        
        // Simuler l'appel API pour la démo
        // Dans un cas réel, utiliser fetchAPI('/admin/' + adminId, 'DELETE', { reason: document.getElementById('delete-reason').value })
        setTimeout(() => {
          showMessage('success', 'Administrateur supprimé avec succès!');
          this.reset();
        }, 500);
      });
    }
    
    // Boutons de suppression dans le tableau
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const row = this.closest('tr');
        const adminId = row.querySelector('td:first-child').textContent;
        const adminName = row.querySelector('td:nth-child(2)').textContent;
        
        const deleteSelect = document.getElementById('delete-admin');
        if (!deleteSelect) return;
        
        // Trouver ou créer l'option pour cet admin
        let option = [...deleteSelect.options].find(opt => opt.value === adminId);
        if (!option) {
          option = new Option(`${adminName} (ID: ${adminId})`, adminId);
          deleteSelect.add(option);
        }
        
        // Sélectionner l'option et faire défiler jusqu'au formulaire de suppression
        deleteSelect.value = adminId;
        document.getElementById('delete-admin').scrollIntoView({ behavior: 'smooth' });
      });
    });
    
    // Charger les administrateurs depuis l'API
    loadAdministrators();
  }
  
  /**
   * Charge la liste des administrateurs depuis l'API
   */
  async function loadAdministrators() {
    try {
      // Dans un cas réel, utiliser fetchAPI('/admin', 'GET')
      // Simulation de données
      const administrators = [
        { id: 1, nom_complet: 'Jean Dupont', email: 'jean.dupont@email.com', role: 'Super Administrateur', statut: 'actif' },
        { id: 2, nom_complet: 'Marie Kamba', email: 'marie.kamba@email.com', role: 'Administrateur', statut: 'actif' },
        { id: 3, nom_complet: 'Ali Ben', email: 'ali.ben@email.com', role: 'Modérateur', statut: 'inactif' }
      ];
      
      // Mise à jour du dropdown de suppression
      const deleteSelect = document.getElementById('delete-admin');
      if (deleteSelect) {
        // Conserver l'option par défaut
        const defaultOption = deleteSelect.options[0];
        deleteSelect.innerHTML = '';
        deleteSelect.add(defaultOption);
        
        // Ajouter les options des administrateurs qui peuvent être supprimés
        administrators
          .filter(admin => admin.role !== 'Super Administrateur')
          .forEach(admin => {
            deleteSelect.add(new Option(`${admin.nom_complet} (${admin.role})`, admin.id));
          });
      }
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement des administrateurs: ' + error.message);
    }
  }
  
  /**
   * Filtre la liste des administrateurs selon les critères
   */
  function filterAdmins() {
    const searchTerm = document.getElementById('search')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('role-filter')?.value.toLowerCase() || '';
    
    document.querySelectorAll('#admin-table tbody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      const role = row.querySelector('td:nth-child(4)')?.textContent.toLowerCase() || '';
      
      let showRow = text.includes(searchTerm);
      if (roleFilter !== '') {
        showRow = showRow && role === roleFilter;
      }
      
      row.style.display = showRow ? '' : 'none';
    });
  }
  
  /**
   * Initialise la page d'ajout d'administrateur
   */
  function initAjouterAdmin() {
    if (currentPage !== 'ajouter-admin.html') return;
    
    console.log('Initialisation de la page ajout d\'administrateur');
    
    const adminForm = document.querySelector('.admin-add-form');
    if (adminForm) {
      adminForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
          const formData = new FormData(this);
          const data = Object.fromEntries(formData.entries());
          
          // Validation basique
          if (!data.nom || !data.prenom || !data.email || !data.password || !data.role) {
            showMessage('error', 'Veuillez remplir tous les champs obligatoires.');
            return;
          }
          
          // Simuler l'appel API pour la démo
          // Dans un cas réel, utiliser fetchAPI('/admin', 'POST', data)
          setTimeout(() => {
            showMessage('success', 'Administrateur ajouté avec succès!');
            this.reset();
          }, 500);
        } catch (error) {
          showMessage('error', 'Erreur lors de l\'ajout: ' + error.message);
        }
      });
    }
  }
  
  /**
   * Initialise la page des notifications
   */
  function initNotifications() {
    if (currentPage !== 'notifications.html') return;
    
    console.log('Initialisation de la page notifications');
    
    // Marquage des notifications comme lues
    document.querySelectorAll('.btn-mark').forEach(btn => {
      btn.addEventListener('click', async function() {
        try {
          const row = this.closest('tr');
          const notificationId = row.dataset.id || 'notification-' + Date.now();
          
          // Simuler l'appel API pour la démo
          // Dans un cas réel, utiliser fetchAPI('/notifications/' + notificationId + '/lue', 'POST')
          
          row.classList.remove('notification-unread');
          row.querySelector('td:nth-child(4)').textContent = 'Lu';
          this.remove();
          
          // Mettre à jour le compteur
          updateNotificationCount();
          
          showMessage('success', 'Notification marquée comme lue', 'message-notification');
        } catch (error) {
          showMessage('error', 'Erreur: ' + error.message, 'message-notification');
        }
      });
    });
    
    // Tout marquer comme lu
    const markAllBtn = document.getElementById('mark-all-read');
    if (markAllBtn) {
      markAllBtn.addEventListener('click', async function() {
        try {
          // Simuler l'appel API pour la démo
          // Dans un cas réel, utiliser fetchAPI('/notifications/mark-all-read', 'POST')
          
          document.querySelectorAll('.notification-unread').forEach(row => {
            row.classList.remove('notification-unread');
            row.querySelector('td:nth-child(4)').textContent = 'Lu';
            const markBtn = row.querySelector('.btn-mark');
            if (markBtn) markBtn.remove();
          });
          
          // Mettre à jour le compteur
          updateNotificationCount(0);
          
          showMessage('success', 'Toutes les notifications ont été marquées comme lues', 'message-notification');
        } catch (error) {
          showMessage('error', 'Erreur: ' + error.message, 'message-notification');
        }
      });
    }
    
    // Filtrage des notifications
    const searchInput = document.getElementById('search');
    const typeFilter = document.getElementById('filter-type');
    
    if (searchInput) searchInput.addEventListener('input', filterNotifications);
    if (typeFilter) typeFilter.addEventListener('change', filterNotifications);
    
    // Charger les notifications depuis l'API
    loadNotifications();
  }
  
  /**
   * Charge les notifications depuis l'API
   */
  async function loadNotifications() {
    try {
      // Dans un cas réel, utiliser fetchAPI('/notifications', 'GET')
      // Pour cette démo, on utilise les données existantes dans le HTML
      
      // Mettre à jour le compteur
      updateNotificationCount();
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement des notifications: ' + error.message, 'message-notification');
    }
  }
  
  /**
   * Met à jour le compteur de notifications
   * @param {number} count - Nombre de notifications (optionnel, sinon calculé)
   */
  function updateNotificationCount(count = null) {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;
    
    if (count === null) {
      // Compter les notifications non lues
      count = document.querySelectorAll('.notification-unread').length;
    }
    
    badge.textContent = count;
    
    // Masquer le badge si pas de notifications
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
  
  /**
   * Filtre les notifications selon les critères
   */
  function filterNotifications() {
    const searchTerm = document.getElementById('search')?.value.toLowerCase() || '';
    const filterType = document.getElementById('filter-type')?.value || 'all';
    
    document.querySelectorAll('#notifications-tbody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      const type = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
      
      let showRow = text.includes(searchTerm);
      if (filterType !== 'all') {
        showRow = showRow && type.includes(filterType);
      }
      
      row.style.display = showRow ? '' : 'none';
    });
  }
  
  /**
   * Initialise la page d'historique des actions
   */
  function initHistorique() {
    if (currentPage !== 'historique.html') return;
    
    console.log('Initialisation de la page historique');
    
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
      filterBtn.addEventListener('click', filterHistorique);
    }
    
    // Gestion de la pagination
    document.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        if (this.disabled) return;
        
        document.querySelector('.pagination-btn.active')?.classList.remove('active');
        this.classList.add('active');
        
        // Dans un cas réel, charger la page correspondante
        // loadHistoriquePage(this.textContent);
      });
    });
    
    // Exportation et impression
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportHistorique);
    }
    
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', printHistorique);
    }
    
    // Charger l'historique depuis l'API
    loadHistorique();
  }
  
  /**
   * Charge l'historique depuis l'API
   */
  async function loadHistorique() {
    try {
      // Dans un cas réel, utiliser fetchAPI('/historique', 'GET')
      // Pour cette démo, on utilise les données existantes dans le HTML
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement de l\'historique: ' + error.message);
    }
  }
  
  /**
   * Filtre l'historique selon les critères
   */
  function filterHistorique() {
    const searchTerm = document.getElementById('search')?.value.toLowerCase() || '';
    const dateFrom = document.getElementById('date-from')?.value || '';
    const dateTo = document.getElementById('date-to')?.value || '';
    const actionType = document.getElementById('action-type')?.value.toLowerCase() || '';
    
    document.querySelectorAll('#history-table tbody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      const date = row.querySelector('td:first-child')?.textContent || '';
      const action = row.querySelector('td:nth-child(4)')?.textContent.toLowerCase() || '';
      
      let showRow = text.includes(searchTerm);
      
      // Filtrer par type d'action
      if (actionType !== '') {
        showRow = showRow && action.includes(actionType);
      }
      
      // Filtrer par date
      if (dateFrom && dateTo) {
        // Convertir au format standard pour comparaison
        const rowDate = formatDateForCompare(date);
        const fromDate = formatDateForCompare(dateFrom);
        const toDate = formatDateForCompare(dateTo);
        
        showRow = showRow && rowDate >= fromDate && rowDate <= toDate;
      }
      
      row.style.display = showRow ? '' : 'none';
    });
  }
  
  /**
   * Formate une date pour la comparaison
   * @param {string} dateStr - Date au format jj/mm/aaaa ou aaaa-mm-jj
   * @returns {string} - Date au format aaaa-mm-jj
   */
  function formatDateForCompare(dateStr) {
    if (!dateStr) return '';
    
    // Si déjà au format aaaa-mm-jj
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    
    // Convertir de jj/mm/aaaa à aaaa-mm-jj
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    return dateStr;
  }
  
  /**
   * Exporte l'historique au format CSV
   */
  function exportHistorique() {
    try {
      const rows = Array.from(document.querySelectorAll('#history-table tbody tr'))
        .filter(row => row.style.display !== 'none');
      
      if (rows.length === 0) {
        showMessage('error', 'Aucune donnée à exporter');
        return;
      }
      
      // Créer les en-têtes
      const headers = Array.from(document.querySelectorAll('#history-table thead th'))
        .map(th => th.textContent);
      
      // Créer les lignes
      const csvRows = [
        headers.join(','),
        ...rows.map(row => {
          return Array.from(row.querySelectorAll('td'))
            .map(td => `"${td.textContent.replace(/"/g, '""')}"`)
            .join(',');
        })
      ];
      
      // Créer le fichier CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Télécharger le fichier
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `historique_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showMessage('success', 'Exportation réussie');
    } catch (error) {
      showMessage('error', 'Erreur lors de l\'exportation: ' + error.message);
    }
  }
  
  /**
   * Imprime l'historique
   */
  function printHistorique() {
    window.print();
  }
  
  /**
   * Initialise la page d'aide et support
   */
  function initAideSupport() {
    if (currentPage !== 'aide-support.html') return;
    
    console.log('Initialisation de la page aide et support');
    
    // Formulaire de contact
    const contactForm = document.getElementById('support-form');
    if (contactForm) {
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simuler l'envoi du formulaire
        showMessage('success', 'Votre message a été envoyé avec succès!');
        this.reset();
      });
    }
  }
  
  /**
   * Initialise la page de paramètres généraux
   */
  function initParametresGeneraux() {
    if (currentPage !== 'parametres-generaux.html') return;
    
    console.log('Initialisation de la page paramètres généraux');
    
    // Formulaire de paramètres
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Simuler l'enregistrement des paramètres
        showMessage('success', 'Paramètres enregistrés avec succès!');
      });
    }
  }
  
  // Initialisation selon la page courante
  initGererAdmin();
  initAjouterAdmin();
  initNotifications();
  initHistorique();
  initAideSupport();
  initParametresGeneraux();
  
  // Initialisation commune pour toutes les pages
  document.querySelectorAll('.btn-retour').forEach(btn => {
    btn.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.includes('index.html')) {
        // Pas de prévention par défaut, navigation normale
      } else {
        e.preventDefault();
        window.history.back();
      }
    });
  });
}); 