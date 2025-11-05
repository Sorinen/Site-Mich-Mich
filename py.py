from flask import Flask, request, render_template, redirect, url_for, flash, session, jsonify
from flask_mail import Mail, Message
import os
from datetime import datetime, timedelta

app = Flask(__name__)

# Clé secrète sécurisée via variable d'environnement
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_change_in_production")

# Configuration Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

mail = Mail(app)

# Configuration Stripe (optionnel)
STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY', '')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')

# Liste des villes de retrait
VILLES_RETRAIT = [
    "Saint-André",
    "Saint-Denis",
    "Saint-Pierre",
    "Le Port",
    "Saint-Paul"
]

# Créneaux horaires disponibles
CRENEAUX_HORAIRES = [
    "9h00 - 10h00",
    "10h00 - 11h00",
    "11h00 - 12h00",
    "14h00 - 15h00",
    "15h00 - 16h00",
    "16h00 - 17h00",
    "17h00 - 18h00"
]

# Routes principales
@app.route('/')
def accueil():
    return render_template('michmich.html', stripe_key=STRIPE_PUBLIC_KEY)

@app.route('/menu')
def menu():
    return render_template('menu.html', stripe_key=STRIPE_PUBLIC_KEY)

@app.route('/contact')
def contact():
    return render_template('contact.html', stripe_key=STRIPE_PUBLIC_KEY)

@app.route('/commande')
def commande():
    # Récupérer le panier depuis la session
    panier = session.get('panier', [])
    total = sum(item['prix'] * item['quantite'] for item in panier)
    
    # Obtenir la date de demain
    date_min = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    
    return render_template('commande.html', 
                        panier=panier, 
                        total=total,
                        villes=VILLES_RETRAIT,
                        creneaux=CRENEAUX_HORAIRES,
                        date_min=date_min,
                        stripe_key=STRIPE_PUBLIC_KEY)

# API pour gérer le panier
@app.route('/api/panier/ajouter', methods=['POST'])
def ajouter_panier():
    data = request.get_json()
    
    if 'panier' not in session:
        session['panier'] = []
    
    # Vérifier si le produit existe déjà
    panier = session['panier']
    produit_existe = False
    
    for item in panier:
        if (item['nom'] == data['nom'] and 
            item['type'] == data.get('type', 'frais')):
            item['quantite'] += data.get('quantite', 1)
            produit_existe = True
            break
    
    if not produit_existe:
        panier.append({
            'nom': data['nom'],
            'prix': data['prix'],
            'quantite': data.get('quantite', 1),
            'type': data.get('type', 'frais')
        })
    
    session['panier'] = panier
    session.modified = True
    
    return jsonify({
        'success': True,
        'panier': panier,
        'total': sum(item['prix'] * item['quantite'] for item in panier)
    })

@app.route('/api/panier/retirer', methods=['POST'])
def retirer_panier():
    data = request.get_json()
    index = data.get('index')
    
    if 'panier' in session and 0 <= index < len(session['panier']):
        session['panier'].pop(index)
        session.modified = True
    
    panier = session.get('panier', [])
    return jsonify({
        'success': True,
        'panier': panier,
        'total': sum(item['prix'] * item['quantite'] for item in panier)
    })

@app.route('/api/panier/vider', methods=['POST'])
def vider_panier():
    session['panier'] = []
    session.modified = True
    return jsonify({'success': True})

@app.route('/api/panier/obtenir', methods=['GET'])
def obtenir_panier():
    panier = session.get('panier', [])
    return jsonify({
        'panier': panier,
        'total': sum(item['prix'] * item['quantite'] for item in panier)
    })

# Formulaire de contact simple

@app.route('/submit', methods=['POST'])
def submit():
    prenom = request.form.get('prenom')
    email = request.form.get('mail')
    message = request.form.get('message')

    if not prenom or not email or not message:
        flash('Tous les champs sont obligatoires', 'error')
        return redirect(url_for('contact'))

    try:
        msg = Message(f"Message de {prenom}",
                    sender=email,
                    recipients=[os.environ.get('MAIL_USERNAME')])
        msg.body = f"Email de l'expéditeur: {email}\n\nMessage:\n{message}"
        mail.send(msg)
        flash('Votre message a été envoyé avec succès !', 'success')
    except Exception as e:
        print(e)
        flash('Erreur lors de l\'envoi du message.', 'error')

    return render_template('confirmation.html', prenom=prenom)

# Soumission de commande
@app.route('/submit_commande', methods=['POST'])
def submit_commande():
    # Récupération des données du formulaire
    nom = request.form.get('nom')
    email = request.form.get('email')
    telephone = request.form.get('telephone')
    ville = request.form.get('ville')
    date_retrait = request.form.get('date_retrait')
    creneau = request.form.get('creneau')
    mode_paiement = request.form.get('mode_paiement')
    
    panier = session.get('panier', [])
    
    if not panier:
        flash('Votre panier est vide', 'error')
        return redirect(url_for('commande'))
    
    if not all([nom, email, telephone, ville, date_retrait, creneau, mode_paiement]):
        flash('Tous les champs sont obligatoires', 'error')
        return redirect(url_for('commande'))
    
    # Calcul du total
    total = sum(item['prix'] * item['quantite'] for item in panier)
    
    # Envoi de l'email de confirmation
    try:
        # Email au client
        msg_client = Message(
            "Confirmation de commande - Chez Mich-Mich",
            sender=os.environ.get('MAIL_USERNAME'),
            recipients=[email]
        )
        
        details_panier = "\n".join([
            f"- {item['nom']} ({item['type']}) x{item['quantite']} : {item['prix'] * item['quantite']:.2f}€"
            for item in panier
        ])
        
        msg_client.body = f"""
Bonjour {nom},

Votre commande a bien été enregistrée !

Détails de la commande :
{details_panier}

Total : {total:.2f}€

Informations de retrait :
- Ville : {ville}
- Date : {date_retrait}
- Créneau : {creneau}
- Mode de paiement : {mode_paiement}

Nous vous attendons avec plaisir !

Chez Mich-Mich
"""
        mail.send(msg_client)
        
        # Email au commerçant
        msg_admin = Message(
            f"Nouvelle commande de {nom}",
            sender=os.environ.get('MAIL_USERNAME'),
            recipients=[os.environ.get('MAIL_USERNAME')]
        )
        
        msg_admin.body = f"""
Nouvelle commande reçue !

Client : {nom}
Email : {email}
Téléphone : {telephone}

Détails de la commande :
{details_panier}

Total : {total:.2f}€

Retrait :
- Ville : {ville}
- Date : {date_retrait}
- Créneau : {creneau}
- Mode de paiement : {mode_paiement}
"""
        mail.send(msg_admin)
        
        # Vider le panier
        session['panier'] = []
        session.modified = True
        
        flash('Votre commande a été enregistrée avec succès !', 'success')
        return render_template('confirmation_commande.html', 
                            nom=nom, 
                            total=total,
                            date_retrait=date_retrait,
                            ville=ville)
        
    except Exception as e:
        print(f"Erreur : {e}")
        flash('Erreur lors de l\'enregistrement de la commande.', 'error')
        return redirect(url_for('commande'))

# Gestion d'erreur 404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Lancement de l'application
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, host='0.0.0.0', port=port)