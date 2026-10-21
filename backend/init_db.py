from app import app, db, Utilisateur, Place

def creer_et_remplir_base():
    with app.app_context():
        print("Suppression de l'ancienne base (si elle existe)...")
        db.drop_all()
        
        print("Création des nouvelles tables...")
        db.create_all()

        # 1. Ajout des Utilisateurs (selon vos données)
        utilisateurs = [
            Utilisateur(id_utilisateur=1, nom="Administrateur Système", email="admin@parking.com", mot_de_passe="admin123", role="admin"),
            Utilisateur(id_utilisateur=2, nom="Agent de Sécurité", email="agent@parking.com", mot_de_passe="agent123", role="agent"),
            Utilisateur(id_utilisateur=3, nom="Jean Client", email="client@parking.com", mot_de_passe="client123", role="client"),
            Utilisateur(id_utilisateur=4, nom="Regonne spencer", email="spenchristophereg@gmail.com", mot_de_passe="1234", role="admin"),
            Utilisateur(id_utilisateur=5, nom="Agent 1", email="agent1@gmail.com", mot_de_passe="agent1", role="agent")
        ]

        # 2. Ajout des Places
        places = [
            Place(numero="A101", type_p="standard", etat="libre"),
            Place(numero="A102", type_p="standard", etat="libre"),
            Place(numero="P201", type_p="premium", etat="libre"),
            Place(numero="H001", type_p="handicape", etat="libre")
        ]

        try:
            db.session.add_all(utilisateurs)
            db.session.add_all(places)
            db.session.commit()
            print("--- SUCCÈS : La table parking.db est créée et peuplée ! ---")
        except Exception as e:
            db.session.rollback()
            print(f"Erreur lors du remplissage : {e}")

if __name__ == "__main__":
    creer_et_remplir_base()