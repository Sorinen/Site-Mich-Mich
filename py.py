from flask import Flask, request, render_template, redirect, url_for, flash
import os

app = Flask(__name__)

# Clé secrète sécurisée via variable d'environnement
app.secret_key = os.environ.get("SECRET_KEY", "dev_key")

# Routes principales
@app.route('/')
def accueil():
    return render_template('michmich.html')

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

# Formulaire de contact / commande
@app.route('/submit', methods=['POST'])
def submit():
    prenom = request.form.get('prenom')
    email = request.form.get('mail')
    message = request.form.get('message')

    # Validation simple
    if not prenom or not email or not message:
        flash('Tous les champs sont obligatoires', 'error')
        return redirect(url_for('contact'))

    # Traitement des données (pour l’instant affiché dans la console)
    print(f"Prénom: {prenom}")
    print(f"Email: {email}")
    print(f"Message: {message}")

    # Redirection vers une page de confirmation
    return render_template('confirmation.html', prenom=prenom)

# Gestion d’erreur 404
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

# Lancement de l'application
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Render fournit le port automatiquement
    app.run(debug=True, host='0.0.0.0', port=port)