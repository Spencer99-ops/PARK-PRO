import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  User, MapPin, Calendar, Clock, Info, RefreshCw, 
  LogOut, AlertCircle 
} from 'lucide-react';
import { theme } from '../Theme';

const API = "http://127.0.0.1:5000/api";

export default function DashboardClient({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('reserver');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ 
    placesLibres: [], 
    mesReservations: [], 
    formules: [], 
    tarifs: [],
    categories: [] 
  });

  const userId = useMemo(() => user?.id_utilisateur || user?.id, [user]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const endpoints = {
        placesLibres: `${API}/places/libres`,
        mesReservations: `${API}/client/reservations/${userId}`,
        tarifs: `${API}/tarifs`,
        formules: `${API}/abonnements/offres`,
        categories: `${API}/types-vehicules`
      };
      const results = {};
      await Promise.all(Object.entries(endpoints).map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          results[key] = res.ok ? await res.json() : [];
        } catch (e) { results[key] = []; }
      }));
      setData(prev => ({ ...prev, ...results }));
    } finally { setLoading(false); }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- LOGIQUE MÉTIER CONSERVÉE ---
  const handleReservation = async (idPlace) => {
    if (!window.confirm("Souhaitez-vous confirmer cette réservation ?")) return;
    try {
      const res = await fetch(`${API}/client/reserver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_place: idPlace, id_utilisateur: userId })
      });
      if (res.ok) { alert("Succès : Votre demande est en attente."); loadData(); }
    } catch (e) { alert("Erreur serveur"); }
  };

  const handleSouscription = async (idAbo, methode) => {
    const ref = prompt(`Référence paiement ${methode} :`);
    if (!ref) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/client/souscrire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_utilisateur: userId, id_abo: idAbo, methode_paiement: methode, reference: ref })
      });
      if (res.ok) { alert("Abonnement activé !"); loadData(); }
    } finally { setLoading(false); }
  };

  // --- CONFIG MENU ---
  const menuItems = [
    { id: 'reserver', icon: <MapPin size={20}/>, label: 'Places Libres' },
    { id: 'reservations', icon: <Clock size={20}/>, label: 'Mes Activités' },
    { id: 'abonnements', icon: <Calendar size={20}/>, label: 'S\'abonner' },
    { id: 'tarifs', icon: <Info size={20}/>, label: 'Grille Tarifaire' },
  ];

  const activeItem = menuItems.find(i => i.id === activeTab);

  return (
    <div style={styles.dashboardLayout}>
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
          .content-animate { animation: fadeIn 0.4s ease-out; }
          .nav-item:hover { background: rgba(255,255,255,0.05) !important; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        `}
      </style>

      {/* --- SIDEBAR (Copie Admin) --- */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>P</div>
          <h2 style={styles.logoText}>PARKING<span style={{ color: theme.accent }}>PRO</span></h2>
        </div>
        
        <div style={styles.userProfile}>
           <div style={styles.avatar}>{user?.nom?.charAt(0).toUpperCase() || 'C'}</div>
           <div style={{ overflow: 'hidden' }}>
             <p style={styles.userRole}>Espace Client</p>
             <p style={styles.userName}>{user?.nom || 'Utilisateur'}</p>
           </div>
        </div>

        <nav style={styles.nav} className="custom-scrollbar">
          {menuItems.map(item => (
            <div 
              key={item.id} 
              className="nav-item"
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                background: activeTab === item.id ? `${theme.accent}15` : 'transparent',
                color: activeTab === item.id ? theme.accent : '#94a3b8',
                borderLeft: activeTab === item.id ? `4px solid ${theme.accent}` : '4px solid transparent',
                fontWeight: activeTab === item.id ? '600' : '500',
              }}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
            <button onClick={onLogout} style={styles.logoutBtn}>
              <LogOut size={18} /> Déconnexion
            </button>
        </div>
      </aside>

      {/* --- CONTENT AREA (Copie Admin) --- */}
      <main style={styles.main}>
        <header style={styles.topHeader}>
            <div>
                <h1 style={styles.pageTitle}>{activeItem?.label}</h1>
                <p style={styles.pageSubtitle}>Bienvenue dans votre interface client sécurisée</p>
            </div>
            <div style={styles.headerRight}>
                <button onClick={loadData} style={styles.refreshBtn}>
                    <RefreshCw size={18} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                </button>
                <div style={styles.liveTag}>
                    <span style={styles.pulseDot}></span> CONNECTÉ
                </div>
            </div>
        </header>

        <section style={styles.contentArea} className="content-animate" key={activeTab}>
          
          {/* TAB: RESERVER */}
          {activeTab === 'reserver' && (
            <div style={styles.gridContainer}>
              {data.placesLibres.length > 0 ? data.placesLibres.map(p => (
                <div key={p.id_place} style={styles.card}>
                  <div style={styles.placeBadge}>DISPONIBLE</div>
                  <div style={styles.cardIconBox}><MapPin size={24} color={theme.accent}/></div>
                  <h3 style={{margin: '10px 0 5px'}}>Place {p.numero}</h3>
                  <p style={{color: '#64748b', fontSize: '0.85rem', marginBottom: '20px'}}>{p.type_p || 'Standard'}</p>
                  <button onClick={() => handleReservation(p.id_place)} style={styles.primaryBtn}>Réserver</button>
                </div>
              )) : (
                <div style={styles.placeholderCard}>
                   <AlertCircle size={48} color="#64748b" />
                   <p>Aucune place disponible pour le moment.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: TARIFS (Tableau style Admin) */}
          {activeTab === 'tarifs' && (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Catégorie</th>
                    <th style={styles.th}>Intervalle</th>
                    <th style={styles.th}>Prix</th>
                    <th style={styles.th}>Méthode</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tarifs.map((t, i) => {
                    const cat = data.categories?.find(c => String(c.id_type) === String(t.id_type_vehicule));
                    return (
                      <tr key={i} style={styles.tr}>
                        <td style={styles.td}>
                           <span style={{marginRight: '8px'}}>{cat?.icone || '🚗'}</span>
                           {cat?.nom_categorie || 'Véhicule'}
                        </td>
                        <td style={styles.td}>{t.minute_debut} - {t.minute_fin === "\\N" ? '∞' : t.minute_fin} min</td>
                        <td style={styles.td}><span style={styles.priceTag}>{t.montant} XAF</span></td>
                        <td style={styles.td}><span style={styles.methodBadge}>{t.methode}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB: ABONNEMENTS */}
          {activeTab === 'abonnements' && (
             <div style={styles.gridContainer}>
                {data.formules.map(f => (
                  <div key={f.id_abo} style={{...styles.card, border: `1px solid ${theme.accent}30`}}>
                    <h2 style={{fontSize: '1.25rem', marginBottom: '5px'}}>{f.nom}</h2>
                    <div style={{fontSize: '2rem', fontWeight: '800', color: theme.accent, margin: '15px 0'}}>
                      {f.prix} <span style={{fontSize: '0.9rem'}}>XAF</span>
                    </div>
                    <div style={styles.aboInfo}>
                       <span>⏱ {f.duree} Jours</span>
                       <span>📉 -{f.reduction}%</span>
                    </div>
                    <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                      <button onClick={() => handleSouscription(f.id_abo, 'OM')} style={styles.omBtn}>OM</button>
                      <button onClick={() => handleSouscription(f.id_abo, 'Momo')} style={styles.momoBtn}>MoMo</button>
                    </div>
                  </div>
                ))}
             </div>
          )}

          {/* TAB: ACTIVITES */}
          {activeTab === 'reservations' && (
            <div style={styles.tableCard}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Emplacement</th>
                    <th style={styles.th}>Date Demande</th>
                    <th style={styles.th}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mesReservations.map((res, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}><strong>Place {res.numero_place}</strong></td>
                      <td style={styles.td}>{new Date(res.date_demande).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          color: res.statut === 'validee' ? '#4ade80' : '#fbbf24',
                          background: res.statut === 'validee' ? '#4ade8015' : '#fbbf2415'
                        }}>
                          {res.statut.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  dashboardLayout: { display: 'flex', height: '100vh', width: '100vw', background: '#0f172a', color: '#f8fafc', overflow: 'hidden' },
  sidebar: { width: '280px', background: '#111827', padding: '24px 0', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '35px', padding: '0 24px' },
  logoIcon: { background: theme.accent, width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#000' },
  logoText: { margin: 0, fontSize: '1.25rem', fontWeight: '900' },
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
  pageTitle: { margin: 0, fontSize: '1.75rem', fontWeight: '700' },
  pageSubtitle: { color: '#64748b', fontSize: '0.85rem' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  refreshBtn: { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  liveTag: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '6px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' },
  pulseDot: { width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s infinite' },
  contentArea: { flex: 1, padding: '30px 40px', overflowY: 'auto' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' },
  card: { background: '#1e293b', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', position: 'relative', transition: 'transform 0.2s' },
  cardIconBox: { width: '50px', height: '50px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
  placeBadge: { position: 'absolute', top: '15px', right: '15px', fontSize: '0.65rem', fontWeight: 'bold', background: '#10b98120', color: '#10b981', padding: '4px 8px', borderRadius: '5px' },
  primaryBtn: { width: '100%', padding: '12px', background: theme.accent, color: '#000', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
  tableCard: { background: '#1e293b', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '18px 24px', textAlign: 'left', background: '#0f172a', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' },
  td: { padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' },
  priceTag: { color: theme.accent, fontWeight: '700' },
  methodBadge: { background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', color: '#94a3b8' },
  statusBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' },
  aboInfo: { display: 'flex', justifyContent: 'center', gap: '15px', color: '#94a3b8', fontSize: '0.85rem' },
  omBtn: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #ff6600', color: '#ff6600', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  momoBtn: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #ffcc00', color: '#ffcc00', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  placeholderCard: { gridColumn: '1/-1', background: '#1e293b', padding: '60px', borderRadius: '20px', textAlign: 'center', color: '#64748b' }
};