import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Car, LogOut, MapPin, Users, CreditCard, 
  RefreshCw, Search, DollarSign, 
  PlusCircle, Edit3, Trash2, Save, Clock, Calendar, AlertCircle
} from 'lucide-react';
import { theme } from '../Theme'; 

export default function DashboardPersonnel({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('places');
  const [subTabAbo, setSubTabAbo] = useState('liste_abonnes');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalType, setModalType] = useState(null); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  const [data, setData] = useState({
    places: [], stationnements: [], vehicules: [],
    clients: [], paiements: [], tarifs: [], abonnements: [], abonnes: []
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const endpoints = {
      places: 'http://localhost:5000/api/places',
      stationnements: 'http://localhost:5000/api/agent/stationnements',
      vehicules: 'http://localhost:5000/api/vehicules',
      clients: 'http://localhost:5000/api/clients',
      paiements: 'http://localhost:5000/api/paiements',
      tarifs: 'http://localhost:5000/api/tarifs',
      abonnements: 'http://localhost:5000/api/abonnements',
      abonnes: 'http://localhost:5000/api/abonnes'
    };
    try {
      const results = {};
      await Promise.all(Object.entries(endpoints).map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          const json = await res.json();
          results[key] = Array.isArray(json) ? json : (json.data || []);
        } catch (e) { results[key] = []; }
      }));
      setData(prev => ({ ...prev, ...results }));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  const handleEntreePlace = async (idPlace) => {
    const plaque = prompt("Entrez le numéro de plaque :");
    if (!plaque) return;
    try {
      const res = await fetch('http://localhost:5000/api/agent/entree-directe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_place: idPlace, plaque: plaque.toUpperCase() })
      });
      if (res.ok) loadAllData();
    } catch (e) { console.error(e); }
  };

  const handleSortieStationnement = async (idStat) => {
    try {
      const resPrix = await fetch(`http://localhost:5000/api/agent/calculer-prix/${idStat}`);
      const info = await resPrix.json();
      if (window.confirm(`Valider la sortie ?\nTotal : ${info.montant_total} XAF`)) {
        const resValider = await fetch(`http://localhost:5000/api/agent/valider-sortie/${idStat}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ montant: info.montant_total, methode: 'Espèces' })
        });
        if (resValider.ok) loadAllData();
      }
    } catch (e) { alert("Erreur validation"); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const type = modalType === 'client' ? 'clients' : 'vehicules';
    const method = selectedItem ? 'PUT' : 'POST';
    const idField = modalType === 'client' ? 'id_utilisateur' : 'id_vehicule';
    const url = `http://localhost:5000/api/${type}${selectedItem ? '/' + selectedItem[idField] : ''}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) { setModalType(null); loadAllData(); }
    } catch (err) { alert("Erreur d'enregistrement"); }
  };

  const handleDelete = async (type, id) => {
    if (window.confirm("Supprimer cet élément ?")) {
      await fetch(`http://localhost:5000/api/${type}/${id}`, { method: 'DELETE' });
      loadAllData();
    }
  };

  const getFilteredData = () => {
    let list = activeTab === 'abonnements' ? (subTabAbo === 'liste_abonnes' ? data.abonnes : data.abonnements) : (data[activeTab] || []);
    return list.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())));
  };

  const menuItems = [
    { id: 'places', icon: <MapPin size={20}/>, label: 'Places' },
    { id: 'stationnements', icon: <Clock size={20}/>, label: 'Flux & Sorties' },
    { id: 'clients', icon: <Users size={20}/>, label: 'Clients' },
    { id: 'vehicules', icon: <Car size={20}/>, label: 'Véhicules' },
    { id: 'abonnements', icon: <Calendar size={20}/>, label: 'Abonnements' },
    { id: 'paiements', icon: <CreditCard size={20}/>, label: 'Paiements' },
    { id: 'tarifs', icon: <DollarSign size={20}/>, label: 'Tarifs' },
  ];

  return (
    <div style={styles.dashboardLayout}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .content-animate { animation: fadeIn 0.3s ease-out; }
        .nav-item:hover { background: rgba(255,255,255,0.05) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>

      {/* --- SIDEBAR --- */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}><Shield size={20} color="#000" /></div>
          <h2 style={styles.logoText}>AGENT<span style={{ color: theme.accent }}>PRO</span></h2>
        </div>
        
        <div style={styles.userProfile}>
           <div style={styles.avatar}>{user?.nom?.charAt(0).toUpperCase() || 'A'}</div>
           <div style={{ overflow: 'hidden' }}>
             <p style={styles.userRole}>Agent de Terrain</p>
             <p style={styles.userName}>{user?.nom || 'Agent Parking'}</p>
           </div>
        </div>

        <nav style={styles.nav} className="custom-scrollbar">
          {menuItems.map(item => (
            <div key={item.id} className="nav-item" onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                background: activeTab === item.id ? `${theme.accent}15` : 'transparent',
                color: activeTab === item.id ? theme.accent : '#94a3b8',
                borderLeft: activeTab === item.id ? `4px solid ${theme.accent}` : '4px solid transparent',
              }}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
            <button onClick={onLogout} style={styles.logoutBtn}><LogOut size={18} /> Déconnexion</button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={styles.main}>
        <header style={styles.topHeader}>
            <div>
                <h1 style={styles.pageTitle}>{activeTab.toUpperCase()}</h1>
                <p style={styles.pageSubtitle}>Gestion des opérations en temps réel</p>
            </div>
            <div style={styles.headerRight}>
                <div style={styles.searchContainer}>
                  <Search size={18} color="#64748b" />
                  <input style={styles.topSearch} placeholder="Recherche rapide..." onChange={e => setSearchTerm(e.target.value)} />
                </div>
                {['clients', 'vehicules'].includes(activeTab) && (
                  <button onClick={() => { setModalType(activeTab.slice(0,-1)); setSelectedItem(null); setFormData({}); }} style={styles.primaryBtn}>
                    <PlusCircle size={18} /> Nouveau
                  </button>
                )}
                <button onClick={loadAllData} style={styles.refreshBtn}>
                    <RefreshCw size={18} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                </button>
                <div style={styles.liveTag}><span style={styles.pulseDot}></span> LIVE</div>
            </div>
        </header>

        {activeTab === 'abonnements' && (
          <div style={styles.subNavBar}>
            <button onClick={() => setSubTabAbo('liste_abonnes')} style={subTabAbo === 'liste_abonnes' ? styles.subNavActive : styles.subNavBtn}>Abonnés Actifs</button>
            <button onClick={() => setSubTabAbo('offres')} style={subTabAbo === 'offres' ? styles.subNavActive : styles.subNavBtn}>Offres & Forfaits</button>
          </div>
        )}

        <section style={styles.contentArea} className="content-animate" key={activeTab + subTabAbo}>
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {activeTab === 'tarifs' && <>
                      <th style={styles.th}>Type Véh.</th><th style={styles.th}>Intervalle</th><th style={styles.th}>Montant</th><th style={styles.th}>Méthode</th>
                    </>}
                    {activeTab === 'abonnements' && subTabAbo === 'liste_abonnes' && <>
                      <th style={styles.th}>Client</th><th style={styles.th}>Réduction</th><th style={styles.th}>Date Fin</th><th style={styles.th}>Statut</th>
                    </>}
                    {activeTab === 'abonnements' && subTabAbo === 'offres' && <>
                      <th style={styles.th}>Nom Offre</th><th style={styles.th}>Prix</th><th style={styles.th}>Durée (J)</th><th style={styles.th}>Remise</th>
                    </>}
                    {activeTab === 'clients' && <><th style={styles.th}>Nom</th><th style={styles.th}>Contact</th><th style={styles.th}>Email</th><th style={styles.th}>Actions</th></>}
                    {activeTab === 'vehicules' && <><th style={styles.th}>Plaque</th><th style={styles.th}>Modèle/Marque</th><th style={styles.th}>Propriétaire</th><th style={styles.th}>Actions</th></>}
                    {activeTab === 'stationnements' && <><th style={styles.th}>Véhicule</th><th style={styles.th}>Entrée</th><th style={styles.th}>Sortie</th><th style={styles.th}>Actions</th></>}
                    {activeTab === 'paiements' && <><th style={styles.th}>Client</th><th style={styles.th}>Type</th><th style={styles.th}>Montant</th><th style={styles.th}>Mode</th></>}
                    {activeTab === 'places' && <><th style={styles.th}>N°</th><th style={styles.th}>Catégorie</th><th style={styles.th}>État</th><th style={styles.th}>Action</th></>}
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData().length === 0 ? (
                    <tr><td colSpan="10" style={styles.emptyCell}>Aucune donnée disponible</td></tr>
                  ) : getFilteredData().map((item, idx) => (
                    <tr key={idx} style={styles.tr}>
                      {activeTab === 'places' && <>
                        <td style={styles.td}><strong>Place {item.numero}</strong></td>
                        <td style={styles.td}>{item.id_type === 1 ? '🏍️ Moto' : '🚗 Voiture'}</td>
                        <td style={styles.td}>
                           <span style={{...styles.statusBadge, 
                             color: item.etat === 'libre' ? '#4ade80' : '#f87171',
                             background: item.etat === 'libre' ? '#4ade8015' : '#f8717115'}}>
                             {item.etat?.toUpperCase()}
                           </span>
                        </td>
                        <td style={styles.td}>
                          {item.etat === 'libre' ? 
                            <button onClick={() => handleEntreePlace(item.id_place)} style={styles.actionBtnIn}>Entrée</button> : 
                            <span style={{fontSize: '0.8rem', color: '#64748b'}}>Occupée</span>
                          }
                        </td>
                      </>}

                      {activeTab === 'stationnements' && <>
                        <td style={styles.td}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <strong>{item.plaque || `ID: ${item.id_vehicule}`}</strong>
                                <span style={{fontSize: '0.7rem', color: '#64748b'}}>Place #{item.id_place}</span>
                            </div>
                        </td>
                        <td style={styles.td}><span style={styles.timeLabel}>{item.heure_entree ? new Date(item.heure_entree).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span></td>
                        <td style={styles.td}>{item.heure_sortie ? new Date(item.heure_sortie).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</td>
                        <td style={styles.td}>
                          {item.statut === 'present' ? 
                            <button onClick={() => handleSortieStationnement(item.id_stationnement)} style={styles.actionBtnOut}>Sortie</button> :
                            <span style={{color: '#4ade80', fontSize: '0.8rem'}}>Terminé</span>
                          }
                        </td>
                      </>}

                      {activeTab === 'vehicules' && <>
                        <td style={styles.td}><strong>{item.plaque}</strong></td>
                        <td style={styles.td}>{item.marque} {item.modele}</td>
                        <td style={styles.td}>ID Proprio: {item.id_utilisateur}</td>
                        <td style={styles.td}>
                          <button onClick={() => { setModalType('vehicule'); setSelectedItem(item); setFormData(item); }} style={styles.iconEdit}><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete('vehicules', item.id_vehicule)} style={styles.iconDel}><Trash2 size={16}/></button>
                        </td>
                      </>}

                      {activeTab === 'abonnements' && subTabAbo === 'liste_abonnes' && <>
                        <td style={styles.td}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <strong>{item.nom_client || item.nom}</strong>
                                <span style={{fontSize: '0.7rem', color: '#64748b'}}>{item.telephone || item.email}</span>
                            </div>
                        </td>
                        <td style={styles.td}>{item.reduction || 0}%</td>
                        <td style={styles.td}>{item.date_fin ? new Date(item.date_fin).toLocaleDateString() : 'N/A'}</td>
                        <td style={styles.td}>
                            <span style={{
                                ...styles.statusBadge, 
                                color: item.statut === 'actif' ? '#4ade80' : '#94a3b8',
                                background: item.statut === 'actif' ? '#4ade8015' : '#94a3b815'
                            }}>
                                {item.statut?.toUpperCase()}
                            </span>
                        </td>
                      </>}

                      {activeTab === 'abonnements' && subTabAbo === 'offres' && <>
                        <td style={styles.td}><strong>{item.nom}</strong></td>
                        <td style={styles.td}><span style={styles.priceTag}>{item.prix} XAF</span></td>
                        <td style={styles.td}>{item.duree_jours} Jours</td>
                        <td style={styles.td}>{item.reduction}%</td>
                      </>}

                      {activeTab === 'clients' && <>
                        <td style={styles.td}><strong>{item.nom}</strong></td>
                        <td style={styles.td}>{item.telephone}</td>
                        <td style={styles.td}>{item.email || '-'}</td>
                        <td style={styles.td}>
                          <button onClick={() => { setModalType('client'); setSelectedItem(item); setFormData(item); }} style={styles.iconEdit}><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete('clients', item.id_utilisateur)} style={styles.iconDel}><Trash2 size={16}/></button>
                        </td>
                      </>}

                      {activeTab === 'paiements' && <>
                        <td style={styles.td}>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                                <strong>{item.nom_client || item.client_nom || 'Passager'}</strong>
                                <span style={{fontSize: '0.7rem', color: '#64748b'}}>ID Client: {item.id_utilisateur || 'N/A'}</span>
                            </div>
                        </td>
                        <td style={styles.td}>
                            <span style={{...styles.statusBadge, color: theme.accent, background: `${theme.accent}15`}}>
                                {item.type_achat}
                            </span>
                        </td>
                        <td style={styles.td}><span style={styles.priceTag}>{item.montant} XAF</span></td>
                        <td style={styles.td}><span style={styles.methodBadge}>{item.methode_paiement}</span></td>
                      </>}

                      {activeTab === 'tarifs' && <>
                        <td style={styles.td}>{item.id_type_vehicule === 1 ? '🏍️ Moto' : '🚗 Voiture'}</td>
                        <td style={styles.td}>{item.minute_debut} - {item.minute_fin || '∞'} min</td>
                        <td style={styles.td}><span style={styles.priceTag}>{item.montant} XAF</span></td>
                        <td style={styles.td}><span style={styles.methodBadge}>{item.methode}</span></td>
                      </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </section>

        {/* --- MODALE --- */}
        {modalType && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h3 style={styles.modalTitle}>{selectedItem ? 'Modifier' : 'Nouveau'} {modalType}</h3>
              <form onSubmit={handleSave} style={styles.form}>
                {modalType === 'client' ? (
                  <>
                    <input style={styles.input} placeholder="Nom Complet" value={formData.nom || ''} onChange={e => setFormData({...formData, nom: e.target.value})} required />
                    <input style={styles.input} placeholder="Téléphone" value={formData.telephone || ''} onChange={e => setFormData({...formData, telephone: e.target.value})} required />
                    <input style={styles.input} type="email" placeholder="Email (Optionnel)" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </>
                ) : (
                  <>
                    <input style={styles.input} placeholder="Plaque (ex: CE 123 AA)" value={formData.plaque || ''} onChange={e => setFormData({...formData, plaque: e.target.value.toUpperCase()})} required />
                    <input style={styles.input} placeholder="Marque" value={formData.marque || ''} onChange={e => setFormData({...formData, marque: e.target.value})} />
                    <input style={styles.input} placeholder="Modèle" value={formData.modele || ''} onChange={e => setFormData({...formData, modele: e.target.value})} />
                    <select style={styles.input} value={formData.type_vehicule_id || ''} onChange={e => setFormData({...formData, type_vehicule_id: parseInt(e.target.value)})} required>
                        <option value="">Type...</option>
                        <option value="1">🏍️ Moto</option>
                        <option value="2">🚗 Voiture</option>
                    </select>
                    <select style={styles.input} value={formData.id_utilisateur || ''} onChange={e => setFormData({...formData, id_utilisateur: e.target.value})} required>
                      <option value="">Sélectionner Propriétaire...</option>
                      {data.clients.map(c => <option key={c.id_utilisateur} value={c.id_utilisateur}>{c.nom}</option>)}
                    </select>
                  </>
                )}
                <div style={styles.modalActions}>
                  <button type="submit" style={styles.primaryBtn}><Save size={18}/> Enregistrer</button>
                  <button type="button" onClick={() => setModalType(null)} style={styles.cancelBtn}>Annuler</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  dashboardLayout: { display: 'flex', height: '100vh', width: '100vw', background: '#0f172a', color: '#f8fafc', overflow: 'hidden' },
  sidebar: { width: '280px', background: '#111827', padding: '24px 0', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '35px', padding: '0 24px' },
  logoIcon: { background: theme.accent, width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#fff' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', margin: '0 20px 25px 20px' },
  avatar: { minWidth: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg, ${theme.accent}, #fff)`, color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },
  userName: { margin: 0, fontSize: '0.85rem', fontWeight: '600' },
  userRole: { margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', padding: '0 12px' },
  navItem: { padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s', fontSize: '0.9rem', borderRadius: '8px' },
  sidebarFooter: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { width: '100%', padding: '10px', background: 'transparent', border: '1px solid #ef444450', color: '#f87171', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  topHeader: { padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  pageTitle: { margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#fff' },
  pageSubtitle: { color: '#64748b', fontSize: '0.85rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' },
  topSearch: { background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem' },
  primaryBtn: { padding: '10px 18px', background: theme.accent, color: '#000', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  refreshBtn: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  liveTag: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '6px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' },
  pulseDot: { width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s infinite' },
  subNavBar: { display: 'flex', gap: '10px', padding: '15px 40px', background: '#0f172a' },
  subNavBtn: { padding: '8px 16px', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: '8px' },
  subNavActive: { padding: '8px 16px', background: theme.accent, color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '8px' },
  contentArea: { flex: 1, padding: '20px 40px', overflowY: 'auto' },
  tableCard: { background: '#1e293b', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '18px 24px', textAlign: 'left', background: '#0f172a', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' },
  td: { padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' },
  tr: { transition: 'background 0.2s' },
  priceTag: { color: theme.accent, fontWeight: '700' },
  timeLabel: { background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' },
  methodBadge: { background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', color: '#94a3b8' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' },
  actionBtnIn: { background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' },
  actionBtnOut: { background: 'transparent', border: '1px solid #ef4444', color: '#f87171', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' },
  iconEdit: { background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer', marginRight: '10px' },
  iconDel: { background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' },
  emptyCell: { padding: '40px', textAlign: 'center', color: '#64748b' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', padding: '35px', borderRadius: '20px', width: '420px', border: '1px solid rgba(255,255,255,0.1)' },
  modalTitle: { margin: '0 0 20px 0', fontSize: '1.25rem', color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '12px', borderRadius: '10px', outline: 'none' },
  modalActions: { display: 'flex', gap: '12px', marginTop: '10px' },
  cancelBtn: { flex: 1, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }
};