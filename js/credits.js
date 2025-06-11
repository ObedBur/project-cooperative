document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://localhost:3000";
  
  // Éléments DOM pour l'ajout de crédit
  const formAjoutCredit = document.getElementById("formAjoutCredit");
  const numeroCompteInput = document.getElementById("numero-compte");
  const messageAjoutDiv = document.getElementById("message-ajout");
  const infoSoldes = document.getElementById("info-soldes");
  const tableCredits = document.getElementById("tableCredits");
  
  // Éléments DOM pour le remboursement
  const formRemboursement = document.getElementById("formRemboursement");
  const numeroCompteRembInput = document.getElementById("numero-compte-remb");
  const selectCredit = document.getElementById("select-credit");
  const montantRemboursInput = document.getElementById("montant-rembourse");
  const deviseRemboursSelect = document.querySelector("select[name='devise-montant-remb']");
  const btnRembourser = document.getElementById("btn-rembourser");
  const messageRemboursementDiv = document.getElementById("message-remboursement");
  const creditDetails = document.getElementById("credit-details");
  const listeCreditsHistorique = document.getElementById("liste-credits-historique");
  
  // Définir la date du jour par défaut
  const dateInput = document.getElementById("date-pret");
  dateInput.valueAsDate = new Date();
  
  // Event listeners pour l'ajout de crédit
  numeroCompteInput.addEventListener("input", debounce(async () => {
    const numeroCompte = numeroCompteInput.value.trim();
    if (numeroCompte.length >= 3) {
      await chargerInfosCompte(numeroCompte, true);
    } else {
      infoSoldes.style.display = "none";
    }
  }, 500));
  
  // Event listeners pour le remboursement
  numeroCompteRembInput.addEventListener("input", debounce(async () => {
    const numeroCompte = numeroCompteRembInput.value.trim();
    if (numeroCompte.length >= 3) {
      await chargerCreditsCompte(numeroCompte);
    } else {
      reinitialiserFormRemboursement();
    }
  }, 500));
  
  // Event listener pour afficher les détails du crédit supprimé
  
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
  async function chargerInfosCompte(numeroCompte, isForCredit = true) {
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
      
      if (isForCredit) {
        // Afficher les soldes pour l'ajout de crédit
        document.getElementById("solde-fc").textContent = `${parseFloat(soldes.soldeFC).toFixed(2)} FC`;
        document.getElementById("solde-usd").textContent = `${parseFloat(soldes.soldeUSD).toFixed(2)} $`;
        
        const creditsActifs = credits.filter(c => c.statut === "en_cours");
        document.getElementById("credits-actifs").textContent = creditsActifs.length;
        
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
        
        document.getElementById("total-du").textContent = totalDuText.length > 0 ? totalDuText.join(" / ") : "0";
        
        infoSoldes.style.display = "block";
        
        // Afficher les crédits dans le tableau
        afficherCredits(credits);
      }
      
      return { soldes, credits };
    } catch (error) {
      console.error("Erreur lors du chargement des infos du compte:", error);
      if (isForCredit) {
        infoSoldes.style.display = "none";
        afficherMessage(messageAjoutDiv, "Compte non trouvé ou erreur de chargement", false);
      } else {
        afficherMessage(messageRemboursementDiv, "Compte non trouvé ou erreur de chargement", false);
      }
      return null;
    }
  }
  
  // Afficher les crédits dans la table
  function afficherCredits(credits) {
    if (!credits || credits.length === 0) {
      tableCredits.innerHTML = '<p class="message-placeholder">Aucun crédit trouvé pour ce compte.</p>';
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
    
    tableCredits.innerHTML = html;
  }
  
  // Charger les crédits pour le formulaire de remboursement
  async function chargerCreditsCompte(numeroCompte) {
    try {
      const result = await chargerInfosCompte(numeroCompte, false);
      
      if (!result) {
        reinitialiserFormRemboursement();
        return;
      }
      
      const { credits } = result;
      
      // Filtrer les crédits actifs
      const creditsActifs = credits.filter(c => c.statut === "en_cours");
      
      // Mettre à jour le select
      selectCredit.innerHTML = '<option value="">-- Sélectionnez un prêt --</option>';
      
      creditsActifs.forEach(credit => {
        const option = document.createElement("option");
        option.value = credit.id;
        option.textContent = `Crédit #${credit.id.substring(0, 8)}... - ${parseFloat(credit.solde_restant).toFixed(2)} ${credit.devise}`;
        option.dataset.credit = JSON.stringify(credit);
        selectCredit.appendChild(option);
      });
      
      // Activer/désactiver le select
      selectCredit.disabled = creditsActifs.length === 0;
      
      if (creditsActifs.length === 0) {
        afficherMessage(messageRemboursementDiv, "Aucun crédit actif à rembourser pour ce compte", false);
      }
      
      // Afficher l'historique des crédits
      afficherHistoriqueCredits(credits);
      
    } catch (error) {
      console.error("Erreur lors du chargement des crédits:", error);
      reinitialiserFormRemboursement();
    }
  }
  
  // Fonction d'affichage des détails du crédit supprimée
  
  // Afficher l'historique des crédits
  function afficherHistoriqueCredits(credits) {
    if (!credits || credits.length === 0) {
      listeCreditsHistorique.innerHTML = '<p class="message-placeholder">Aucun crédit trouvé pour ce compte.</p>';
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
    
    listeCreditsHistorique.innerHTML = html;
  }
  
  // Réinitialiser le formulaire de remboursement
  function reinitialiserFormRemboursement() {
    selectCredit.innerHTML = '<option value="">-- Sélectionnez un prêt --</option>';
    selectCredit.disabled = true;
    montantRemboursInput.disabled = true;
    deviseRemboursSelect.disabled = true;
    btnRembourser.disabled = true;
    creditDetails.style.display = "none";
    listeCreditsHistorique.innerHTML = '<p class="message-placeholder">Veuillez saisir un numéro de compte pour voir l\'historique.</p>';
  }
  
  // Gérer la soumission du formulaire d'ajout de crédit
  formAjoutCredit.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(formAjoutCredit);
    const data = {
      numero_compte: formData.get("numero-compte"),
      date_pret: formData.get("date-pret"),
      montant_pret: formData.get("montant-pret"),
      devise: formData.get("devise-montant-pret"),
    };

    // Validation simple côté client
    if (
      !data.numero_compte ||
      !data.date_pret ||
      !data.montant_pret ||
      !data.devise
    ) {
      afficherMessage(messageAjoutDiv, "Tous les champs sont requis.", false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      afficherMessage(messageAjoutDiv, result.message || result.error, res.ok);
      if (res.ok) {
        formAjoutCredit.reset();
        dateInput.valueAsDate = new Date();
        infoSoldes.style.display = "none";
        tableCredits.innerHTML = '';
      }
    } catch (error) {
      afficherMessage(
        messageAjoutDiv,
        "Erreur de connexion au serveur.",
        false
      );
    }
  });
  
  // Gérer la soumission du formulaire de remboursement
  formRemboursement.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const numeroCompte = numeroCompteRembInput.value.trim();
    const creditId = selectCredit.value;
    const montantRembourse = parseFloat(montantRemboursInput.value);
    const devise = deviseRemboursSelect.value;
    
    // Validation simple côté client
    if (!numeroCompte || !creditId || isNaN(montantRembourse) || montantRembourse <= 0 || !devise) {
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
        // Créer un message de succès détaillé
        const montantInteret = montantRembourse * 0.15 / 1.15; // 15% du montant total
        const interetSysteme = montantInteret * (10/15); // 10% des 15% d'intérêt
        const interetMembre = montantInteret * (5/15);   // 5% des 15% d'intérêt
        
        const messageSucces = `
          ✅ Remboursement effectué avec succès !<br>
          💰 Montant remboursé: ${montantRembourse.toFixed(2)} ${credit.devise}<br>
          📊 Répartition des intérêts:<br>
          &nbsp;&nbsp;• Système (+10%): ${interetSysteme.toFixed(2)} ${credit.devise}<br>
          &nbsp;&nbsp;• Votre épargne (+5%): ${interetMembre.toFixed(2)} ${credit.devise}
        `;
        
        afficherMessage(messageRemboursementDiv, messageSucces, true);
        
        // Réinitialiser le formulaire
        formRemboursement.reset();
        
        // Recharger les crédits et informations du compte
        await chargerCreditsCompte(numeroCompte);
        
        // Réinitialiser les détails
        creditDetails.style.display = "none";
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
