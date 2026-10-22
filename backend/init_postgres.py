from app import app, db
from app import Utilisateur, Place, Reservation, Abonnement, Abonne, Vehicule, Transaction, ConfigurationPaiement, ConfigurationBanque

def initialiser_schema_postgres():
    """Initialise le schéma de la base de données PostgreSQL sans supprimer les données"""
    with app.app_context():
        print("Création des tables PostgreSQL...")
        db.create_all()
        print("--- SUCCÈS : Le schéma PostgreSQL est créé ! ---")

if __name__ == "__main__":
    initialiser_schema_postgres()
