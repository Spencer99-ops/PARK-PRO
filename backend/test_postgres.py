from app import app, db, Utilisateur, Place, Reservation

def test_connexion():
    with app.app_context():
        print("Test de connexion a PostgreSQL...")
        
        # Test utilisateurs
        utilisateurs = Utilisateur.query.all()
        print(f"Utilisateurs: {len(utilisateurs)}")
        for u in utilisateurs:
            print(f"  - {u.nom} ({u.email}) - {u.role}")
        
        # Test places
        places = Place.query.all()
        print(f"\nPlaces: {len(places)}")
        for p in places:
            print(f"  - {p.numero} ({p.type_p}) - {p.etat}")
        
        # Test reservations
        reservations = Reservation.query.all()
        print(f"\nReservations: {len(reservations)}")
        for r in reservations:
            print(f"  - ID {r.id_res} - Statut: {r.statut}")
        
        print("\nConnexion PostgreSQL reussie!")

if __name__ == "__main__":
    test_connexion()
