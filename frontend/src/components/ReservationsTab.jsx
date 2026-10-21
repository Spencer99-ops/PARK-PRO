import React, { useEffect, useState } from 'react';
import { theme } from '../Theme';

export default function ReservationsTab() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fonction pour récupérer les données
  const fetchReservations = () => {
    fetch('http://localhost:5000/api/admin/reservations')
      .then(res => {
        if (!res.ok) throw new Error('Erreur Serveur');
        return res.json();
      })
      .then(data => {
        setReservations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur chargement:", err);
        setLoading(false);
        setReservations([]); 
      });
  };

  // 2. IMPORTANT : Déclenche l'appel API au montage du composant
  useEffect(() => {
    fetchReservations();
  }, []); // Le tableau vide [] signifie "exécuter une seule fois au chargement"

  const handleAction = (id_res, nouveauStatut) => {
    fetch(`http://localhost:5000/api/admin/reservations/${id_res}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: nouveauStatut })
    })
    .then(res => {
      if(res.ok) {
        // Mise à jour locale de l'état pour un feedback immédiat
        setReservations(prev => prev.map(r => 
          r.id_res === id_res ? { ...r, statut: nouveauStatut } : r
        ));
      }
    })
    .catch(err => console.error("Erreur lors de la mise à jour:", err));
  };

  const getStatusStyle = (statut) => {
    const map = {
      validee: { bg: '#22c55e20', color: '#22c55e', label: 'Validée' },
      en_attente: { bg: '#f1c40f20', color: '#f1c40f', label: 'En attente' },
      refusee: { bg: '#ef444420', color: '#ef4444', label: 'Refusée' },
      terminee: { bg: '#94a3b820', color: '#94a3b8', label: 'Terminée' },
    };
    return map[statut] || { bg: '#334155', color: '#fff', label: statut };
  };

  // Remplace ton ancien bloc "const filteredReservations" par celui-ci :
const filteredReservations = reservations.filter(res => 
  res.statut !== 'en_attente' && // <--- On ne garde que les "validee", "refusee" ou "terminee"
  res.client?.toLowerCase().includes(searchTerm.toLowerCase())
);

  if (loading) return (
    <div style={{ color: '#94a3b8', padding: '100px', textAlign: 'center', fontSize: '1.2rem' }}>
      <div className="spinner"></div> {/* Tu peux ajouter un spinner CSS ici */}
      Chargement des réservations en cours...
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <h2 style={{color: '#fff', marginBottom: '10px'}}>Gestion des Réservations</h2>
           <button onClick={fetchReservations} style={styles.refreshBtn}>Actualiser ↻</button>
        </div>
        <input 
          style={styles.searchInput}
          placeholder="Rechercher un client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Place</th>
              <th style={styles.th}>Début / Fin</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.map(res => {
              const status = getStatusStyle(res.statut);
              return (
                <tr key={res.id_res} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>{res.client}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{res.email}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.placeBadge}>{res.place}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ color: '#cbd5e1' }}>{res.debut}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{res.fin}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {res.statut === 'en_attente' ? (
                      <div style={styles.actionGroup}>
                        <button 
                          onClick={() => handleAction(res.id_res, 'validee')}
                          style={{ ...styles.actionBtn, color: '#22c55e', borderColor: '#22c55e40' }}
                          title="Valider la réservation"
                        >✓</button>
                        <button 
                          onClick={() => handleAction(res.id_res, 'refusee')}
                          style={{ ...styles.actionBtn, color: '#ef4444', borderColor: '#ef444440' }}
                          title="Refuser la réservation"
                        >✕</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Traité</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredReservations.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <div style={{fontSize: '2rem', marginBottom: '10px'}}>📅</div>
            Aucune réservation trouvée
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { animation: 'fadeIn 0.3s ease-out', padding: '20px' },
  header: { marginBottom: '20px' },
  refreshBtn: {
    background: 'transparent',
    border: '1px solid #334155',
    color: '#94a3b8',
    padding: '5px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  searchInput: {
    background: '#0f172a',
    border: '1px solid #334155',
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '300px',
    outline: 'none',
    marginTop: '10px'
  },
  tableWrapper: { background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '15px 20px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #334155' },
  td: { padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem' },
  placeBadge: { background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '8px', fontWeight: '800', border: '1px solid #334155', color: theme.accent || '#3b82f6' },
  statusBadge: { padding: '5px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', display: 'inline-block', textTransform: 'uppercase' },
  actionGroup: { display: 'flex', gap: '8px' },
  actionBtn: { 
    background: 'rgba(255,255,255,0.03)', 
    border: '1px solid', 
    borderRadius: '8px', 
    width: '32px', 
    height: '32px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    transition: 'all 0.2s'
  }
};