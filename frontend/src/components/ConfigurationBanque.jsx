import React, { useState, useEffect } from 'react';
import { theme } from '../Theme';
import { ShieldCheck, Eye, EyeOff, Save, Loader2 } from 'lucide-react';

export default function ConfigurationBanque() {
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    api_public_key: '',
    api_secret_key: '',
    marchand_id: '',
    devise: 'FCFA',
    mode_test: true
  });

  // --- CHARGEMENT DES DONNÉES AU MONTAGE ---
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/config-banque');
        if (res.ok) {
          const data = await res.json();
          if (data.marchand_id) setConfig(data); // On ne remplit que si des données existent
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de la config:", err);
      }
    };
    fetchConfig();
  }, []);

  // --- SAUVEGARDE ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/config-banque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (res.ok) {
        alert("✅ Configuration sauvegardée sur le serveur.");
      } else {
        alert("❌ Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
      alert("Impossible de contacter le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <ShieldCheck color={theme.accent} size={32} />
          <h2 style={styles.title}>Sécurité des Paiements par Carte</h2>
        </div>
        
        <p style={styles.subtitle}>Configurez vos accès API pour activer le traitement Visa/Mastercard (Stripe, CinetPay, etc.).</p>

        <div style={styles.form}>
          {/* ID Marchand */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>ID Marchand / Site ID</label>
            <input 
              style={styles.input} 
              value={config.marchand_id} 
              onChange={e => setConfig({...config, marchand_id: e.target.value})}
              placeholder="Ex: PARKING_DOUALA_001"
            />
          </div>

          {/* Clé Publique */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Clé Publique (API Key)</label>
            <input 
              style={styles.input} 
              value={config.api_public_key}
              onChange={e => setConfig({...config, api_public_key: e.target.value})}
              placeholder="pk_test_..."
            />
          </div>

          {/* Clé Secrète */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Clé Secrète (Secret Key)</label>
            <div style={styles.passwordWrapper}>
              <input 
                type={showKey ? "text" : "password"} 
                style={styles.inputPassword}
                value={config.api_secret_key}
                onChange={e => setConfig({...config, api_secret_key: e.target.value})}
                placeholder="sk_test_..."
              />
              <button onClick={() => setShowKey(!showKey)} style={styles.eyeBtn} type="button">
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Rangée Devise & Mode */}
          <div style={styles.row}>
            <div style={{...styles.inputGroup, flex: 1}}>
              <label style={styles.label}>Devise par défaut</label>
              <select style={styles.select} value={config.devise} onChange={e => setConfig({...config, devise: e.target.value})}>
                <option value="FCFA">FCFA (XAF)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </div>
            
            <div style={styles.toggleGroup}>
              <label style={styles.label}>Mode Test</label>
              <input 
                type="checkbox" 
                style={styles.checkbox}
                checked={config.mode_test} 
                onChange={e => setConfig({...config, mode_test: e.target.checked})}
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            style={{...styles.saveBtn, opacity: isSaving ? 0.7 : 1}}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {isSaving ? "Enregistrement..." : "Enregistrer la configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Les styles restent les mêmes que précédemment avec une légère correction pour le bouton
const styles = {
  container: { padding: '40px', display: 'flex', justifyContent: 'center' },
  card: { background: '#1e293b', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '600px', border: '1px solid #334155' },
  header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' },
  title: { color: '#fff', fontSize: '1.5rem', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '0.9rem', marginBottom: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#94a3b8', fontSize: '0.85rem' },
  input: { background: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px', color: '#fff' },
  passwordWrapper: { position: 'relative', display: 'flex' },
  inputPassword: { background: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px', color: '#fff', width: '100%' },
  eyeBtn: { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
  row: { display: 'flex', gap: '20px', alignItems: 'center' },
  select: { background: '#0f172a', border: '1px solid #334155', padding: '10px', borderRadius: '8px', color: '#fff' },
  toggleGroup: { display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' },
  saveBtn: { background: theme.accent, color: '#0f172a', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }
};