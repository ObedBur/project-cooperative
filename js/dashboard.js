document.addEventListener("DOMContentLoaded", () => {
  // --- Gestion du menu déroulant des paramètres ---
  const paramFabHeader = document.getElementById("paramFabHeader");
  const paramMenu = document.getElementById("paramMenu");

  if (paramFabHeader && paramMenu) {
    paramFabHeader.addEventListener("click", (event) => {
      // Empêche le clic de se propager à la fenêtre, ce qui fermerait le menu immédiatement
      event.stopPropagation();
      paramMenu.classList.toggle("active");
    });

    // Ferme le menu si l'utilisateur clique en dehors
    window.addEventListener("click", (event) => {
      if (
        !paramMenu.contains(event.target) &&
        !paramFabHeader.contains(event.target)
      ) {
        if (paramMenu.classList.contains("active")) {
          paramMenu.classList.remove("active");
        }
      }
    });
  }

  // --- Chargement des statistiques du tableau de bord ---
  const loadDashboardStats = async () => {
    try {
      // Afficher des loaders sur chaque carte de statistique
      document.querySelectorAll('.stat-card .stat-info span').forEach(span => {
        span.innerHTML = '<div class="loading"></div>';
      });

      // Tentative de récupération des données depuis le serveur
      const response = await fetch("/dashboard-stats");
      
      if (!response.ok) {
        throw new Error("Impossible de charger les statistiques du tableau de bord.");
      }
      
      const stats = await response.json();

      // Animation pour les mises à jour des statistiques
      const updateStatWithAnimation = (elementId, value, suffix = '') => {
        const element = document.getElementById(elementId);
        if (element) {
          // Stocker l'ancienne valeur si disponible
          const oldValue = element.dataset.value ? parseInt(element.dataset.value) : 0;
          const newValue = parseInt(value);
          
          // Animation de comptage
          let startTime;
          const duration = 1000; // 1 seconde
          
          function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Interpolation entre ancienne et nouvelle valeur
            const currentValue = Math.round(oldValue + progress * (newValue - oldValue));
            element.textContent = currentValue.toLocaleString() + suffix;
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              // Stocker la nouvelle valeur pour les prochaines animations
              element.dataset.value = newValue;
            }
          }
          
          requestAnimationFrame(animate);
        }
      };

      // Mettre à jour chaque carte avec les données reçues et animation
      updateStatWithAnimation("total-membres", stats.totalMembresActifs);
      updateStatWithAnimation("solde-total-fc", stats.soldeTotalFC, ' FC');
      updateStatWithAnimation("solde-total-usd", stats.soldeTotalUSD, ' $');
      updateStatWithAnimation("dette-totale-fc", stats.totalCreditsEnCoursFC, ' FC');
      updateStatWithAnimation("dette-totale-usd", stats.totalCreditsEnCoursUSD, ' $');
      updateStatWithAnimation("benefice-total", stats.beneficeEstime, ' FC');

      // Ajouter une classe pour les animations de succès
      document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.add('success-animation');
        // Supprimer la classe après l'animation
        setTimeout(() => card.classList.remove('success-animation'), 700);
      });

    } catch (error) {
      console.error(error);
      // Afficher un message d'erreur sur les cartes de statistiques
      document.querySelectorAll('.stat-card .stat-info span').forEach(span => {
        span.innerHTML = '<span style="color: #e74c3c; font-size: 0.9em;">Erreur de chargement</span>';
      });
      
      // Afficher une notification d'erreur
      afficherNotification("Impossible de charger les statistiques du tableau de bord", "error");
    }
  };
  
  // Charger les graphiques après que les statistiques sont chargées
  const loadCharts = async () => {
    try {
      // Créer le graphique Épargne vs Crédits
      const epargneCreditsResponse = await fetch("/epargne-credit-stats");
      if (!epargneCreditsResponse.ok) throw new Error("Erreur lors du chargement des données du graphique");
      const epargneCreditsData = await epargneCreditsResponse.json();
      
      const ctx1 = document.getElementById('epargneCreditChart').getContext('2d');
      window.epargneCreditChart = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: epargneCreditsData.labels,
          datasets: [{
            label: 'Épargnes (FC)',
            data: epargneCreditsData.epargne,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: 'Crédits (FC)',
            data: epargneCreditsData.credits,
            borderColor: '#764ba2',
            backgroundColor: 'rgba(118, 75, 162, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formaterMontant(value, 'FC');
                }
              }
            }
          },
          animation: {
            duration: 2000
          }
        }
      });
      
      // Créer le graphique de répartition par sexe
      const repartitionResponse = await fetch("/repartition-sexe");
      if (!repartitionResponse.ok) throw new Error("Erreur lors du chargement des données de répartition");
      const repartitionData = await repartitionResponse.json();
      
      const ctx2 = document.getElementById('repartitionSexeChart').getContext('2d');
      window.repartitionSexeChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Femmes', 'Hommes'],
          datasets: [{
            data: [repartitionData.femmes, repartitionData.hommes],
            backgroundColor: ['#667eea', '#764ba2'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          },
          animation: {
            duration: 1500
          }
        }
      });
      
    } catch (error) {
      console.error("Erreur lors du chargement des graphiques:", error);
      afficherNotification("Impossible de charger les graphiques", "error");
    }
  };
  
  // Charger les activités récentes
  const loadRecentActivity = async () => {
    try {
      const activityContainer = document.getElementById('activite-recente');
      if (!activityContainer) return;
      
      // Afficher un loader
      activityContainer.innerHTML = '<div class="loading"></div>';
      
      const response = await fetch("/recent-activity");
      if (!response.ok) throw new Error("Erreur lors du chargement des activités récentes");
      
      const activities = await response.json();
      
      if (activities.length === 0) {
        activityContainer.innerHTML = '<p class="message-placeholder">Aucune activité récente</p>';
        return;
      }
      
      let html = '';
      activities.forEach((activity, index) => {
        const date = new Date(activity.timestamp).toLocaleDateString('fr-FR');
        html += `
          <div class="activity-item ${index === 0 ? 'new-activity' : ''}" style="animation-delay: ${index * 0.1}s">
            <i class="fa-solid ${getActivityIcon(activity.type)}"></i>
            <div class="activity-text">${activity.description}</div>
            <div class="activity-time">${date}</div>
          </div>
        `;
      });
      
      activityContainer.innerHTML = html;
      
    } catch (error) {
      console.error("Erreur lors du chargement des activités:", error);
      document.getElementById('activite-recente').innerHTML = 
        '<p class="message-placeholder">Impossible de charger les activités récentes</p>';
    }
  };
  
  // Gestion du toggle devise pour les graphiques
  const setupCurrencyToggle = () => {
    document.querySelectorAll('.currency-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const devise = this.dataset.currency;
        mettreAJourGraphiqueDevise(devise);
      });
    });
  };
  
  // Gestion du toggle de devise pour les graphiques
  function mettreAJourGraphiqueDevise(devise) {
    if (!window.epargneCreditChart) return;
    
    // Mettre à jour les données du graphique en fonction de la devise
    fetch(`/epargne-credit-stats?devise=${devise}`)
      .then(response => response.json())
      .then(data => {
        window.epargneCreditChart.data.datasets[0].data = data.epargne;
        window.epargneCreditChart.data.datasets[1].data = data.credits;
        window.epargneCreditChart.data.datasets[0].label = `Épargnes (${devise.toUpperCase()})`;
        window.epargneCreditChart.data.datasets[1].label = `Crédits (${devise.toUpperCase()})`;
        
        // Mettre à jour le formattage des montants sur l'axe Y
        window.epargneCreditChart.options.scales.y.ticks.callback = function(value) {
          return formaterMontant(value, devise.toUpperCase());
        };
        
        window.epargneCreditChart.update();
      })
      .catch(error => {
        console.error("Erreur lors de la mise à jour du graphique:", error);
        afficherNotification("Erreur lors du changement de devise", "error");
      });
  }
  
  // Format de montant avec séparateurs de milliers et symbole de devise
  function formaterMontant(montant, devise = 'FC') {
    if (devise === 'FC') {
      return new Intl.NumberFormat('fr-CD', {
        style: 'currency',
        currency: 'CDF',
        minimumFractionDigits: 0
      }).format(montant).replace('CDF', 'FC');
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: devise === 'USD' ? 2 : 0
      }).format(montant);
    }
  }
  
  // Fonction pour obtenir l'icône appropriée selon le type d'activité
  function getActivityIcon(type) {
    const icons = {
      'epargne': 'fa-piggy-bank',
      'credit': 'fa-file-invoice-dollar',
      'remboursement': 'fa-cash-register',
      'nouveau_membre': 'fa-user-plus',
      'retrait': 'fa-money-bill-wave',
      'modification': 'fa-edit',
      'suppression': 'fa-trash'
    };
    return icons[type] || 'fa-circle-info';
  }
  
  // Afficher une notification
  function afficherNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas
    let notification = document.getElementById('notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    // Ajouter le type à la classe
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    
    // Afficher la notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    // Masquer après 3 secondes
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
  
  // Vérifier les nouvelles activités toutes les 30 secondes
  const checkForNewActivities = async () => {
    try {
      const response = await fetch("/check-new-activities");
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.hasNewActivities) {
        loadRecentActivity();
        loadDashboardStats(); // Rafraîchir aussi les statistiques
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des nouvelles activités:", error);
    }
  };
  
  // Animation des cartes et widgets au chargement
  const animerElements = () => {
    const elements = document.querySelectorAll('.stat-card, .widget');
    elements.forEach((element, index) => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        element.style.transition = 'all 0.6s ease';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 150);
    });
  };
  
  // Rafraîchissement automatique des données
  const refreshInterval = 60000; // 60 secondes
  let autoRefreshTimer;
  
  function startAutoRefresh() {
    if (autoRefreshTimer) clearInterval(autoRefreshTimer);
    autoRefreshTimer = setInterval(() => {
      loadDashboardStats();
      checkForNewActivities();
    }, refreshInterval);
  }
  
  // Initialisation de la page
  loadDashboardStats();
  loadCharts();
  loadRecentActivity();
  setupCurrencyToggle();
  animerElements();
  startAutoRefresh();
  
  // Vérifier la connexion internet
  if (!navigator.onLine) {
    afficherNotification('Mode hors ligne activé', 'error');
  }
  
  window.addEventListener('online', () => {
    afficherNotification('Connexion rétablie', 'success');
    loadDashboardStats(); // Recharger les données
    loadCharts();
    loadRecentActivity();
  });
  
  window.addEventListener('offline', () => {
    afficherNotification('Connexion internet perdue', 'error');
  });
});
