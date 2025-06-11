document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://localhost:3000";
  
  // Éléments DOM pour le formulaire de remboursement
  const numeroCompteInput = document.getElementById("numero-compte");
  const formRemboursement = document.getElementById("formRemboursement");
  const selectCredit = document.getElementById("select-credit");
  const montantRemboursInput = document.getElementById("montant-rembourse");
  const deviseRemboursementSpan = document.getElementById("devise-remboursement");
  const btnRembourser = document.getElementById("btn-rembourser");
  const messageRemboursementDiv = document.getElementById("message-remboursement");
  
  // Éléments DOM pour l'affichage des informations
  const infoSoldesDiv = document.getElementById("info-soldes");
  const soldeFcSpan = document.getElementById("solde-fc");
  const soldeUsdSpan = document.getElementById("solde-usd");
  const creditsActifsSpan = document.getElementById("credits-actifs");
  const totalDuSpan = document.getElementById("total-du");
  const listeCreditsHistoriqueDiv = document.getElementById("liste-credits-historique");
  const creditDetailsDiv = document.getElementById("credit-details");
  
  // Champs de détails du crédit
  const detailMontantInitial = document.getElementById("detail-montant-initial");
  const detailMontantTotal = document.getElementById("detail-montant-total");
  const detailDejaRembourse = document.getElementById("detail-deja-rembourse");
  const detailResteAPayer = document.getElementById("detail-reste-a-payer");
  
  // Event listeners
  numeroCompteInput.addEventListener("input", debounce(async () => {
    const numeroCompte = numeroCompteInput.value.trim();
    if (numeroCompte.length >= 3) {
      await chargerInfosCompte(numeroCompte);
    } else {
      infoSoldesDiv.style.display = "none";
      reinitialiserFormRemboursement();
    }
  }, 500));
  
  selectCredit.addEventListener("change", () => {
    afficherDetailsCredit();
  });
  
  // Fonction debounce pour limiter les appels API
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Affiche un message et le fait disparaître
  function afficherMessage(element, message, isSuccess) {
    element.innerHTML = `<div class="message ${isSuccess ? 'success' : 'error'}">${message}</div>`;
    setTimeout(() => (element.innerHTML = ""), 5000);
  }
  
  // Charger les informations du compte
  async function chargerInfosCompte(numeroCompte) {
    try {
      // Charger le solde
      const soldeResponse = await fetch(`${apiUrl}/solde/${numeroCompte}`);
      
      if (!soldeResponse.ok) {
        throw new Error("Compte non trouvé");
      }
      
      const soldes = await soldeResponse.json();
      
      // Charger les crédits
      const creditsResponse = await fetch(`${apiUrl}/credits?compte=${numeroCompte}`);
      const credits = await creditsResponse.json();
      
      // Afficher les soldes
      soldeFcSpan.textContent = `${parseFloat(soldes.soldeFC).toFixed(2)} FC`;
      soldeUsdSpan.textContent = `${parseFloat(soldes.soldeUSD).toFixed(2)} $`;
      
      const creditsActifs = credits.filter(c => c.statut === "en_cours");
      creditsActifsSpan.textContent = creditsActifs.length;
      
      // Calculer le total dû
      let totalDuFC = 0;
      let totalDuUSD = 0;
      
      creditsActifs.forEach(credit => {
        if (credit.devise === "FC") {
          totalDuFC += parseFloat(credit.solde_restant);
        } else {
          totalDuUSD += parseFloat(credit.solde_restant);
        }
      });
      
      const totalDuText = [];
      if (totalDuFC > 0) totalDuText.push(`${totalDuFC.toFixed(2)} FC`);
      if (totalDuUSD > 0) totalDuText.push(`${totalDuUSD.toFixed(2)} $`);
      
      totalDuSpan.textContent = totalDuText.length > 0 ? totalDuText.join(" / ") : "0";
      
      // Afficher les informations
      infoSoldesDiv.style.display = "block";
      
      // Charger les crédits dans le select
      chargerCredits(creditsActifs);
      
      // Afficher l'historique des crédits
      afficherHistoriqueCredits(credits);
      
      return { soldes, credits };
    } catch (error) {
      console.error("Erreur lors du chargement des infos du compte:", error);
      infoSoldesDiv.style.display = "none";
      afficherMessage(messageRemboursementDiv, "Compte non trouvé ou erreur de chargement", false);
      reinitialiserFormRemboursement();
      return null;
    }
  }
  
  // Charger les crédits dans le select
  function chargerCredits(creditsActifs) {
    // Réinitialiser le select
    selectCredit.innerHTML = '<option value="">-- Sélectionnez un prêt --</option>';
    
    if (creditsActifs.length === 0) {
      selectCredit.disabled = true;
      afficherMessage(messageRemboursementDiv, "Aucun crédit actif à rembourser pour ce compte", false);
      return;
    }
    
    // Ajouter les options
    creditsActifs.forEach(credit => {
      const option = document.createElement("option");
      option.value = credit.id;
      option.textContent = `Crédit #${credit.id.substring(0, 8)}... - ${parseFloat(credit.solde_restant).toFixed(2)} ${credit.devise}`;
      option.dataset.credit = JSON.stringify(credit);
      selectCredit.appendChild(option);
    });
    
    // Activer le select
    selectCredit.disabled = false;
  }
  
  // Afficher les détails du crédit sélectionné
  function afficherDetailsCredit() {
    const selectedOption = selectCredit.selectedOptions[0];
    
    if (!selectedOption || !selectedOption.value) {
      creditDetailsDiv.style.display = "none";
      montantRemboursInput.disabled = true;
      btnRembourser.disabled = true;
      deviseRemboursementSpan.textContent = "";
      return;
    }
    
    try {
      const credit = JSON.parse(selectedOption.dataset.credit);
      
      // Remplir les détails
      detailMontantInitial.textContent = `${parseFloat(credit.montant_pret).toFixed(2)} ${credit.devise}`;
      detailMontantTotal.textContent = `${parseFloat(credit.montant_total_a_rembourser).toFixed(2)} ${credit.devise}`;
      detailDejaRembourse.textContent = `${parseFloat(credit.montant_deja_rembourse).toFixed(2)} ${credit.devise}`;
      detailResteAPayer.textContent = `${parseFloat(credit.solde_restant).toFixed(2)} ${credit.devise}`;
      
      // Mettre à jour le champ de montant
      deviseRemboursementSpan.textContent = credit.devise;
      montantRemboursInput.disabled = false;
      btnRembourser.disabled = false;
      
      // Définir le placeholder et max du montant
      const resteAPayer = parseFloat(credit.solde_restant);
      montantRemboursInput.max = resteAPayer;
      montantRemboursInput.placeholder = `Maximum: ${resteAPayer.toFixed(2)} ${credit.devise}`;
      
      // Afficher les détails
      creditDetailsDiv.style.display = "block";
    } catch (error) {
      console.error("Erreur lors de l'affichage des détails du crédit:", error);
      creditDetailsDiv.style.display = "none";
    }
  }
  
  // Afficher l'historique des crédits
  function afficherHistoriqueCredits(credits) {
    if (!credits || credits.length === 0) {
      listeCreditsHistoriqueDiv.innerHTML = '<p class="message-placeholder">Aucun crédit trouvé pour ce compte.</p>';
      return;
    }
    
    let html = '';
    
    credits.forEach(credit => {
      const montantPret = parseFloat(credit.montant_pret);
      const montantTotalARembourser = parseFloat(credit.montant_total_a_rembourser);
      const montantDejaRembourse = parseFloat(credit.montant_deja_rembourse);
      const soldeRestant = parseFloat(credit.solde_restant);
      
      const pourcentageRembourse = (montantDejaRembourse / montantTotalARembourser) * 100;
      
      html += `
        <div class="credit-card">
          <div class="credit-header">
            <h4>Crédit #${credit.id.substring(0, 8)}...</h4>
            <span class="credit-status ${credit.statut === 'en_cours' ? 'status-actif' : 'status-rembourse'}">
              ${credit.statut === 'en_cours' ? 'En cours' : 'Remboursé'}
            </span>
          </div>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Montant initial:</span>
              <span class="detail-value">${montantPret.toFixed(2)} ${credit.devise}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Avec intérêts (+15%):</span>
              <span class="detail-value">${montantTotalARembourser.toFixed(2)} ${credit.devise}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Remboursé:</span>
              <span class="detail-value">${montantDejaRembourse.toFixed(2)} ${credit.devise}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Reste à payer:</span>
              <span class="detail-value ${soldeRestant > 0 ? 'highlight' : ''}">${soldeRestant.toFixed(2)} ${credit.devise}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Progression:</span>
              <span class="detail-value">${Math.round(pourcentageRembourse)}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date de création:</span>
              <span class="detail-value">${new Date(credit.date_pret).toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Échéance:</span>
              <span class="detail-value">${new Date(credit.echeance).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      `;
    });
    
    listeCreditsHistoriqueDiv.innerHTML = html;
  }
  
  // Réinitialiser le formulaire de remboursement
  function reinitialiserFormRemboursement() {
    selectCredit.innerHTML = '<option value="">-- Sélectionnez un prêt --</option>';
    selectCredit.disabled = true;
    montantRemboursInput.disabled = true;
    montantRemboursInput.value = "";
    btnRembourser.disabled = true;
    deviseRemboursementSpan.textContent = "";
    creditDetailsDiv.style.display = "none";
    listeCreditsHistoriqueDiv.innerHTML = '<p class="message-placeholder">Veuillez saisir un numéro de compte pour voir l\'historique.</p>';
  }
  
  // Gérer la soumission du formulaire de remboursement
  formRemboursement.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const numeroCompte = numeroCompteInput.value.trim();
    const creditId = selectCredit.value;
    const montantRembourse = parseFloat(montantRemboursInput.value);
    const devise = deviseRemboursementSpan.textContent === "FC" ? "CDF" : "USD";
    
    // Validation simple côté client
    if (!numeroCompte || !creditId || isNaN(montantRembourse) || montantRembourse <= 0) {
      afficherMessage(messageRemboursementDiv, "Veuillez remplir tous les champs correctement", false);
      return;
    }
    
    // Récupérer les détails du crédit
    const credit = JSON.parse(selectCredit.selectedOptions[0].dataset.credit);
    const soldeRestant = parseFloat(credit.solde_restant);
    
    if (montantRembourse > soldeRestant) {
      afficherMessage(messageRemboursementDiv, `Le montant ne peut pas dépasser ${soldeRestant.toFixed(2)} ${credit.devise}`, false);
      return;
    }
    
    // Préparer les données pour le serveur
    const data = {
      numero_compte: numeroCompte,
      montant_rembourse: montantRembourse,
      devise: devise,
      credit_id: creditId
    };
    
    // Désactiver le bouton pendant le traitement
    btnRembourser.innerHTML = '<div class="loading"></div> Traitement...';
    btnRembourser.disabled = true;
    
    try {
      const res = await fetch(`${apiUrl}/remboursements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      // Réactiver le bouton
      btnRembourser.innerHTML = '<i class="fa-solid fa-cash-register"></i> Valider le remboursement';
      
      if (res.ok) {
        // Créer un message de succès détaillé avec les détails du remboursement
        let messageSucces = "Remboursement effectué avec succès !";
        
        if (result.details) {
          const { montant_rembourse, interet_total, interet_systeme, interet_membre, devise } = result.details;
          const deviseSymbol = devise === "FC" ? "FC" : "$";
          
          messageSucces = `
            ✅ Remboursement effectué avec succès !<br>
            💰 Montant remboursé: ${parseFloat(montant_rembourse).toFixed(2)} ${deviseSymbol}<br>
            📊 Répartition des intérêts:<br>
            &nbsp;&nbsp;• Système (+10%): ${parseFloat(interet_systeme).toFixed(2)} ${deviseSymbol}<br>
            &nbsp;&nbsp;• Votre épargne (+5%): ${parseFloat(interet_membre).toFixed(2)} ${deviseSymbol}
          `;
        }
        
        afficherMessage(messageRemboursementDiv, messageSucces, true);
        
        // Réinitialiser le formulaire
        montantRemboursInput.value = "";
        
        // Recharger les crédits et informations du compte
        await chargerInfosCompte(numeroCompte);
        
        // Réinitialiser les détails
        creditDetailsDiv.style.display = "none";
      } else {
        afficherMessage(messageRemboursementDiv, result.error || "Erreur lors du remboursement", false);
        btnRembourser.disabled = false;
      }
    } catch (error) {
      console.error("Erreur lors du remboursement:", error);
      afficherMessage(messageRemboursementDiv, "Erreur de connexion au serveur", false);
      btnRembourser.innerHTML = '<i class="fa-solid fa-cash-register"></i> Valider le remboursement';
      btnRembourser.disabled = false;
    }
  });
});
