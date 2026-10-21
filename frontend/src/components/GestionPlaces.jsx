import React, { useState, useEffect } from 'react';
import { theme } from '../Theme';

export default function GestionPlaces() {
  const [places, setPlaces] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'table'
  const [editingPlace, setEditingPlace] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlace, setNewPlace] = useState({ numero: '', type: 'Standard' });

  // 1. Charger les places depuis le serveur
  const fetchPlaces = () => {
    fetch('http://localhost:5000/api/admin/places')
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error("Erreur de chargement:", err));
  };

  useEffect(() => { fetchPlaces(); }, []);

  // 2. Ajouter une place (Route: /api/admin/places/ajouter)
  const handleAdd = (e) => {
    e.preventDefault();
    fetch('http://localhost:5000/api/admin/places/ajouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlace)
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) alert(data.error);
      else {
        setShowAddModal(false);
        setNewPlace({ numero: '', type: 'Standard' });
        fetchPlaces();
      }
    });
  };

  // 3. Modifier une place (Route: /api/admin/places/update/<id>)
  const handleUpdate = (e) => {
    e.preventDefault();
    fetch(`http://localhost:5000/api/admin/places/update/${editingPlace.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: editingPlace.numero,
        type: editingPlace.type,
        etat: editingPlace.etat
      })
    })
    .then(() => {
      setEditingPlace(null);
      fetchPlaces();
    });
  };

  // 4. Supprimer une place (Route: /api/admin/places/supprimer/<id>)
  const handleDelete = (id, numero) => {
    if (window.confirm(`Confirmer la suppression de la place ${numero} ?`)) {
      fetch(`http://localhost:5000/api/admin/places/supprimer/${id}`, {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        else fetchPlaces();
      });
    }
  };

  const getTypeColor = (type) => {
    if (type === 'Premium') return theme.accent;
    if (type === 'Handicapé') return '#3b82f6';
    return '#94a3b8'; // Standard
  };

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.viewSwitch}>
          <button onClick={() => setViewMode('grid')} style={{...styles.switchBtn, background: viewMode === 'grid' ? theme.accent : 'transparent', color: viewMode === 'grid' ? '#000' : '#fff'}}>Logistique (Grille)</button>
          <button onClick={() => setViewMode('table')} style={{...styles.switchBtn, background: viewMode === 'table' ? theme.accent : 'transparent', color: viewMode === 'table' ? '#000' : '#fff'}}>Données (Tableau)</button>
        </div>
        <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>+ Ajouter une Place</button>
      </div>

      {/* --- VUE GRILLE --- */}
      {viewMode === 'grid' ? (
        <div style={styles.gridContainer}>
          {places.map(p => (
            <div key={p.id} style={{
              ...styles.placeBox,
              border: `2px solid ${getTypeColor(p.type)}`,
              background: p.etat === 'occupe' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.05)'
            }}>
              <button onClick={() => handleDelete(p.id, p.numero)} style={styles.deleteBadge}>×</button>
              <div onClick={() => setEditingPlace(p)} style={styles.clickableArea}>
                <span style={styles.placeNum}>{p.numero}</span>
                <span style={{...styles.placeTypeLabel, color: getTypeColor(p.type)}}>{p.type}</span>
              </div>
              <div style={{...styles.statusDot, background: p.etat === 'libre' ? theme.success : theme.danger}} />
            </div>
          ))}
        </div>
      ) : (
        /* --- VUE TABLEAU --- */
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Numéro</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>État</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.map(p => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}><strong>{p.numero}</strong></td>
                  <td style={styles.td}>{p.type}</td>
                  <td style={styles.td}>
                    <span style={{color: p.etat === 'libre' ? theme.success : theme.danger}}>● {p.etat}</span>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => setEditingPlace(p)} style={styles.editBtn}>Modifier</button>
                    <button onClick={() => handleDelete(p.id, p.numero)} style={styles.deleteBtn}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODAL AJOUT --- */}
      {showAddModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{marginTop: 0, color: theme.accent}}>Nouvelle Place</h3>
            <form onSubmit={handleAdd} style={styles.form}>
              <input 
                placeholder="Numéro (ex: B-202)" 
                style={styles.input} 
                required 
                onChange={e => setNewPlace({...newPlace, numero: e.target.value.toUpperCase()})}
              />
              <select style={styles.input} onChange={e => setNewPlace({...newPlace, type: e.target.value})}>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Handicapé">Handicapé</option>
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>Annuler</button>
                <button type="submit" style={styles.saveBtn}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL MODIFICATION --- */}
      {editingPlace && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{marginTop: 0}}>Modifier {editingPlace.numero}</h3>
            <form onSubmit={handleUpdate} style={styles.form}>
              <label style={styles.label}>Type</label>
              <select value={editingPlace.type} style={styles.input} onChange={e => setEditingPlace({...editingPlace, type: e.target.value})}>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Handicapé">Handicapé</option>
              </select>
              <label style={styles.label}>État</label>
              <select value={editingPlace.etat} style={styles.input} onChange={e => setEditingPlace({...editingPlace, etat: e.target.value})}>
                <option value="libre">Libre</option>
                <option value="occupe">Occupé</option>
              </select>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditingPlace(null)} style={styles.cancelBtn}>Fermer</button>
                <button type="submit" style={styles.saveBtn}>Mettre à jour</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '10px', animation: 'fadeIn 0.3s ease' },
  toolbar: { display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' },
  viewSwitch: { background: '#1e293b', padding: '5px', borderRadius: '12px', display: 'flex' },
  switchBtn: { border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  addBtn: { background: theme.accent, border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', color: '#000' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' },
  placeBox: { height: '110px', borderRadius: '15px', position: 'relative', display: 'flex', flexDirection: 'column' },
  clickableArea: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  placeNum: { fontSize: '1.4rem', fontWeight: '900', color: '#fff' },
  placeTypeLabel: { fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '4px' },
  deleteBadge: { position: 'absolute', top: '5px', left: '5px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontWeight: 'bold', zIndex: 10 },
  statusDot: { position: 'absolute', top: '10px', right: '10px', width: '8px', height: '8px', borderRadius: '50%' },
  tableCard: { background: '#1e293b', borderRadius: '20px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '15px', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem' },
  td: { padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#fff' },
  editBtn: { background: 'transparent', border: `1px solid ${theme.accent}`, color: theme.accent, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', marginRight: '5px' },
  deleteBtn: { background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', padding: '30px', borderRadius: '24px', width: '380px', border: '1px solid rgba(255,255,255,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  label: { fontSize: '0.8rem', color: '#94a3b8', marginBottom: '-10px' },
  input: { padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: '#fff' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '10px' },
  cancelBtn: { flex: 1, padding: '12px', background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' },
  saveBtn: { flex: 1, padding: '12px', background: theme.accent, color: '#000', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }
};