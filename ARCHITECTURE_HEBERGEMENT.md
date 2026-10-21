# Architecture du projet Gestion Parking et hébergement gratuit adapté

## 1. Vue d’ensemble

Ce projet est une application de gestion de parking qui combine :

- un frontend React + Vite pour l’interface utilisateur ;
- un backend Flask + SQLAlchemy pour l’API et la logique métier ;
- une base SQLite locale pour le stockage des données au stade actuel ;
- une logique de rôles avec admin, agent et client.

L’application permet de gérer :

- les utilisateurs et leurs rôles ;
- les places de parking ;
- les réservations ;
- les abonnements ;
- les paiements ;
- les notifications et les statuts ;
- les tableaux de bord admin / agent / client.

---

## 2. Architecture technique

### 2.1 Frontend

Dossier : frontend/

Technologies :

- React 18
- Vite
- React Router DOM
- Axios
- Recharts
- Lucide React
- React Toastify

Rôle :

- afficher les écrans de connexion, dashboard, gestion des places, réservations, abonnements, paiements, etc.
- consommer l’API Flask via Axios
- afficher les données en temps réel selon le rôle de l’utilisateur

Les composants importants sont dans :

- frontend/src/App.jsx
- frontend/src/components/

### 2.2 Backend

Dossier : backend/

Technologies :

- Python 3
- Flask
- Flask-SQLAlchemy
- Flask-CORS
- SQLite (actuellement)

Rôle :

- exposer les endpoints API REST
- gérer les comptes, les véhicules, les places, les réservations, les abonnements et les paiements
- valider les permissions selon le rôle utilisateur

Fichiers principaux :

- backend/app.py : logique principale, modèles, routes API
- backend/init_db.py : initialisation de la base
- backend/init_system.py : création des comptes système

### 2.3 Base de données

Le backend utilise SQLite avec la base :

- backend/parking.db

Le modèle de données contient notamment :

- Utilisateur
- Place
- Reservation
- Abonnement
- Abonne
- Vehicule
- Transaction
- ConfigurationPaiement
- ConfigurationBanque

La base est locale et prête pour des tests locaux, mais elle n’est pas la meilleure option pour un déploiement gratuit public sans stockage persistant.

---

## 3. Flux fonctionnel principal

### 3.1 Connexion

- L’utilisateur envoie son email et son mot de passe à /api/connexion
- Le backend recherche le compte dans la table Utilisateur
- Si les identifiants correspondent, il renvoie le rôle de l’utilisateur
- Le frontend redirige vers le bon dashboard selon le rôle

### 3.2 Rôles

- admin : gestion complète de la plateforme
- agent : gestion du stationnement et des opérations quotidiennes
- client : consultation et réservation / abonnements

### 3.3 Données métier

Le backend traite :

- création des places
- validation des réservations
- souscription aux abonnements
- entrées/sorties de véhicules
- notifications de sécurité
- statistiques de occupation
- configuration bancaire / paiement

---

## 4. Structure du projet

```text
gestion-parking/
├── backend/
│   ├── app.py
│   ├── init_db.py
│   ├── init_system.py
│   ├── package.json
│   ├── server.js
│   ├── venv/
│   └── parking.db
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── ARCHITECTURE_HEBERGEMENT.md
└── README.md (si présent dans le projet)
```

---

## 5. Identifiants admin par défaut

Les comptes de démonstration sont créés dans le backend, et le compte admin principal est :

- Email : admin@parking.com
- Mot de passe : admin123

Autres comptes de test :

- Agent : agent@parking.com / agent123
- Client : client@parking.com / client123

---

## 6. Serveur démarré

Le backend Flask a bien été lancé et répond sur :

- http://127.0.0.1:5000

Le log du serveur confirme le démarrage avec :

- Serveur Flask actif
- Running on http://127.0.0.1:5000

---

## 7. Hébergement gratuit le plus approprié

### Option recommandée : Frontend + Backend séparés

#### 7.1 Frontend : Netlify

Pourquoi c’est adapté :

- le frontend est statique (Vite build)
- le déploiement est simple via GitHub
- solution gratuite très populaire pour les applications React/Vite

Avantage :

- très facile à mettre en ligne
- rapide
- idéal pour un site web ou un dashboard frontend

#### 7.2 Backend : Render ou Railway

Pourquoi c’est adapté :

- le backend Flask est un service web classique
- possibilité de déployer depuis GitHub
- gratuite en phase de test / démonstration

Important :

- SQLite n’est pas conseillé pour un déploiement public gratuit, car le système de fichiers d’un service gratuit est souvent éphémère
- si on conserve SQLite, il faudra limiter l’usage à une démonstration locale ou un environnement non critique

#### 7.3 Base de données : Supabase / Neon (gratuit)

Pour un vrai hébergement public gratuit, il est préférable de migrer de SQLite vers PostgreSQL.

Recommandation de migration :

- backend Flask → Render ou Railway
- base de données → Supabase ou Neon PostgreSQL (gratuit)
- frontend → Netlify

Cela donne une architecture robuste et gratuite compatible avec un déploiement réel.

---

## 8. Architecture recommandée pour le déploiement gratuit

```text
Utilisateur navigateur
        │
        ▼
    Frontend React
  Netlify (gratuit)
        │
        ├── appels API HTTPS
        ▼
   Backend Flask
 Render / Railway (gratuit)
        │
        ▼
   PostgreSQL
 Supabase / Neon (gratuit)
```

### Pourquoi cette architecture est la plus fiable :

- le frontend est bien adapté au hosting statique gratuit ;
- le backend est supporté par des plateformes gratuites de type Render ;
- la base de données PostgreSQL est stable et persistante ;
- cette configuration évite les problèmes liés au stockage SQLite sur des serveurs éphémères.

---

## 9. Recommandation concrète

### Cas idéal pour un prototype ou une démo

- Frontend : Netlify
- Backend : Render
- BDD : Supabase PostgreSQL

### Cas plus simple mais moins robuste

- Frontend : Netlify
- Backend : Render avec SQLite local (fonctionnel pour démo, non recommandé en production gratuite)

### Cas à éviter pour un hébergement gratuit public

- garder SQLite sur un service éphémère
- héberger à la fois frontend et backend sur un seul serveur sans base persistante

---

## 10. Conclusion

Le projet est bien structuré en architecture 3 couches :

- Frontend React/Vite
- Backend Flask API
- Base de données SQL

Pour un hébergement gratuit approprié, la meilleure option est :

- Netlify pour le frontend ;
- Render ou Railway pour le backend ;
- Supabase ou Neon pour la base de données PostgreSQL.

Cette solution est la plus adaptée à un projet Python/React réel, plus stable et plus professionnelle qu’un simple SQLite hébergé en gratuit.
