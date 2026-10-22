# Gestion Parking

Application de gestion de parking avec système de réservation, abonnements et paiements.

## Architecture

- **Frontend**: React + Vite
- **Backend**: Flask + SQLAlchemy
- **Base de données**: PostgreSQL (Neon) - Base de données cloud gratuite

## Installation

### Backend

Le projet utilise Neon PostgreSQL pour la base de données.

**Première installation avec Neon:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cp .env.example .env
# Éditez .env et ajoutez votre DATABASE_URL Neon
python init_postgres.py  # Crée le schéma PostgreSQL
python app.py
```

**Pour migrer des données existantes de SQLite vers PostgreSQL:**

```bash
python migrate_to_postgres.py
```

Le backend démarre sur `http://127.0.0.1:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend démarre sur `http://localhost:5173`

## Comptes par défaut

- **Admin**: admin@parking.com / admin123
- **Agent**: agent@parking.com / agent123
- **Client**: client@parking.com / client123

## Déploiement

Pour l'hébergement gratuit:
- Frontend: Netlify
- Backend: Render ou Railway
- Base de données: Neon PostgreSQL (déjà configuré)

**Configuration de production:**

Sur Render/Railway, ajoutez la variable d'environnement:
- `DATABASE_URL`: L'URL de connexion Neon (disponible dans le dashboard Neon)

## Structure du projet

```
gestion-parking/
├── backend/
│   ├── app.py              # Application Flask principale
│   ├── init_db.py          # Initialisation de la base
│   ├── init_system.py      # Création des comptes système
│   ├── requirements.txt    # Dépendances Python
│   └── parking.db          # Base de données SQLite (gitignored)
├── frontend/
│   ├── src/                # Code React
│   ├── package.json        # Dépendances Node
│   └── vite.config.js      # Configuration Vite
└── README.md
```
