// ==================== BURGER MENU ====================
const burger = document.getElementById('burger');
const sidebar = document.getElementById('sidebar');

if (burger && sidebar) {
    burger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    // Fermer la sidebar en cliquant en dehors
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !burger.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Fermer la sidebar au clic sur un lien
    const sidebarLinks = sidebar.querySelectorAll('a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    });
}

// ==================== CAROUSEL ====================
const carousel = document.querySelector('.carousel');
const leftArrow = document.querySelector('.carousel-arrow.left');
const rightArrow = document.querySelector('.carousel-arrow.right');

if (carousel && leftArrow && rightArrow) {
    const scrollAmount = 270; // largeur carte + gap

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

    // Gestion des flèches au clavier
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

// ==================== PANIER (SIMULATION) ====================
const addToCartButtons = document.querySelectorAll('.carte button');

addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const carte = e.target.closest('.carte');
        const nomProduit = carte.querySelector('h3').textContent;
        const prix = carte.querySelector('span').textContent;
        
        // Animation du bouton
        e.target.textContent = '✓ Ajouté !';
        e.target.style.backgroundColor = '#28a745';
        
        // Afficher une notification
        showNotification(`${nomProduit} ajouté au panier (${prix})`);
        
        // Réinitialiser le bouton après 2 secondes
        setTimeout(() => {
            e.target.textContent = 'Ajouter au panier';
            e.target.style.backgroundColor = '';
        }, 2000);
    });
});

// Fonction pour afficher une notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #72bdb4;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Ajouter les animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .flash-message {
        padding: 15px;
        margin-bottom: 15px;
        border-radius: 5px;
        text-align: center;
    }
    
    .flash-message.error {
        background-color: #f44336;
        color: white;
    }
    
    .flash-message.success {
        background-color: #4CAF50;
        color: white;
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

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        const prenom = document.getElementById('prenom').value.trim();
        const mail = document.getElementById('mail').value.trim();
        const message = document.getElementById('ameliorer').value.trim();
        
        if (!prenom || !mail || !message) {
            e.preventDefault();
            alert('Veuillez remplir tous les champs obligatoires.');
            return false;
        }
        
        // Validation email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(mail)) {
            e.preventDefault();
            alert('Veuillez entrer une adresse email valide.');
            return false;
        }
    });
}

console.log('✅ Script Mich-Mich chargé avec succès !');