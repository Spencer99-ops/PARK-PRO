import React, { useState, useEffect } from 'react';
import { theme } from '../Theme';

export default function GestionTarifs() {
  const [types, setTypes] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [viewMode, setViewMode] = useState('cards');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    minute_debut: 0, minute_fin: '', montant: 0, methode: 'FIXE'
  });

  const fetchData = async () => {
    try {
      const [resTypes, resTarifs] = await Promise.all([
        fetch('http://localhost:5000/api/types-vehicules'),
        fetch('http://localhost:5000/api/tarifs')
      ]);
      const dataTypes = await resTypes.json();
      const dataTarifs = await resTarifs.json();
      setTypes(dataTypes);
      setTarifs(dataTarifs);
      if (dataTypes.length > 0 && !selectedType) setSelectedType(dataTypes[0]);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `http://localhost:5000/api/tarifs/${editingId}` : 'http://localhost:5000/api/tarifs';
    const payload = { ...formData, id_type_vehicule: selectedType.id_type, minute_fin: formData.minute_fin === '' ? null : parseInt(formData.minute_fin) };
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) { setShowModal(false); fetchData(); }
    } catch (err) { alert("Erreur"); }
  };

  const tarifsFiltrés = tarifs.filter(t => t.id_type_vehicule === selectedType?.id_type);

  return (
    <div style={styles.mainWrapper}>
      <div style={styles.contentContainer}>
        {/* Header avec boutons alignés à droite proprement */}
        <div style={styles.headerSection}>
          <div style={styles.headerText}>
            <h2 style={styles.title}>Tarification</h2>
            <p style={styles.subtitle}>Gérez vos paliers de prix</p>
          </div>
          <div style={styles.headerActions}>
            <div style={styles.viewToggle}>
              <button onClick={() => setViewMode('cards')} style={{...styles.toggleBtn, background: viewMode === 'cards' ? theme.accent : 'transparent', color: viewMode === 'cards' ? '#000' : '#fff'}}>Grille</button>
              <button onClick={() => setViewMode('list')} style={{...styles.toggleBtn, background: viewMode === 'list' ? theme.accent : 'transparent', color: viewMode === 'list' ? '#000' : '#fff'}}>Liste</button>
            </div>
            <button onClick={() => { setIsEditing(false); setShowModal(true); }} style={styles.addBtnMain}>+ Nouveau</button>
          </div>
        </div>

        {/* Sélecteur de type avec scroll horizontal si trop long */}
        <div style={styles.typeSelectorWrapper}>
          <div style={styles.typeSelector}>
            {types.map(t => (
              <div key={t.id_type} onClick={() => setSelectedType(t)} style={{
                  ...styles.typeTab,
                  background: selectedType?.id_type === t.id_type ? `${theme.accent}20` : '#1e293b',
                  borderColor: selectedType?.id_type === t.id_type ? theme.accent : '#334155',
                  color: selectedType?.id_type === t.id_type ? theme.accent : '#94a3b8'
                }}>
                <span>{t.icone}</span>
                <span style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{t.nom_categorie}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone de contenu scrollable verticalement */}
        <div style={styles.scrollArea}>
          {tarifsFiltrés.length > 0 ? (
            viewMode === 'cards' ? (
              <div style={styles.cardsGrid}>
                {tarifsFiltrés.map((t, index) => (
                  <div key={t.id_tarif} style={styles.tarifCard}>
                    <div style={styles.cardHeader}>
                      <span style={styles.indexLabel}>PALIER {index + 1}</span>
                      <span style={t.methode === 'FIXE' ? styles.badgeF : styles.badgeH}>{t.methode}</span>
                    </div>
                    <div style={styles.priceBox}>
                      <span style={styles.amountText}>{t.montant}</span>
                      <span style={styles.currencyText}>FCFA{t.methode === 'HEURE' ? '/h' : ''}</span>
                    </div>
                    <div style={styles.timeInfoBox}>
                      <span>{t.minute_debut}m</span>
                      <div style={styles.separatorLine}></div>
                      <span>{t.minute_fin || '∞'}m</span>
                    </div>
                    <div style={styles.cardFooter}>
                      <button style={styles.editBtn} onClick={() => { setIsEditing(true); setEditingId(t.id_tarif); setFormData(t); setShowModal(true); }}>Modifier</button>
                      <button style={styles.delBtn} onClick={() => { if(window.confirm("Supprimer?")) fetch(`http://localhost:5000/api/tarifs/${t.id_tarif}`, {method:'DELETE'}).then(fetchData) }}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Intervalle</th>
                      <th style={styles.th}>Montant</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarifsFiltrés.map(t => (
                      <tr key={t.id_tarif}>
                        <td style={styles.td}>{t.minute_debut} - {t.minute_fin || '∞'} min</td>
                        <td style={{...styles.td, color: theme.accent}}>{t.montant} FCFA</td>
                        <td style={styles.td}>
                          <button style={styles.actionBtn} onClick={() => { setIsEditing(true); setEditingId(t.id_tarif); setFormData(t); setShowModal(true); }}>✏️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div style={styles.empty}>Aucun tarif trouvé.</div>
          )}
        </div>
      </div>

      {/* Modal ajusté */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>{isEditing ? 'Modifier' : 'Nouveau'}</h3>
            <div style={styles.formRow}>
              <input type="number" placeholder="Début" style={styles.input} value={formData.minute_debut} onChange={e => setFormData({...formData, minute_debut: e.target.value})} />
              <input type="number" placeholder="Fin" style={styles.input} value={formData.minute_fin} onChange={e => setFormData({...formData, minute_fin: e.target.value})} />
            </div>
            <div style={{...styles.formRow, marginTop: '10px'}}>
              <input type="number" placeholder="Prix" style={styles.input} value={formData.montant} onChange={e => setFormData({...formData, montant: e.target.value})} />
              <select style={styles.input} value={formData.methode} onChange={e => setFormData({...formData, methode: e.target.value})}>
                <option value="FIXE">FIXE</option>
                <option value="HEURE">/ HEURE</option>
              </select>
            </div>
            <div style={styles.modalActions}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>Annuler</button>
              <button onClick={handleSave} style={styles.saveBtn}>Valider</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  mainWrapper: {
    width: '100%',
    height: '100vh',
    background: '#0f172a',
    display: 'flex',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden'
  },
  contentContainer: {
    width: '100%',
    maxWidth: '1200px', // Limite la largeur max pour la lisibilité
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap', // Évite que les boutons sortent sur petit écran
    gap: '15px'
  },
  title: { color: '#fff', margin: 0, fontSize: '1.4rem' },
  subtitle: { color: '#64748b', margin: 0, fontSize: '0.85rem' },
  headerActions: { display: 'flex', gap: '10px', alignItems: 'center' },
  
  typeSelectorWrapper: { width: '100%', overflowX: 'auto', marginBottom: '20px', scrollbarWidth: 'none' },
  typeSelector: { display: 'flex', gap: '10px', paddingBottom: '5px' },
  typeTab: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', borderRadius: '12px', border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap' },

  scrollArea: { flexGrow: 1, overflowY: 'auto', paddingRight: '5px' },
  cardsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' },
  
  tarifCard: { background: '#1e293b', borderRadius: '15px', padding: '15px', border: '1px solid #334155' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
  indexLabel: { fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'bold' },
  badgeF: { color: '#f59e0b', fontSize: '0.6rem', fontWeight: 'bold', background: '#f59e0b10', padding: '2px 8px', borderRadius: '5px' },
  badgeH: { color: '#3b82f6', fontSize: '0.6rem', fontWeight: 'bold', background: '#3b82f610', padding: '2px 8px', borderRadius: '5px' },
  
  priceBox: { textAlign: 'center', margin: '15px 0' },
  amountText: { fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' },
  currencyText: { fontSize: '0.75rem', color: '#64748b', marginLeft: '5px' },
  
  timeInfoBox: { display: 'flex', alignItems: 'center', gap: '10px', background: '#0f172a', padding: '8px', borderRadius: '10px', fontSize: '0.8rem', color: '#94a3b8' },
  separatorLine: { flex: 1, height: '1px', background: '#334155' },
  
  cardFooter: { display: 'flex', gap: '8px', marginTop: '15px' },
  editBtn: { flex: 1, background: '#334155', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' },
  delBtn: { background: 'transparent', border: 'none', cursor: 'pointer' },

  addBtnMain: { background: theme.accent, color: '#000', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  viewToggle: { background: '#1e293b', padding: '4px', borderRadius: '10px', display: 'flex' },
  toggleBtn: { border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', cursor: 'pointer' },

  tableWrapper: { background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '12px', background: '#0f172a', color: '#64748b' },
  td: { padding: '12px', color: '#cbd5e1', borderBottom: '1px solid #334155' },
  actionBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', padding: '25px', borderRadius: '20px', width: '320px', border: '1px solid #334155' },
  modalTitle: { color: '#fff', margin: '0 0 15px 0' },
  formRow: { display: 'flex', gap: '10px' },
  input: { background: '#0f172a', border: '1px solid #334155', padding: '10px', borderRadius: '10px', color: '#fff', width: '100%', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  cancelBtn: { flex: 1, background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' },
  saveBtn: { flex: 1, background: theme.accent, color: '#000', padding: '10px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' },
  empty: { textAlign: 'center', padding: '40px', color: '#64748b' }
};