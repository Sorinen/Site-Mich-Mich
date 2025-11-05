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
    } catch (error) {
        console.error('Erreur lors du chargement du panier:', error);
    }
}

// Ajouter au panier
async function ajouterAuPanier(nom, prix, type = 'frais') {
    try {
        const response = await fetch('/api/panier/ajouter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nom: nom,
                prix: prix,
                quantite: 1,
                type: type
            })
        });
        
        const data = await response.json();
        if (data.success) {
            panier = data.panier;
            afficherPanier();
            showNotification(`${nom} (${type}) ajouté !`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        showNotification('Erreur', 'error');
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
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    }
}

// Afficher le panier (VERSION SOBRE ET COMPACTE)
// PANIER MINI RÉTRACTABLE/EXTENSIBLE
let panierOuvert = false;
function afficherPanier() {
    const panierWidget = document.getElementById('panier-widget');
    if (!panierWidget) return;

    const total = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
    const nombreArticles = panier.reduce((sum, item) => sum + item.quantite, 0);

    // Bouton toggle: ⯆ fermé, ⯅ ouvert
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
                            <span>x${item.quantite}</span>
                            <span>${(item.prix * item.quantite).toFixed(2)}€</span>
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
    // Ajout de l'événement sur le bouton toggle
    const toggleBtn = document.getElementById('panier-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panierOuvert = !panierOuvert;
            afficherPanier();
        });
    }
}

// ==================== MODAL POUR CHOIX DU TYPE ====================
function afficherModalChoix(nom, prix) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Type de samoussa</h3>
            <p><strong>${nom}</strong> - ${prix}€</p>
            <div class="modal-buttons">
                <button onclick="confirmerAjout('${nom.replace(/'/g, "\\'")}', ${prix}, 'frais')" class="btn-modal">
                    ❄️ Frais
                </button>
                <button onclick="confirmerAjout('${nom.replace(/'/g, "\\'")}', ${prix}, 'surgelé')" class="btn-modal">
                    🧊 Surgelé
                </button>
            </div>
            <button onclick="fermerModal()" class="btn-annuler">Annuler</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmerAjout(nom, prix, type) {
    ajouterAuPanier(nom, prix, type);
    fermerModal();
}

function fermerModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// ==================== CAROUSEL ====================
const carousel = document.querySelector('.carousel');
const leftArrow = document.querySelector('.carousel-arrow.left');
const rightArrow = document.querySelector('.carousel-arrow.right');

if (carousel && leftArrow && rightArrow) {
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
const addToCartButtons = document.querySelectorAll('.carte button');

addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const carte = e.target.closest('.carte');
        const nomProduit = carte.querySelector('h3').textContent;
        const prixText = carte.querySelector('span').textContent;
        const prix = parseFloat(prixText.replace('€', '').replace(',', '.').trim());
        
        afficherModalChoix(nomProduit, prix);
        
        e.target.textContent = '✓';
        setTimeout(() => {
            e.target.textContent = 'Ajouter au panier';
        }, 1000);
    });
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

// ==================== STYLES CSS DYNAMIQUES (PANIER SOBRE ET COMPACT) ====================
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
    
    .flash-message {
        padding: 12px;
        margin-bottom: 15px;
        border-radius: 8px;
        text-align: center;
        font-size: 0.95rem;
    }
    
    .flash-message.error {
        background-color: #f44336;
        color: white;
    }
    
    .flash-message.success {
        background-color: #4CAF50;
        color: white;
    }

    /* PANIER MINI - VERSION SOBRE */
    #panier-widget {
        position: fixed;
        top: 80px;
        right: 15px;
        width: 240px;
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

    .item-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #ccc;
        font-size: 0.8rem;
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

    /* Modal */
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
    }

    .modal-content {
        background: #497D74;
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        max-width: 350px;
        width: 90%;
    }

    .modal-content h3 {
        color: white;
        margin-bottom: 12px;
        font-size: 1.2rem;
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
            width: 200px;
            right: 10px;
            top: 75px;
            font-size: 0.8rem;
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

// ==================== VALIDATION FORMULAIRE ====================
const contactForm = document.querySelector('form[action*="submit"]');

if (contactForm && !contactForm.id) {
    contactForm.addEventListener('submit', (e) => {
        const prenom = document.getElementById('prenom')?.value.trim();
        const mail = document.getElementById('mail')?.value.trim();
        const message = document.getElementById('ameliorer')?.value.trim();
        
        if (prenom !== undefined && mail !== undefined && message !== undefined) {
            if (!prenom || !mail || !message) {
                e.preventDefault();
                alert('Veuillez remplir tous les champs obligatoires.');
                return false;
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(mail)) {
                e.preventDefault();
                alert('Veuillez entrer une adresse email valide.');
                return false;
            }
        }
    });
}

// ==================== INITIALISATION ====================
document.addEventListener('DOMContentLoaded', () => {
    chargerPanier();
});

console.log('✅ Script Mich-Mich chargé avec succès !');