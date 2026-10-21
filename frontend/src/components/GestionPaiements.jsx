import React, { useState, useEffect, useCallback } from 'react';
import { theme } from '../Theme';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function GestionPaiements() {
  const [transactions, setTransactions] = useState([]);
  const [configMethods, setConfigMethods] = useState([]);
  const [filtre, setFiltre] = useState('TOUS');
  const [loading, setLoading] = useState(true);

  // 1. Chargement des données
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [resTrans, resConfig] = await Promise.all([
        fetch('http://localhost:5000/api/admin/transactions'),
        fetch('http://localhost:5000/api/admin/config-paiement')
      ]);

      if (!resTrans.ok || !resConfig.ok) throw new Error("Erreur serveur");

      const dataTrans = await resTrans.json();
      const dataConfig = await resConfig.json();

      setTransactions(Array.isArray(dataTrans) ? dataTrans : []);
      setConfigMethods(Array.isArray(dataConfig) ? dataConfig : []);
    } catch (err) {
      console.error("Erreur de chargement:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 2. Actions
  const handleToggle = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/config-paiement/toggle/${id}`, { method: 'PUT' });
      if (res.ok) fetchAllData();
    } catch (err) { alert("Erreur de mise à jour"); }
  };

  const handlePayment = async (id, methodeNom) => {
    if (!window.confirm(`Confirmer le règlement via ${methodeNom} ?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/transactions/valider/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methode: methodeNom })
      });
      if (res.ok) fetchAllData();
    } catch (err) { alert("Erreur lors du paiement"); }
  };

  // 3. Calculs pour le Graphique et les Stats
  const stats = transactions.reduce((acc, t) => {
    const val = parseFloat(t.montant) || 0;
    const type = (t.type_achat || "").toUpperCase();
    if (type === 'ABONNEMENT') acc.abo += val;
    else acc.passage += val;

    // Répartition par méthode pour le graphique
    if (t.methode_paiement && t.methode_paiement !== 'En attente') {
      acc.byMethod[t.methode_paiement] = (acc.byMethod[t.methode_paiement] || 0) + val;
    }
    return acc;
  }, { abo: 0, passage: 0, byMethod: {} });

  const pieData = Object.keys(stats.byMethod).map(name => ({
    name: name,
    value: stats.byMethod[name]
  }));

  const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#eab308'];

  const filteredData = transactions.filter(t => 
    filtre === 'TOUS' ? true : (t.type_achat || "").toUpperCase() === filtre
  );

  if (loading) return <div style={styles.loader}>Analyse des flux financiers...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.topGrid}>
        
        {/* CONFIGURATION */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Passerelles Actives</h3>
          {configMethods.map(method => (
            <div key={method.id} style={styles.methodRow}>
              <div style={styles.methodInfo}>
                <span>{method.logo}</span>
                <span style={styles.methodName}>{method.nom_methode}</span>
              </div>
              <label style={styles.switch} onClick={() => handleToggle(method.id)}>
                <div style={{...styles.slider, backgroundColor: method.est_actif ? theme.accent : '#334155'}}>
                  <div style={{...styles.dot, transform: method.est_actif ? 'translateX(18px)' : 'translateX(0)'}} />
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* GRAPHIQUE CIRCULAIRE */}
        <div style={styles.card}>
          <h3 style={styles.sectionTitle}>Répartition des Revenus</h3>
          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie 
                  data={pieData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => `${value.toLocaleString()} FCFA`}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RÉSUMÉ TOTAL */}
        <div style={{...styles.card, background: 'linear-gradient(135deg, #1e293b, #0f172a)'}}>
          <h3 style={styles.sectionTitle}>Chiffre d'Affaires Global</h3>
          <div style={styles.statsMain}>
             <div style={styles.statItem}>
                <span style={styles.statLabel}>Abonnements</span>
                <span style={{...styles.statVal, color: '#a855f7'}}>{stats.abo.toLocaleString()}</span>
             </div>
             <div style={styles.statItem}>
                <span style={styles.statLabel}>Passages</span>
                <span style={{...styles.statVal, color: '#3b82f6'}}>{stats.passage.toLocaleString()}</span>
             </div>
          </div>
          <div style={styles.totalBox}>
            <span style={styles.totalLabel}>TOTAL ENCAISSÉ</span>
            <span style={styles.totalVal}>{(stats.abo + stats.passage).toLocaleString()} <small style={{fontSize: '1rem'}}>FCFA</small></span>
          </div>
        </div>
      </div>

      {/* TABLEAU */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3>Journal des Transactions</h3>
          <div style={styles.filterGroup}>
            {['TOUS', 'ABONNEMENT', 'TARIF'].map(f => (
              <button key={f} onClick={() => setFiltre(f)} style={filtre === f ? styles.filterBtnActive : styles.filterBtn}>
                {f === 'TARIF' ? 'PASSAGES' : f}
              </button>
            ))}
          </div>
        </div>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Méthode</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((t, idx) => (
                <tr key={t.id_trans || idx} style={styles.tr}>
                  <td style={styles.td}>{t.date_paiement ? new Date(t.date_paiement).toLocaleDateString() : '---'}</td>
                  <td style={styles.td}>{t.client_nom || "Visiteur"}</td>
                  <td style={styles.td}>{t.methode_paiement || 'En attente'}</td>
                  <td style={{...styles.td, fontWeight: 'bold', color: theme.accent}}>
                    {parseFloat(t.montant).toLocaleString()} F
                  </td>
                  <td style={styles.td}>
                    {(!t.methode_paiement || t.methode_paiement === 'En attente') && (
                      <div style={{display: 'flex', gap: '5px'}}>
                        {configMethods.filter(m => m.est_actif).map(method => (
                          <button 
                            key={method.id}
                            onClick={() => handlePayment(t.id_trans, method.nom_methode)}
                            style={{...styles.actionBtn, backgroundColor: method.nom_methode === 'Espèces' ? '#22c55e' : theme.accent}}
                          >
                            {method.logo}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', color: '#fff', maxWidth: '1400px', margin: '0 auto' },
  topGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' },
  card: { background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' },
  sectionTitle: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '20px' },
  methodRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  methodInfo: { display: 'flex', gap: '10px', alignItems: 'center' },
  methodName: { fontSize: '0.9rem' },
  switch: { cursor: 'pointer' },
  slider: { width: '40px', height: '22px', borderRadius: '20px', padding: '3px', transition: '0.3s' },
  dot: { width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.3s' },
  statsMain: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  statItem: { display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '0.7rem', color: '#94a3b8' },
  statVal: { fontSize: '1.4rem', fontWeight: 'bold' },
  totalBox: { borderTop: '1px solid #334155', paddingTop: '15px', textAlign: 'center' },
  totalLabel: { fontSize: '0.6rem', color: theme.accent, fontWeight: 'bold' },
  totalVal: { display: 'block', fontSize: '2.4rem', fontWeight: '900' },
  tableCard: { background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', overflow: 'hidden' },
  tableHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a' },
  filterGroup: { display: 'flex', gap: '8px' },
  filterBtn: { background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem' },
  filterBtnActive: { background: theme.accent, color: '#0f172a', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', border: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px 20px', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', borderBottom: '2px solid #334155' },
  td: { padding: '16px 20px', fontSize: '0.85rem', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  actionBtn: { border: 'none', color: '#fff', padding: '8px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  loader: { padding: '100px', textAlign: 'center', color: '#94a3b8' }
};