from app import app, db, Utilisateur, Place

def initialiser_donnees():
    # On utilise le contexte de l'application Flask pour accéder à la DB
    with app.app_context():
        print("Nettoyage de l'ancienne base...")
        db.drop_all()  # Supprime les anciennes tables
        db.create_all() # Crée les nouvelles tables proprement
        
        print("Création des utilisateurs (Point IV.9 du cahier des charges)...")
        # 1. L'ADMINISTRATEUR
        admin = Utilisateur(
            nom="Administrateur Système", 
            email="admin@parking.com", 
            mot_de_passe="admin123", 
            role="admin"
        )
        
        # 2. LE PERSONNEL (AGENT)
        agent = Utilisateur(
            nom="Agent de Sécurité", 
            email="agent@parking.com", 
            mot_de_passe="agent123", 
            role="agent"
        )
        
        # 3. LE CLIENT
        client = Utilisateur(
            nom="Jean Client", 
            email="client@parking.com", 
            mot_de_passe="client123", 
            role="client"
        )
        
        db.session.add_all([admin, agent, client])

        print("Création des places (Point IV.3)...")
        # On crée quelques places de différents types pour les tests
        places = [
            Place(numero="A101", type_p="standard", etat="libre"),
            Place(numero="A102", type_p="standard", etat="libre"),
            Place(numero="P201", type_p="premium", etat="libre"),
            Place(numero="H001", type_p="handicape", etat="libre")
        ]
        db.session.add_all(places)
        
        # Sauvegarde définitive en base de données
        db.session.commit()
        print("--- BASE DE DONNÉES INITIALISÉE AVEC SUCCÈS ---")

if __name__ == "__main__":
    initialiser_donnees()
    # Le script s'arrête ici, il ne lance PAS de serveur.