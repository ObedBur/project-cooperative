document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "http://localhost:3000/api/membres";

  // Variables globales pour la pagination
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalItems = 0;
  let allMembres = []; // Stockage de tous les membres pour filtrage côté client
  let filteredMembres = []; // Membres après filtrage

  // Variables pour le tri
  let currentSortField = 'date_adhesion';
  let currentSortDirection = 'desc'; // 'asc' ou 'desc'

  const form = document.getElementById("formMembre");
  const numeroCompte = document.getElementById("numero-compte");
  const nomComplet = document.getElementById("nom-complet");
  const telephone = document.getElementById("telephone");
  const dateAdhesion = document.getElementById("date-adhesion");
  const typeCompte = document.getElementById("type-compte");
  const statut = document.getElementById("statut");
  const tableMembres = document.getElementById("tableMembres");
  const btnSupprimerCompte = document.getElementById("btnSupprimerCompte");
  const numeroSupprimer = document.getElementById("numero-supprimer");
  const messageDiv = document.getElementById("message");
  const affichageBorder = document.querySelector(".affichage-border");
  const formTitle = document.getElementById("form-title");
  const btnSubmit = document.getElementById("btn-submit").querySelector('span');
  const btnSubmitIcon = document.getElementById("btn-submit").querySelector('i');
  const hiddenId = document.getElementById("membre-id");

  // Nouveaux champs
  const dateNaissance = document.getElementById("date-naissance");
  const sexeM = document.getElementById("sexe-m");
  const sexeF = document.getElementById("sexe-f");
  const email = document.getElementById("email");
  const idNationale = document.getElementById("id-nationale");
  const adresse = document.getElementById("adresse");
  const photoProfil = document.getElementById("photo-profil");

  // Éléments du DOM pour les nouvelles fonctionnalités
  const toggleFiltersBtn = document.getElementById("toggle-filters");
  const advancedFilters = document.getElementById("advanced-filters");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const resetFiltersBtn = document.getElementById("reset-filters");
  const exportExcelBtn = document.getElementById("btn-export-excel");
  const exportPdfBtn = document.getElementById("btn-export-pdf");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");
  const currentPageSpan = document.getElementById("current-page");
  const totalPagesSpan = document.getElementById("total-pages");
  
  // Champs de filtre
  const filterStatut = document.getElementById("filter-statut");
  const filterTypeCompte = document.getElementById("filter-type-compte");
  const filterSexe = document.getElementById("filter-sexe");
  const filterDateDebut = document.getElementById("filter-date-debut");
  const filterDateFin = document.getElementById("filter-date-fin");
  
  // Statistiques
  const totalMembresActifs = document.getElementById("total-membres-actifs");
  const totalMembresInactifs = document.getElementById("total-membres-inactifs");
  const ratioHommes = document.getElementById("ratio-hommes");
  const ratioFemmes = document.getElementById("ratio-femmes");

  // Initialisation de intl-tel-input pour le champ téléphone
  let iti;
  if (telephone) {
    iti = window.intlTelInput(telephone, {
      initialCountry: "cd", // République Démocratique du Congo
      preferredCountries: ["cd"],
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
      separateDialCode: true,
      autoPlaceholder: "polite"
    });
  }

  // Formater le numéro de compte comme un numéro bancaire
  if (numeroCompte) {
    numeroCompte.addEventListener("input", function(e) {
      // Supprimer tout ce qui n'est pas un chiffre
      let value = e.target.value.replace(/\D/g, "");
      
      // Limiter à 6 chiffres
      if (value.length > 6) {
        value = value.slice(0, 6);
      }
      
      // Formatter par groupes de 3 chiffres séparés par des tirets
      let formattedValue = "";
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 3 === 0) {
          formattedValue += "-";
        }
        formattedValue += value[i];
      }
      
      // Mettre à jour la valeur
      e.target.value = formattedValue;
    });

    // Si un numéro est déjà présent, le formatter
    if (numeroCompte.value) {
      const event = new Event("input");
      numeroCompte.dispatchEvent(event);
    }
  }

  // --- Fonctions de communication avec l'API ---

  const api = {
    async get() {
      try {
        const response = await fetch(apiUrl);
        
        // Vérifier le type de contenu avant de traiter comme JSON
        const contentType = response.headers.get("content-type");
        
        if (!response.ok) {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Erreur de chargement des membres");
          } else {
            // Si ce n'est pas du JSON, afficher l'erreur différemment
            const text = await response.text();
            console.error("Réponse non-JSON reçue:", text.substring(0, 100));
            throw new Error("La réponse du serveur n'est pas au format JSON attendu");
          }
        }
        
        // Vérifier que la réponse est bien du JSON avant de la traiter
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Le serveur a renvoyé un contenu non-JSON:", text.substring(0, 100));
          throw new Error("Le serveur a renvoyé un contenu non-JSON");
        }
        
        return response.json();
      } catch (error) {
        console.error("Erreur lors de la récupération des membres:", error);
        throw error;
      }
    },
    
    async post(data) {
      try {
        console.log("Envoi des données au serveur:", data);
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de l'ajout du membre");
        }
        
        return response.json();
      } catch (error) {
        console.error("Erreur lors de l'envoi des données:", error);
        throw error;
      }
    },
    
    async put(id, data) {
      try {
        console.log("Mise à jour du membre:", id, data);
        const response = await fetch(`${apiUrl}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur lors de la mise à jour du membre");
        }
        
      return response.json();
      } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
        throw error;
      }
    },
    
    async delete(id) {
      const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression du membre");
      }
      return response.json();
    },

    // Nouvelle fonction pour récupérer le prochain numéro de compte
    async getNextNumeroCompte() {
      try {
        const response = await fetch("http://localhost:3000/api/prochain-numero-compte");
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération du numéro de compte");
        }
        const data = await response.json();
        return data.numero_compte;
      } catch (error) {
        console.error("Erreur:", error);
        throw error;
      }
    }
  };

  // --- Fonctions d'affichage ---

  function showMessage(message, isError = false) {
    messageDiv.textContent = message;
    messageDiv.className = isError ? "message error" : "message success";
    
    // Faire défiler vers le message
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
      messageDiv.textContent = "";
      messageDiv.className = "";
    }, 5000); // Augmenté à 5 secondes pour une meilleure visibilité
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date) ? '-' : date.toLocaleDateString();
  }

  // Fonction pour formater le numéro de téléphone dans l'affichage
  function formatTelephone(tel) {
    if (!tel) return '-';
    
    // Si le numéro ne commence pas par +, ajouter +243
    if (!tel.startsWith('+')) {
      // Supprimer les 0 au début si présents
      tel = tel.replace(/^0+/, '');
      // Ajouter le préfixe +243
      tel = '+243' + tel;
    }
    
    return tel;
  }

  // Fonction pour formater les numéros de compte dans l'affichage
  function formatNumeroCompte(numero) {
    if (!numero) return '-';
    
    // Supprimer tout ce qui n'est pas un chiffre
    let value = numero.replace(/\D/g, "");
    
    // Limiter à 6 chiffres
    value = value.substring(0, 6);
    
    // S'assurer que le numéro a 6 chiffres (ajouter des zéros au début si nécessaire)
    value = value.padStart(6, "0");
    
    // Formatter par groupes de 3 chiffres séparés par des tirets (123-456)
    if (value.length === 6) {
      return value.substring(0, 3) + "-" + value.substring(3);
    }
    
    return value;
  }

  // --- Nouvelles fonctions pour les fonctionnalités avancées ---

  // Initialisation des écouteurs d'événements pour les nouvelles fonctionnalités
  function setupNewFeatures() {
    // Toggle des filtres avancés
    if (toggleFiltersBtn) {
      toggleFiltersBtn.addEventListener('click', () => {
        if (advancedFilters) {
          advancedFilters.classList.toggle('show');
        }
      });
    }

    // Application des filtres
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', applyFilters);
    }

    // Réinitialisation des filtres
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', resetFilters);
    }

    // Export Excel
    if (exportExcelBtn) {
      exportExcelBtn.addEventListener('click', exportToExcel);
    }

    // Export PDF
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', exportToPDF);
    }

    // Pagination
    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    }

    // Tri de tableau
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const sortField = th.getAttribute('data-sort');
        handleSort(sortField);
      });
    });
  }

  // Fonction de pagination
  function setupPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (currentPageSpan) currentPageSpan.textContent = currentPage;
    if (totalPagesSpan) totalPagesSpan.textContent = totalPages;
    
    if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;
  }

  function goToPage(page) {
    currentPage = page;
    renderCurrentPage();
  }

  function renderCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const membresAffichage = filteredMembres.slice(startIndex, endIndex);
    
    renderMembres(membresAffichage);
    setupPagination(filteredMembres.length);
  }

  // Fonctions de filtrage
  function applyFilters() {
    const statutFilter = filterStatut?.value || '';
    const typeCompteFilter = filterTypeCompte?.value || '';
    const sexeFilter = filterSexe?.value || '';
    const dateDebutFilter = filterDateDebut?.value ? new Date(filterDateDebut.value) : null;
    const dateFinFilter = filterDateFin?.value ? new Date(filterDateFin.value) : null;
    
    // Filtrer les membres
    filteredMembres = allMembres.filter(membre => {
      // Filtre par statut
      if (statutFilter && membre.statut !== statutFilter) return false;
      
      // Filtre par type de compte
      if (typeCompteFilter && membre.type_compte !== typeCompteFilter) return false;
      
      // Filtre par sexe
      if (sexeFilter && membre.sexe !== sexeFilter) return false;
      
      // Filtre par date de début
      if (dateDebutFilter) {
        const dateAdhesion = new Date(membre.date_adhesion);
        if (dateAdhesion < dateDebutFilter) return false;
      }
      
      // Filtre par date de fin
      if (dateFinFilter) {
        const dateAdhesion = new Date(membre.date_adhesion);
        if (dateAdhesion > dateFinFilter) return false;
      }
      
      return true;
    });
    
    // Réinitialiser la pagination
    currentPage = 1;
    renderCurrentPage();
    
    // Mettre à jour le message de statut
    if (advancedFilters) {
      advancedFilters.classList.remove('show');
      
      // Afficher un message sur le nombre de résultats filtrés
      showMessage(`${filteredMembres.length} membre(s) trouvé(s)`);
    }
  }

  function resetFilters() {
    // Réinitialiser les champs de filtre
    if (filterStatut) filterStatut.value = '';
    if (filterTypeCompte) filterTypeCompte.value = '';
    if (filterSexe) filterSexe.value = '';
    if (filterDateDebut) filterDateDebut.value = '';
    if (filterDateFin) filterDateFin.value = '';
    
    // Réinitialiser les données filtrées
    filteredMembres = [...allMembres];
    
    // Réinitialiser la pagination
    currentPage = 1;
    renderCurrentPage();
    
    // Mettre à jour le message de statut
    if (advancedFilters) {
      advancedFilters.classList.remove('show');
      showMessage("Filtres réinitialisés");
    }
  }

  // Fonction de tri
  function handleSort(sortField) {
    // Mise à jour des classes CSS pour l'indication visuelle
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Si on clique sur le même champ, inverser la direction
    if (sortField === currentSortField) {
      currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      currentSortField = sortField;
      currentSortDirection = 'asc';
    }
    
    // Ajouter la classe correspondante
    const currentTh = document.querySelector(`th[data-sort="${sortField}"]`);
    if (currentTh) {
      currentTh.classList.add(currentSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
    
    // Trier les données
    sortMembres();
    
    // Réafficher les données
    renderCurrentPage();
  }

  function sortMembres() {
    filteredMembres.sort((a, b) => {
      let fieldA, fieldB;
      
      // Déterminer les champs à comparer selon currentSortField
      switch (currentSortField) {
        case 'numero':
          fieldA = a.numero_compte || '';
          fieldB = b.numero_compte || '';
          break;
        case 'date':
          fieldA = new Date(a.date_adhesion || 0);
          fieldB = new Date(b.date_adhesion || 0);
          break;
        case 'nom':
          fieldA = a.nom_complet || '';
          fieldB = b.nom_complet || '';
          break;
        default:
          fieldA = a[currentSortField] || '';
          fieldB = b[currentSortField] || '';
      }
      
      // Comparer selon la direction
      if (currentSortDirection === 'asc') {
        if (fieldA < fieldB) return -1;
        if (fieldA > fieldB) return 1;
        return 0;
      } else {
        if (fieldA > fieldB) return -1;
        if (fieldA < fieldB) return 1;
        return 0;
      }
    });
  }

  // Fonctions d'exportation
  function exportToExcel() {
    // Notification à l'utilisateur
    showMessage("Préparation de l'exportation Excel...");
    
    try {
      // Créer une URL de téléchargement
      const worksheet = XLSX.utils.json_to_sheet(filteredMembres);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Membres");
      
      // Générer le fichier
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Créer un Blob et lien de téléchargement
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien temporaire pour télécharger
      const a = document.createElement('a');
      a.href = url;
      a.download = `membres_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      showMessage("Exportation Excel terminée avec succès!");
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel:", error);
      showMessage("Erreur lors de l'exportation Excel. Vérifiez la console pour plus de détails.", true);
    }
  }

  function exportToPDF() {
    showMessage("Préparation de l'exportation PDF...");
    
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      // Définir les styles et le titre
      doc.setFontSize(18);
      doc.text("Liste des membres", 14, 22);
      doc.setFontSize(11);
      doc.text(`Exporté le ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Créer le tableau pour les données
      const columns = [
        {header: 'Numéro', dataKey: 'numero_compte'},
        {header: 'Nom', dataKey: 'nom_complet'},
        {header: 'Téléphone', dataKey: 'telephone'},
        {header: 'Date adhésion', dataKey: 'date_adhesion'},
        {header: 'Statut', dataKey: 'statut'}
      ];
      
      // Préparer les données pour le tableau
      const data = filteredMembres.map(membre => ({
        numero_compte: formatNumeroCompte(membre.numero_compte),
        nom_complet: membre.nom_complet || '-',
        telephone: formatTelephone(membre.telephone) || '-',
        date_adhesion: formatDate(membre.date_adhesion) || '-',
        statut: membre.statut || '-'
      }));
      
      // Dessiner le tableau
      doc.autoTable({
        startY: 40,
        head: [columns.map(col => col.header)],
        body: data.map(item => columns.map(col => item[col.dataKey])),
        theme: 'striped',
        headStyles: { fillColor: [74, 109, 167] }
      });
      
      // Sauvegarder le PDF
      doc.save(`membres_export_${new Date().toISOString().split('T')[0]}.pdf`);
      
      showMessage("Exportation PDF terminée avec succès!");
    } catch (error) {
      console.error("Erreur lors de l'exportation PDF:", error);
      showMessage("Erreur lors de l'exportation PDF. Vérifiez la console pour plus de détails.", true);
    }
  }

  // Fonction pour calculer et afficher les statistiques
  function updateStatistics() {
    // Statistiques de base
    const membresActifs = allMembres.filter(m => m.statut === 'actif').length;
    const membresInactifs = allMembres.filter(m => m.statut === 'inactif').length;
    const hommesCount = allMembres.filter(m => m.sexe === 'M').length;
    const femmesCount = allMembres.filter(m => m.sexe === 'F').length;
    
    // Mettre à jour les éléments DOM
    if (totalMembresActifs) totalMembresActifs.textContent = membresActifs;
    if (totalMembresInactifs) totalMembresInactifs.textContent = membresInactifs;
    if (ratioHommes) ratioHommes.textContent = hommesCount;
    if (ratioFemmes) ratioFemmes.textContent = femmesCount;
  }
  
  // Fonction utilitaire pour le debounce
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

  // Aperçu de la photo
  if (photoProfil) {
    photoProfil.addEventListener('change', function(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('apercu-photo');
          preview.style.backgroundImage = `url(${e.target.result})`;
          preview.innerHTML = ''; // Vider l'icône
          
          // Ajouter la classe pour indiquer qu'une photo est présente
          preview.classList.add('has-photo');
        }
        reader.readAsDataURL(file);
      }
    });
  }

  // Modification de la fonction de rendu des membres pour support de pagination
  function renderMembres(membres) {
    tableMembres.innerHTML = "";
    if (membres.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.setAttribute("colspan", "7");
      td.style.textAlign = "center";
      td.textContent = "Aucun membre enregistré.";
      tr.appendChild(td);
      tableMembres.appendChild(tr);
      return;
    }
    
    membres.forEach((membre) => {
      const tr = document.createElement("tr");
      let statusClass = membre.statut === 'actif' ? 'statut-actif' : 'statut-inactif';
      
      // Créer les cellules de façon sécurisée
      const tdNumero = document.createElement("td");
      tdNumero.textContent = formatNumeroCompte(membre.numero_compte) || '-';
      tr.appendChild(tdNumero);
      
      const tdDate = document.createElement("td");
      tdDate.textContent = formatDate(membre.date_adhesion) || '-';
      tr.appendChild(tdDate);
      
      const tdNom = document.createElement("td");
      tdNom.textContent = membre.nom_complet || '-';
      tr.appendChild(tdNom);
      
      const tdTel = document.createElement("td");
      tdTel.textContent = formatTelephone(membre.telephone) || '-';
      tr.appendChild(tdTel);
      
      const tdEmail = document.createElement("td");
      tdEmail.textContent = membre.email || '-';
      tr.appendChild(tdEmail);
      
      const tdAdresse = document.createElement("td");
      tdAdresse.textContent = membre.adresse || '-';
      tr.appendChild(tdAdresse);
      
      // Créer la cellule des actions
      const tdActions = document.createElement("td");
      tdActions.setAttribute("data-label", "Actions");
      
      // Bouton modifier
      const btnModifier = document.createElement("button");
      btnModifier.className = "btn-action btn-modifier";
      btnModifier.setAttribute("data-id", membre.numero_compte);
      btnModifier.setAttribute("title", "Modifier ce membre");
      const iconModifier = document.createElement("i");
      iconModifier.className = "fa-solid fa-pencil";
      btnModifier.appendChild(iconModifier);
      tdActions.appendChild(btnModifier);
      
      // Bouton supprimer
      const btnSupprimer = document.createElement("button");
      btnSupprimer.className = "btn-action btn-supprimer";
      btnSupprimer.setAttribute("data-id", membre.numero_compte);
      btnSupprimer.setAttribute("title", "Supprimer ce membre");
      const iconSupprimer = document.createElement("i");
      iconSupprimer.className = "fa-solid fa-trash";
      btnSupprimer.appendChild(iconSupprimer);
      tdActions.appendChild(btnSupprimer);
      
      // Bouton détails
      const btnDetails = document.createElement("button");
      btnDetails.className = "btn-action btn-details";
      btnDetails.setAttribute("data-id", membre.numero_compte);
      btnDetails.setAttribute("title", "Voir les détails");
      const iconDetails = document.createElement("i");
      iconDetails.className = "fa-solid fa-eye";
      btnDetails.appendChild(iconDetails);
      tdActions.appendChild(btnDetails);
      
      tr.appendChild(tdActions);
      tableMembres.appendChild(tr);
    });

    // Ajout des écouteurs pour les boutons d'action
    document.querySelectorAll('.btn-action.btn-modifier').forEach(button => {
      button.addEventListener('click', function() {
        const membreId = this.getAttribute('data-id');
        // Trouver le membre directement dans allMembres pour éviter un appel API
        const membre = allMembres.find(m => m.numero_compte === membreId);
          if (membre) {
            modeEdition(membre);
          } else {
            showMessage(`Membre avec l'ID ${membreId} non trouvé.`, true);
          }
      });
    });
    
    document.querySelectorAll('.btn-action.btn-supprimer').forEach(button => {
      button.addEventListener('click', function() {
        const membreId = this.getAttribute('data-id');
        if (confirm(`Voulez-vous vraiment supprimer le membre N°${membreId} ?`)) {
          api.delete(membreId).then(() => {
            showMessage("Membre supprimé avec succès.");
            handleLoadMembres();
          }).catch(error => {
            showMessage(error.message, true);
          });
        }
      });
    });

    // Ajout des écouteurs pour les boutons de détails
    document.querySelectorAll('.btn-action.btn-details').forEach(button => {
      button.addEventListener('click', function() {
        const membreId = this.getAttribute('data-id');
        // Trouver le membre directement dans allMembres pour éviter un appel API
        const membre = allMembres.find(m => m.numero_compte === membreId);
          if (membre) {
            afficherDetailsMembre(membre);
          } else {
            showMessage(`Membre avec l'ID ${membreId} non trouvé.`, true);
          }
        });
      });
  }

  // Modification de la fonction de chargement des membres
  async function handleLoadMembres() {
    try {
      // Afficher un indicateur de chargement
      if (tableMembres) {
        tableMembres.innerHTML = "<tr><td colspan='7' style='text-align:center;'>Chargement des données...</td></tr>";
      }
      
      // Charger tous les membres
      const membres = await api.get();
      console.log("Membres chargés:", membres.length);
      
      // Stocker tous les membres
      allMembres = membres;
      filteredMembres = [...membres];
      totalItems = membres.length;
      
      // Réinitialiser la pagination
      currentPage = 1;
      
      // Mettre à jour les statistiques
      updateStatistics();
      
      // Afficher la première page
      renderCurrentPage();
    } catch (error) {
      showMessage(error.message, true);
      if (tableMembres) {
        tableMembres.innerHTML = "<tr><td colspan='7' style='text-align:center;color:red;'>Erreur lors du chargement des données</td></tr>";
      }
    }
  }

  // Modification de la recherche pour utiliser les données locales
  function handleSearch() {
    const searchInput = document.getElementById('recherche-membre');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce((e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      
      if (!searchTerm) {
        // Réinitialiser à tous les membres
        filteredMembres = [...allMembres];
      } else {
        // Filtrer localement
        filteredMembres = allMembres.filter(membre => {
          return (
            (membre.nom_complet && membre.nom_complet.toLowerCase().includes(searchTerm)) ||
            (membre.numero_compte && membre.numero_compte.includes(searchTerm)) ||
            (membre.telephone && membre.telephone.includes(searchTerm))
          );
        });
      }
      
      // Réinitialiser la pagination et afficher
      currentPage = 1;
      renderCurrentPage();
    }, 300));
  }

  // --- Gestionnaires d'événements ---

  // Fonction pour charger le prochain numéro de compte
  async function chargerProchainNumeroCompte() {
    try {
      if (numeroCompte) {
        // En mode ajout uniquement (pas en mode édition)
        if (!hiddenId.value) {
          const prochainNumero = await api.getNextNumeroCompte();
          numeroCompte.value = prochainNumero;
          numeroCompte.classList.add('compte-preview');
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement du prochain numéro de compte:", error);
    }
  }

  function modeAjout() {
    form.reset();
    hiddenId.value = '';
    formTitle.textContent = 'Ajouter un nouveau membre';
    btnSubmit.textContent = 'Ajouter le membre';
    btnSubmitIcon.className = 'fa-solid fa-user-plus';
    const apercuPhoto = document.getElementById('apercu-photo');
    apercuPhoto.style.backgroundImage = '';
    apercuPhoto.innerHTML = '<i class="fa-solid fa-user"></i>';
    apercuPhoto.classList.remove('has-photo');
    
    // Réinitialiser intl-tel-input
    if (iti) {
      iti.setCountry('cd');
    }

    // Charger le prochain numéro de compte
    chargerProchainNumeroCompte();
  }

  function modeEdition(membre) {
    form.reset();
    hiddenId.value = membre.numero_compte;
    
    // Debug
    console.log("Mode édition avec les données:", membre);
    
    // Remplir tous les champs du formulaire avec les données du membre
    numeroCompte.value = membre.numero_compte ? formatNumeroCompte(membre.numero_compte) : '';
    numeroCompte.classList.remove('compte-preview');
    
    nomComplet.value = membre.nom_complet || '';
    
    // Gérer le téléphone avec intl-tel-input
    if (telephone && iti) {
      if (membre.telephone) {
        // Si le numéro commence par +, utiliser tel qu'il est
        if (membre.telephone.startsWith('+')) {
          iti.setNumber(membre.telephone);
        } else {
          // Sinon, ajouter le préfixe +243
          iti.setNumber('+243' + membre.telephone.replace(/^0+/, ''));
        }
      } else {
        iti.setCountry('cd');
      }
    } else {
      if (telephone) telephone.value = membre.telephone || '';
    }
    
    dateAdhesion.value = membre.date_adhesion ? new Date(membre.date_adhesion).toISOString().split('T')[0] : '';
    typeCompte.value = membre.type_compte || '';
    statut.value = membre.statut || 'actif';
    
    // Nouveaux champs
    if (dateNaissance) {
      dateNaissance.value = membre.date_naissance ? new Date(membre.date_naissance).toISOString().split('T')[0] : '';
    }
    if (sexeM && sexeF) {
      sexeM.checked = membre.sexe === 'M';
      sexeF.checked = membre.sexe === 'F';
    }
    if (email) email.value = membre.email || '';
    if (idNationale) idNationale.value = membre.id_nationale || '';
    if (adresse) adresse.value = membre.adresse || '';
    
    // Si photo existe
    const apercuPhoto = document.getElementById('apercu-photo');
    if (membre.photo) {
      apercuPhoto.style.backgroundImage = `url(${membre.photo})`;
      apercuPhoto.innerHTML = '';
      apercuPhoto.classList.add('has-photo');
    } else {
      apercuPhoto.innerHTML = '<i class="fa-solid fa-user"></i>';
      apercuPhoto.style.backgroundImage = '';
      apercuPhoto.classList.remove('has-photo');
    }
    
    formTitle.textContent = `Modifier le membre : ${membre.nom_complet}`;
    btnSubmit.textContent = 'Enregistrer les modifications';
    btnSubmitIcon.className = 'fa-solid fa-save';
    window.scrollTo(0, 0);
  }

  async function handleAddMembre(e) {
    e.preventDefault();
    
    // Vérification améliorée des champs obligatoires
    if (!nomComplet.value || !telephone.value || !dateAdhesion.value || !typeCompte.value) {
      showMessage("Veuillez remplir tous les champs obligatoires", true);
      return;
    }
    
    // Validation du nom (lettres, espaces, tirets uniquement)
    const regexNom = /^[A-Za-zÀ-ÿ\s\-']+$/;
    if (!regexNom.test(nomComplet.value)) {
      showMessage("Le nom ne doit contenir que des lettres, espaces et tirets", true);
      return;
    }
    
    // Validation du téléphone
    const phoneNumber = iti ? iti.getNumber() : telephone.value;
    if (!iti.isValidNumber()) {
      showMessage("Numéro de téléphone invalide. Veuillez entrer un numéro au format international.", true);
      return;
    }
    
    // Validation de la date d'adhésion
    const dateAdhesionObj = new Date(dateAdhesion.value);
    const today = new Date();
    if (dateAdhesionObj > today) {
      showMessage("La date d'adhésion ne peut pas être dans le futur.", true);
      return;
    }
    
    // Validation de la date de naissance si fournie
    if (dateNaissance && dateNaissance.value) {
      const dateNaissanceObj = new Date(dateNaissance.value);
      if (dateNaissanceObj > today) {
        showMessage("La date de naissance ne peut pas être dans le futur.", true);
        return;
      }
    }
    
    // Validation de l'email si fourni
    if (email && email.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.value)) {
        showMessage("Format d'adresse e-mail invalide.", true);
        return;
      }
    }
    
    // Collecter tous les champs du formulaire
    const formData = {
      nom_complet: nomComplet.value,
      telephone: phoneNumber,
      date_adhesion: dateAdhesion.value,
      type_compte: typeCompte.value,
      statut: statut.value,
      date_naissance: dateNaissance ? dateNaissance.value : null,
      sexe: sexeM && sexeM.checked ? 'M' : (sexeF && sexeF.checked ? 'F' : null),
      email: email ? email.value : null,
      id_nationale: idNationale ? idNationale.value : null,
      adresse: adresse ? adresse.value : null
    };

    // Debug
    console.log("Données du formulaire:", formData);

    const isEditing = hiddenId.value !== '';
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;

    try {
      // Gestion de la photo - encodage en Base64 pour stockage dans Excel
      if (photoProfil && photoProfil.files.length > 0) {
        const file = photoProfil.files[0];
        
        // Vérifier la taille du fichier (max 5MB pour être cohérent avec le serveur)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          showMessage("L'image est trop grande. Veuillez choisir une image de moins de 5MB.", true);
          submitBtn.disabled = false;
          return;
        }
        
        // Lire l'image en Base64
        const reader = new FileReader();
        reader.onload = async function(e) {
          try {
            // Récupérer l'image en Base64 et l'ajouter aux données du formulaire
            formData.photo = e.target.result;
            
            // Envoyer les données avec la photo
            await processFormSubmission(formData, isEditing);
          } catch (error) {
            showMessage(error.message, true);
            submitBtn.disabled = false;
          }
        };
        reader.onerror = function() {
          showMessage("Erreur lors de la lecture de l'image", true);
          submitBtn.disabled = false;
        };
        reader.readAsDataURL(file);
      } else {
        // Pas de photo sélectionnée, continuer normalement
        await processFormSubmission(formData, isEditing);
      }
    } catch (error) {
      showMessage(error.message, true);
      submitBtn.disabled = false;
    }
  }
  
  // Fonction pour traiter la soumission du formulaire
  async function processFormSubmission(formData, isEditing) {
    const submitBtn = document.getElementById('btn-submit');
    
    try {
      if (isEditing) {
        // Mettre à jour un membre existant
        await api.put(hiddenId.value.replace(/-/g, ''), formData);
        showMessage(`Membre ${formData.nom_complet} mis à jour avec succès !`);
      } else {
        // Ajouter un nouveau membre
        const response = await api.post(formData);
        showMessage(`Membre ${formData.nom_complet} ajouté avec succès !`);
      }
      
      form.reset();
      modeAjout();
      handleLoadMembres();
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      submitBtn.disabled = false;
    }
  }

  // Fonction pour afficher les détails d'un membre dans la modale
  function afficherDetailsMembre(membre) {
    if (!membre) return;
    
    // Sécuriser l'affichage des détails en utilisant textContent
    document.getElementById('detail-numero').textContent = formatNumeroCompte(membre.numero_compte) || 'Non spécifié';
    document.getElementById('detail-nom').textContent = membre.nom_complet || 'Non spécifié';
    document.getElementById('detail-date-adhesion').textContent = formatDate(membre.date_adhesion) || 'Non spécifié';
    document.getElementById('detail-telephone').textContent = formatTelephone(membre.telephone) || 'Non spécifié';
    document.getElementById('detail-email').textContent = membre.email || 'Non spécifié';
    document.getElementById('detail-adresse').textContent = membre.adresse || 'Non spécifié';
    document.getElementById('detail-id-nationale').textContent = membre.id_nationale || 'Non spécifié';
    document.getElementById('detail-date-naissance').textContent = formatDate(membre.date_naissance) || 'Non spécifié';
    
    // Création sécurisée pour le sexe
    const sexeText = membre.sexe === 'M' ? 'Masculin' : (membre.sexe === 'F' ? 'Féminin' : 'Non spécifié');
    document.getElementById('detail-sexe').textContent = sexeText;
    
    document.getElementById('detail-type-compte').textContent = membre.type_compte || 'Non spécifié';
    document.getElementById('detail-statut').textContent = membre.statut || 'Non spécifié';
    
    // Afficher la photo de façon sécurisée
    const photoElem = document.getElementById('detail-photo');
    if (membre.photo && membre.photo.trim() !== '') {
      // Vérifier que la photo est un base64 valide
      if (membre.photo.startsWith('data:image/')) {
      photoElem.src = membre.photo;
      photoElem.style.display = 'block';
      } else {
        photoElem.src = 'placeholder.jpg';
        photoElem.style.display = 'block';
      }
    } else if (document.getElementById('apercu-photo').style.backgroundImage) {
      // Récupérer l'image depuis l'aperçu de façon sécurisée
      const bgImage = document.getElementById('apercu-photo').style.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const extractedUrl = bgImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
        // Vérifier que l'URL est valide (data URL ou chemin relatif)
        if (extractedUrl.startsWith('data:image/') || extractedUrl.startsWith('/')) {
          photoElem.src = extractedUrl;
        photoElem.style.display = 'block';
      } else {
          photoElem.src = 'placeholder.jpg';
        photoElem.style.display = 'block';
      }
    } else {
        photoElem.src = 'placeholder.jpg';
        photoElem.style.display = 'block';
      }
    } else {
      photoElem.src = 'placeholder.jpg';
      photoElem.style.display = 'block';
    }
    
    // Afficher la modale
    const modal = document.getElementById('membre-details-modal');
    modal.style.display = 'block';
  }

  // Fermer la modale quand on clique sur le X
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
      closeModalBtn.addEventListener('click', function() {
          document.getElementById('membre-details-modal').style.display = 'none';
      });
  }
  
  // Fermer la modale en cliquant à l'extérieur
  window.addEventListener('click', function(event) {
      const modal = document.getElementById('membre-details-modal');
      if (event.target === modal) {
          modal.style.display = 'none';
      }
  });

  // --- Initialisation ---
  console.log("Initialisation de la gestion des membres avec fonctionnalités avancées");

  if (form) {
    form.addEventListener("submit", handleAddMembre);
  } else {
    console.error("Formulaire non trouvé");
  }
  
  if (tableMembres) {
    // Les écouteurs sont maintenant directement attachés aux boutons
    // dans la fonction renderMembres
  } else {
    console.error("Tableau des membres non trouvé");
  }
  
  const btnCancel = document.getElementById('btn-cancel');
  if (btnCancel) {
    btnCancel.addEventListener('click', modeAjout);
  }
  
  // Initialisation des fonctionnalités avancées
  setupNewFeatures();
  
  // Charger le prochain numéro de compte lors de l'initialisation
  chargerProchainNumeroCompte();
  
  // Initialisation de la recherche et chargement des membres
  handleSearch();
  handleLoadMembres();
});
