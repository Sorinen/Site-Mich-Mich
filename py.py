from flask import Flask, request, render_template, redirect, url_for, flash, session, jsonify, send_file
from flask_mail import Mail, Message
import os
from datetime import datetime, timedelta
import json
from functools import wraps
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from werkzeug.utils import secure_filename

app = Flask(__name__)

app.secret_key = os.environ.get("SECRET_KEY", "dev_key_change_in_production")

# Configuration Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)

# Configuration upload d'images
UPLOAD_FOLDER = 'static/images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Créer le dossier d'upload s'il n'existe pas
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

mail = Mail(app)

STRIPE_PUBLIC_KEY = os.environ.get('STRIPE_PUBLIC_KEY', '')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '')

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

VILLES_RETRAIT = [
    "Saint-André",
    "Saint-Denis",
    "Saint-Pierre",
    "Le Port",
    "Saint-Paul"
]

CRENEAUX_HORAIRES = [
    "9h00 - 10h00",
    "10h00 - 11h00",
    "11h00 - 12h00",
    "14h00 - 15h00",
    "15h00 - 16h00",
    "16h00 - 17h00",
    "17h00 - 18h00"
]

COMMANDES_FILE = 'commandes.json'
PRODUITS_FILE = 'produits.json'
PROMOTIONS_FILE = 'promotions.json'
STATS_FILE = 'stats.json'

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_files():
    if not os.path.exists(COMMANDES_FILE):
        with open(COMMANDES_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f)
    
    if not os.path.exists(PRODUITS_FILE):
        produits_default = [
            {"nom": "Samoussa Poulet", "prix": 1.50, "image": "samousa.jpg"},
            {"nom": "Samoussa Fromage", "prix": 1.30, "image": "samousa.jpg"},
            {"nom": "Samoussa Végétarien", "prix": 1.40, "image": "samousa.jpg"},
            {"nom": "Samoussa Bœuf", "prix": 1.60, "image": "samousa.jpg"},
            {"nom": "Samoussa Thon", "prix": 1.50, "image": "samousa.jpg"},
            {"nom": "Menu 6 Samoussas", "prix": 8.00, "image": "samousa.jpg"},
            {"nom": "Menu 12 Samoussas", "prix": 15.00, "image": "samousa.jpg"},
            {"nom": "Menu Famille", "prix": 24.00, "image": "samousa.jpg"},
            {"nom": "Pack Dégustation", "prix": 5.50, "image": "samousa.jpg"}
        ]
        with open(PRODUITS_FILE, 'w', encoding='utf-8') as f:
            json.dump(produits_default, f, ensure_ascii=False, indent=2)
    
    if not os.path.exists(PROMOTIONS_FILE):
        with open(PROMOTIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump([], f, ensure_ascii=False, indent=2)
    
    if not os.path.exists(STATS_FILE):
        with open(STATS_FILE, 'w', encoding='utf-8') as f:
            json.dump({"visites": 0, "paniers_abandonnes": 0}, f)

init_files()

def charger_commandes():
    try:
        with open(COMMANDES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def sauvegarder_commandes(commandes):
    with open(COMMANDES_FILE, 'w', encoding='utf-8') as f:
        json.dump(commandes, f, ensure_ascii=False, indent=2)

def sauvegarder_commande(commande):
    commandes = charger_commandes()
    commandes.append(commande)
    sauvegarder_commandes(commandes)

def charger_produits():
    try:
        with open(PRODUITS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def sauvegarder_produits(produits):
    with open(PRODUITS_FILE, 'w', encoding='utf-8') as f:
        json.dump(produits, f, ensure_ascii=False, indent=2)

def charger_promotions():
    try:
        with open(PROMOTIONS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def sauvegarder_promotions(promotions):
    with open(PROMOTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(promotions, f, ensure_ascii=False, indent=2)

def charger_stats():
    try:
        with open(STATS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"visites": 0, "paniers_abandonnes": 0}

def incrementer_visite():
    stats = charger_stats()
    stats['visites'] = stats.get('visites', 0) + 1
    with open(STATS_FILE, 'w', encoding='utf-8') as f:
        json.dump(stats, f)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            flash('Veuillez vous connecter pour accéder à cette page', 'error')
            return redirect(url_for('admin_login'))
        # Renouveler la session à chaque requête
        session.modified = True
        return f(*args, **kwargs)
    return decorated_function

# Routes principales
@app.route('/')
def accueil():
    incrementer_visite()
    promotions = charger_promotions()
    return render_template('michmich.html', stripe_key=STRIPE_PUBLIC_KEY, produits=promotions)

@app.route('/menu')
def menu():
    produits = charger_produits()
    return render_template('menu.html', stripe_key=STRIPE_PUBLIC_KEY, produits=produits)

@app.route('/contact')
def contact():
    return render_template('contact.html', stripe_key=STRIPE_PUBLIC_KEY)

@app.route('/commande')
def commande():
    panier = session.get('panier', [])
    total = sum(item['prix'] * item['quantite'] for item in panier)
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
    
    panier = session['panier']
    produit_existe = False
    
    for item in panier:
        if (item['nom'] == data['nom'] and 
            item['type'] == data.get('type', 'cuit')):
            item['quantite'] += data.get('quantite', 1)
            produit_existe = True
            break
    
    if not produit_existe:
        panier.append({
            'nom': data['nom'],
            'prix': data['prix'],
            'quantite': data.get('quantite', 1),
            'type': data.get('type', 'cuit')
        })
    
    session['panier'] = panier
    session.modified = True
    
    return jsonify({
        'success': True,
        'panier': panier,
        'total': sum(item['prix'] * item['quantite'] for item in panier)
    })

@app.route('/api/panier/modifier_quantite', methods=['POST'])
def modifier_quantite():
    data = request.get_json()
    index = data.get('index')
    quantite = data.get('quantite')
    
    if 'panier' in session and 0 <= index < len(session['panier']):
        if quantite > 0:
            session['panier'][index]['quantite'] = quantite
        else:
            session['panier'].pop(index)
        session.modified = True
    
    panier = session.get('panier', [])
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

@app.route('/submit_commande', methods=['POST'])
def submit_commande():
    nom = request.form.get('nom')
    email = request.form.get('email')
    telephone = request.form.get('telephone')
    ville = request.form.get('ville')
    adresse = request.form.get('adresse', '')
    date_retrait = request.form.get('date_retrait')
    creneau = request.form.get('creneau')
    mode_paiement = request.form.get('mode_paiement')
    type_retrait = request.form.get('type_retrait', 'sur_place')
    
    panier = session.get('panier', [])
    
    if not panier:
        flash('Votre panier est vide', 'error')
        return redirect(url_for('commande'))
    
    if type_retrait == 'livraison':
        if not all([nom, email, telephone, adresse, date_retrait, creneau, mode_paiement]):
            flash('Tous les champs sont obligatoires pour une livraison', 'error')
            return redirect(url_for('commande'))
    else:
        if not all([nom, email, telephone, ville, date_retrait, creneau, mode_paiement]):
            flash('Tous les champs sont obligatoires', 'error')
            return redirect(url_for('commande'))
    
    total = sum(item['prix'] * item['quantite'] for item in panier)
    
    commande_data = {
        'id': len(charger_commandes()) + 1,
        'date_commande': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'nom': nom,
        'email': email,
        'telephone': telephone,
        'type_retrait': type_retrait,
        'ville': ville if type_retrait == 'sur_place' else None,
        'adresse': adresse if type_retrait == 'livraison' else None,
        'date_retrait': date_retrait,
        'creneau': creneau,
        'mode_paiement': mode_paiement,
        'statut_paiement': 'En attente' if mode_paiement == 'A la livraison' else 'Payé',
        'panier': panier,
        'total': total,
        'statut': 'En cours'
    }
    
    # Sauvegarder AVANT d'essayer d'envoyer les emails
    sauvegarder_commande(commande_data)
    
    # Vider le panier AVANT la confirmation
    session['panier'] = []
    session.modified = True
    
    # Envoi emails en arrière-plan (ne bloque pas)
    try:
        msg_client = Message(
            "Confirmation de commande - Chez Mich-Mich",
            sender=os.environ.get('MAIL_USERNAME'),
            recipients=[email]
        )
        
        details_panier = "\n".join([
            f"- {item['nom']} ({item['type']}) x{item['quantite']} : {item['prix'] * item['quantite']:.2f}€"
            for item in panier
        ])
        
        retrait_info = f"Adresse de livraison : {adresse}" if type_retrait == 'livraison' else f"Ville de retrait : {ville}"
        
        msg_client.body = f"""Bonjour {nom},

Votre commande a bien été enregistrée !

Détails de la commande :
{details_panier}

Total : {total:.2f}€

Informations de retrait :
- Type : {'Livraison' if type_retrait == 'livraison' else 'Sur place'}
- {retrait_info}
- Date : {date_retrait}
- Créneau : {creneau}
- Mode de paiement : {mode_paiement}

Nous vous attendons avec plaisir !

Chez Mich-Mich"""
        mail.send(msg_client)
    except Exception as e:
        print(f"Erreur envoi email (non bloquant): {e}")
    
    # Toujours afficher la confirmation
    return render_template('confirmation_commande.html', 
                        nom=nom, 
                        total=total,
                        date_retrait=date_retrait,
                        ville=ville if type_retrait == 'sur_place' else 'Livraison à domicile')

# ==================== ROUTES ADMIN ====================
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session.permanent = True
            session['admin_logged_in'] = True
            session['admin_last_activity'] = datetime.now().isoformat()
            flash('Connexion réussie !', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Identifiants incorrects', 'error')
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.clear()
    flash('Déconnexion réussie', 'success')
    return redirect(url_for('accueil'))

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    commandes = charger_commandes()
    stats = charger_stats()
    
    # Stats globales
    total_commandes = len(commandes)
    chiffre_affaire = sum(c['total'] for c in commandes)
    paniers_abandonnes = stats.get('paniers_abandonnes', 0)
    visites = stats.get('visites', 0)
    
    # Stats du mois en cours
    maintenant = datetime.now()
    mois_actuel = maintenant.strftime('%Y-%m')
    
    commandes_mois = [c for c in commandes if c['date_commande'].startswith(mois_actuel)]
    total_commandes_mois = len(commandes_mois)
    chiffre_affaire_mois = sum(c['total'] for c in commandes_mois)
    
    # Meilleures ventes
    produits_vendus = {}
    for commande in commandes:
        for item in commande['panier']:
            nom = item['nom']
            produits_vendus[nom] = produits_vendus.get(nom, 0) + item['quantite']
    
    meilleures_ventes = sorted(produits_vendus.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return render_template('admin_dashboard.html',
                         commandes=commandes,
                         total_commandes=total_commandes,
                         chiffre_affaire=chiffre_affaire,
                         total_commandes_mois=total_commandes_mois,
                         chiffre_affaire_mois=chiffre_affaire_mois,
                         mois_actuel=maintenant.strftime('%B %Y'),
                         paniers_abandonnes=paniers_abandonnes,
                         visites=visites,
                         meilleures_ventes=meilleures_ventes)

@app.route('/admin/commande/supprimer/<int:commande_id>', methods=['POST'])
@admin_required
def admin_supprimer_commande(commande_id):
    try:
        commandes = charger_commandes()
        commandes = [c for c in commandes if c['id'] != commande_id]
        sauvegarder_commandes(commandes)
        flash('Commande supprimée avec succès', 'success')
    except Exception as e:
        print(f"Erreur suppression commande: {e}")
        flash('Erreur lors de la suppression', 'error')
    
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/supprimer_commandes_terminees', methods=['POST'])
@admin_required
def admin_supprimer_commandes_terminees():
    try:
        commandes = charger_commandes()
        # Garder seulement les commandes "En cours"
        commandes_actives = [c for c in commandes if c.get('statut') == 'En cours']
        sauvegarder_commandes(commandes_actives)
        flash(f'{len(commandes) - len(commandes_actives)} commande(s) terminée(s) supprimée(s)', 'success')
    except Exception as e:
        print(f"Erreur: {e}")
        flash('Erreur lors de la suppression', 'error')
    
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/export_pdf')
@admin_required
def admin_export_pdf():
    try:
        commandes = charger_commandes()
        maintenant = datetime.now()
        mois_actuel = maintenant.strftime('%Y-%m')
        
        commandes_mois = [c for c in commandes if c['date_commande'].startswith(mois_actuel)]
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        styles = getSampleStyleSheet()
        
        # Titre
        titre = Paragraph(f"<b>Rapport des ventes - {maintenant.strftime('%B %Y')}</b>", styles['Title'])
        elements.append(titre)
        elements.append(Spacer(1, 20))
        
        # Stats
        total_mois = sum(c['total'] for c in commandes_mois)
        stats_text = f"<b>Total commandes:</b> {len(commandes_mois)}<br/><b>Chiffre d'affaires:</b> {total_mois:.2f}€"
        stats_para = Paragraph(stats_text, styles['Normal'])
        elements.append(stats_para)
        elements.append(Spacer(1, 20))
        
        # Tableau des commandes
        data = [['ID', 'Client', 'Date', 'Total']]
        for c in commandes_mois:
            data.append([
                str(c['id']),
                c['nom'][:20],
                c['date_commande'][:10],
                f"{c['total']:.2f}€"
            ])
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(table)
        
        doc.build(elements)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'ventes_{mois_actuel}.pdf',
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"Erreur export PDF: {e}")
        flash('Erreur lors de l\'export PDF', 'error')
        return redirect(url_for('admin_dashboard'))

@app.route('/admin/produits')
@admin_required
def admin_produits():
    produits = charger_produits()
    promotions = charger_promotions()
    return render_template('admin_produits.html', produits=produits, promotions=promotions)

@app.route('/admin/produit/ajouter', methods=['POST'])
@admin_required
def admin_ajouter_produit():
    try:
        nom = request.form.get('nom')
        prix = request.form.get('prix')
        
        if not nom or not prix:
            flash('Le nom et le prix sont obligatoires', 'error')
            return redirect(url_for('admin_produits'))
        
        # Gérer l'upload d'image
        image_filename = 'samousa.jpg'  # Image par défaut
        if 'image_file' in request.files:
            file = request.files['image_file']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Ajouter un timestamp pour éviter les collisions
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                image_filename = filename
        
        produits = charger_produits()
        
        nouveau_produit = {
            'nom': nom,
            'prix': float(prix),
            'image': image_filename
        }
        
        produits.append(nouveau_produit)
        sauvegarder_produits(produits)
        
        flash('Produit ajouté avec succès', 'success')
    except Exception as e:
        print(f"Erreur ajout produit: {e}")
        flash('Erreur lors de l\'ajout du produit', 'error')
    
    return redirect(url_for('admin_produits'))

@app.route('/admin/produit/modifier/<int:index>', methods=['POST'])
@admin_required
def admin_modifier_produit(index):
    try:
        nom = request.form.get('nom')
        prix = request.form.get('prix')
        image = request.form.get('image', 'samousa.jpg')
        
        produits = charger_produits()
        
        if 0 <= index < len(produits):
            produits[index]['nom'] = nom
            produits[index]['prix'] = float(prix)
            produits[index]['image'] = image
            
            sauvegarder_produits(produits)
            flash('Produit modifié avec succès', 'success')
        else:
            flash('Produit introuvable', 'error')
    except Exception as e:
        print(f"Erreur modification produit: {e}")
        flash('Erreur lors de la modification', 'error')
    
    return redirect(url_for('admin_produits'))

@app.route('/admin/produit/supprimer/<int:index>', methods=['POST'])
@admin_required
def admin_supprimer_produit(index):
    try:
        produits = charger_produits()
        
        if 0 <= index < len(produits):
            produits.pop(index)
            sauvegarder_produits(produits)
            flash('Produit supprimé avec succès', 'success')
        else:
            flash('Produit introuvable', 'error')
    except Exception as e:
        print(f"Erreur suppression produit: {e}")
        flash('Erreur lors de la suppression', 'error')
    
    return redirect(url_for('admin_produits'))

@app.route('/admin/promotion/ajouter', methods=['POST'])
@admin_required
def admin_ajouter_promotion():
    try:
        nom = request.form.get('nom')
        prix = request.form.get('prix')
        
        if not nom or not prix:
            flash('Le nom et le prix sont obligatoires', 'error')
            return redirect(url_for('admin_produits'))
        
        # Gérer l'upload d'image
        image_filename = 'samousa.jpg'  # Image par défaut
        if 'image_file' in request.files:
            file = request.files['image_file']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Ajouter un timestamp pour éviter les collisions
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                image_filename = filename
        
        promotions = charger_promotions()
        
        nouvelle_promotion = {
            'nom': nom,
            'prix': float(prix),
            'image': image_filename
        }
        
        promotions.append(nouvelle_promotion)
        sauvegarder_promotions(promotions)
        
        flash('Promotion ajoutée avec succès', 'success')
    except Exception as e:
        print(f"Erreur ajout promotion: {e}")
        flash('Erreur lors de l\'ajout de la promotion', 'error')
    
    return redirect(url_for('admin_produits'))

@app.route('/admin/promotion/supprimer/<int:index>', methods=['POST'])
@admin_required
def admin_supprimer_promotion(index):
    try:
        promotions = charger_promotions()
        
        if 0 <= index < len(promotions):
            promotions.pop(index)
            sauvegarder_promotions(promotions)
            flash('Promotion supprimée avec succès', 'success')
        else:
            flash('Promotion introuvable', 'error')
    except Exception as e:
        print(f"Erreur suppression promotion: {e}")
        flash('Erreur lors de la suppression', 'error')
    
    return redirect(url_for('admin_produits'))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, host='0.0.0.0', port=port)