document.addEventListener('DOMContentLoaded', function() {
    console.log("Page chargée - initialisation");
    
    // Configuration du menu paramètres
    setupParamMenu();
    
    // Configuration de la recherche
    setupSearch();
    
    // Configuration du bouton de chargement des données
    setupLoadDataButton();
});

// Configuration du menu paramètres - corrigé pour s'afficher par-dessus les autres éléments
function setupParamMenu() {
    const paramFabHeader = document.getElementById('paramFabHeader');
    const paramMenu = document.getElementById('paramMenu');
    
    if (paramFabHeader && paramMenu) {
        // Assurer que le dropdown a un z-index élevé
        paramMenu.style.zIndex = '2000';
        
        paramFabHeader.addEventListener('click', (event) => {
            event.stopPropagation();
            
            // Vérifier si le menu est déjà actif
            const isActive = paramMenu.classList.contains('active');
            
            // Fermer tous les menus ouverts
            document.querySelectorAll('.param-menu').forEach(menu => {
                menu.classList.remove('active');
            });
            
            // Si le menu n'était pas déjà actif, l'activer
            if (!isActive) {
                paramMenu.classList.add('active');
                // Positionner le menu correctement par rapport à son parent
                const rect = paramFabHeader.getBoundingClientRect();
                paramMenu.style.top = (rect.bottom + 5) + 'px';
                paramMenu.style.right = '10px';
            }
        });

        // Fermer le menu si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (!paramFabHeader.contains(e.target) && !paramMenu.contains(e.target)) {
                paramMenu.classList.remove('active');
            }
        });
    }
}

// Configuration de la recherche
function setupSearch() {
    const searchInput = document.querySelector('.search-block input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function(e) {
            const searchTerm = e.target.value.toLowerCase();
            console.log(`Recherche: ${searchTerm}`);
            // Implémentation à faire
        }, 300));
    }
}

// Fonction utilitaire pour le debounce
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Fonction pour afficher des notifications
function afficherNotification(message, type = 'info') {
    console.log(`Notification (${type}): ${message}`);
    
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Afficher puis cacher après 3 secondes
        notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// Configuration du bouton de chargement des données
function setupLoadDataButton() {
    const loadDataBtn = document.getElementById('loadDataBtn');
    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', function() {
            // Ajouter classe pour l'animation de chargement
            this.classList.add('loading');
            this.querySelector('i').classList.add('fa-spin');
            this.disabled = true;
            this.textContent = ' Chargement en cours...';
            this.prepend(document.createElement('i')).className = 'fas fa-sync-alt fa-spin';
            
            // Cacher les widgets pendant le chargement
            document.querySelectorAll('.widget').forEach(widget => {
                widget.style.opacity = '0';
                widget.style.transform = 'translateY(20px)';
            });
            
            // Charger les données
            loadDashboardStats().then(() => {
                // Animer l'apparition des widgets après le chargement des données
                animateWidgetsAppearance();
                
                // Réinitialiser le bouton après le chargement
                setTimeout(() => {
                    this.classList.remove('loading');
                    this.querySelector('i').classList.remove('fa-spin');
                    this.disabled = false;
                    this.textContent = ' Actualiser les données';
                    this.prepend(document.createElement('i')).className = 'fas fa-sync-alt';
                    
                    // Afficher une notification de succès
                    afficherNotification("Données chargées avec succès", "success");
                }, 300);
            }).catch(error => {
                // Gérer l'erreur
                this.classList.remove('loading');
                this.querySelector('i').classList.remove('fa-spin');
                this.disabled = false;
                this.textContent = ' Réessayer';
                this.prepend(document.createElement('i')).className = 'fas fa-exclamation-triangle';
                
                afficherNotification("Erreur lors du chargement des données", "error");
            });
        });
    }
}

// Chargement des statistiques du tableau de bord
function loadDashboardStats() {
    return new Promise((resolve, reject) => {
        try {
            // Afficher des loaders sur chaque carte de statistique
            document.querySelectorAll('.stat-card .stat-info span').forEach(span => {
                span.innerHTML = '<div class="loading"></div>';
            });
            
            // Simuler un délai réseau (à remplacer par un vrai appel API)
            setTimeout(() => {
                try {
                    // Données fictives (à remplacer par des données réelles)
                    const statsData = {
                        totalMembresActifs: 5,
                        soldeTotalFC: 900000,
                        soldeTotalUSD: 450,
                        totalCreditsEnCoursFC: 175000,
                        totalCreditsEnCoursUSD: 87.5,
                        beneficeEstime: 17500
                    };
                    
                    // Mettre à jour les statistiques avec animation de compteur
                    updateStatValueWithAnimation('total-membres', statsData.totalMembresActifs);
                    updateStatValueWithAnimation('solde-total-fc', statsData.soldeTotalFC, 'FC');
                    updateStatValueWithAnimation('solde-total-usd', statsData.soldeTotalUSD, 'USD');
                    updateStatValueWithAnimation('dette-totale-fc', statsData.totalCreditsEnCoursFC, 'FC');
                    updateStatValueWithAnimation('dette-totale-usd', statsData.totalCreditsEnCoursUSD, 'USD');
                    updateStatValueWithAnimation('benefice-total', statsData.beneficeEstime, 'FC');
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }, 800);
            
        } catch (error) {
            console.error(error);
            document.querySelectorAll('.stat-card .stat-info span').forEach(span => {
                span.textContent = 'Erreur de chargement';
                span.style.color = '#e74c3c';
            });
            
            afficherNotification("Impossible de charger les statistiques", "error");
            reject(error);
        }
    });
}

// Mettre à jour la valeur d'un élément statistique avec une animation de compteur
function updateStatValueWithAnimation(elementId, endValue, devise = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1500; // Durée de l'animation en ms
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed > duration) {
            // Animation terminée
            element.textContent = devise ? formaterMontant(endValue, devise) : endValue;
            return;
        }
        
        // Calculer la valeur actuelle avec easeOutExpo pour une animation plus naturelle
        const progress = 1 - Math.pow(1 - elapsed / duration, 3);
        const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
        
        // Mettre à jour l'élément
        element.textContent = devise ? formaterMontant(currentValue, devise) : currentValue;
        
        // Continuer l'animation
        requestAnimationFrame(animate);
    };
    
    animate();
}

// Formater un montant avec séparateur de milliers et devise
function formaterMontant(montant, devise = 'FC') {
    if (devise === 'FC') {
        return new Intl.NumberFormat('fr-FR', { 
            maximumFractionDigits: 0 
        }).format(montant) + ' FC';
    } else if (devise === 'USD') {
        return new Intl.NumberFormat('fr-FR', { 
            maximumFractionDigits: 2
        }).format(montant) + ' $';
    }
    return montant;
}

// Animation pour l'apparition des widgets
function animateWidgetsAppearance() {
    const widgets = document.querySelectorAll('.widget');
    widgets.forEach((widget, index) => {
        setTimeout(() => {
            widget.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            widget.style.opacity = '1';
            widget.style.transform = 'translateY(0)';
        }, 100 + index * 150); // Délai progressif pour chaque widget
    });
}