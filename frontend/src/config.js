// Configuration de l'API
// En développement: utilise l'URL locale
// En production: utilise l'URL du backend déployé
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export const API = API_URL;
