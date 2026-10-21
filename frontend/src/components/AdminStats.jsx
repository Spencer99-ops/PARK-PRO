import React, { useEffect, useState, useCallback } from 'react';
import { theme } from '../Theme';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminStats() {
  const [dbStats, setDbStats] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  
  // État pour gérer la largeur de l'écran
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('http://localhost:5000/api/stats').then(res => res.json()),
      fetch('http://localhost:5000/api/admin/places').then(res => res.json())
    ])
    .then(([statsData, placesData]) => {
      setDbStats(statsData);
      setPlaces(placesData);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Erreur de chargement:", err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => setIsChartReady(true), 200);
    const interval = setInterval(loadData, 10000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [loadData]);

  if (!dbStats) return <div style={styles.loading}>Initialisation du dashboard...</div>;

  // Calcul du taux d'occupation dynamique
  const occupationActuelle = dbStats.total_places > 0 
    ? Math.round(((dbStats.total_places - dbStats.places_libres) / dbStats.total_places) * 100) 
    : 0;

  const chartData = [
    { name: 'Lun', occupation: 20 }, { name: 'Mar', occupation: 45 },
    { name: 'Mer', occupation: 30 }, { name: 'Jeu', occupation: 70 },
    { name: 'Ven', occupation: 85 }, { name: 'Sam', occupation: 60 },
    { name: 'Dim', occupation: occupationActuelle },
  ];

  return (
    <div style={styles.container}>
      {/* HEADER RESPONSIVE */}
      <div style={{...styles.header, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center'}}>
        <div style={{ marginBottom: isMobile ? '15px' : '0' }}>
          <h2 style={styles.title}>Tableau de bord</h2>
          <p style={styles.subtitle}>Supervision de l'activité du parking</p>
        </div>
        <button onClick={loadData} disabled={loading} style={styles.refreshBtn}>
          {loading ? "Chargement..." : "🔄 Actualiser"}
        </button>
      </div>
      
      {/* GRILLE STATS : 5 CARTES */}
      <div style={styles.statsGrid}>
        {[
          { label: "Capacité", value: dbStats.total_places || 0, icon: "🅿️", color: "#3498db" },
          { label: "Libres", value: dbStats.places_libres || 0, icon: "✅", color: theme.success },
          { label: "Réservations", value: dbStats.total_reservations || 0, icon: "📅", color: "#e67e22" },
          { label: "Actives", value: dbStats.res_validees || 0, icon: "⏳", color: "#f1c40f" },
          { label: "Clients", value: dbStats.total_clients || 0, icon: "👥", color: "#9b59b6" },
        ].map((card, i) => (
          <div key={i} style={styles.card}>
            <div style={{...styles.iconWrapper, backgroundColor: `${card.color}20`, color: card.color}}>
              {card.icon}
            </div>
            <div>
              <div style={styles.cardValue}>{card.value}</div>
              <div style={styles.cardLabel}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{
        ...styles.mainContent,
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr'
      }}>
        
        {/* GRAPHIQUE */}
        <div style={styles.chartSection}>
          <h3 style={styles.sectionTitle}>Analyse d'occupation (%)</h3>
          <div style={{ width: '100%', height: isMobile ? 250 : 300 }}>
            {isChartReady && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                  <XAxis dataKey="name" stroke={theme.textMuted} fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke={theme.textMuted} fontSize={10} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={styles.tooltip} />
                  <Area type="monotone" dataKey="occupation" stroke={theme.primary} fill="url(#colorOcc)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* TABLEAU DES PLACES */}
        <div style={styles.tableSection}>
          <h3 style={styles.sectionTitle}>Disponibilité en direct</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>N°</th>
                  <th style={styles.th}>TYPE</th>
                  <th style={styles.th}>STATUT</th>
                </tr>
              </thead>
              <tbody>
                {places.map((place) => (
                  <tr key={place.id} style={styles.tr}>
                    <td style={styles.tdNum}>{place.numero}</td>
                    <td style={styles.td}>{place.type || 'Std'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: place.etat === 'libre' ? `${theme.success}20` : `${theme.danger}20`,
                        color: place.etat === 'libre' ? theme.success : theme.danger,
                        padding: '4px 8px',
                        fontSize: '0.65rem'
                      }}>
                        {place.etat.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '15px', color: theme.text, maxWidth: '1400px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px' },
  title: { fontSize: '1.6rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { color: theme.textMuted, fontSize: '0.85rem', marginTop: '4px' },
  refreshBtn: { 
    padding: '10px 18px', borderRadius: '12px', backgroundColor: theme.card, 
    color: theme.text, border: `1px solid ${theme.border}`, cursor: 'pointer',
    fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s'
  },
  statsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
    gap: '15px', 
    marginBottom: '30px' 
  },
  card: { 
    background: theme.card, padding: '20px', borderRadius: '20px', 
    border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: '15px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  iconWrapper: { width: '45px', height: '45px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' },
  cardValue: { fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.2' },
  cardLabel: { color: theme.textMuted, fontSize: '0.75rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' },
  mainContent: { display: 'grid', gap: '20px' },
  chartSection: { background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}`, minWidth: 0 },
  tableSection: { background: theme.card, padding: '25px', borderRadius: '24px', border: `1px solid ${theme.border}` },
  sectionTitle: { fontSize: '1.1rem', marginBottom: '20px', fontWeight: '700', color: theme.text },
  tableWrapper: { overflowY: 'auto', maxHeight: '350px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 10px', color: theme.textMuted, fontSize: '0.7rem', borderBottom: `1px solid ${theme.border}`, textTransform: 'uppercase' },
  tr: { borderBottom: `1px solid ${theme.border}`, transition: 'background 0.2s' },
  tdNum: { padding: '15px 10px', fontWeight: '800', fontSize: '0.9rem', color: theme.primary },
  td: { padding: '15px 10px', fontSize: '0.85rem' },
  statusBadge: { borderRadius: '8px', fontWeight: '800', letterSpacing: '0.5px' },
  tooltip: { backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '12px', fontSize: '12px', color: theme.text, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' },
  loading: { color: theme.text, padding: '100px', textAlign: 'center', fontSize: '1.1rem', fontWeight: '600' }
};