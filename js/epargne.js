document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://localhost:3000/depots";
  const apiPrefix = "http://localhost:3000/api";

  const form = document.getElementById("depotForm");
  const tableBody = document.getElementById("depotTableBody");
  const soldeFC_div = document.getElementById("soldeFC");
  const soldeUSD_div = document.getElementById("soldeUSD");
  const messageDiv = document.getElementById("message");
  const typeCompteSelect = document.getElementById("typeCompte");
  const submitBtn = document.getElementById("submitBtn");
  const compteInput = document.getElementById("compte");

  // --- Fonctions de communication avec l'API ---

  const api = {
    async get() {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Erreur de chargement des dépôts");
        return response.json();
      } catch (error) {
        console.error("Erreur API:", error);
        throw new Error("Impossible de charger les données. Vérifiez la connexion au serveur.");
      }
    },
    async getFC() {
      try {
        const response = await fetch(`${apiUrl}-fc`);
        if (!response.ok) throw new Error("Erreur de chargement des dépôts FC");
        return response.json();
      } catch (error) {
        console.error("Erreur API:", error);
        throw new Error("Impossible de charger les données FC. Vérifiez la connexion au serveur.");
      }
    },
    async getUSD() {
      try {
        const response = await fetch(`${apiUrl}-usd`);
        if (!response.ok) throw new Error("Erreur de chargement des dépôts USD");
        return response.json();
      } catch (error) {
        console.error("Erreur API:", error);
        throw new Error("Impossible de charger les données USD. Vérifiez la connexion au serveur.");
      }
    },
    async post(data) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de l'ajout du dépôt");
        }
        
        return response.json();
      } catch (error) {
        console.error("Erreur API:", error);
        throw error;
      }
    },
    async getMembres() {
      try {
        const response = await fetch(`${apiPrefix}/membres`);
        if (!response.ok) throw new Error("Erreur de chargement des membres");
        return response.json();
      } catch (error) {
        console.error("Erreur API:", error);
        throw new Error("Impossible de charger les membres. Vérifiez la connexion au serveur.");
      }
    },
    async getEpargneTotal() {
      try {
        const response = await fetch(`${apiPrefix}/epargne-total`);
        if (!response.ok) throw new Error("Erreur de chargement des soldes totaux");
        return response.json();
      } catch (error) {
        console.error("Erreur API:", error);
        throw new Error("Impossible de charger les soldes totaux. Vérifiez la connexion au serveur.");
      }
    },
    // Nouvelle méthode pour récupérer le solde total avec bonus d'un membre
    async getSoldeTotalBonus(numeroCompte) {
      try {
        if (!numeroCompte) throw new Error("Numéro de compte requis");
        
        const response = await fetch(`${apiPrefix}/solde-total-bonus/${numeroCompte}`);
        if (!response.ok) throw new Error("Erreur de chargement du solde avec bonus");
        return response.json();
      } catch (error) {
        console.error("Erreur API:", error);
        throw new Error("Impossible de charger le solde avec bonus. Vérifiez la connexion au serveur.");
      }
    }
  };

  // --- Fonctions d'affichage ---

  function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = isError ? "message error" : "message success";
    messageDiv.style.display = "block";
    
    // Animation de l'affichage
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateY(-10px)";
    
    setTimeout(() => {
      messageDiv.style.transition = "opacity 0.3s, transform 0.3s";
      messageDiv.style.opacity = "1";
      messageDiv.style.transform = "translateY(0)";
    }, 10);
    
    setTimeout(() => {
      messageDiv.style.opacity = "0";
      messageDiv.style.transform = "translateY(10px)";
      
      // Masquer après la fin de l'animation
      setTimeout(() => {
        messageDiv.style.display = "none";
        messageDiv.className = "";
      }, 300);
    }, 5000);
  }

  function formatCurrency(amount, currency) {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    
    return currency === 'USD' ? 
      `${amount.toFixed(2)} $` : 
      `${amount.toFixed(2)} FC`;
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  }

  function renderDepots(depots) {
    // Trier les dépôts par date (du plus récent au plus ancien)
    depots.sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = "";
    if (depots.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:20px;">Aucun dépôt enregistré.</td></tr>';
      soldeFC_div.textContent = "0 FC";
      soldeUSD_div.textContent = "0 $";
      return;
    }

    const cumulsParMembre = {};
    let totalFC = 0;
    let totalUSD = 0;

    depots.forEach((depot, index) => {
      const { compte, type_compte, date, montant } = depot;
      const parsedMontant = parseFloat(montant);

      // Initialiser le cumul pour un nouveau membre
      if (!cumulsParMembre[compte]) {
        cumulsParMembre[compte] = { FC: 0, USD: 0 };
      }

      // Mettre à jour le cumul et le total
      if (type_compte === "FC") {
        cumulsParMembre[compte].FC += parsedMontant;
        totalFC += parsedMontant;
      } else if (type_compte === "USD") {
        cumulsParMembre[compte].USD += parsedMontant;
        totalUSD += parsedMontant;
      }

      const tr = document.createElement("tr");
      
      // Ajouter une classe pour les lignes récentes
      if (index < 3) {
        tr.classList.add('table-highlight');
        tr.setAttribute('data-new', 'true');
        
        // Animation d'apparition
        tr.style.opacity = '0';
        tr.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          tr.style.transition = 'all 0.5s ease-out';
          tr.style.opacity = '1';
          tr.style.transform = 'translateY(0)';
        }, index * 100);
      }
      
      tr.innerHTML = `
        <td>${compte}</td>
        <td>${type_compte}</td>
        <td>${formatDate(date)}</td>
        <td class="currency-${type_compte.toLowerCase()}">${formatCurrency(parsedMontant, type_compte)}</td>
        <td class="currency-fc">${formatCurrency(cumulsParMembre[compte].FC, 'FC')}</td>
        <td class="currency-usd">${formatCurrency(cumulsParMembre[compte].USD, 'USD')}</td>
      `;
      tableBody.appendChild(tr);
    });

    // Animer les soldes
    const animateCounter = (element, value, currency, duration = 1000) => {
      let startValue = 0;
      const startTime = performance.now();
      
      const updateCounter = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Fonction d'easing pour un effet plus naturel
        const easing = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;
        const easedProgress = easing(progress);
        
        const currentValue = startValue + (value - startValue) * easedProgress;
        element.textContent = formatCurrency(currentValue, currency);
        
        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };
      
      requestAnimationFrame(updateCounter);
    };
    
    animateCounter(soldeFC_div, totalFC, 'FC');
    animateCounter(soldeUSD_div, totalUSD, 'USD');
  }

  // --- Gestionnaires d'événements ---

  async function handleLoadDepots() {
    try {
      // Afficher un message de chargement dans le tableau
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;"><div class="loading"></div><span style="margin-left: 1rem;">Chargement des données depuis EpargneFC et EpargneUSD...</span></td></tr>';
      
      // Charger les dépôts combinés des feuilles EpargneFC et EpargneUSD
      const depots = await api.get();
      renderDepots(depots);
      
      console.log("Données chargées depuis les feuilles EpargneFC et EpargneUSD:", depots.length, "entrées");
    } catch (error) {
      showMessage(error.message, true);
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:red;">Erreur de chargement: ${error.message}</td></tr>`;
    }
  }

  async function handleAddDepot(e) {
    e.preventDefault();
    
    // Ajouter une classe de chargement au bouton
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    const formData = new FormData(form);
    const data = {
      compte: formData.get("compte"),
      type_compte: formData.get("typeCompte"),
      date: formData.get("date"),
      montant: parseFloat(formData.get("montant")),
    };

    if (!data.compte || !data.type_compte || !data.date || isNaN(data.montant) || data.montant <= 0) {
      showMessage("Veuillez remplir tous les champs correctement.", true);
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      return;
    }

    try {
      await api.post(data);
      showMessage(`Dépôt de ${formatCurrency(data.montant, data.type_compte)} ajouté avec succès !`);
      form.reset();
      
      // Définir la date par défaut à aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('date').value = today;
      
      // Recharger les dépôts pour mettre à jour l'affichage
      handleLoadDepots();
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }
  
  // Fonction pour charger les suggestions de comptes
  async function loadComptesSuggestions() {
    try {
      const membres = await api.getMembres();
      const suggestionsContainer = document.getElementById('suggestions-compte');
      
      compteInput.addEventListener('input', function() {
        const value = this.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        
        if (!value) {
          suggestionsContainer.style.display = 'none';
          document.getElementById('soldeInfoContainer').style.display = 'none';
          return;
        }
        
        // Filtrer les membres par numéro de compte
        const filtered = membres.filter(m => 
          m.numero_compte.toLowerCase().includes(value)
        );
        
        if (filtered.length === 0) {
          suggestionsContainer.style.display = 'none';
          return;
        }
        
        // Afficher les suggestions
        filtered.slice(0, 5).forEach(membre => {
          const item = document.createElement('div');
          item.className = 'suggestion-item';
          item.textContent = `${membre.numero_compte} - ${membre.nom_complet}`;
          item.addEventListener('click', () => {
            compteInput.value = membre.numero_compte;
            suggestionsContainer.style.display = 'none';
            // Charger et afficher le solde du membre
            loadAndDisplayMemberBalance(membre.numero_compte);
          });
          suggestionsContainer.appendChild(item);
        });
        
        suggestionsContainer.style.display = 'block';
      });
      
      // Fermer les suggestions quand on clique ailleurs
      document.addEventListener('click', function(e) {
        if (e.target !== compteInput && e.target !== suggestionsContainer) {
          suggestionsContainer.style.display = 'none';
        }
      });
      
      // Ajouter un event listener pour charger le solde quand le champ perd le focus
      compteInput.addEventListener('blur', function() {
        const numeroCompte = this.value.trim();
        if (numeroCompte) {
          // Vérifier si le numéro de compte existe dans la liste des membres
          const membreExiste = membres.some(m => m.numero_compte === numeroCompte);
          if (membreExiste) {
            loadAndDisplayMemberBalance(numeroCompte);
          }
        }
      });
    } catch (error) {
      console.error("Erreur lors du chargement des suggestions de comptes:", error);
    }
  }
  
  // Fonction pour charger et afficher le solde d'un membre avec bonus
  async function loadAndDisplayMemberBalance(numeroCompte) {
    try {
      const soldeInfoContainer = document.getElementById('soldeInfoContainer');
      const infoSoldeFC = document.getElementById('infoSoldeFC');
      const infoSoldeUSD = document.getElementById('infoSoldeUSD');
      const infoBonusFC = document.getElementById('infoBonusFC');
      const infoBonusUSD = document.getElementById('infoBonusUSD');
      
      // Afficher un indicateur de chargement
      soldeInfoContainer.style.display = 'block';
      infoSoldeFC.textContent = 'Chargement...';
      infoSoldeUSD.textContent = 'Chargement...';
      infoBonusFC.textContent = 'Chargement...';
      infoBonusUSD.textContent = 'Chargement...';
      
      // Récupérer les données de solde
      const soldeData = await api.getSoldeTotalBonus(numeroCompte);
      
      // Afficher les soldes avec animation
      const animateValue = (element, value, devise, duration = 800) => {
        let startValue = 0;
        const startTime = performance.now();
        
        const updateValue = (timestamp) => {
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Fonction d'easing pour un effet plus naturel
          const easing = t => t < .5 ? 2*t*t : -1+(4-2*t)*t;
          const easedProgress = easing(progress);
          
          const currentValue = startValue + parseFloat(value) * easedProgress;
          element.textContent = formatCurrency(currentValue, devise);
          
          if (progress < 1) {
            requestAnimationFrame(updateValue);
          }
        };
        
        requestAnimationFrame(updateValue);
      };
      
      // Animer l'affichage des soldes
      animateValue(infoSoldeFC, soldeData.soldeFC, 'FC');
      animateValue(infoSoldeUSD, soldeData.soldeUSD, 'USD');
      animateValue(infoBonusFC, soldeData.soldeAvecBonusFC, 'FC');
      animateValue(infoBonusUSD, soldeData.soldeAvecBonusUSD, 'USD');
      
      // Effet visuel pour attirer l'attention
      soldeInfoContainer.style.opacity = '0';
      soldeInfoContainer.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        soldeInfoContainer.style.transition = 'all 0.5s ease';
        soldeInfoContainer.style.opacity = '1';
        soldeInfoContainer.style.transform = 'translateY(0)';
      }, 50);
      
    } catch (error) {
      console.error("Erreur lors du chargement du solde membre:", error);
      document.getElementById('soldeInfoContainer').style.display = 'none';
      showMessage("Impossible de charger les informations de solde.", true);
    }
  }
  
  // --- Initialisation ---
  
  // Définir la date par défaut à aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
  
  // Gestionnaires d'événements
  form.addEventListener("submit", handleAddDepot);
  
  // Charger les suggestions de comptes
  loadComptesSuggestions();
  
  // Charger les dépôts existants
  handleLoadDepots();
});
