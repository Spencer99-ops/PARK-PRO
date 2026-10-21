import React, { useState, useEffect } from 'react';
import { theme } from '../Theme';
import { 
  Shield, UserCheck, UserX, Mail, Loader2, 
  Search, FileText, LayoutGrid, List, 
  X, Edit2, Calendar, Crown, Car
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function GestionPersonnel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({ nom: '', email: '', role: 'agent', mot_de_passe: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/abonnes-complet');
      const result = await res.json();
      if (res.ok) setData(Array.isArray(result) ? result : []);
    } catch (err) {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleQuickAction = async (user) => {
    const id_place = 1; 
    let plaque = "";
    if (user.statut !== 'present') {
      plaque = prompt(`Entrée pour ${user.nom}. Plaque :`);
      if (!plaque) return;
    } else {
      if (!window.confirm(`Valider la sortie pour ${user.nom} ?`)) return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/agent/place-action/${id_place}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plaque: plaque || "ABONNÉ", id_utilisateur: user.id_utilisateur })
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Erreur terminal.");
    }
  };

  const processedData = data
    .filter(u => u.nom.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => sortOrder === 'asc' ? a.nom.localeCompare(b.nom) : b.nom.localeCompare(a.nom));

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("REGISTRE OFFICIEL", 14, 20);
    autoTable(doc, {
      head: [["ID", "NOM", "FORFAIT", "EXPIRATION"]],
      body: processedData.map(u => [u.id_utilisateur, u.nom, u.forfait || 'AGENT', u.date_fin]),
      startY: 30,
      theme: 'striped'
    });
    doc.save(`Rapport.pdf`);
  };

  const handleSave = () => { 
    // Ta logique de sauvegarde ici
    setShowModal(false); 
  };

  return (
    <div style={styles.container} className="content-animate">
      {/* HEADER SECTION - Plus compact et moderne */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Personnel & Abonnés</h2>
          <div style={styles.subtitle}>
            <span style={styles.pulseDot}></span>
            {processedData.length} comptes actifs
          </div>
        </div>
        <div style={styles.actionsGroup}>
          <button style={styles.exportBtn} onClick={exportToPDF}><FileText size={18} /> Exporter</button>
          <button style={styles.addBtn} onClick={() => { setIsEditing(false); setShowModal(true); }}>
            <Shield size={18} /> Nouvel Accès
          </button>
        </div>
      </div>

      {/* TOOLBAR - Alignée sur le dashboard */}
      <div style={styles.toolBar}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Rechercher par nom ou ID..." 
            style={styles.searchInput} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div style={styles.viewToggle}>
          <button onClick={() => setViewMode('grid')} style={{...styles.toggleBtn, color: viewMode === 'grid' ? theme.accent : '#64748b', background: viewMode === 'grid' ? 'rgba(255,255,255,0.05)' : 'transparent'}}><LayoutGrid size={18}/></button>
          <button onClick={() => setViewMode('list')} style={{...styles.toggleBtn, color: viewMode === 'list' ? theme.accent : '#64748b', background: viewMode === 'list' ? 'rgba(255,255,255,0.05)' : 'transparent'}}><List size={18}/></button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loaderContainer}><Loader2 className="animate-spin" color={theme.accent} size={40} /></div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div style={styles.grid}>
              {processedData.map(user => (
                <div key={user.id_utilisateur} style={styles.card} className="nav-item">
                  <div style={styles.cardHeader}>
                    <div style={styles.avatar}>
                      {user.forfait ? <Crown size={20} color={theme.accent} /> : <UserCheck size={20} color="#60a5fa" />}
                    </div>
                    <span style={styles.idBadge}>#{user.id_utilisateur}</span>
                  </div>
                  
                  <h3 style={styles.userName}>{user.nom}</h3>
                  <div style={styles.infoRow}><Mail size={14} /> {user.email}</div>
                  <div style={styles.infoRow}>
                    <Shield size={14} /> 
                    <span style={{color: user.forfait ? theme.accent : '#64748b', fontWeight: '600'}}>
                      {user.forfait || "Agent de service"}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <Calendar size={14} /> 
                    <span style={{fontSize: '0.8rem'}}>Expire: {user.date_fin || "Permanent"}</span>
                  </div>

                  <div style={styles.cardActions}>
                    <button style={styles.editBtn} onClick={() => { setCurrentId(user.id_utilisateur); setIsEditing(true); setShowModal(true); }}>
                      <Edit2 size={14} />
                    </button>
                    <button style={{...styles.actionBtn, background: user.statut === 'present' ? '#ef444420' : `${theme.accent}20`, color: user.statut === 'present' ? '#f87171' : theme.accent}} onClick={() => handleQuickAction(user)}>
                      <Car size={16} /> {user.statut === 'present' ? 'Sortie' : 'Entrée'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Membre</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Expiration</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map(user => (
                    <tr key={user.id_utilisateur} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                           <div style={styles.avatarSmall}>{user.nom.charAt(0)}</div>
                           <div>
                             <div style={{fontWeight:'600'}}>{user.nom}</div>
                             <div style={{fontSize:'0.75rem', color:'#64748b'}}>{user.email}</div>
                           </div>
                        </div>
                      </td>
                      <td style={styles.td}><span style={styles.typeBadge}>{user.forfait || "AGENT"}</span></td>
                      <td style={styles.td}>{user.date_fin || "—"}</td>
                      <td style={styles.td}>
                        <div style={{display:'flex', gap:'8px'}}>
                          <button style={styles.iconBtn} onClick={() => handleQuickAction(user)}><Car size={18} /></button>
                          <button style={styles.iconBtn} onClick={() => { setCurrentId(user.id_utilisateur); setIsEditing(true); setShowModal(true); }}><Edit2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* MODAL SYSTEM */}
      {showModal && (
        <div style={styles.overlay} className="content-animate">
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0}}>{isEditing ? "Édition Profil" : "Nouvel Accès"}</h3>
              <X style={{cursor:'pointer'}} onClick={() => setShowModal(false)} />
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom complet</label>
                <input style={styles.input} value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mot de passe</label>
                <input type="password" style={styles.input} onChange={e => setForm({...form, mot_de_passe: e.target.value})} />
              </div>
              <div style={styles.modalFooter}>
                <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Annuler</button>
                <button style={styles.saveBtn} onClick={handleSave}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { fontSize: '1.5rem', fontWeight: '700', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' },
  pulseDot: { width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s infinite' },
  
  actionsGroup: { display: 'flex', gap: '12px' },
  addBtn: { background: theme.accent, color: '#000', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  exportBtn: { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },

  toolBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', gap: '20px' },
  searchBox: { position: 'relative', flex: 1 },
  searchIcon: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' },
  searchInput: { width: '100%', background: '#111827', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 12px 12px 42px', borderRadius: '12px', color: '#fff', outline: 'none' },
  
  viewToggle: { background: '#111827', padding: '4px', borderRadius: '10px', display: 'flex', border: '1px solid rgba(255,255,255,0.1)' },
  toggleBtn: { border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', transition: 'all 0.3s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  avatar: { width: '40px', height: '40px', background: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' },
  avatarSmall: { width: '32px', height: '32px', background: theme.accent, borderRadius: '8px', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' },
  idBadge: { color: '#64748b', fontSize: '0.75rem', fontWeight: '600' },
  userName: { fontSize: '1.1rem', fontWeight: '600', margin: '0 0 10px 0' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '6px' },
  
  cardActions: { display: 'flex', gap: '8px', marginTop: '18px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  editBtn: { background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  actionBtn: { flex: 1, border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },

  tableWrapper: { background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)' },
  td: { padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem' },
  typeBadge: { background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#111827', width: '400px', borderRadius: '20px', padding: '25px', border: '1px solid rgba(255,255,255,0.1)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  label: { display: 'block', marginBottom: '6px', color: '#64748b', fontSize: '0.8rem' },
  input: { width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', color: '#fff', outline: 'none' },
  modalFooter: { display: 'flex', gap: '10px', marginTop: '10px' },
  saveBtn: { flex: 2, background: theme.accent, color: '#000', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { flex: 1, background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', cursor: 'pointer' },
  loaderContainer: { display: 'flex', justifyContent: 'center', padding: '60px' }
};