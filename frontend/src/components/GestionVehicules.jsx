import React, { useState, useEffect, useMemo } from 'react';
import { theme } from '../Theme';
import { 
  Car, Clock, LogOut, RefreshCcw, 
  AlertCircle, Trash2, Search, Info 
} from 'lucide-react';

export default function GestionVehicules() {
  const [parkingLive, setParkingLive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVehicules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:5000/api/admin/vehicules-presents');
      const data = await res.json();
      if (res.ok) {
        setParkingLive(Array.isArray(data) ? data : []);
      } else {
        throw new Error(data.error || "Erreur lors de la récupération");
      }
    } catch (err) {
      setError("Impossible de charger les véhicules présents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicules();
    const interval = setInterval(fetchVehicules, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrage intelligent
  const filteredVehicules = useMemo(() => {
    return parkingLive.filter(v => 
      v.plaque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.proprietaire?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parkingLive, searchTerm]);

  const handleSortie = async (id) => {
    if (!window.confirm("Confirmer la sortie de ce véhicule ?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/vehicules/sortie/${id}`, {
        method: 'POST'
      });
      if (res.ok) fetchVehicules();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleSupprimer = async (id, plaque) => {
    if (!window.confirm(`Action irréversible : supprimer ${plaque} ?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/vehicules/supprimer/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchVehicules();
      }
    } catch (err) {
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="content-animate">
      {/* BARRE DE CONTRÔLE HAUTE */}
      <div style={styles.topActions}>
        <div style={styles.searchContainer}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Rechercher une plaque ou un propriétaire..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={fetchVehicules} style={styles.refreshBtn}>
          <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Mise à jour...' : 'Actualiser'}
        </button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* STATISTIQUES RAPIDES */}
      <div style={styles.statsStrip}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Trafic actuel :</span>
          <span style={styles.statValue}>{parkingLive.length} véhicules</span>
        </div>
        <div style={styles.liveIndicator}>
          <span className="pulse-dot"></span> Mise à jour auto (30s)
        </div>
      </div>

      {/* GRILLE DES VÉHICULES */}
      <div style={styles.grid}>
        {!loading && filteredVehicules.length === 0 && (
          <div style={styles.emptyContainer}>
            <Car size={48} color="#334155" />
            <p style={styles.emptyMsg}>Aucun véhicule ne correspond à votre recherche.</p>
          </div>
        )}

        {filteredVehicules.map(v => (
          <div key={v.id} style={styles.vehiculeCard}>
            <div style={styles.cardHeader}>
              <div style={styles.ownerBadge}>
                <div style={styles.ownerInitial}>{v.proprietaire?.charAt(0) || 'C'}</div>
                <span style={styles.ownerName}>{v.proprietaire || 'Client Occasionnel'}</span>
              </div>
              <button 
                onClick={() => handleSupprimer(v.id, v.plaque)} 
                style={styles.deleteIconBtn}
                className="hover-red"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={styles.plateContainer}>
              <div style={styles.plateLabel}>MATRICULE</div>
              <div style={styles.plateText}>{v.plaque}</div>
            </div>
            
            <div style={styles.infoRow}>
              <div style={styles.timeTag}>
                <Clock size={14} />
                <span>Entrée : {v.heure_entree ? new Date(v.heure_entree).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
              </div>
            </div>

            <div style={styles.actionGroup}>
               <button onClick={() => handleSortie(v.id)} style={styles.exitBtn}>
                 <LogOut size={16} /> Valider la Sortie
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  topActions: { display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '20px' },
  searchContainer: { position: 'relative', flex: 1 },
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' },
  searchInput: { 
    width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', 
    padding: '12px 12px 12px 40px', borderRadius: '12px', color: '#fff', outline: 'none',
    fontSize: '0.9rem' 
  },
  refreshBtn: { 
    background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', 
    padding: '0 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', gap: '8px', transition: '0.2s' 
  },
  statsStrip: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    background: 'rgba(255,255,255,0.02)', padding: '10px 20px', 
    borderRadius: '10px', marginBottom: '25px', border: '1px solid rgba(255,255,255,0.05)' 
  },
  statLabel: { color: '#94a3b8', fontSize: '0.85rem' },
  statValue: { color: theme.accent, fontWeight: 'bold', marginLeft: '8px' },
  liveIndicator: { color: '#4ade80', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
  vehiculeCard: { 
    background: '#111827', padding: '24px', borderRadius: '20px', 
    border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex', flexDirection: 'column', gap: '15px' 
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  ownerBadge: { display: 'flex', alignItems: 'center', gap: '10px' },
  ownerInitial: { 
    width: '32px', height: '32px', background: theme.accent, 
    borderRadius: '8px', color: '#000', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' 
  },
  ownerName: { color: '#fff', fontSize: '0.85rem', fontWeight: '600' },
  deleteIconBtn: { 
    background: 'transparent', border: 'none', color: '#334155', 
    cursor: 'pointer', padding: '5px', borderRadius: '6px', transition: '0.2s' 
  },
  
  plateContainer: { 
    background: '#facc15', borderRadius: '10px', padding: '12px', 
    border: '2px solid #000', textAlign: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)' 
  },
  plateLabel: { color: '#000', fontSize: '0.6rem', fontWeight: '900', opacity: 0.6, marginBottom: '2px' },
  plateText: { color: '#000', fontWeight: '900', fontSize: '1.4rem', fontFamily: 'monospace', letterSpacing: '1px' },
  
  infoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  timeTag: { 
    background: 'rgba(255,255,255,0.03)', color: '#94a3b8', 
    padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem',
    display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)'
  },
  
  actionGroup: { marginTop: '10px' },
  exitBtn: { 
    width: '100%', padding: '12px', background: `${theme.accent}15`, 
    color: theme.accent, border: `1px solid ${theme.accent}30`, 
    borderRadius: '12px', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', gap: '10px', 
    fontWeight: '700', fontSize: '0.9rem', transition: '0.2s' 
  },
  emptyContainer: { gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', opacity: 0.5 },
  emptyMsg: { marginTop: '15px', color: '#64748b' },
  errorBox: { padding: '15px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
};