document.addEventListener("DOMContentLoaded", () => {
  const btnGenerer = document.getElementById("btn-generer-rapport");
  const periodeInput = document.getElementById("periode-rapport");
  const rapportDisplay = document.getElementById("rapport-display");
  const messageDiv = document.getElementById("message-rapport");
  const btnImprimer = document.getElementById("btn-imprimer-rapport");

  // Définir la valeur par défaut du champ de date sur le mois en cours
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  periodeInput.value = `${year}-${month}`;

  btnGenerer.addEventListener("click", async () => {
    const periode = periodeInput.value;
    if (!periode) {
      showMessage("Veuillez sélectionner un mois et une année.", "error");
      return;
    }

    const [annee, mois] = periode.split("-");

    // Afficher un message de chargement
    showMessage("Génération du rapport en cours...", "info");
    rapportDisplay.style.display = "none";

    try {
      const response = await fetch(`/rapport/${annee}/${mois}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      // Mise à jour de l'affichage
      updateRapportUI(data, annee, mois);
      showMessage("Rapport généré avec succès.", "success");
      rapportDisplay.style.display = "block";
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
      showMessage(`Erreur: ${error.message}`, "error");
      rapportDisplay.style.display = "none";
    }
  });

  function updateRapportUI(data, annee, mois) {
    const moisTexte = new Date(annee, mois - 1).toLocaleString("fr-FR", {
      month: "long",
    });
    document.getElementById(
      "rapport-titre"
    ).textContent = `Rapport pour ${moisTexte} ${annee}`;

    // Données FC
    document.getElementById("depots-fc").textContent = `${data.fc.depots} FC`;
    document.getElementById(
      "retraits-fc"
    ).textContent = `${data.fc.retraits} FC`;
    document.getElementById("credits-fc").textContent = `${data.fc.credits} FC`;
    document.getElementById(
      "interets-fc"
    ).textContent = `${data.fc.interets} FC`;
    document.getElementById(
      "benefice-fc"
    ).textContent = `${data.fc.benefice} FC`;

    // Données USD
    document.getElementById("depots-usd").textContent = `$ ${data.usd.depots}`;
    document.getElementById(
      "retraits-usd"
    ).textContent = `$ ${data.usd.retraits}`;
    document.getElementById(
      "credits-usd"
    ).textContent = `$ ${data.usd.credits}`;
    document.getElementById(
      "interets-usd"
    ).textContent = `$ ${data.usd.interets}`;
    document.getElementById(
      "benefice-usd"
    ).textContent = `$ ${data.usd.benefice}`;
  }

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
  }

  btnImprimer.addEventListener("click", () => {
    window.print();
  });
});
