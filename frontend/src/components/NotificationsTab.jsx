import React, { useEffect, useState } from 'react';
import { theme } from '../Theme';
import { CheckCircle, XCircle, Bell, Calendar, UserCircle } from 'lucide-react';

export default function NotificationsTab() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // On ne récupère plus que les notifications
      const res = await fetch('http://localhost:5000/api/admin/notifications');
      const data = await res.json();
      // Le filtrage 'EN_ATTENTE' est déjà fait côté Backend pour plus de performance
      setNotifs(data);
    } catch (err) {
      console.error("Erreur de synchronisation:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (idNotif, decision) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/notifications/${idNotif}/decider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: decision }) // 'VALIDE' ou 'REFUSE'
      });
      
      if (res.ok) {
        fetchData(); // Rafraîchir la liste
      } else {
        const error = await res.json();
        alert("Erreur: " + error.error);
      }
    } catch (err) {
      alert("Erreur lors de l'envoi de la décision");
    }
  };

  if (loading) return <div style={styles.loading}>Chargement du centre de contrôle...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}><Bell size={24} color={theme.accent} /> Centre de Validation</h2>
        <span style={styles.countBadge}>{notifs.length} en attente</span>
      </div>

      {notifs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '3rem' }}>✅</div>
          <p>Tout est à jour. Aucune action requise.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {notifs.map((n) => (
            <div key={n.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{
                  ...styles.typeBadge, 
                  color: n.type_action === 'RESERVATION' ? '#f59e0b' : '#3b82f6'
                }}>
                  {n.type_action === 'RESERVATION' ? <Calendar size={12}/> : <UserCircle size={12}/>}
                  {n.type_action}
                </span>
                <span style={styles.date}>{n.date}</span>
              </div>
              
              <p style={styles.message}>{n.message}</p>

              <div style={styles.actionGroup}>
                <button onClick={() => handleAction(n.id, 'VALIDE')} style={styles.approveBtn}>
                  <CheckCircle size={18} /> Confirmer
                </button>
                <button onClick={() => handleAction(n.id, 'REFUSE')} style={styles.rejectBtn}>
                  <XCircle size={18} /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { animation: 'fadeIn 0.5s ease' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
  title: { margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '1.4rem' },
  countBadge: { background: theme.accent, color: '#000', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' },
  card: { background: '#1e293b', padding: '20px', borderRadius: '15px', border: '1px solid #334155' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  typeBadge: { fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' },
  date: { fontSize: '0.8rem', color: '#64748b' },
  message: { color: '#e2e8f0', marginBottom: '20px', lineHeight: '1.5', minHeight: '3em' },
  actionGroup: { display: 'flex', gap: '10px' },
  approveBtn: { flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
  rejectBtn: { flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
  emptyState: { textAlign: 'center', padding: '80px', background: '#1e293b', borderRadius: '20px', color: '#64748b' },
  loading: { padding: '40px', color: '#64748b', textAlign: 'center' }
};