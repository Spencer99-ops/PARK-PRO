// Configuration de l'API
// En développement: utilise l'URL locale
// En production: utilise l'URL relative (proxy Netlify)
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

// Si VITE_API_URL n'est pas défini ou est en prod, utiliser l'URL relative
export const API = (import.meta.env.MODE === 'production' || !import.meta.env.VITE_API_URL)
  ? '/api'
  : API_URL;
