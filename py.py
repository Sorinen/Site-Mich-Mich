from flask import Flask, request, render_template, redirect, url_for, flash
import os

app = Flask(__name__)
app.secret_key = 'votre_cle_secrete_ici'  # Changez cette clé en production

@app.route('/')
def accueil():
    return render_template('michmich.html')

@app.route('/menu')
def menu():
    return render_template('menu.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/submit', methods=['POST'])
def submit():
    prenom = request.form.get('prenom')
    email = request.form.get('mail')
    message = request.form.get('message')

    # Validation basique
    if not prenom or not email or not message:
        flash('Tous les champs sont obligatoires', 'error')
        return redirect(url_for('contact'))

    # Ici tu peux traiter les données : enregistrer dans une base de données, envoyer un email, etc.
    print(f"Prénom: {prenom}")
    print(f"Email: {email}")
    print(f"Message: {message}")

    # Redirection vers une page de confirmation
    return render_template('confirmation.html', prenom=prenom)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)