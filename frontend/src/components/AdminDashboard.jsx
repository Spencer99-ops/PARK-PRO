import React, { useState, useMemo } from 'react';
import { theme } from '../Theme';

// Importations des composants existants
import AdminStats from './AdminStats';
import NotificationsTab from './NotificationsTab';
import ReservationsTab from './ReservationsTab';
import GestionPlaces from './GestionPlaces';
import GestionAbonnements from './GestionAbonnements';
import GestionTarifs from './GestionTarifs';
import GestionPaiements from './GestionPaiements';
import ConfigurationBanque from './ConfigurationBanque';
import GestionClients from './GestionClients';
import GestionVehicules from './GestionVehicules'; // Le registre des entrées/sorties
import GestionPersonnel from './GestionPersonnel'; // La gestion des agents/admins



export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('statistiques');

  // Configuration du menu latéral
  const menuItems = useMemo(() => [
    { id: 'statistiques', icon: '📊', label: 'Statistiques' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'reservations', icon: '📅', label: 'Réservations' },
    { id: 'places', icon: '🅿️', label: 'Gestion Places' },
    { id: 'vehicules', icon: '🚗', label: 'Véhicules' }, // <-- Nouveau
    { id: 'abonnements', icon: '💎', label: 'Abonnements' },
    { id: 'tarifs', icon: '💰', label: 'Tarifs' },
    { id: 'paiements', icon: '💳', label: 'Paiements' },
    { id: 'config_banque', icon: '⚙️', label: 'Configuration Banque' },
    { id: 'clients', icon: '👥', label: 'Clients' },
    { id: 'personnel', icon: '🛠️', label: 'Personnel' }, // <-- Nouveau
  ], []);

  const activeItem = menuItems.find(i => i.id === activeTab);

  // Moteur de rendu des composants
  const renderContent = () => {
    switch (activeTab) {
      case 'statistiques': return <AdminStats />;
      case 'notifications': return <NotificationsTab />;
      case 'reservations': return <ReservationsTab />;
      case 'places': return <GestionPlaces />;
      case 'vehicules': return <GestionVehicules />;
      case 'abonnements': return <GestionAbonnements />;
      case 'tarifs': return <GestionTarifs />;
      case 'paiements': return <GestionPaiements />;
      case 'config_banque': return <ConfigurationBanque />;
      case 'clients': return <GestionClients />;
      case 'personnel': return <GestionPersonnel />;
      default:
        return (
          <div style={styles.placeholderCard}>
            <div style={styles.placeholderIcon}>{activeItem?.icon}</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem' }}>Module {activeItem?.label}</h3>
            <p style={{ color: theme.textMuted, maxWidth: '450px', margin: '0 auto', lineHeight: '1.6' }}>
              Cette section est en cours d'initialisation pour le compte de <strong>{user?.nom}</strong>.
            </p>
          </div>
        );
    }
  };

  return (
    <div style={styles.dashboardLayout}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
          .content-animate { animation: fadeIn 0.4s ease-out; }
          .nav-item:hover { background: rgba(255,255,255,0.05) !important; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; borderRadius: 10px; }
        `}
      </style>

      {/* --- SIDEBAR --- */}
      <aside style={styles.sidebar}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>P</div>
          <h2 style={styles.logoText}>PARKING<span style={{ color: theme.accent }}>PRO</span></h2>
        </div>
        
        <div style={styles.userProfile}>
           <div style={styles.avatar}>{user?.nom?.charAt(0).toUpperCase() || 'A'}</div>
           <div style={{ overflow: 'hidden' }}>
             <p style={styles.userRole}>Administrateur</p>
             <p style={styles.userName}>{user?.nom || 'Admin System'}</p>
           </div>
        </div>

        <nav style={styles.nav} className="custom-scrollbar">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <div 
                key={item.id} 
                className="nav-item"
                onClick={() => setActiveTab(item.id)}
                style={{
                  ...styles.navItem,
                  background: isActive ? `${theme.accent}15` : 'transparent',
                  color: isActive ? theme.accent : '#94a3b8',
                  borderLeft: isActive ? `4px solid ${theme.accent}` : '4px solid transparent',
                  fontWeight: isActive ? '600' : '500',
                }}
              >
                <span style={{ fontSize: '1.2rem', filter: isActive ? 'none' : 'grayscale(1)' }}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
            <button onClick={onLogout} style={styles.logoutBtn}>
              <span>🚪</span> Déconnexion
            </button>
        </div>
      </aside>

      {/* --- CONTENU PRINCIPAL --- */}
      <main style={styles.main}>
        <header style={styles.topHeader}>
            <div>
                <h1 style={styles.pageTitle}>{activeItem?.label}</h1>
                <p style={styles.pageSubtitle}>Pilotage de l'infrastructure ParkingPro</p>
            </div>
            <div style={styles.headerRight}>
                <div style={styles.liveTag}>
                    <span style={styles.pulseDot}></span> SYSTÈME EN LIGNE
                </div>
            </div>
        </header>

        <section style={styles.contentArea} className="content-animate" key={activeTab}>
            {renderContent()}
        </section>
      </main>
    </div>
  );
}

const styles = {
  dashboardLayout: { 
    display: 'flex', height: '100vh', width: '100vw', 
    background: '#0f172a', color: '#f8fafc', overflow: 'hidden' 
  },
  sidebar: { 
    width: '280px', background: '#111827', padding: '24px 0', 
    display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' 
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '35px', padding: '0 24px' },
  logoIcon: { 
    background: theme.accent, width: '36px', height: '36px', borderRadius: '10px', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#000' 
  },
  logoText: { margin: 0, fontSize: '1.25rem', fontWeight: '900' },
  userProfile: { 
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
    background: 'rgba(255,255,255,0.03)', borderRadius: '12px', margin: '0 20px 25px 20px' 
  },
  avatar: { 
    minWidth: '38px', height: '38px', borderRadius: '50%', 
    background: `linear-gradient(135deg, ${theme.accent}, #fff)`, color: '#000', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' 
  },
  userName: { margin: 0, fontSize: '0.85rem', fontWeight: '600' },
  userRole: { margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', padding: '0 12px' },
  navItem: { 
    padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
    gap: '12px', transition: 'all 0.2s', fontSize: '0.9rem', borderRadius: '8px' 
  },
  sidebarFooter: { padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { 
    width: '100%', padding: '10px', background: 'transparent', border: '1px solid #ef444450', 
    color: '#f87171', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', gap: '8px' 
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column' },
  topHeader: { 
    padding: '24px 40px', display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.05)' 
  },
  pageTitle: { margin: 0, fontSize: '1.75rem', fontWeight: '700' },
  pageSubtitle: { color: '#64748b', fontSize: '0.85rem' },
  contentArea: { flex: 1, padding: '30px 40px', overflowY: 'auto' },
  liveTag: { 
    display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', 
    color: '#4ade80', padding: '6px 14px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' 
  },
  pulseDot: { 
    width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', 
    animation: 'pulse 1.5s infinite' 
  },
  placeholderCard: { 
    background: '#1e293b', padding: '80px 40px', borderRadius: '20px', 
    textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' 
  },
  placeholderIcon: { fontSize: '4rem', marginBottom: '20px', display: 'block' }
};