document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://localhost:3000";
  const form = document.getElementById("formRetrait");
  const tableBody = document.getElementById("retraits-tbody");
  const soldeFcDisplay = document.getElementById("solde-display-fc");
  const soldeUsdDisplay = document.getElementById("solde-display-usd");
  const soldeInfoContainer = document.getElementById("soldes-info");
  const soldeInfoFc = document.getElementById("solde-info-fc");
  const soldeInfoUsd = document.getElementById("solde-info-usd");
  const numeroCompteInput = document.getElementById("numero-compte");
  const dateRetraitInput = document.getElementById("date-retrait");
  const montantRetireInput = document.getElementById("montant-retire");
  const deviseSelect = document.querySelector("select[name='devise-montant-retire']");

  // Définir la date d'aujourd'hui par défaut
  dateRetraitInput.valueAsDate = new Date();

  // Variables pour stocker les soldes et montants max
  let soldeFC = 0;
  let soldeUSD = 0;
  let maxRetirableFC = 0;
  let maxRetirableUSD = 0;

  // Charger les retraits et les soldes
  loadRetraits();
  
  // Validation en temps réel du montant à retirer
  montantRetireInput.addEventListener("input", () => {
    const montant = parseFloat(montantRetireInput.value);
    const devise = deviseSelect.value === "CDF" ? "FC" : "USD";
    
    if (!isNaN(montant)) {
      const maxRetirable = devise === "FC" ? maxRetirableFC : maxRetirableUSD;
      
      if (montant > maxRetirable) {
        montantRetireInput.setCustomValidity(`Le montant maximum retirable est de ${maxRetirable.toFixed(2)} ${devise}`);
        montantRetireInput.classList.add("invalid");
      } else {
        montantRetireInput.setCustomValidity("");
        montantRetireInput.classList.remove("invalid");
      }
    }
  });
  
  // Mise à jour de la validation lors du changement de devise
  deviseSelect.addEventListener("change", () => {
    if (montantRetireInput.value) {
      const event = new Event("input");
      montantRetireInput.dispatchEvent(event);
    }
  });

  // Gestion de la soumission du formulaire
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const numeroCompte = numeroCompteInput.value.trim();
    const dateRetrait = dateRetraitInput.value;
    const montantRetire = parseFloat(montantRetireInput.value);
    const devise = deviseSelect.value === "CDF" ? "FC" : "USD";

    if (!numeroCompte || !dateRetrait || isNaN(montantRetire) || montantRetire <= 0) {
      showMessage("Veuillez remplir tous les champs correctement", "error");
      return;
    }
    
    // Vérifier le solde minimum à conserver selon la devise
    try {
      const soldeResponse = await fetch(`${apiUrl}/solde/${numeroCompte}`);
      const soldes = await soldeResponse.json();
      
      const soldeActuel = devise === "FC" ? soldes.soldeFC : soldes.soldeUSD;
      const montantMinimal = devise === "FC" ? 3000 : 1;
      
      if (soldeActuel - montantRetire < montantMinimal) {
        showMessage(`Vous devez maintenir un solde minimal de ${montantMinimal} ${devise} dans votre compte.`, "error");
        return;
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du solde:", error);
    }

    try {
      const response = await fetch(`${apiUrl}/retraits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_compte: numeroCompte,
          date_retrait: dateRetrait,
          montant_retire: montantRetire,
          devise: devise,
          membre_authentifie: numeroCompte // Assure que le retrait concerne bien le compte du membre
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage("Retrait enregistré avec succès", "success");
        form.reset();
        dateRetraitInput.valueAsDate = new Date(); // Réinitialiser la date
        loadRetraits(); // Recharger les données
      } else {
        showMessage(result.error || "Erreur lors de l'enregistrement", "error");
      }
    } catch (error) {
      console.error("Erreur:", error);
      showMessage("Erreur de connexion au serveur", "error");
    }
  });

  // Charger les retraits depuis le serveur
  async function loadRetraits() {
    try {
      // Afficher le chargement
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 2rem;">
            <div class="loading"></div>
            <span style="margin-left: 1rem;">Chargement des données...</span>
          </td>
        </tr>
      `;

      // Charger les retraits
      const retraitsResponse = await fetch(`${apiUrl}/retraits`);
      const retraits = await retraitsResponse.json();

      // Charger les soldes (si un numéro de compte est saisi)
      if (numeroCompteInput.value.trim()) {
        // Utiliser la fonction loadSoldes déjà définie pour la cohérence
        await loadSoldes(numeroCompteInput.value.trim());
      }

      // Afficher les retraits
      if (retraits.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="3" style="text-align: center; padding: 2rem;">
              Aucun retrait enregistré
            </td>
          </tr>
        `;
      } else {
        tableBody.innerHTML = retraits
          .map(
            (retrait) => `
            <tr>
              <td>${formatDate(retrait.date)}</td>
            <td>${retrait.compte}</td>
              <td>${retrait.montant} ${retrait.devise}</td>
            </tr>
          `
          )
          .join("");
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; padding: 2rem; color: red;">
            Erreur de chargement des données
          </td>
        </tr>
      `;
    }
  }

  // Écouteur pour le changement ou la saisie dans le numéro de compte
  numeroCompteInput.addEventListener("input", () => {
    const numeroCompte = numeroCompteInput.value.trim();
    if (numeroCompte.length >= 3) { // Commencer la recherche après 3 caractères minimum
      loadSoldes(numeroCompte);
    } else {
      // Cacher l'affichage des soldes si le champ est presque vide
      soldeInfoContainer.classList.remove("active");
      soldeInfoFc.textContent = "0.00 FC";
      soldeInfoUsd.textContent = "0.00 $";
    }
  });
  
  // Écouteur pour la validation finale du numéro de compte
  numeroCompteInput.addEventListener("change", () => {
    if (numeroCompteInput.value.trim()) {
      loadRetraits();
    }
  });
  
  // Fonction pour charger et afficher les soldes automatiquement
  async function loadSoldes(numeroCompte) {
    try {
      const response = await fetch(`${apiUrl}/solde/${numeroCompte}`);
      if (response.ok) {
        const soldes = await response.json();
        
        // Montants minimaux à conserver
        const montantMinimalFC = 3000;
        const montantMinimalUSD = 1;
        
        // Calculer les montants maximums retirables
        maxRetirableFC = Math.max(0, soldes.soldeFC - montantMinimalFC);
        maxRetirableUSD = Math.max(0, soldes.soldeUSD - montantMinimalUSD);
        
        // Stocker les soldes actuels
        soldeFC = soldes.soldeFC;
        soldeUSD = soldes.soldeUSD;
        
        // Mettre à jour l'affichage des soldes dans le formulaire
        soldeInfoFc.textContent = `${soldes.soldeFC.toFixed(2)} FC`;
        soldeInfoUsd.textContent = `${soldes.soldeUSD.toFixed(2)} $`;
        
        // Mettre à jour les montants maximums retirables
        document.getElementById("max-retirable-fc").textContent = `${maxRetirableFC.toFixed(2)} FC`;
        document.getElementById("max-retirable-usd").textContent = `${maxRetirableUSD.toFixed(2)} $`;
        
        // Mettre à jour l'affichage principal des soldes aussi
        soldeFcDisplay.textContent = `${soldes.soldeFC.toFixed(2)} FC`;
        soldeUsdDisplay.textContent = `${soldes.soldeUSD.toFixed(2)} $`;
        
        // Activer l'affichage des soldes
        soldeInfoContainer.classList.add("active");
        
        // Ajouter une animation pour attirer l'attention
        soldeInfoFc.classList.add("highlight");
        soldeInfoUsd.classList.add("highlight");
        
        // Retirer l'animation après 1 seconde
        setTimeout(() => {
          soldeInfoFc.classList.remove("highlight");
          soldeInfoUsd.classList.remove("highlight");
        }, 1000);
      } else {
        // En cas d'erreur, masquer l'affichage des soldes
        soldeInfoContainer.classList.remove("active");
      }
    } catch (error) {
      console.error("Erreur lors du chargement des soldes:", error);
      soldeInfoContainer.classList.remove("active");
    }
  }

  // Fonction pour formater la date
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  }

  // Fonction pour afficher les messages
  function showMessage(message, type) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }
}); 