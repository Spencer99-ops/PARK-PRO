from flask import Flask, request, jsonify, Response
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta, timezone
import logging
from sqlalchemy import text, func
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/favicon.ico')
def favicon():
    return Response(status=204)

# --- CONSTANTES (Correction SonarLint S1192) ---
# Définit une constante pour éviter la duplication de la chaîne de formatage
DATE_FORMAT_SHORT = '%d/%m %H:%M'
DATE_FORMAT_FULL = '%d/%m/%Y %H:%M'

# Configuration Logging
logging.basicConfig(level=logging.INFO)

# Configuration Base de données
# Utilise DATABASE_URL si disponible (PostgreSQL en production), sinon SQLite (développement local)
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///parking.db')

# Validation et correction de l'URL de base de données
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
elif DATABASE_URL and not DATABASE_URL.startswith(('postgresql://', 'sqlite://')):
    # Si l'URL ne commence pas par le bon protocole, utiliser SQLite en fallback
    print(f"WARNING: Invalid DATABASE_URL format: {DATABASE_URL[:20]}... Using SQLite fallback")
    DATABASE_URL = 'sqlite:///parking.db'

# Changer le dialecte pour utiliser psycopg3 au lieu de psycopg2
if DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Désactiver le dossier instance pour Vercel (système de fichiers en lecture seule)
app.config['INSTANCE_PATH'] = '/tmp'
# Forcer l'utilisation de psycopg3 au lieu de psycopg2
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
}
db = SQLAlchemy(app)

# --- MODÈLES ---

class Utilisateur(db.Model):
    __tablename__ = 'utilisateurs'
    id_utilisateur = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    mot_de_passe = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'admin', 'agent', 'client'
    telephone = db.Column(db.String(20))
    plaque = db.Column(db.String(20))

class Place(db.Model):
    __tablename__ = 'places'
    id_place = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(10), nullable=False, unique=True)
    type_p = db.Column(db.String(20), default='Standard')
    etat = db.Column(db.String(20), default='libre')

class Reservation(db.Model):
    __tablename__ = 'reservations'
    id_res = db.Column(db.Integer, primary_key=True)
    id_utilisateur = db.Column(db.Integer, db.ForeignKey('utilisateurs.id_utilisateur'))
    id_place = db.Column(db.Integer, db.ForeignKey('places.id_place'))
    date_debut = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    date_fin = db.Column(db.DateTime, nullable=True)
    statut = db.Column(db.String(20), default='en_attente')

class Notification(db.Model):
    __tablename__ = 'notifications'
    id_notif = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    type_action = db.Column(db.String(50)) # 'VALIDATION_INSCRIPTION', 'ALERTE'
    id_cible = db.Column(db.Integer)        # ID de l'utilisateur ou de la réservation à modifier
    statut = db.Column(db.String(20), default='EN_ATTENTE') # 'EN_ATTENTE', 'VALIDE', 'REFUSE'
    date_notif = db.Column(db.DateTime, default=datetime.utcnow)
    lue = db.Column(db.Boolean, default=False)

class Abonnement(db.Model):
    __tablename__ = 'abonnement'
    id_abo = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), nullable=False)
    prix = db.Column(db.Float, nullable=False)
    reduction = db.Column(db.Integer, default=0)
    duree_jours = db.Column(db.Integer, default=30)
    description = db.Column(db.String(255))

class Abonne(db.Model):
    __tablename__ = 'abonne'
    id_client_abo = db.Column(db.Integer, primary_key=True)
    nom_client = db.Column(db.String(100), nullable=False)
    email_client = db.Column(db.String(100))
    id_abo = db.Column(db.Integer, db.ForeignKey('abonnement.id_abo'))
    reduction = db.Column(db.Integer, default=0)
    date_debut = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    date_fin = db.Column(db.DateTime)
    statut = db.Column(db.String(20), default='actif')

class TypeVehicule(db.Model):
    __tablename__ = 'types_vehicules'
    id_type = db.Column(db.Integer, primary_key=True)
    nom_categorie = db.Column(db.String(50), nullable=False)
    icone = db.Column(db.String(10), default='🚗')
    tarifs = db.relationship('Tarif', backref='type_vehicule', cascade="all, delete-orphan")

class Tarif(db.Model):
    __tablename__ = 'tarifs'
    id_tarif = db.Column(db.Integer, primary_key=True)
    id_type_vehicule = db.Column(db.Integer, db.ForeignKey('types_vehicules.id_type'), nullable=False)
    minute_debut = db.Column(db.Integer, nullable=False, default=0)
    minute_fin = db.Column(db.Integer, nullable=True) 
    montant = db.Column(db.Float, nullable=False)
    methode = db.Column(db.String(20), nullable=False, default='FIXE') 

class Transaction(db.Model):
    __tablename__ = 'transactions'
    id_trans = db.Column(db.Integer, primary_key=True)
    type_achat = db.Column(db.String(20)) 
    montant = db.Column(db.Float, nullable=False)
    methode_paiement = db.Column(db.String(50)) 
    reference_externe = db.Column(db.String(100)) 
    date_paiement = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    client_nom = db.Column(db.String(100))
    # Nouvelle colonne ajoutée ici :
    id_utilisateur = db.Column(db.Integer, db.ForeignKey('utilisateurs.id_utilisateur'))

    # Relation pour accéder facilement aux infos de l'utilisateur
    utilisateur = db.relationship('Utilisateur', backref='ses_transactions')

class ConfigurationPaiement(db.Model):
    __tablename__ = 'config_paiement'
    id = db.Column(db.Integer, primary_key=True)
    nom_methode = db.Column(db.String(50), unique=True) 
    est_actif = db.Column(db.Boolean, default=True)
    logo = db.Column(db.String(100)) 

class ConfigurationBanque(db.Model):
    __tablename__ = 'config_banque'  # <--- Ajoutez cette ligne cruciale
    
    id = db.Column(db.Integer, primary_key=True)
    marchand_id = db.Column(db.String(100))
    api_public_key = db.Column(db.String(255))
    api_secret_key = db.Column(db.String(255)) 
    devise = db.Column(db.String(10), default='XAF')
    mode_test = db.Column(db.Boolean, default=True)
    derniere_maj = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# --- NOUVEAUX MODÈLES POUR GESTION APPROFONDIE ---

class Vehicule(db.Model):
    __tablename__ = 'vehicules'
    id_vehicule = db.Column(db.Integer, primary_key=True)
    id_utilisateur = db.Column(db.Integer, db.ForeignKey('utilisateurs.id_utilisateur', ondelete='CASCADE'), nullable=False)
    plaque = db.Column(db.String(20), unique=True, nullable=False)
    marque = db.Column(db.String(50))
    modele = db.Column(db.String(50))
    couleur = db.Column(db.String(30))
    type_vehicule_id = db.Column(db.Integer, db.ForeignKey('types_vehicules.id_type'))
    date_enregistrement = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class HoraireTravail(db.Model):
    __tablename__ = 'horaires_travail'
    id_horaire = db.Column(db.Integer, primary_key=True)
    id_utilisateur = db.Column(db.Integer, db.ForeignKey('utilisateurs.id_utilisateur', ondelete='CASCADE'), nullable=False)
    jour_semaine = db.Column(db.Integer)  # 0=Dimanche, 1=Lundi...
    heure_debut = db.Column(db.String(10), nullable=False) # Format "HH:mm"
    heure_fin = db.Column(db.String(10), nullable=False)

