const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Chemin absolu vers le fichier pour éviter les erreurs de dossier
const dbPath = path.resolve(__dirname, 'parking.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Erreur de connexion:', err.message);
    } else {
        console.log('--- CONNEXION RÉUSSIE ---');
        console.log('Base de données connectée sur :', dbPath);
    }
});

// ROUTE DE DEBUG : Pour vérifier si les tables existent vraiment
app.get('/api/debug', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json({ tables_dans_db: rows });
    });
});

// ROUTE STATISTIQUES
app.get('/api/stats', (req, res) => {
    // Note : On utilise les noms exacts de vos tables : places, reservations, utilisateurs
    const q = `
        SELECT 
            (SELECT COUNT(*) FROM places) as total_places,
            (SELECT COUNT(*) FROM places WHERE etat = 'libre') as places_libres,
            (SELECT COUNT(*) FROM reservations WHERE statut = 'validee') as res_validees,
            (SELECT COUNT(*) FROM utilisateurs WHERE role = 'client') as total_clients
    `;
    db.get(q, [], (err, row) => {
        if (err) {
            console.error('Erreur SQL:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

// ROUTE LISTE DES PLACES
app.get('/api/places', (req, res) => {
    db.all("SELECT id_place, numero, type_p, etat FROM places", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Serveur prêt : http://localhost:${PORT}`);
});