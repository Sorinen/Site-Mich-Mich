#!/bin/bash

# Script de démarrage pour le site Mich-Mich

echo "🚀 Démarrage du site Mich-Mich..."

# Vérifier si le fichier .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé!"
    echo "📝 Création d'un fichier .env à partir de .env.example..."
    
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Fichier .env créé!"
        echo ""
        echo "⚠️  IMPORTANT: Éditez le fichier .env avec vos vraies valeurs:"
        echo "   - SECRET_KEY (générez une clé aléatoire)"
        echo "   - MAIL_USERNAME (votre email Gmail)"
        echo "   - MAIL_PASSWORD (mot de passe d'application Gmail)"
        echo ""
        echo "Puis relancez ce script."
        exit 1
    else
        echo "❌ .env.example non trouvé. Créez un fichier .env manuellement."
        exit 1
    fi
fi

# Vérifier si l'environnement virtuel existe
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv
    echo "✅ Environnement virtuel créé!"
fi

# Activer l'environnement virtuel
echo "🔧 Activation de l'environnement virtuel..."
source venv/bin/activate

# Installer les dépendances
echo "📥 Installation des dépendances..."
pip install -q -r requirements.txt

# Charger les variables d'environnement
echo "⚙️  Chargement des variables d'environnement..."
export $(cat .env | grep -v '^#' | xargs)

# Démarrer Flask
echo "✨ Démarrage du serveur Flask..."
echo ""
echo "📍 Le site sera accessible sur:"
echo "   http://localhost:5001"
echo "   http://127.0.0.1:5001"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

python py.py