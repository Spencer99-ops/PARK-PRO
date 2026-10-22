import sys
import os

# Ajouter le dossier backend au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app

# Exporter l'application Flask pour Vercel
application = app

