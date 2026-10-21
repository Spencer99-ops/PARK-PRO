import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { theme } from '../Theme';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importez le plugin sous un nom précis
export default function GestionAbonnements() {
  const [tab, setTab] = useState('offres');
  const [offres, setOffres] = useState([]);
  const [abonnes, setAbonnes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDays, setFilterDays] = useState(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const [editingOffre, setEditingOffre] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ 
    nom: '', prix: 0, reduction: 0, duree_jours: 30, description: '' 
  });

  const refreshData = useCallback(() => {
    Promise.all([
      fetch('http://localhost:5000/api/admin/abonnements').then(res => res.json()),
      fetch('http://localhost:5000/api/admin/abonnes').then(res => res.json())
    ]).then(([offresData, abonnesData]) => {
      setOffres(Array.isArray(offresData) ? offresData : []);
      setAbonnes(Array.isArray(abonnesData) ? abonnesData : []);
    }).catch(err => console.error("Erreur:", err));
  }, []);

  useEffect(() => {
    refreshData();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    setTimeout(() => setIsChartReady(true), 400);
    return () => window.removeEventListener('resize', handleResize);
  }, [refreshData]);

  // --- LOGIQUE COMMERCIALE ---
  const forfaitPopulaire = useMemo(() => {
    if (abonnes.length === 0) return null;
    const counts = {};
    abonnes.forEach(a => { counts[a.forfait] = (counts[a.forfait] || 0) + 1; });
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }, [abonnes]);

  const abonnesFiltres = useMemo(() => {
    let list = abonnes.filter(a => a.nom?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterDays) {
      const today = new Date();
      const limit = new Date();
      limit.setDate(today.getDate() + filterDays);
      list = list.filter(a => {
        const dateFin = new Date(a.date_fin.split('/').reverse().join('-'));
        return dateFin <= limit && dateFin >= today;
      });
    }
    return list;
  }, [abonnes, searchTerm, filterDays]);

  const chiffreAffairesNet = useMemo(() => 
    abonnes.reduce((acc, curr) => acc + (parseFloat(curr.prix_net) || 0), 0)
  , [abonnes]);

  const statsData = useMemo(() => {
    const counts = {};
    abonnes.forEach(a => { counts[a.forfait] = (counts[a.forfait] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [abonnes]);

  const handleOpenAdd = () => {
    setFormData({ nom: '', prix: 0, reduction: 0, duree_jours: 30, description: '' });
    setIsAdding(true);
    setEditingOffre(true);
  };

  const handleOpenEdit = (offre) => {
    setEditingOffre(offre);
    setFormData({ 
      nom: offre.nom, prix: offre.prix, reduction: offre.reduction, 
      duree_jours: offre.duree_jours, description: offre.description || '' 
    });
    setIsAdding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isAdding 
      ? 'http://localhost:5000/api/admin/abonnements' 
      : `http://localhost:5000/api/admin/abonnements/update/${editingOffre.id_abo}`;
    
    try {
      const response = await fetch(url, {
        method: isAdding ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) { setEditingOffre(null); refreshData(); }
    } catch (err) { alert("Erreur serveur"); }
  };

const exportPDF = () => {
  try {
    const doc = new jsPDF();
    
    // 1. Force la police et désactive l'espacement entre caractères
    doc.setFont("helvetica", "normal");

    // 2. En-tête avec prix propre (séparation par espaces simples)
    const caNombre = parseFloat(chiffreAffairesNet) || 0;
    const caTexte = caNombre.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

    doc.setFontSize(18);
    doc.text("RAPPORT DES ABONNEMENTS", 14, 20);

    doc.setFontSize(11);
    doc.text(`Chiffre d'affaires total : ${caTexte} FCFA`, 14, 30);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 14, 37);

    // 3. Traitement des lignes
    const tableRows = abonnesFiltres.map(a => {
      // Nettoyage du prix (espace simple entre les milliers)
      const p = String(a.prix_net).replace(/[^0-9]/g, "");
      const pFormat = p.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      // On garde les / pour la date mais on s'assure que c'est une chaîne propre
      const datePropre = (a.date_fin || "").trim();

      return [
        (a.nom || "").trim(),
        (a.forfait || "").trim(),
        `${a.reduction || 0}%`,
        `${pFormat} FCFA`,
        datePropre // Les / reviennent ici
      ];
    });

    // 4. Génération du tableau avec l'option charSpace à 0
    autoTable(doc, {
      startY: 45,
      head: [["Client", "Forfait", "Remise", "Prix Net", "Echéance"]],
      body: tableRows,
      theme: 'grid',
      styles: { 
        font: "helvetica", 
        fontSize: 10,
        charSpace: 0, // SOLUTION ANTI-ESPACEMENT
        cellPadding: 3
      },
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    });

    doc.save("Rapport_Abonnements.pdf");
    
  } catch (error) {
    console.error("Erreur PDF:", error);
    alert("Erreur lors de l'export.");
  }
};
  const COLORS = [theme.accent, '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  return (
    <div style={styles.container}>
      <style>{`
        .card-hover { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .card-hover:hover { transform: translateY(-10px); border-color: ${theme.accent} !important; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6); }
        .btn-press:active { transform: scale(0.95); }
        .row-hover:hover { background: rgba(255,255,255,0.03) !important; }
        @keyframes pulse-gold { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); } 70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.mainTitle}>Gestion Commerciale</h2>
          <p style={styles.subtitle}>Pilotez vos offres et suivez vos revenus</p>
        </div>
        <button onClick={handleOpenAdd} style={styles.addBtn} className="btn-press">
          + Nouveau Forfait
        </button>
      </div>

      {/* STATS DASHBOARD */}
      <div style={{ ...styles.statsRow, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Revenu Global</span>
          <div style={styles.kpiValue}>{new Intl.NumberFormat('fr-FR').format(chiffreAffairesNet)} <small style={{fontSize: '0.9rem', color: '#64748b'}}>FCFA</small></div>
          <div style={{...styles.kpiTrend, color: '#10b981'}}>↑ {abonnes.length} ventes</div>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Abonnés Actifs</span>
          <div style={styles.kpiValue}>{abonnes.length}</div>
          <div style={styles.kpiTrend}>Répartis sur {offres.length} offres</div>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Répartition</span>
          <div style={{height: '70px', marginTop: '10px'}}>
             {isChartReady && (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart><Pie data={statsData} innerRadius={20} outerRadius={30} dataKey="value" paddingAngle={5} stroke="none">
                    {statsData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                 </Pie><Tooltip contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}/></PieChart>
               </ResponsiveContainer>
             )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={styles.tabContainer}>
        {['offres', 'liste'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{...styles.tabLink, color: tab === t ? theme.accent : '#64748b'}}>
            {t === 'offres' ? 'Catalogue Commercial' : 'Répertoire Clients'}
            {tab === t && <div style={styles.activeTabIndicator} />}
          </button>
        ))}
      </div>

      {/* CATALOGUE DES OFFRES */}
      {tab === 'offres' ? (
        <div style={styles.grid}>
          {offres.map((offre) => {
            const isPopular = offre.nom === forfaitPopulaire;
            return (
              <div key={offre.id_abo} style={{...styles.priceCard, border: isPopular ? `2px solid #f59e0b` : '1px solid #334155'}} className="card-hover">
                {isPopular && <div style={styles.popularBadge}>⭐ LE PLUS CHOISI</div>}
                <div style={styles.cardHeader}>
                  <span style={styles.daysBadge}>{offre.duree_jours} JOURS</span>
                  <button style={styles.trashBtn}>🗑️</button>
                </div>
                <h3 style={styles.offerTitle}>{offre.nom}</h3>
                <div style={styles.priceBox}>
                  <span style={styles.currency}>FCFA</span>
                  <span style={styles.amount}>{new Intl.NumberFormat('fr-FR').format(offre.prix)}</span>
                </div>
                {offre.reduction > 0 && <div style={styles.discountTag}>Économie de {offre.reduction}% incluse</div>}
                <div style={styles.featureList}>
                  {(offre.description || "Services standard inclus").split(/[;+,]/).map((feat, i) => (
                    <div key={i} style={styles.feature}>
                      <div style={styles.dot} /> <span style={styles.featureText}>{feat.trim()}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleOpenEdit(offre)} style={styles.editBtn} className="btn-press">Modifier les détails</button>
              </div>
            );
          })}
        </div>
      ) : (
        /* LISTE CLIENTS */
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <input style={styles.searchBar} placeholder="🔍 Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button onClick={exportPDF} style={styles.pdfBtn}>📄 Export PDF</button>
          </div>
          <div style={{overflowX: 'auto'}}>
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Client</th><th style={styles.th}>Forfait</th><th style={styles.th}>Échéance</th><th style={styles.th}>Prix Net</th></tr>
              </thead>
              <tbody>
                {abonnesFiltres.map(a => (
                  <tr key={a.id} style={styles.tr} className="row-hover">
                    <td style={styles.td}><strong>{a.nom}</strong></td>
                    <td style={styles.td}><span style={styles.badge}>{a.forfait}</span></td>
                    <td style={styles.td}>{a.date_fin}</td>
                    <td style={styles.td}><span style={styles.moneyText}>{new Intl.NumberFormat('fr-FR').format(a.prix_net)} FCFA</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL AMÉLIORÉ (PLUS COMPACT) */}
      {editingOffre && (
        <div style={styles.modalOverlay} onClick={() => setEditingOffre(null)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{isAdding ? "✨ Nouveau Forfait" : "⚙️ Configuration"}</h3>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Nom de l'offre</label>
                <input style={styles.input} value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="Ex: Premium" required />
              </div>

              <div style={styles.inputRow}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Prix (FCFA)</label>
                  <input type="number" style={styles.input} value={formData.prix} onChange={e => setFormData({...formData, prix: e.target.value})} required />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Remise (%)</label>
                  <input type="number" style={styles.input} value={formData.reduction} onChange={e => setFormData({...formData, reduction: e.target.value})} />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Durée de validité (Jours)</label>
                <input type="number" style={styles.input} value={formData.duree_jours} onChange={e => setFormData({...formData, duree_jours: e.target.value})} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Avantages (Séparés par ";" )</label>
                <textarea 
                  style={{...styles.input, minHeight: '80px', resize: 'none', fontSize: '0.9rem'}} 
                  placeholder="Parking couvert; Lavage offert..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setEditingOffre(null)} style={styles.cancelBtn}>Annuler</button>
                <button type="submit" style={styles.confirmBtn} className="btn-press">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '40px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' },
  mainTitle: { fontSize: '2.2rem', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' },
  subtitle: { color: '#64748b', margin: '5px 0 0 0' },
  addBtn: { background: theme.accent, color: '#000', border: 'none', padding: '14px 28px', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', transition: '0.3s' },
  
  statsRow: { display: 'grid', gap: '20px', marginBottom: '40px' },
  kpiCard: { background: '#1e293b', padding: '25px', borderRadius: '24px', border: '1px solid #334155' },
  kpiLabel: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' },
  kpiValue: { fontSize: '1.8rem', fontWeight: '900', margin: '10px 0' },
  kpiTrend: { fontSize: '0.85rem', fontWeight: '600' },

  tabContainer: { display: 'flex', gap: '40px', marginBottom: '35px', borderBottom: '1px solid #334155' },
  tabLink: { background: 'none', border: 'none', padding: '15px 5px', cursor: 'pointer', fontWeight: '700', fontSize: '1.05rem', position: 'relative' },
  activeTabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: theme.accent, borderRadius: '3px' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' },
  priceCard: { background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)', padding: '35px', borderRadius: '32px', position: 'relative', border: '1px solid #334155' },
  popularBadge: { position: 'absolute', top: '-15px', right: '30px', background: '#f59e0b', color: '#000', padding: '8px 18px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '900', animation: 'pulse-gold 2s infinite' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' },
  daysBadge: { background: 'rgba(255,255,255,0.05)', padding: '8px 14px', borderRadius: '12px', fontSize: '0.75rem', color: theme.accent, fontWeight: '800', border: '1px solid rgba(255,255,255,0.1)' },
  trashBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.3 },
  offerTitle: { fontSize: '1.6rem', fontWeight: '900', margin: '0 0 15px 0' },
  priceBox: { display: 'flex', alignItems: 'baseline', gap: '10px' },
  currency: { color: '#64748b', fontWeight: '800', fontSize: '1.1rem' },
  amount: { fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-1px' },
  discountTag: { color: '#ef4444', fontSize: '0.85rem', fontWeight: '800', margin: '15px 0', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-block', padding: '4px 12px', borderRadius: '8px' },
  featureList: { margin: '20px 0', paddingTop: '20px', borderTop: '1px solid #334155' },
  feature: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' },
  featureText: { fontSize: '0.95rem', color: '#cbd5e1' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', background: theme.accent, boxShadow: `0 0 8px ${theme.accent}` },
  editBtn: { width: '100%', padding: '16px', borderRadius: '18px', border: '1px solid #334155', background: 'rgba(255,255,255,0.03)', color: '#fff', fontWeight: '700', cursor: 'pointer' },

  tableCard: { background: '#1e293b', borderRadius: '28px', border: '1px solid #334155', overflow: 'hidden' },
  tableHeader: { padding: '25px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155' },
  searchBar: { background: '#0f172a', border: '1px solid #334155', padding: '12px 20px', borderRadius: '14px', color: '#fff', width: '300px' },
  pdfBtn: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 20px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '20px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '700' },
  td: { padding: '20px', borderBottom: '1px solid #334155' },
  badge: { color: theme.accent, fontWeight: '700' },
  moneyText: { color: '#10b981', fontWeight: '900' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 1000 },
  modalCard: { background: '#1e293b', padding: '30px', borderRadius: '32px', width: '90%', maxWidth: '480px', border: '1px solid #475569', animation: 'slideIn 0.3s ease-out' },
  modalTitle: { textAlign: 'center', marginBottom: '25px', fontWeight: '900', fontSize: '1.5rem' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  inputRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  label: { fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' },
  input: { background: '#0f172a', border: '1px solid #334155', padding: '12px 16px', borderRadius: '14px', color: '#fff', outline: 'none' },
  modalFooter: { display: 'flex', gap: '15px', marginTop: '15px' },
  confirmBtn: { flex: 2, background: theme.accent, border: 'none', padding: '16px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' },
  cancelBtn: { flex: 1, background: 'none', border: '1px solid #334155', color: '#fff', padding: '16px', borderRadius: '15px', cursor: 'pointer' }
};