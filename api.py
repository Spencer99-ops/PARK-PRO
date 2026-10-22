import sys
import os

# Ajouter le dossier backend au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import app

# Pour Vercel, l'application doit être exportée
application = app

if __name__ == "__main__":
    app.run()
