@echo off
REM Script de démarrage pour Windows

echo 🚀 Démarrage du site Mich-Mich...
echo.

REM Vérifier si le fichier .env existe
if not exist .env (
    echo ⚠️  Fichier .env non trouvé!
    
    if exist .env.example (
        echo 📝 Création d'un fichier .env à partir de .env.example...
        copy .env.example .env
        echo ✅ Fichier .env créé!
        echo.
        echo ⚠️  IMPORTANT: Éditez le fichier .env avec vos vraies valeurs:
        echo    - SECRET_KEY (générez une clé aléatoire)
        echo    - MAIL_USERNAME (votre email Gmail)
        echo    - MAIL_PASSWORD (mot de passe d'application Gmail)
        echo.
        echo Puis relancez ce script.
        pause
        exit /b 1
    ) else (
        echo ❌ .env.example non trouvé. Créez un fichier .env manuellement.
        pause
        exit /b 1
    )
)

REM Vérifier si l'environnement virtuel existe
if not exist venv (
    echo 📦 Création de l'environnement virtuel...
    python -m venv venv
    echo ✅ Environnement virtuel créé!
)

REM Activer l'environnement virtuel
echo 🔧 Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

REM Installer les dépendances
echo 📥 Installation des dépendances...
pip install -q -r requirements.txt

REM Charger les variables d'environnement depuis .env
echo ⚙️  Chargement des variables d'environnement...
for /f "tokens=*" %%a in ('type .env ^| findstr /v "^#"') do set %%a

REM Démarrer Flask
echo ✨ Démarrage du serveur Flask...
echo.
echo 📍 Le site sera accessible sur:
echo    http://localhost:5001
echo    http://127.0.0.1:5001
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur
echo.

python py.py

pause