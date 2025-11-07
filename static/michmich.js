// ==================== BURGER MENU ====================
const burger = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');

if (burger && sidebar) {
    burger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !burger.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    });
}

// ==================== PANIER PERSISTANT ====================
let panier = [];

// Charger le panier depuis le serveur
async function chargerPanier() {
    try {
        const response = await fetch('/api/panier/obtenir');
        const data = await response.json();
        panier = data.panier || [];
        afficherPanier();
        // Mettre à jour les quantités affichées dans le panier de la page commande
        if (document.querySelector('.commande-container')) {
            mettreAJourPageCommande();
        }
    } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
    }
}

// Ajouter au panier
async function ajouterAuPanier(nom, prix, type = 'cuit', quantite = 1) {
    try {
        const response = await fetch('/api/panier/ajouter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nom: nom,
                prix: prix,
                quantite: quantite,
                type: type
            })
        });
        
        const data = await response.json();
        if (data.success) {
            panier = data.panier;
            afficherPanier();
            showNotification(`${quantite} x ${nom} (${type}) ajouté !`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur', 'error');
    }
}

// Modifier la quantité
async function modifierQuantite(index, quantite) {
    try {
        const response = await fetch('/api/panier/modifier_quantite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ index: index, quantite: quantite })
        });
        
        const data = await response.json();
        if (data.success) {
            panier = data.panier;
            afficherPanier();
            // Recharger la page si on est sur la page commande
            if (document.querySelector('.commande-container')) {
                location.reload();
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Retirer du panier
async function retirerDuPanier(index) {
    try {
        const response = await fetch('/api/panier/retirer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ index: index })
        });
        
        const data = await response.json();
        if (data.success) {
            panier = data.panier;
            afficherPanier();
            // Recharger la page si on est sur la page commande
            if (document.querySelector('.commande-container')) {
                location.reload();
            }
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Vider le panier
async function viderPanier() {
    if (confirm('Vider le panier ?')) {
        try {
            const response = await fetch('/api/panier/vider', {
                method: 'POST'
            });
            
            const data = await response.json();
            if (data.success) {
                panier = [];
                afficherPanier();
                // Recharger la page si on est sur la page commande
                if (document.querySelector('.commande-container')) {
                    location.reload();
                }
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}

// Afficher le panier avec boutons +/-
let panierOuvert = false;
function afficherPanier() {
    const panierWidget = document.getElementById('panier-widget');
    if (!panierWidget) return;

    const total = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    const nombreArticles = panier.reduce((sum, item) => sum + item.quantite, 0);

    let html = `
        <div class="panier-mini-header" style="cursor:pointer;">
            <span class="panier-icone">🛒 ${nombreArticles}</span>
            <span class="panier-total-mini">${total.toFixed(2)}€</span>
            <button id="panier-toggle-btn" class="panier-toggle-btn" aria-label="Ouvrir/fermer le panier" style="background:none;border:none;color:white;font-size:1.1em;cursor:pointer;margin-left:8px;">
                ${panierOuvert ? '➖' : '➕'}
            </button>
        </div>
    `;
    
    if (panierOuvert) {
        if (panier.length > 0) {
            html += '<div class="panier-mini-items">';
            panier.forEach((item, index) => {
                html += `
                    <div class="panier-mini-item">
                        <span class="item-nom">${item.nom} (${item.type[0].toUpperCase()})</span>
                        <div class="item-actions">
                            <div class="quantity-controls">
                                <button onclick="modifierQuantite(${index}, ${item.quantite - 1})" class="btn-quantity">∓</button>
                                <span class="quantity-display">${item.quantite}</span>
                                <button onclick="modifierQuantite(${index}, ${item.quantite + 1})" class="btn-quantity">+</button>
                            </div>
                            <span class="item-prix">${(item.prix * item.quantite).toFixed(2)}€</span>
                            <button onclick="retirerDuPanier(${index})" class="btn-mini-retirer">×</button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            html += `
                <div class="panier-mini-actions">
                    <a href="/commande" class="btn-mini-commander">Commander</a>
                    <button onclick="viderPanier()" class="btn-mini-vider">Vider</button>
                </div>
            `;
        } else {
            html += '<p class="panier-mini-vide">Panier vide</p>';
        }
    }
    
    panierWidget.innerHTML = html;
    
    const toggleBtn = document.getElementById('panier-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panierOuvert = !panierOuvert;
            afficherPanier();
        });
    }
}

// ==================== MODAL POUR CHOIX DU TYPE AVEC QUANTITÉ ====================
let quantiteSelectionnee = 1;
let typeSelectionne = null;

function afficherModalChoix(nom, prix) {
    // Empêcher le scroll de la page
    document.body.style.overflow = 'hidden';
    
    quantiteSelectionnee = 1;
    typeSelectionne = null;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <h3>Ajouter au panier</h3>
            <p><strong>${nom}</strong> - ${prix}€</p>
            
            <div class="modal-flex-container">
                <!-- Choix QUANTITÉ -->
                <div class="modal-section">
                    <label style="font-size: 1rem; margin-bottom: 10px; display: block; color: white;">Quantité</label>
                    <div class="quantity-controls-modal">
                        <button type="button" onclick="event.stopPropagation(); changerQuantiteModal(-1);" class="btn-quantity-modal">∓</button>
                        <span id="quantite-modal" class="quantity-display-modal">1</span>
                        <button type="button" onclick="event.stopPropagation(); changerQuantiteModal(1);" class="btn-quantity-modal">+</button>
                    </div>
                </div>
                
                <!-- Choix TYPE -->
                <div class="modal-section">
                    <label style="font-size: 1rem; margin-bottom: 10px; display: block; color: white;">Type</label>
                    <div class="type-buttons">
                        <button type="button" id="btn-cuit" onclick="event.stopPropagation(); selectionnerType('cuit');" class="btn-type">
                            🍳 Cuit
                        </button>
                        <button type="button" id="btn-surgele" onclick="event.stopPropagation(); selectionnerType('surgelé');" class="btn-type">
                            🧊 Surgelé
                        </button>
                    </div>
                </div>
            </div>
            
            <button type="button" id="btn-confirmer" onclick="event.stopPropagation(); confirmerAjoutModal('${nom.replace(/'/g, "\\'")}', ${prix});" class="btn-modal-confirmer" disabled>
                ✅ Ajouter au panier
            </button>
            <button type="button" onclick="event.stopPropagation(); fermerModal();" class="btn-annuler">Annuler</button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Fermer le modal en cliquant en dehors
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            fermerModal();
        }
    });
}

function changerQuantiteModal(delta) {
    quantiteSelectionnee = Math.max(1, quantiteSelectionnee + delta);
    const display = document.getElementById('quantite-modal');
    if (display) {
        display.textContent = quantiteSelectionnee;
    }
    verifierValidationModal();
}

function selectionnerType(type) {
    typeSelectionne = type;
    
    // Mise à jour visuelle des boutons
    const btnCuit = document.getElementById('btn-cuit');
    const btnSurgele = document.getElementById('btn-surgele');
    
    if (btnCuit && btnSurgele) {
        btnCuit.classList.remove('type-selected');
        btnSurgele.classList.remove('type-selected');
        
        if (type === 'cuit') {
            btnCuit.classList.add('type-selected');
        } else {
            btnSurgele.classList.add('type-selected');
        }
    }
    
    verifierValidationModal();
}

function verifierValidationModal() {
    const btnConfirmer = document.getElementById('btn-confirmer');
    if (btnConfirmer) {
        if (typeSelectionne !== null) {
            btnConfirmer.disabled = false;
            btnConfirmer.style.opacity = '1';
            btnConfirmer.style.cursor = 'pointer';
        } else {
            btnConfirmer.disabled = true;
            btnConfirmer.style.opacity = '0.5';
            btnConfirmer.style.cursor = 'not-allowed';
        }
    }
}

function confirmerAjoutModal(nom, prix) {
    if (typeSelectionne) {
        ajouterAuPanier(nom, prix, typeSelectionne, quantiteSelectionnee);
        fermerModal();
    }
}

function fermerModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
    quantiteSelectionnee = 1;
    typeSelectionne = null;
    // Réactiver le scroll de la page
    document.body.style.overflow = '';
}

// ==================== CAROUSEL ====================
const carousel = document.querySelector('.carousel');
const leftArrow = document.querySelector('.carousel-arrow.left');
const rightArrow = document.querySelector('.carousel-arrow.right');

if (carousel && leftArrow && rightArrow) {
    // Centrer le carousel au chargement
    setTimeout(() => {
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;
        const centerPosition = (scrollWidth - clientWidth) / 2;
        carousel.scrollLeft = centerPosition;
    }, 100);
    
    const scrollAmount = 270;

    leftArrow.addEventListener('click', () => {
        carousel.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });

    rightArrow.addEventListener('click', () => {
        carousel.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            carousel.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowRight') {
            carousel.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    });
}

// ==================== BOUTONS AJOUTER AU PANIER ====================
document.addEventListener('click', (e) => {
    // Vérifier si c'est un bouton d'ajout au panier
    const button = e.target.closest('.carte button, .btn-table');
    
    if (button && !button.classList.contains('btn-quantity') && 
        !button.classList.contains('btn-quantity-modal') &&
        !button.classList.contains('btn-mini-retirer') &&
        !button.classList.contains('btn-mini-vider') &&
        !button.classList.contains('btn-modal') &&
        !button.classList.contains('btn-annuler')) {
        
        e.preventDefault();
        e.stopPropagation();
        
        const carte = button.closest('.carte') || button.closest('tr');
        
        let nomProduit, prix;
        
        if (carte && carte.classList && carte.classList.contains('carte')) {
            // Carousel : chercher le h3 pour le nom
            const h3Element = carte.querySelector('h3');
            if (h3Element) {
                nomProduit = h3Element.textContent.trim();
            }
            
            // Carousel : chercher le span pour le prix (juste avant le <br>)
            const spanElement = carte.querySelector('span');
            if (spanElement) {
                const prixText = spanElement.textContent;
                // Extraire le nombre du texte "1.50 €" ou "1.50 €"
                prix = parseFloat(prixText.replace(/[^\d.,]/g, '').replace(',', '.'));
            }
            
            console.log('Carousel détecté:', nomProduit, prix); // Debug
        } else if (carte) {
            // Table du menu
            const cells = carte.querySelectorAll('td');
            if (cells.length >= 3) {
                nomProduit = cells[0].textContent.trim();
                const prixText = cells[2].textContent;
                prix = parseFloat(prixText.replace('€', '').replace(',', '.').trim());
            }
            
            console.log('Table menu détectée:', nomProduit, prix); // Debug
        }
        
        if (nomProduit && !isNaN(prix)) {
            afficherModalChoix(nomProduit, prix);
            
            const originalText = button.textContent;
            button.textContent = '✓';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1000);
        } else {
            console.error('Impossible de récupérer le nom ou le prix', {nomProduit, prix});
        }
    }
});

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background-color: ${type === 'error' ? '#f44336' : '#72bdb4'};
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 10000;
        font-size: 0.9rem;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// ==================== STYLES CSS DYNAMIQUES ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    
    .quantity-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255,255,255,0.1);
        border-radius: 15px;
        padding: 2px 6px;
    }
    
    .btn-quantity {
        background: #72bdb4;
        color: white;
        border: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1rem;
        line-height: 1;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    
    .btn-quantity:hover {
        background: #497D74;
    }
    
    .quantity-display {
        min-width: 20px;
        text-align: center;
        font-weight: bold;
        color: white;
        font-size: 0.85rem;
    }
    
    .item-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
    }
    
    .item-prix {
        color: #72bdb4;
        font-weight: bold;
        font-size: 0.85rem;
        min-width: 50px;
        text-align: right;
    }
    
    /* Sélecteur de quantité dans le modal */
    .quantity-selector {
        margin: 20px 0;
        text-align: center;
    }
    
    .quantity-selector label {
        display: block;
        color: white;
        margin-bottom: 10px;
        font-weight: bold;
    }
    
    .quantity-controls-modal {
        display: inline-flex;
        align-items: center;
        gap: 15px;
        background: rgba(255,255,255,0.1);
        border-radius: 25px;
        padding: 8px 20px;
    }
    
    .btn-quantity-modal {
        background: #72bdb4;
        color: white;
        border: none;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.3rem;
        line-height: 1;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }
    
    .btn-quantity-modal:hover {
        background: #27445D;
    }
    
    .quantity-display-modal {
        min-width: 40px;
        text-align: center;
        font-weight: bold;
        color: white;
        font-size: 1.5rem;
    }
    
    #panier-widget {
        position: fixed;
        top: 80px;
        right: 15px;
        width: 280px;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(15px) saturate(150%);
        border-radius: 10px;
        padding: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        z-index: 999;
        font-size: 0.85rem;
    }
    
    .panier-mini-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(114, 189, 180, 0.3);
        margin-bottom: 8px;
        gap: 8px;
    }
    
    .panier-toggle-btn {
        background: none;
        border: none;
        color: white;
        font-size: 1.1em;
        cursor: pointer;
        margin-left: 8px;
        padding: 0 2px;
        transition: color 0.2s;
    }
    
    .panier-toggle-btn:hover {
        color: #72bdb4;
    }
    
    .panier-icone {
        color: #72bdb4;
        font-weight: bold;
        font-size: 1rem;
    }
    
    .panier-total-mini {
        color: white;
        font-weight: bold;
        font-size: 1.1rem;
    }
    
    .panier-mini-vide {
        text-align: center;
        color: #999;
        padding: 15px 0;
        font-size: 0.85rem;
    }
    
    .panier-mini-items {
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: 8px;
    }
    
    .panier-mini-item {
        padding: 6px;
        margin-bottom: 5px;
        background: rgba(255,255,255,0.05);
        border-radius: 5px;
    }
    
    .item-nom {
        display: block;
        color: white;
        font-size: 0.85rem;
        margin-bottom: 4px;
    }
    
    .btn-mini-retirer {
        background: rgba(244, 67, 54, 0.7);
        color: white;
        border: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 0.9rem;
        line-height: 1;
        padding: 0;
    }
    
    .btn-mini-retirer:hover {
        background: #f44336;
    }
    
    .panier-mini-actions {
        display: flex;
        gap: 6px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(114, 189, 180, 0.3);
    }
    
    .btn-mini-commander {
        flex: 2;
        background: #72bdb4;
        color: white;
        text-align: center;
        padding: 8px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: bold;
        font-size: 0.85rem;
        transition: background 0.3s;
    }
    
    .btn-mini-commander:hover {
        background: #497D74;
    }
    
    .btn-mini-vider {
        flex: 1;
        background: rgba(244, 67, 54, 0.7);
        color: white;
        border: none;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
    }
    
    .btn-mini-vider:hover {
        background: #f44336;
    }
    
    /* Modal avec sections côte à côte */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        overflow-y: auto;
    }
    
    .modal-content {
        background: #497D74;
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        margin: auto;
        position: relative;
    }
    
    .modal-flex-container {
        display: flex;
        gap: 20px;
        justify-content: space-around;
        margin: 20px 0;
        flex-wrap: wrap;
    }
    
    .modal-section {
        flex: 1;
        min-width: 150px;
        text-align: center;
    }
    
    .type-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .btn-type {
        background: #72bdb4;
        color: white;
        border: 2px solid transparent;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: bold;
        transition: all 0.3s;
        width: 100%;
    }
    
    .btn-type:hover {
        background: #27445D;
        transform: scale(1.05);
    }
    
    .btn-type.type-selected {
        background: #27445D;
        border-color: #ffd700;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    }
    
    .btn-modal-confirmer {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 15px 30px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
        transition: all 0.3s;
        width: 100%;
        margin-bottom: 10px;
    }
    
    .btn-modal-confirmer:hover:not(:disabled) {
        background: #45a049;
    }
    
    .btn-modal-confirmer:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .modal-content h3 {
        color: white;
        margin-bottom: 12px;
        font-size: 1.3rem;
    }
    
    .modal-content p {
        color: white;
        margin-bottom: 18px;
        font-size: 1rem;
    }
    
    .modal-buttons {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
    }
    
    .btn-modal {
        flex: 1;
        background: #72bdb4;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.95rem;
        font-weight: bold;
        transition: background 0.3s;
    }
    
    .btn-modal:hover {
        background: #27445D;
    }
    
    .btn-annuler {
        background: #666;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .btn-annuler:hover {
        background: #555;
    }
    
    /* Boutons dans le tableau */
    .btn-table {
        background: #72bdb4;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 0.85rem;
        transition: background 0.3s;
    }
    
    .btn-table:hover {
        background: #497D74;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        #panier-widget {
            width: 220px;
            right: 10px;
            top: 75px;
            font-size: 0.8rem;
        }
        
        .quantity-controls {
            gap: 4px;
            padding: 2px 4px;
        }
        
        .btn-quantity {
            width: 20px;
            height: 20px;
            font-size: 0.9rem;
        }
        
        .modal-content {
            max-width: 90%;
        }
        
        .quantity-controls-modal {
            gap: 10px;
            padding: 6px 15px;
        }
        
        .btn-quantity-modal {
            width: 30px;
            height: 30px;
            font-size: 1.1rem;
        }
    }
`;
document.head.appendChild(style);

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== VALIDATION FORMULAIRE COMMANDE ====================
const commandeForm = document.getElementById('commande-form');
if (commandeForm) {
    const typeRetraitRadios = document.querySelectorAll('input[name="type_retrait"]');
    const villeGroup = document.getElementById('ville-group');
    const adresseGroup = document.getElementById('adresse-group');
    
    typeRetraitRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'livraison') {
                if (villeGroup) villeGroup.style.display = 'none';
                if (adresseGroup) adresseGroup.style.display = 'block';
            } else {
                if (villeGroup) villeGroup.style.display = 'block';
                if (adresseGroup) adresseGroup.style.display = 'none';
            }
        });
    });
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', () => {
    chargerPanier();
});

console.log('✅ Script Mich-Mich chargé avec succès !');