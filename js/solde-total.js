document.addEventListener('DOMContentLoaded', function() {
    console.log("Page Solde Total chargée - initialisation");
    
    // Simuler le chargement des données avec une animation
    setTimeout(() => {
        // Charger les données des soldes
        loadSoldeData();
    }, 500);
});

// Fonction pour charger les données des soldes
function loadSoldeData() {
    // Dans un environnement réel, ces données viendraient d'un appel API
    const soldeData = {
        fc: {
            total: 1250000,
            circulation: 350000,
            epargne: 750000,
            credits: 150000,
            trend: 12.5
        },
        usd: {
            total: 4500,
            circulation: 1200,
            epargne: 2800,
            credits: 500,
            trend: 8.3
        }
    };
    
    // Animer l'apparition des données
    updateSoldeWithAnimation('solde-total-fc', soldeData.fc.total, 'FC');
    updateSoldeWithAnimation('solde-circulation-fc', soldeData.fc.circulation, 'FC');
    updateSoldeWithAnimation('solde-epargne-fc', soldeData.fc.epargne, 'FC');
    updateSoldeWithAnimation('solde-credits-fc', soldeData.fc.credits, 'FC');
    
    updateSoldeWithAnimation('solde-total-usd', soldeData.usd.total, 'USD');
    updateSoldeWithAnimation('solde-circulation-usd', soldeData.usd.circulation, 'USD');
    updateSoldeWithAnimation('solde-epargne-usd', soldeData.usd.epargne, 'USD');
    updateSoldeWithAnimation('solde-credits-usd', soldeData.usd.credits, 'USD');
    
    // Mettre à jour les tendances
    updateTrend('trend-fc', soldeData.fc.trend);
    updateTrend('trend-usd', soldeData.usd.trend);
}

// Fonction pour animer l'affichage des montants
function updateSoldeWithAnimation(elementId, finalValue, currency) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const duration = 1500; // Durée de l'animation en ms
    const startTime = Date.now();
    const startValue = 0;
    
    const formatCurrency = (amount, currency) => {
        if (currency === 'FC') {
            return new Intl.NumberFormat('fr-FR').format(amount) + ' FC';
        } else {
            return new Intl.NumberFormat('fr-FR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount) + ' $';
        }
    };
    
    const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed > duration) {
            // Animation terminée
            element.textContent = formatCurrency(finalValue, currency);
            element.classList.add('success-animation');
            return;
        }
        
        // Easing function pour une animation plus naturelle
        const progress = 1 - Math.pow(1 - elapsed / duration, 3);
        const currentValue = Math.floor(startValue + (finalValue - startValue) * progress);
        
        element.textContent = formatCurrency(currentValue, currency);
        
        requestAnimationFrame(animate);
    };
    
    animate();
}

// Fonction pour mettre à jour l'affichage des tendances
function updateTrend(elementId, trendValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Formatage du pourcentage avec 1 décimale
    const formattedTrend = trendValue.toFixed(1);
    
    // Définir la classe et le texte en fonction de la valeur
    const parentElement = element.parentElement;
    
    if (trendValue > 0) {
        parentElement.className = 'trend positive';
        parentElement.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        element.textContent = `+${formattedTrend}% depuis le mois dernier`;
    } else if (trendValue < 0) {
        parentElement.className = 'trend negative';
        parentElement.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
        element.textContent = `${formattedTrend}% depuis le mois dernier`;
    } else {
        parentElement.className = 'trend neutral';
        parentElement.innerHTML = '<i class="fa-solid fa-minus"></i>';
        element.textContent = `${formattedTrend}% depuis le mois dernier`;
    }
    
    // Ajouter l'élément span de retour
    parentElement.appendChild(element);
} 