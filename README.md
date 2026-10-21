# Gestion Parking

Application de gestion de parking avec système de réservation, abonnements et paiements.

## Architecture

- **Frontend**: React + Vite
- **Backend**: Flask + SQLAlchemy
- **Base de données**: SQLite (version de développement)

## Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python init_db.py
python init_system.py
python app.py
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
- Base de données: Migrer vers PostgreSQL (Supabase ou Neon)

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
