import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../Theme';
import { 
  Search, UserPlus, Edit2, Trash2, Mail, Phone, 
  Car, Loader2, AlertCircle, X, CheckCircle2 
} from 'lucide-react';

export default function GestionClients() {
  const [clients, setClients] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  const initialFormState = { nom: '', email: '', telephone: '', plaque: '' };
  const [currentClient, setCurrentClient] = useState(initialFormState);

  // Utilisation de useCallback pour stabiliser la fonction
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/clients');
      if (!res.ok) throw new Error("Erreur serveur lors de la récupération");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Impossible de charger les clients. Vérifiez la connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Auto-fermeture des notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const validateForm = () => {
    if (!currentClient.nom.trim() || !currentClient.email.trim()) {
      alert("Le nom et l'email sont obligatoires.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentClient.email)) {
      alert("Format d'email invalide.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    const isEditing = !!currentClient.id;
    const url = isEditing 
      ? `http://localhost:5000/api/admin/clients/${currentClient.id}`
      : 'http://localhost:5000/api/admin/clients';

    try {
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentClient,
          plaque: currentClient.plaque.toUpperCase().trim()
        })
      });
      
      const data = await res.json();

      if (res.ok) {
        setNotification({ type: 'success', message: isEditing ? "Client mis à jour" : "Client ajouté" });
        setShowModal(false);
        fetchClients();
        setCurrentClient(initialFormState);
      } else {
        alert(data.error || "Une erreur est survenue.");
      }
    } catch (err) { 
      alert("Erreur réseau : le serveur est peut-être hors ligne.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer définitivement ce client ?")) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/admin/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({ type: 'success', message: "Client supprimé" });
        fetchClients();
      }
    } catch (err) { alert("Erreur lors de la suppression."); }
  };

  const filteredClients = clients.filter(c => 
    c.nom?.toLowerCase().includes(recherche.toLowerCase()) || 
    c.plaque?.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div style={styles.container}>
      {/* Notification Toast */}
      {notification && (
        <div style={{...styles.toast, backgroundColor: notification.type === 'success' ? '#10b981' : '#ef4444'}}>
          <CheckCircle2 size={18} /> {notification.message}
        </div>
      )}

      <div style={styles.actionBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#64748b" />
          <input 
            placeholder="Nom ou immatriculation..." 
            style={styles.searchInput}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          {recherche && <X size={16} color="#64748b" style={{cursor:'pointer'}} onClick={() => setRecherche('')} />}
        </div>
        <button style={styles.addBtn} onClick={() => { setCurrentClient(initialFormState); setShowModal(true); }}>
          <UserPlus size={18} /> Nouveau Client
        </button>
      </div>

      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.statusCenter}>
            <Loader2 className="animate-spin" color={theme.accent} size={32} />
            <p style={{color: '#94a3b8', marginTop: 10}}>Chargement de la base clients...</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Immatriculation</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.clientInfo}>
                      <div style={styles.avatar}>{client.nom[0].toUpperCase()}</div>
                      <span style={styles.clientName}>{client.nom}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.contactItem}><Phone size={14} /> {client.telephone || '--'}</div>
                    <div style={styles.contactItem}><Mail size={14} /> {client.email}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.plaqueBadge}>{client.plaque || 'SANS PLAQUE'}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button style={styles.editBtn} onClick={() => { setCurrentClient(client); setShowModal(true); }}><Edit2 size={16} /></button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(client.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal amélioré */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0}}>{currentClient.id ? 'Modifier' : 'Nouveau'} Client</h3>
              <X style={{cursor:'pointer'}} onClick={() => setShowModal(false)} />
            </div>
            
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom Complet *</label>
                <input style={styles.input} value={currentClient.nom} onChange={e => setCurrentClient({...currentClient, nom: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input style={styles.input} type="email" value={currentClient.email} onChange={e => setCurrentClient({...currentClient, email: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Téléphone</label>
                <input style={styles.input} value={currentClient.telephone} onChange={e => setCurrentClient({...currentClient, telephone: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Plaque</label>
                <input style={styles.input} value={currentClient.plaque} onChange={e => setCurrentClient({...currentClient, plaque: e.target.value})} placeholder="Ex: LT-123-AA" />
              </div>
            </div>
            
            <div style={styles.modalActions}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Styles existants optimisés...
  toast: { position: 'fixed', top: '20px', right: '20px', padding: '12px 20px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 2000, boxShadow: '0 10px 15px rgba(0,0,0,0.3)', transition: 'all 0.3s' },
  container: { padding: '20px' },
  actionBar: { display: 'flex', marginBottom: '20px', gap: '15px' },
  searchWrapper: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#1e293b', padding: '0 15px', borderRadius: '10px', border: '1px solid #334155' },
  searchInput: { background: 'none', border: 'none', color: '#fff', padding: '12px 0', width: '100%', outline: 'none' },
  addBtn: { background: theme.accent, color: '#000', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  tableCard: { background: '#1e293b', borderRadius: '15px', border: '1px solid #334155', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '18px 20px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #334155' },
  td: { padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#e2e8f0' },
  avatar: { width: '36px', height: '36px', borderRadius: '10px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: theme.accent },
  clientInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  clientName: { fontWeight: '600', color: '#fff' },
  contactItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' },
  plaqueBadge: { background: '#0f172a', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #334155', fontFamily: 'monospace', color: '#38bdf8' },
  editBtn: { background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  deleteBtn: { background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
  modal: { background: '#1e293b', padding: '30px', borderRadius: '24px', width: '450px', border: '1px solid #334155' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '20px' },
  formGrid: { display: 'grid', gap: '15px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#94a3b8', fontSize: '0.8rem' },
  input: { background: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '10px', color: '#fff', outline: 'none' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '25px' },
  cancelBtn: { flex: 1, padding: '12px', background: 'transparent', border: '1px solid #334155', color: '#fff', borderRadius: '10px', cursor: 'pointer' },
  saveBtn: { flex: 2, padding: '12px', background: theme.accent, border: 'none', color: '#000', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display:'flex', justifyContent:'center' },
  statusCenter: { padding: '60px', textAlign: 'center' }
};