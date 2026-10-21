import React, { useState, useEffect } from 'react';
import { theme } from '../Theme';
import { Search, Car, Trash2, User } from 'lucide-react';

export default function RegistreVehicules() {
  const [vehicules, setVehicules] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/tous-les-vehicules')
      .then(res => res.json())
      .then(data => setVehicules(data))
      .catch(err => console.error(err));
  }, []);

  const filtered = vehicules.filter(v => 
    v.plaque.toLowerCase().includes(search.toLowerCase()) || 
    v.proprietaire.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: '#fff', margin: 0 }}>Répertoire Global</h2>
        <input 
          placeholder="Rechercher plaque..." 
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '8px' }}
        />
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#64748b', borderBottom: '1px solid #334155' }}>
            <th style={{ padding: '12px' }}>Type</th>
            <th>Plaque</th>
            <th>Modèle</th>
            <th>Propriétaire</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(v => (
            <tr key={v.id} style={{ borderBottom: '1px solid #334155' }}>
              <td style={{ padding: '12px', fontSize: '20px' }}>{v.icone}</td>
              <td style={{ fontWeight: 'bold', color: theme.accent }}>{v.plaque}</td>
              <td>{v.marque} {v.modele}</td>
              <td>{v.proprietaire}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}