class LogActivite(db.Model):
    __tablename__ = 'logs_activite'
    id_log = db.Column(db.Integer, primary_key=True)
    id_agent = db.Column(db.Integer, db.ForeignKey('utilisateurs.id_utilisateur'))
    action = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text)
    date_action = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class TicketSupport(db.Model):
    __tablename__ = 'tickets_support'
    id_ticket = db.Column(db.Integer, primary_key=True)
    id_client = db.Column(db.Integer, db.ForeignKey('utilisateurs.id_utilisateur'), nullable=False)
    sujet = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    priorite = db.Column(db.String(20), default='normale')
    statut = db.Column(db.String(20), default='ouvert') # ouvert, ferme
    date_creation = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Depense(db.Model):
    __tablename__ = 'depenses'
    id_depense = db.Column(db.Integer, primary_key=True)
    categorie = db.Column(db.String(50))
    montant = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    date_depense = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    id_admin = db.Column(db.Integer, db.ForeignKey('utilisateurs.id_utilisateur'))

class Stationnement(db.Model):
    __tablename__ = 'stationnements'
    id_stationnement = db.Column(db.Integer, primary_key=True)
    id_reservation = db.Column(db.Integer, db.ForeignKey('reservations.id_res'), nullable=False)
    id_vehicule = db.Column(db.Integer, db.ForeignKey('vehicules.id_vehicule'), nullable=False)
    heure_entree = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    heure_sortie = db.Column(db.DateTime, nullable=True)
    statut = db.Column(db.String(20), default='present') # 'present' ou 'sorti'

    # Relations pour faciliter les requêtes
    reservation = db.relationship('Reservation', backref='stationnements')
    vehicule = db.relationship('Vehicule', backref='passages')
# --- ROUTES AUTHENTIFICATION ---

@app.route('/api/connexion', methods=['POST'])
def login():
    d = request.json
    if not d or not d.get('email'):
        return jsonify({"error": "Données manquantes"}), 400
    
    u = Utilisateur.query.filter_by(email=d.get('email')).first()
    if u and u.mot_de_passe == d.get('password'):
        return jsonify({"id": u.id_utilisateur, "nom": u.nom, "role": u.role}), 200
    return jsonify({"error": "Identifiants incorrects"}), 401

# --- ROUTES CRUD UTILISATEURS ---

