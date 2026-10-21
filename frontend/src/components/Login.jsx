import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { theme } from '../Theme';

// Importez une de vos images de parking
import BackgroundImg from './parking(1).jpeg'; 

const API = "http://127.0.0.1:5000/api";

export default function Login({ onLogin, onBack }) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    email: '', 
    password: '', 
    role: 'client', 
    nom: '' 
  });

  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    setForm(prev => ({ ...prev, role: selectedRole }));
    if (selectedRole !== 'client') setIsRegister(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegister ? '/inscription' : '/connexion';
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}${endpoint}`, form);
      const data = response.data;

      if (isRegister) {
        toast.success("Compte créé avec succès ! Veuillez vous connecter.");
        setIsRegister(false);
      } else {
        if (data && (data.id_utilisateur || data.id)) {
          toast.success(`Bienvenue, ${data.nom || 'Utilisateur'}`);
          onLogin(data); 
        } else {
          throw new Error("Réponse du serveur incomplète");
        }
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Erreur de connexion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Overlay pour l'opacité de l'arrière-plan */}
      <div style={styles.overlay}></div>

      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.logoBadge}>P</div>
        <h2 style={styles.title}>{isRegister ? 'INSCRIPTION' : 'CONNEXION'}</h2>
        
        {!isRegister && (
          <select 
            style={styles.input} 
            value={form.role} 
            onChange={handleRoleChange}
            name="role"
          >
            <option value="client">Accès : Client</option>
            <option value="agent">Accès : Personnel / Agent</option>
            <option value="admin">Accès : Administrateur</option>
          </select>
        )}

        {isRegister && (
          <input 
            name="nom"
            style={styles.input} 
            placeholder="Nom complet" 
            value={form.nom}
            onChange={handleInputChange} 
            required 
          />
        )}

        <input 
          name="email"
          style={styles.input} 
          type="email" 
          placeholder="Email" 
          value={form.email}
          onChange={handleInputChange} 
          required 
        />
        
        <input 
          name="password"
          style={styles.input} 
          type="password" 
          placeholder="Mot de passe" 
          value={form.password}
          onChange={handleInputChange} 
          required 
        />

        <button 
          style={{
            ...styles.submitBtn, 
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }} 
          disabled={loading}
        >
          {loading ? "Chargement..." : (isRegister ? "Créer mon compte client" : "Se connecter")}
        </button>

        {form.role === 'client' && (
          <p style={styles.toggleText}>
            {isRegister ? "Déjà membre ?" : "Nouveau client ?"} 
            <span style={styles.link} onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? " Connectez-vous" : " Créez un compte"}
            </span>
          </p>
        )}

        <button 
          type="button" 
          onClick={onBack} 
          style={styles.backBtn}
          disabled={loading}
        >
          ← Retour à l'accueil
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { 
    height: '100vh', 
    backgroundImage: `url(${BackgroundImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: '20px',
    position: 'relative' // Important pour l'overlay
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.8)', // Calque sombre bleuté pour la lisibilité
    zIndex: 1
  },
  card: { 
    background: 'rgba(15, 23, 42, 0.9)', // Légère transparence sur la carte
    backdropFilter: 'blur(10px)', // Effet de flou moderne
    padding: '40px', 
    borderRadius: '24px', 
    width: '100%',
    maxWidth: '400px', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    zIndex: 2, // Pour passer au-dessus de l'overlay
    position: 'relative'
  },
  logoBadge: {
    width: '50px',
    height: '50px',
    background: theme.accent,
    borderRadius: '12px',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '900',
    color: '#000'
  },
  title: { textAlign: 'center', marginBottom: '30px', color: 'white', fontSize: '1.8rem', fontWeight: '800' },
  input: { 
    width: '100%', 
    padding: '14px', 
    background: 'rgba(2, 6, 23, 0.6)', 
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    color: 'white', 
    borderRadius: '10px', 
    marginBottom: '15px', 
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '1rem'
  },
  submitBtn: { 
    width: '100%', 
    padding: '16px', 
    background: theme.accent, 
    color: '#000', 
    border: 'none', 
    borderRadius: '10px', 
    fontWeight: '800', 
    fontSize: '1rem',
    transition: 'all 0.3s',
    boxShadow: `0 10px 20px ${theme.accent}30`
  },
  toggleText: { textAlign: 'center', marginTop: '20px', color: '#94a3b8', fontSize: '0.9rem' },
  link: { color: theme.accent, cursor: 'pointer', fontWeight: 'bold' },
  backBtn: { width: '100%', background: 'none', border: 'none', color: '#64748b', marginTop: '20px', cursor: 'pointer', fontSize: '0.9rem' }
};