@app.route('/api/admin/utilisateurs', methods=['GET', 'POST'])
def gestion_tous_utilisateurs():
    if request.method == 'POST':
        data = request.json
        try:
            nouvel_u = Utilisateur(
                nom=data['nom'],
                email=data['email'],
                mot_de_passe=data.get('mot_de_passe', '123456'),
                role=data.get('role', 'client'),
                telephone=data.get('telephone'),
                plaque=data.get('plaque')
            )
            db.session.add(nouvel_u)
            db.session.commit()
            return jsonify({"msg": "Utilisateur créé"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    role = request.args.get('role')
    query = Utilisateur.query
    if role == 'client':
        query = query.filter_by(role='client')
    elif role == 'staff':
        query = query.filter(Utilisateur.role != 'client')
    
    users = query.all()
    return jsonify([{
        "id": u.id_utilisateur, "nom": u.nom, "email": u.email,
        "role": u.role, "telephone": u.telephone, "plaque": u.plaque
    } for u in users])

@app.route('/api/admin/utilisateurs/<int:id>', methods=['PUT', 'DELETE'])
def detail_utilisateur(id):
    u = Utilisateur.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(u)
        db.session.commit()
        return jsonify({"msg": "Supprimé"})
    
    data = request.json
    u.nom = data.get('nom', u.nom)
    u.email = data.get('email', u.email)
    u.telephone = data.get('telephone', u.telephone)
    u.plaque = data.get('plaque', u.plaque)
    u.role = data.get('role', u.role)
    db.session.commit()
    return jsonify({"msg": "Mis à jour"})

# --- GESTION VÉHICULES PRÉSENTS ---
@app.route('/api/admin/vehicules-presents', methods=['GET'])
def get_presents_physiques():
    try:
        # Jointure pour récupérer les infos complètes
        presents = db.session.query(
            Stationnement.id_stationnement,
            Vehicule.plaque,
            Vehicule.marque,
            Utilisateur.nom,
            Stationnement.heure_entree
        ).join(Vehicule, Stationnement.id_vehicule == Vehicule.id_vehicule)\
         .join(Utilisateur, Vehicule.id_utilisateur == Utilisateur.id_utilisateur)\
         .filter(Stationnement.statut == 'present').all()

        return jsonify([{
            "id": p.id_stationnement,
            "plaque": p.plaque,
            "vehicule": p.marque,
            "proprietaire": p.nom,
            "heure_entree": p.heure_entree.isoformat()
        } for p in presents]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# 2. Route pour enregistrer la sortie
@app.route('/api/admin/vehicules/sortie/<int:id_stat>', methods=['POST'])
def enregistrer_sortie_physique(id_stat):
    try:
        # 1. On récupère le mouvement de stationnement
        mouvement = Stationnement.query.get(id_stat)
        if not mouvement:
            return jsonify({"error": "Mouvement non trouvé"}), 404
            
        # 2. On enregistre la sortie
        mouvement.statut = 'sorti'
        mouvement.heure_sortie = datetime.now()
        
        # 3. Facultatif : On peut aussi libérer la place liée dans la table réservation
        reservation = Reservation.query.get(mouvement.id_reservation)
        if reservation:
            reservation.statut = 'terminee'
            
        db.session.commit()
        return jsonify({"message": "Véhicule sorti avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/tous-les-vehicules', methods=['GET'])
def get_tous_les_vehicules():
    try:
        # On utilise une jointure externe (outerjoin) au cas où un véhicule 
        # n'aurait pas de type ou de propriétaire valide (évite la liste vide)
        query = db.session.query(
            Vehicule, 
            Utilisateur.nom, 
            TypeVehicule.nom_categorie, 
            TypeVehicule.icone
        ).join(Utilisateur, Vehicule.id_utilisateur == Utilisateur.id_utilisateur)\
         .join(TypeVehicule, Vehicule.type_vehicule_id == TypeVehicule.id_type).all() # Vérifiez bien 'type_vehicule_id'
        
        resultat = []
        for v, nom_owner, cat, ico in query:
            resultat.append({
                "id": v.id_vehicule,
                "plaque": v.plaque,
                "marque": v.marque,
                "modele": v.modele,
                "proprietaire": nom_owner,
                "categorie": cat,
                "icone": ico,
                "date": v.date_enregistrement.strftime('%d/%m/%Y') if v.date_enregistrement else "N/A"
            })
        
        return jsonify(resultat), 200
    except Exception as e:
        print(f"Erreur SQL: {str(e)}") # Pour voir l'erreur dans la console Flask
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/vehicules-actifs', methods=['GET'])
def get_vehicules_actifs():
    query = db.session.query(Reservation, Utilisateur, Place).join(
        Utilisateur, Reservation.id_utilisateur == Utilisateur.id_utilisateur
    ).join(Place, Reservation.id_place == Place.id_place).filter(Reservation.statut == 'validee').all()
    
    return jsonify([{
        "id_res": r.Reservation.id_res,
        "proprietaire": r.Utilisateur.nom,
        "plaque": r.Utilisateur.plaque,
        "place": r.Place.numero,
        "entree": r.Reservation.date_debut.strftime(DATE_FORMAT_SHORT)
    } for r in query])

@app.route('/api/client/vehicules/ajouter', methods=['POST'])
def ajouter_vehicule():
    try:
        data = request.get_json()
        
        # 1. Validation des données
        if not data.get('plaque') or not data.get('id_utilisateur'):
            return jsonify({"error": "La plaque et l'ID utilisateur sont requis"}), 400
            
        # 2. Vérifier si la plaque existe déjà
        exist_deja = Vehicule.query.filter_by(plaque=data['plaque']).first()
        if exist_deja:
            return jsonify({"error": "Ce véhicule est déjà enregistré"}), 400

        # 3. Création de l'instance
        nouveau_v = Vehicule(
            id_utilisateur=data['id_utilisateur'],
            plaque=data['plaque'].upper(),
            marque=data.get('marque'),
            modele=data.get('modele'),
            couleur=data.get('couleur'),
            type_vehicule_id=data.get('type_vehicule_id') # Optionnel
        )
        
        db.session.add(nouveau_v)
        db.session.commit()
        
        return jsonify({"message": "Véhicule ajouté avec succès", "id": nouveau_v.id_vehicule}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Récupérer tous les véhicules d'un client spécifique
@app.route('/api/client/vehicules/<int:id_user>', methods=['GET'])
def get_mes_vehicules(id_user):
    try:
        vehicules = Vehicule.query.filter_by(id_utilisateur=id_user).all()
        liste = []
        for v in vehicules:
            liste.append({
                "id": v.id_vehicule,
                "plaque": v.plaque,
                "marque": v.marque,
                "modele": v.modele,
                "couleur": v.couleur
            })
        return jsonify(liste), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/vehicules/supprimer/<int:id_v>', methods=['DELETE'])
def supprimer_vehicule_admin(id_v):
    try:
        vehicule = Vehicule.query.get(id_v)
        if not vehicule:
            return jsonify({"error": "Véhicule introuvable"}), 404
            
        # Suppression du véhicule
        db.session.delete(vehicule)
        db.session.commit()
        
        return jsonify({"message": f"Le véhicule {vehicule.plaque} a été supprimé"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/entree-vehicule', methods=['POST'])
def valider_entree():
    data = request.json
    id_res = data.get('id_res')
    
    res = Reservation.query.get(id_res)
    if not res: return jsonify({"error": "Réservation non trouvée"}), 404

    # On crée le mouvement
    nouveau_mouvement = Stationnement(
        id_reservation=id_res,
        id_vehicule=res.vehicule_id, # Assurez-vous d'avoir ce lien
        statut='present'
    )
    
    # On met à jour la réservation pour dire qu'elle est consommée
    res.statut = 'en_cours'
    
    db.session.add(nouveau_mouvement)
    db.session.commit()
    return jsonify({"message": "Entrée enregistrée"}), 201
# --- ROUTES PLACES ---

@app.route('/api/admin/places', methods=['GET'])
def get_places():
    places = Place.query.all()
    return jsonify([{"id": p.id_place, "numero": p.numero, "type": p.type_p, "etat": p.etat} for p in places])

@app.route('/api/admin/places/ajouter', methods=['POST'])
def ajouter_place():
    data = request.json
    if not data.get('numero'):
        return jsonify({"error": "Numéro de place requis"}), 400
    if Place.query.filter_by(numero=data['numero']).first():
        return jsonify({"error": "Ce numéro de place existe déjà"}), 400
    try:
        nouvelle_place = Place(numero=data['numero'], type_p=data.get('type', 'Standard'), etat='libre')
        db.session.add(nouvelle_place)
        db.session.commit()
        return jsonify({"msg": "Place ajoutée"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/places/update/<int:id>', methods=['PUT'])
def update_place(id):
    data = request.json
    place = Place.query.get_or_404(id)
    try:
        place.numero = data.get('numero', place.numero)
        place.type_p = data.get('type', place.type_p)
        place.etat = data.get('etat', place.etat)
        db.session.commit()
        return jsonify({"msg": "Place mise à jour"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/places/supprimer/<int:id>', methods=['DELETE'])
def supprimer_place(id):
    place = Place.query.get_or_404(id)
    if place.etat == 'occupe':
        return jsonify({"error": "Impossible de supprimer une place occupée"}), 400
    try:
        db.session.delete(place)
        db.session.commit()
        return jsonify({"msg": "Place supprimée"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/stats/occupation', methods=['GET'])
def stats_occupation():
    try:
        # Compte par état (libre, occupe, maintenance)
        stats = db.session.query(Place.etat, func.count(Place.id_place)).group_by(Place.etat).all()
        
        # Transformation en dictionnaire facile à lire pour React
        resultat = {etat: count for etat, count in stats}
        
        # Ajout du total pour calculer des pourcentages côté frontend
        total = sum(resultat.values())
        resultat["total_places"] = total
        
        return jsonify(resultat), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- ROUTES RÉSERVATIONS ---

@app.route('/api/admin/reservations', methods=['GET'])
def get_reservations():
    try:
        query = db.session.query(Reservation, Utilisateur, Place).join(
            Utilisateur, Reservation.id_utilisateur == Utilisateur.id_utilisateur
        ).outerjoin(Place, Reservation.id_place == Place.id_place).all()
        results = []
        for res, user, place in query:
            results.append({
                "id_res": res.id_res,
                "client": user.nom,
                "email": user.email,
                "place": place.numero if place else "Non assignée",
                "debut": res.date_debut.strftime(DATE_FORMAT_SHORT),
                "fin": res.date_fin.strftime(DATE_FORMAT_SHORT) if res.date_fin else "En cours",
                "statut": res.statut
            })
        return jsonify(results), 200
    except Exception as e:
        logging.error(f"Erreur SQL Reservations: {e}")
        return jsonify([]), 500

@app.route('/api/admin/reservations/<int:id_res>', methods=['PUT'])
def update_res_status_improved(id_res):
    data = request.json
    nouveau_statut = data.get('statut')
    res = Reservation.query.get_or_404(id_res)
    
    # Si on annule ou termine, on libère la place
    if nouveau_statut in ['annulee', 'refusee', 'terminee']:
        place = Place.query.get(res.id_place)
        if place:
            place.etat = 'libre'
            
    res.statut = nouveau_statut
    db.session.commit()
    return jsonify({"msg": f"Réservation {nouveau_statut}"})

@app.route('/api/admin/notifications', methods=['GET'])
def get_notifications():
    # On récupère les notifications non lues ou en attente
    notifs = Notification.query.filter_by(statut='EN_ATTENTE').order_by(Notification.date_notif.desc()).all()
    
    return jsonify([{
        "id": n.id_notif,
        "message": n.message,
        "lue": n.lue,
        "statut": n.statut,
        "type_action": n.type_action,
        "id_cible": n.id_cible,
        "date": n.date_notif.strftime('%d/%m/%Y %H:%M')
    } for n in notifs])

@app.route('/api/admin/notifications/<int:id_notif>/decider', methods=['POST'])
def decider_notification(id_notif):
    data = request.json
    decision = data.get('decision') # 'VALIDE' ou 'REFUSE'
    
    # 1. Récupération de la notification
    notif = Notification.query.get_or_404(id_notif)
    
    try:
        # 2. Mise à jour de la réservation liée
        # On utilise id_cible qui contient l'ID de la réservation
        if notif.id_cible:
            # On cherche la réservation dans la table 'reservations'
            res_liee = Reservation.query.get(notif.id_cible)
            if res_liee:
                res_liee.statut = 'validee' if decision == 'VALIDE' else 'refusee'
            else:
                print(f"Attention: Réservation ID {notif.id_cible} non trouvée")

        # 3. Mise à jour de la notification
        notif.statut = decision
        notif.lue = True
        
        db.session.commit()
        return jsonify({"success": True}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"ERREUR BACKEND: {str(e)}") # Regardez votre console Flask pour voir le détail
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/reservations/<int:id_res>', methods=['PUT'])
def update_statut_reservation(id_res):
    try:
        data = request.json
        nouveau_statut = data.get('statut') # 'validee' ou 'refusee'
        
        # 1. Trouver la réservation
        res = Reservation.query.get(id_res)
        if not res:
            return jsonify({"error": "Réservation introuvable"}), 404
            
        # 2. Mettre à jour le statut
        res.statut = nouveau_statut
        
        # 3. Logique métier supplémentaire (Optionnel)
        # Si validée, on pourrait marquer la place comme 'occupée' ici
        
        db.session.commit()
        return jsonify({"message": f"Réservation {nouveau_statut}"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- ROUTES ABONNEMENTS ---

@app.route('/api/admin/abonnements', methods=['GET', 'POST'])
def gestion_offres():
    if request.method == 'POST':
        data = request.json
        try:
            nouveau = Abonnement(
                nom=data['nom'], 
                prix=float(data['prix']),
                reduction=int(data.get('reduction', 0)),
                description=data.get('description', ''),
                duree_jours=int(data.get('duree_jours', 30))
            )
            db.session.add(nouveau)
            db.session.commit()
            return jsonify({"msg": "Offre créée"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400
    
    abos = Abonnement.query.all()
    return jsonify([{
        "id_abo": a.id_abo, 
        "nom": a.nom, 
        "prix": a.prix, 
        "reduction": a.reduction, 
        "duree_jours": a.duree_jours,
        "description": a.description if a.description else ""
    } for a in abos])

@app.route('/api/admin/abonnements/update/<int:id>', methods=['PUT'])
def update_abonnement(id):
    data = request.json
    abo = Abonnement.query.get_or_404(id)
    try:
        abo.nom = data.get('nom', abo.nom)
        abo.prix = float(data.get('prix', abo.prix))
        abo.reduction = int(data.get('reduction', abo.reduction))
        abo.duree_jours = int(data.get('duree_jours', abo.duree_jours))
        abo.description = data.get('description', abo.description)
        Abonne.query.filter_by(id_abo=id).update({"reduction": abo.reduction})
        db.session.commit()
        return jsonify({"msg": "Forfait mis à jour"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/abonnements/supprimer/<int:id>', methods=['DELETE'])
def supprimer_abonnement(id):
    abo = Abonnement.query.get_or_404(id)
    nb_clients = Abonne.query.filter_by(id_abo=id).count()
    if nb_clients > 0:
        return jsonify({"error": f"Action refusée : {nb_clients} client(s) possèdent encore ce forfait."}), 400
    try:
        db.session.delete(abo)
        db.session.commit()
        return jsonify({"msg": "Forfait supprimé"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- ROUTES ABONNÉS ---

@app.route('/api/admin/abonnes', methods=['GET', 'POST'])
def gestion_abonnes():
    if request.method == 'POST':
        data = request.json
        try:
            pack = Abonnement.query.get_or_404(data['id_abo'])
            # Correction SonarLint S1481 : variable 'user' supprimée car inutilisée
            
            nouvel_abonne = Abonne(
                nom_client=data['nom'], 
                email_client=data['email'],
                id_abo=data['id_abo'], 
                reduction=pack.reduction,
                date_fin=datetime.now(timezone.utc) + timedelta(days=pack.duree_jours),
                statut='actif'
            )
            db.session.add(nouvel_abonne)
            trans = Transaction(
                client_nom=data['nom'],
                type_achat='ABONNEMENT',
                methode_paiement="Orange Money",
                montant=pack.prix * (1 - (pack.reduction / 100)),
                reference_externe=f"ABO-{datetime.now().strftime('%Y%m%d%H%M')}"
            )
            db.session.add(trans)
            db.session.commit()
            return jsonify({"msg": "Inscrit et Transaction enregistrée"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    query = db.session.query(Abonne, Abonnement).join(Abonnement, Abonne.id_abo == Abonnement.id_abo).all()
    results = []
    for a, abo in query:
        prix_net = abo.prix * (1 - (a.reduction / 100))
        results.append({
            "id": a.id_client_abo, 
            "nom": a.nom_client, 
            "nom_client": a.nom_client,
            "forfait": abo.nom,
            "prix_base": abo.prix, 
            "reduction": a.reduction, 
            "prix_net": prix_net,
            "statut": a.statut, 
            "date_fin": a.date_fin.strftime("%d/%m/%Y")
        })
    return jsonify(results)
# --- FIX : Liste des abonnés avec ID Utilisateur réel et détails du forfait ---
@app.route('/api/admin/abonnes-complet', methods=['GET'])
def get_abonnes_complet():
    try:
        # Jointure Abonne + Abonnement (Type d'offre) + Utilisateur (pour le vrai ID)
        query = db.session.query(Abonne, Abonnement, Utilisateur).join(
            Abonnement, Abonne.id_abo == Abonnement.id_abo
        ).join(
            Utilisateur, Abonne.email_client == Utilisateur.email
        ).all()
        
        return jsonify([{
            "id_utilisateur": u.id_utilisateur, # Vrai ID de la table utilisateurs
            "nom": a.nom_client,
            "email": a.email_client,
            "forfait": abo.nom,
            "reduction": a.reduction,
            "date_debut": a.date_debut.isoformat() if a.date_debut else None,
            "date_fin": a.date_fin.strftime("%d/%m/%Y") if a.date_fin else "N/A",
            "statut": a.statut
        } for a, abo, u in query]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- NOUVEAU : Action Rapide (Clic sur place) ---
@app.route('/api/agent/place-action/<int:id_place>', methods=['POST'])
def action_rapide_place(id_place):
    data = request.json
    place = Place.query.get_or_404(id_place)
    
    try:
        if place.etat == 'libre':
            # LOGIQUE ENTRÉE
            plaque = data.get('plaque', 'PASSAGE').upper()
            vehicule = Vehicule.query.filter_by(plaque=plaque).first()
            if not vehicule:
                # Création véhicule par défaut (lié à l'admin ou profil passage ID 1)
                vehicule = Vehicule(plaque=plaque, id_utilisateur=1, type_vehicule_id=1)
                db.session.add(vehicule)
                db.session.flush()

            res = Reservation(id_utilisateur=vehicule.id_utilisateur, id_place=id_place, statut='en_cours')
            db.session.add(res)
            db.session.flush()
            
            stat = Stationnement(id_reservation=res.id_res, id_vehicule=vehicule.id_vehicule, statut='present')
            place.etat = 'occupe'
            db.session.add(stat)
            msg = "Véhicule entré"
        else:
            # LOGIQUE SORTIE
            stat = db.session.query(Stationnement).join(Reservation).filter(
                Reservation.id_place == id_place, 
                Stationnement.statut == 'present'
            ).first()
            
            if stat:
                stat.statut = 'sorti'
                stat.heure_sortie = datetime.now(timezone.utc)
                res = Reservation.query.get(stat.id_reservation)
                res.statut = 'terminee'
                place.etat = 'libre'
                msg = "Sortie validée"

        db.session.commit()
        return jsonify({"success": True, "message": msg, "nouveau_statut": place.etat}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
        
@app.route('/api/types-vehicules', methods=['GET', 'POST'])
def gestion_types():
    if request.method == 'POST':
        data = request.json
        if not data or 'nom_categorie' not in data:
            return jsonify({"error": "Données manquantes"}), 400
        nouveau = TypeVehicule(nom_categorie=data['nom_categorie'], icone=data.get('icone', '🚗'))
        db.session.add(nouveau)
        db.session.commit()
        return jsonify({"msg": "Type de véhicule ajouté"}), 201
    types_raw = TypeVehicule.query.all()
    return jsonify([{
        "id_type": t.id_type, 
        "nom_categorie": t.nom_categorie, 
        "icone": t.icone
    } for t in types_raw if t])

# --- ROUTES TARIFS ---

@app.route('/api/tarifs', methods=['GET'])
def obtenir_tarifs():
    tarifs = Tarif.query.all()
    return jsonify([{
        "id_tarif": t.id_tarif, 
        "id_type_vehicule": t.id_type_vehicule, # React attend id_type_vehicule
        "minute_debut": t.minute_debut,
        "minute_fin": t.minute_fin,
        "montant": t.montant,                   # React attend montant
        "methode": t.methode
    } for t in tarifs])

@app.route('/api/tarifs/<int:id>', methods=['PUT', 'DELETE'])
def detail_tarif(id):
    tarif = Tarif.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.json
        try:
            tarif.minute_debut = int(data.get('minute_debut', tarif.minute_debut))
            tarif.minute_fin = int(data['minute_fin']) if data.get('minute_fin') else None
            tarif.montant = float(data.get('montant', tarif.montant))
            tarif.methode = data.get('methode', tarif.methode)
            db.session.commit()
            return jsonify({"msg": "Tarif mis à jour"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400
    if request.method == 'DELETE':
        db.session.delete(tarif)
        db.session.commit()
        return jsonify({"msg": "Tarif supprimé"})

# --- STATS, PAIEMENTS & SETUP ---

@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        "total_places": Place.query.count(),
        "places_libres": Place.query.filter_by(etat='libre').count(),
        "total_clients": Utilisateur.query.filter_by(role='client').count(),
        "total_reservations": Reservation.query.count(),
        "res_validees": Reservation.query.filter_by(statut='validee').count()
    })

# --- CONFIGURATION DES PASSERELLES ---
# --- SECTION : CONFIGURATION DES PAIEMENTS ---
# --- SECTION : CONFIGURATION DES PAIEMENTS ---
@app.route('/api/admin/config-paiement', methods=['GET'])
def admin_get_payment_config():
    try:
        # Note : On vérifie si la table est config_paiement (sans s) ou config_paiements
        # Si vous avez une erreur "no such table", ajustez le nom ici :
        query = text("SELECT id, nom_methode, est_actif, logo FROM config_paiement")
        configs = db.session.execute(query).fetchall()
        
        # On utilise les index [0], [1]... car ce sont des tuples SQL
        return jsonify([{
            "id": c[0],
            "nom_methode": c[1],
            "est_actif": bool(c[2]),
            "logo": c[3]
        } for c in configs]), 200
    except Exception as e:
        print(f"❌ Erreur Config: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/config-paiement/toggle/<int:id_config>', methods=['PUT'])
def admin_toggle_payment_method(id_config):
    try:
        query = text("UPDATE config_paiement SET est_actif = 1 - est_actif WHERE id = :id")
        db.session.execute(query, {'id': id_config})
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- SECTION : FLUX DES TRANSACTIONS (UNE SEULE FONCTION ICI) ---
@app.route('/api/admin/transactions', methods=['GET'])
def get_all_transactions_with_user():
    try:
        # Cette requête gère tout : nom de l'utilisateur ou nom saisi manuellement
        query = text("""
            SELECT t.id_trans, t.montant, t.date_paiement, t.methode_paiement, t.type_achat, 
                   COALESCE(u.nom, t.client_nom, 'Client de passage') as nom_client
            FROM transactions t
            LEFT JOIN utilisateurs u ON t.id_utilisateur = u.id_utilisateur
            ORDER BY t.date_paiement DESC
        """)
        results = db.session.execute(query).fetchall()
        
        return jsonify([{
            "id_trans": r[0],
            "montant": r[1],
            "date_paiement": r[2].isoformat() if hasattr(r[2], 'isoformat') else str(r[2]),
            "methode_paiement": r[3],
            "type_achat": r[4],
            "client_nom": r[5]
        } for r in results]), 200
    except Exception as e:
        print(f"❌ Erreur SQL Transactions: {e}")
        return jsonify({"error": "Erreur lors de la récupération des données"}), 500

@app.route('/api/admin/transactions/valider/<int:id_trans>', methods=['POST'])
def valider_paiement(id_trans):
    try:
        data = request.json
        methode = data.get('methode', 'Espèces')
        
        # On vérifie d'abord si cette passerelle est activée dans la config
        check_query = text("SELECT est_actif FROM config_paiement WHERE nom_methode = :m")
        config = db.session.execute(check_query, {'m': methode}).fetchone()
        
        if config and config[0] == 0:
            return jsonify({"error": f"La passerelle {methode} est actuellement désactivée"}), 400

        query = text("""
            UPDATE transactions 
            SET methode_paiement = :methode, 
                date_paiement = CURRENT_TIMESTAMP 
            WHERE id_trans = :id
        """)
        db.session.execute(query, {'methode': methode, 'id': id_trans})
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@app.route('/api/admin/config-banque', methods=['GET'])
def get_config_banque():
    config = ConfigurationBanque.query.get(1)
    if not config:
        return jsonify({"error": "Configuration introuvable"}), 404
        
    return jsonify({
        "marchand_id": config.marchand_id,
        "api_public_key": config.api_public_key,
        "api_secret_key": config.api_secret_key,
        "devise": config.devise,
        "mode_test": config.mode_test,
        "derniere_maj": config.derniere_maj.isoformat() if config.derniere_maj else None
    }), 200

@app.route('/api/admin/config-banque', methods=['POST'])
def save_config_banque():
    try:
        data = request.json
        config = ConfigurationBanque.query.get(1)
        
        if not config:
            config = ConfigurationBanque(id=1)
            db.session.add(config)

        # Mise à jour des champs
        config.marchand_id = data.get('marchand_id')
        config.api_public_key = data.get('api_public_key')
        config.api_secret_key = data.get('api_secret_key')
        config.devise = data.get('devise', 'XAF')
        config.mode_test = data.get('mode_test', True)

        db.session.commit()
        return jsonify({"success": True, "message": "Configuration mise à jour"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/clients', methods=['GET'])
def get_all_clients():
    try:
        # On ne récupère QUE les utilisateurs qui sont des clients
        clients = Utilisateur.query.filter_by(role='client').all()
        
        resultat = []
        for c in clients:
            resultat.append({
                "id": c.id_utilisateur,
                "nom": c.nom,
                "email": c.email,
                "telephone": c.telephone,
                "plaque": c.plaque
            })
        return jsonify(resultat), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- AJOUTER / ENREGISTRER UN CLIENT ---
@app.route('/api/admin/clients', methods=['POST'])
def add_client():
    try:
        data = request.json
        # On vérifie si l'email existe déjà
        if Utilisateur.query.filter_by(email=data.get('email')).first():
            return jsonify({"error": "Cet email est déjà utilisé"}), 400

        nouveau_client = Utilisateur(
            nom=data.get('nom'),
            email=data.get('email'),
            telephone=data.get('telephone'),
            plaque=data.get('plaque'),
            role='client',  # Forcé en tant que client
            mot_de_passe='parking123'  # Mot de passe par défaut à changer par l'utilisateur
        )
        db.session.add(nouveau_client)
        db.session.commit()
        return jsonify({"success": True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- MODIFIER UN CLIENT ---
@app.route('/api/admin/clients/<int:id_user>', methods=['PUT'])
def update_client(id_user):
    try:
        data = request.json
        client = Utilisateur.query.get(id_user)
        if not client:
            return jsonify({"error": "Client introuvable"}), 404

        client.nom = data.get('nom', client.nom)
        client.email = data.get('email', client.email)
        client.telephone = data.get('telephone', client.telephone)
        client.plaque = data.get('plaque', client.plaque)

        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- SUPPRIMER UN CLIENT ---
@app.route('/api/admin/clients/<int:id_user>', methods=['DELETE'])
def delete_client(id_user):
    try:
        client = Utilisateur.query.get(id_user)
        if not client:
            return jsonify({"error": "Client introuvable"}), 404

        db.session.delete(client)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/admin/personnel', methods=['GET'])
def get_personnel():
    """Récupère uniquement les utilisateurs ayant le rôle 'agent'"""
    try:
        # On filtre par role='agent' pour correspondre à vos données (IDs 4 et 5)
        agents = Utilisateur.query.filter_by(role='agent').all()
        
        return jsonify([{
            "id_utilisateur": a.id_utilisateur,
            "nom": a.nom,
            "email": a.email,
            "role": a.role,
            "mot_de_passe": a.mot_de_passe 
        } for a in agents]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/personnel', methods=['POST'])
def add_personnel():
    """Ajoute un nouveau membre avec mot de passe en clair"""
    data = request.json
    try:
        # Vérification si l'email existe déjà
        if Utilisateur.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Cet email est déjà utilisé"}), 400

        # Création du nouvel agent (mot de passe en clair)
        new_agent = Utilisateur(
            nom=data.get('nom'),
            email=data.get('email'),
            mot_de_passe=data.get('mot_de_passe'),
            role='agent' # On force le rôle agent pour cette route
        )
        
        db.session.add(new_agent)
        db.session.commit()
        return jsonify({"success": True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/personnel/<int:id_user>', methods=['DELETE'])
def delete_personnel(id_user):
    """Supprime un agent par son ID"""
    try:
        agent = Utilisateur.query.get_or_404(id_user)
        db.session.delete(agent)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/personnel/<int:id_utilisateur>', methods=['PUT'])
def modifier_personnel(id_utilisateur):
    data = request.json
    
    # 1. On récupère l'utilisateur directement via l'ORM
    # get_or_404 renvoie une erreur propre si l'ID n'existe pas
    agent = Utilisateur.query.get_or_404(id_utilisateur)

    try:
        # 2. Mise à jour des champs obligatoires ou fournis
        agent.nom = data.get('nom', agent.nom)
        agent.email = data.get('email', agent.email)
        agent.role = data.get('role', agent.role)

        # 3. Gestion intelligente du mot de passe
        nouveau_mdp = data.get('mot_de_passe')
        if nouveau_mdp and nouveau_mdp.strip() != "":
            agent.mot_de_passe = nouveau_mdp 
            # Note : Idéalement, utilisez generate_password_hash(nouveau_mdp) ici

        # 4. Validation des changements
        db.session.commit()
        
        return jsonify({
            "success": True, 
            "message": "Agent mis à jour avec succès"
        }), 200

    except Exception as e:
        # En cas d'erreur (ex: email déjà pris), on annule la transaction
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- GESTION AGENT : ENTRÉES/SORTIES ---

@app.route('/api/places', methods=['GET'])
def obtenir_places():
    places = Place.query.all()
    return jsonify([{"id_place": p.id_place, "numero": p.numero, "type_p": p.type_p, "etat": p.etat} for p in places])

@app.route('/api/vehicules', methods=['GET', 'POST'])
def gérer_vehicules():
    if request.method == 'POST':
        data = request.json
        v = Vehicule(plaque=data['plaque'], modele=data.get('modele'), id_utilisateur=data['id_utilisateur'])
        db.session.add(v)
        db.session.commit()
        return jsonify({"msg": "Véhicule ajouté"}), 201
    
    vehicules = Vehicule.query.all()
    res = []
    for v in vehicules:
        u = db.session.get(Utilisateur, v.id_utilisateur)
        res.append({
            "id_vehicule": v.id_vehicule, 
            "plaque": v.plaque, 
            "modele": v.modele, 
            "proprietaire": u.nom if u else "Inconnu", 
            "id_utilisateur": v.id_utilisateur
        })
    return jsonify(res)

@app.route('/api/vehicules/<int:id>', methods=['DELETE'])
def supprimer_vehicule(id):
    v = Vehicule.query.get_or_404(id)
    db.session.delete(v)
    db.session.commit()
    return jsonify({"msg": "Véhicule supprimé"})

@app.route('/api/vehicules/recherche/<string:plaque>', methods=['GET'])
def rechercher_vehicule(plaque):
    # On cherche le véhicule et on joint les infos du propriétaire et du type
    v = db.session.query(Vehicule, Utilisateur, TypeVehicule).join(
        Utilisateur, Vehicule.id_utilisateur == Utilisateur.id_utilisateur
    ).join(
        TypeVehicule, Vehicule.type_vehicule_id == TypeVehicule.id_type
    ).filter(Vehicule.plaque == plaque).first()
    
    if not v:
        return jsonify({"message": "Véhicule inconnu, enregistrement nécessaire"}), 404
    
    vehicule, proprio, categorie = v
    return jsonify({
        "plaque": vehicule.plaque,
        "description": f"{vehicule.marque} {vehicule.modele} ({vehicule.couleur})",
        "proprietaire": proprio.nom,
        "type": categorie.nom_categorie,
        "icone": categorie.icone
    })

@app.route('/api/clients', methods=['GET', 'POST'])
def gérer_clients():
    if request.method == 'POST':
        data = request.json
        nouveau = Utilisateur(nom=data['nom'], email=data.get('email'), telephone=data.get('telephone'), role='client')
        db.session.add(nouveau)
        db.session.commit()
        return jsonify({"msg": "Client ajouté"}), 201
    
    clients = Utilisateur.query.filter_by(role='client').all()
    return jsonify([{"id_utilisateur": c.id_utilisateur, "nom": c.nom, "telephone": c.telephone, "email": c.email} for c in clients])

@app.route('/api/clients/<int:id>', methods=['DELETE', 'PUT'])
def modifier_supprimer_client(id):
    client = Utilisateur.query.get_or_404(id)
    if request.method == 'DELETE':
        db.session.delete(client)
        db.session.commit()
        return jsonify({"msg": "Client supprimé"})
    
    if request.method == 'PUT':
        data = request.json
        client.nom = data.get('nom', client.nom)
        client.telephone = data.get('telephone', client.telephone)
        db.session.commit()
        return jsonify({"msg": "Client mis à jour"})
    return jsonify({"msg": "OK"})

@app.route('/api/paiements', methods=['GET'])
def obtenir_paiements():
    trans = Transaction.query.order_by(Transaction.date_paiement.desc()).all()
    return jsonify([{
        "id_paiement": t.id_trans, 
        "montant": t.montant, 
        "date_paiement": t.date_paiement.isoformat(), 
        "methode_paiement": t.methode_paiement, # Correction ici
        "nom_client": t.client_nom              # Correction ici
    } for t in trans])



# --- UNE SEULE FONCTION AVEC UN NOM UNIQUE ---
@app.route('/api/abonnes', methods=['GET', 'POST'], strict_slashes=False)
def gestion_abonnes_liste():  # J'ai renommé la fonction pour plus de sécurité
    if request.method == 'POST':
        data = request.json
        try:
            # Récupération du forfait pour calculs
            pack = Abonnement.query.get_or_404(data['id_abo'])
            
            nouvel_abonne = Abonne(
                nom_client=data['nom'], 
                email_client=data['email'],
                id_abo=data['id_abo'], 
                reduction=pack.reduction,
                date_fin=datetime.now(timezone.utc) + timedelta(days=pack.duree_jours),
                statut='actif'
            )
            db.session.add(nouvel_abonne)
            
            # Création de la transaction
            trans = Transaction(
                client_nom=data['nom'],
                type_achat='ABONNEMENT',
                methode_paiement="Orange Money",
                montant=pack.prix * (1 - (pack.reduction / 100)),
                reference_externe=f"ABO-{datetime.now().strftime('%Y%m%d%H%M')}"
            )
            db.session.add(trans)
            db.session.commit()
            return jsonify({"msg": "Inscription réussie et transaction enregistrée"}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 400

    # PARTIE GET
    query = db.session.query(Abonne, Abonnement).join(Abonnement).all()
    results = []
    for a, abo in query:
        results.append({
            "id": a.id_client_abo, 
            "nom": a.nom_client,      # React attend 'nom'
            "email": a.email_client,  # React attend 'email'
            "forfait": abo.nom,
            "reduction": a.reduction, # React attend 'reduction'
            "statut": a.statut, 
            "date_fin": a.date_fin.strftime("%d/%m/%Y") if a.date_fin else "N/A"
        })
    return jsonify(results)

@app.route('/api/types-vehicules', methods=['GET'])
def obtenir_types():
    types = TypeVehicule.query.all()
    return jsonify([{
        "id": t.id_type,
        "nom": t.nom_categorie,
        "icone": t.icone
    } for t in types])

@app.route('/api/abonnements', methods=['GET'])
def consulter_abonnements():
    # On récupère les enregistrements de la table 'Abonne' (les clients inscrits)
    # et on fait une jointure avec 'Abonnement' pour avoir le nom de l'offre
    query = db.session.query(Abonne, Abonnement).join(
        Abonnement, Abonne.id_abo == Abonnement.id_abo
    ).all()
    
    res = []
    for client_abo, offre in query:
        res.append({
            "id_abo": client_abo.id_client_abo,
            "client": client_abo.nom_client, # Utilise le nom stocké dans Abonne
            "email": client_abo.email_client,
            "offre": offre.nom,              # Nom du forfait (ex: "Mensuel")
            "expiration": client_abo.date_fin.strftime('%d/%m/%Y') if client_abo.date_fin else "N/A",
            "statut": client_abo.statut
        })
    return jsonify(res)
# --- GESTION AGENT : FLUX & ACTIONS ---


@app.route('/api/agent/entree-directe', methods=['POST'])
def enregistrer_entree_directe():
    data = request.json
    plaque = data.get('plaque', '').upper()
    id_place = data.get('id_place')
    
    if not plaque or not id_place:
        return jsonify({"error": "Plaque et place requises"}), 400

    try:
        vehicule = Vehicule.query.filter_by(plaque=plaque).first()
        if not vehicule:
            vehicule = Vehicule(plaque=plaque, id_utilisateur=1, marque=data.get('marque', 'Inconnue'), type_vehicule_id=1)
            db.session.add(vehicule)
            db.session.flush()

        place = Place.query.get(id_place)
        if not place or place.etat != 'libre':
            return jsonify({"error": "Place indisponible"}), 400

        nouvelle_res = Reservation(id_utilisateur=vehicule.id_utilisateur, id_place=id_place, statut='en_cours')
        db.session.add(nouvelle_res)
        db.session.flush()

        place.etat = 'occupe'
        mouvement = Stationnement(id_reservation=nouvelle_res.id_res, id_vehicule=vehicule.id_vehicule, statut='present')
        db.session.add(mouvement)
        
        db.session.add(LogActivite(action="ENTREE", details=f"Plaque: {plaque}, Place: {place.numero}"))
        db.session.commit()
        return jsonify({"msg": "Entrée enregistrée", "id_stat": mouvement.id_stationnement}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/agent/calculer-prix/<int:id_stat>', methods=['GET'])
def calculer_prix_final(id_stat):
    try:
        mouvement = Stationnement.query.get_or_404(id_stat)
        maintenant = datetime.now(timezone.utc)
        
        # Calcul de la durée
        duree = maintenant - mouvement.heure_entree.replace(tzinfo=timezone.utc)
        minutes_reelles = max(1, int(duree.total_seconds() / 60))
        
        # Récupération du véhicule pour connaître son type
        vehicule = Vehicule.query.get(mouvement.id_vehicule)
        
        # Trouver le tarif correspondant
        # On prend le tarif dont minute_debut est le plus proche (inférieur ou égal) aux minutes réelles
        tarif = Tarif.query.filter(
            Tarif.id_type_vehicule == vehicule.type_vehicule_id,
            Tarif.minute_debut <= minutes_reelles
        ).order_by(Tarif.minute_debut.desc()).first()

        # Logique de calcul selon la méthode
        montant_final = 500.0 # Prix par défaut si aucun tarif trouvé
        if tarif:
            if tarif.methode == "HEURE":
                # Exemple : 500 XAF par heure entamée
                nb_heures = (minutes_reelles // 60) + (1 if minutes_reelles % 60 > 0 else 0)
                montant_final = tarif.montant * nb_heures
            else:
                montant_final = tarif.montant

        return jsonify({
            "id_stat": id_stat,
            "duree_minutes": minutes_reelles,
            "tarif_applique": tarif.montant if tarif else 500,
            "montant_total": montant_final,
            "devise": "XAF"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/agent/valider-sortie/<int:id_stat>', methods=['POST'])
def valider_sortie_coherente(id_stat):
    data = request.json
    try:
        # 1. Trouver le mouvement de stationnement
        mouvement = Stationnement.query.get_or_404(id_stat)
        mouvement.statut = 'sorti'
        mouvement.heure_sortie = datetime.now(timezone.utc)
        
        # 2. Mettre à jour la réservation liée
        res = Reservation.query.get(mouvement.id_reservation)
        if res:
            res.statut = 'terminee'
            res.date_fin = mouvement.heure_sortie  # Remplit le \N que vous voyez
            
            # 3. Libérer la place
            place = Place.query.get(res.id_place)
            if place:
                place.etat = 'libre'
        
        # 4. Enregistrer la transaction financière
        nouvelle_trans = Transaction(
            montant=data.get('montant'),
            type_achat='PARKING',
            methode_paiement=data.get('methode', 'Espèces'),
            client_nom=data.get('client_nom', 'Client de passage'),
            date_paiement=mouvement.heure_sortie
        )
        
        db.session.add(nouvelle_trans)
        db.session.commit()
        return jsonify({"message": "Sortie validée et place libérée"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/agent/places/statut/<int:id_place>', methods=['PATCH'])
def modifier_statut_place(id_place):
    data = request.json
    place = Place.query.get_or_404(id_place)
    place.etat = data.get('etat', 'libre')
    db.session.commit()
    return jsonify({"msg": "Statut mis à jour"}), 200


@app.route('/api/agent/stationnements', methods=['GET'])
def obtenir_stationnements():
    # Cette requête récupère tout d'un coup (Stationnement + Vehicule + Place)
    resultats = db.session.query(Stationnement, Vehicule, Place)\
        .join(Vehicule, Stationnement.id_vehicule == Vehicule.id_vehicule)\
        .join(Reservation, Stationnement.id_reservation == Reservation.id_res)\
        .join(Place, Reservation.id_place == Place.id_place)\
        .filter(Stationnement.statut == 'present').all()

    flux = []
    for s, v, p in resultats:
        flux.append({
            "id_stat": s.id_stationnement,
            "plaque": v.plaque,
            "heure_entree": s.heure_entree.strftime('%H:%M'),
            "numero_place": p.numero
        })
    return jsonify(flux)

# --- ROUTES CLIENT : RÉSERVATIONS ---

@app.route('/api/client/reserver', methods=['POST'])
def client_reserver():
    data = request.json
    try:
        # Vérification des IDs reçus
        id_user = data.get('id_utilisateur')
        id_place = data.get('id_place')

        if not id_user or not id_place:
            return jsonify({"error": "Données manquantes"}), 400

        # Création de la réservation avec le statut 'en_attente' pour l'admin
        nouvelle_res = Reservation(
            id_utilisateur=int(id_user),
            id_place=int(id_place),
            statut='en_attente', # Important pour le filtre Admin
            date_debut=datetime.now(timezone.utc)
        )
        
        db.session.add(nouvelle_res)
        
        # Optionnel : Ajouter une notification système pour l'admin
        notif = Notification(
            message=f"Nouvelle demande de réservation pour la place {id_place}",
            type_action='VALIDATION_RESERVATION',
            id_cible=id_user
        )
        db.session.add(notif)
        
        db.session.commit()
        return jsonify({"message": "Demande envoyée avec succès"}), 201

    except Exception as e:
        db.session.rollback()
        print(f"ERREUR BACKEND: {str(e)}") # Vérifiez votre terminal Flask
        return jsonify({"error": "Erreur interne", "details": str(e)}), 500

@app.route('/api/client/reservations/<int:user_id>', methods=['GET'])
def get_reservations_client(user_id):
    # Jointure pour récupérer le numéro de place lisible
    reservations = db.session.query(Reservation, Place).join(
        Place, Reservation.id_place == Place.id_place
    ).filter(Reservation.id_utilisateur == user_id).all()
    
    return jsonify([{
        "id_res": r.Reservation.id_res,
        "numero_place": r.Place.numero,
        "date_demande": r.Reservation.date_debut.isoformat(),
        "statut": r.Reservation.statut
    } for r in reservations])

# --- ROUTES CLIENT : CONSULTATION ---

@app.route('/api/places/libres', methods=['GET'])
def get_places_disponibles():
    # Places avec état 'libre' ET sans réservation active en attente
    subquery = db.session.query(Reservation.id_place).filter(Reservation.statut == 'en_attente').subquery()
    places = Place.query.filter(Place.etat == 'libre').filter(~Place.id_place.in_(subquery)).all()
    
    return jsonify([{
        "id_place": p.id_place,
        "numero": p.numero,
        "type_p": p.type_p
    } for p in places])

@app.route('/api/tarifs', methods=['GET'])
def get_tous_tarifs():
    tarifs = Tarif.query.all()
    return jsonify([{
        "id_tarif": t.id_tarif,
        "id_type_vehicule": t.id_type_vehicule,
        "minute_debut": t.minute_debut,
        "minute_fin": t.minute_fin,
        "montant": t.montant,
        "methode": t.methode
    } for t in tarifs])

# --- ROUTES CLIENT : ABONNEMENTS & PAIEMENT ---

@app.route('/api/abonnements/offres', methods=['GET'])
def get_offres_abonnement():
    offres = Abonnement.query.all()
    return jsonify([{
        "id_abo": o.id_abo,
        "nom": o.nom,
        "prix": o.prix,
        "reduction": o.reduction,
        "duree": o.duree_jours,
        "description": o.description
    } for o in offres])

@app.route('/api/client/souscrire', methods=['POST'])
def souscrire_abonnement():
    data = request.json
    user = Utilisateur.query.get(data['id_utilisateur'])
    offre = Abonnement.query.get(data['id_abo'])
    
    if not user or not offre:
        return jsonify({"error": "Utilisateur ou Offre introuvable"}), 404

    try:
        # 1. Créer la transaction financière
        nouvelle_trans = Transaction(
            type_achat="ABONNEMENT",
            montant=offre.prix,
            methode_paiement=data['methode_paiement'], # 'Orange Money', 'MoMo', 'CB'
            id_utilisateur=user.id_utilisateur,
            client_nom=user.nom,
            reference_externe=data.get('reference') # Ref de la banque
        )
        db.session.add(nouvelle_trans)

        # 2. Créer l'entrée dans la table 'Abonne'
        nouvel_abonne = Abonne(
            nom_client=user.nom,
            email_client=user.email,
            id_abo=offre.id_abo,
            reduction=offre.reduction,
            date_fin=datetime.now(timezone.utc) + timedelta(days=offre.duree_jours),
            statut='actif'
        )
        db.session.add(nouvel_abonne)
        
        db.session.commit()
        return jsonify({"message": "Abonnement activé avec succès"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500        

@app.route('/api/setup')
def setup():
    try:
        db.drop_all()
        db.create_all()
        admin = Utilisateur(nom="Admin", email="admin@parking.com", mot_de_passe="admin123", role="admin")
        client1 = Utilisateur(nom="Jean Dupont", email="jean@gmail.com", mot_de_passe="client123", role="client", plaque="LT-123-AA", telephone="677001122")
        db.session.add_all([admin, client1])
        db.session.commit()
        p1 = Place(numero="A1", type_p="Standard", etat="occupe")
        db.session.add(p1)
        db.session.commit()
        res1 = Reservation(id_utilisateur=client1.id_utilisateur, id_place=p1.id_place, statut="validee")
        db.session.add(res1)
        db.session.commit()
        return "Base réinitialisée."
    except Exception as e:
        db.session.rollback()
        return f"Erreur : {str(e)}", 500

if __name__ == '__main__':
    # En production, Render définit la variable PORT
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)