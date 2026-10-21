import React, { useState, useCallback, useMemo } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import DashboardPersonnel from './components/DashboardPersonnel'; 
import DashboardClient from './components/DashboardClient'; 
import Login from './components/Login'; 
import { theme } from './Theme';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('accueil');

  // Utilisation de useCallback pour stabiliser la fonction et éviter des re-rendus inutiles
  const handleLogout = useCallback(() => {
    setUser(null);
    setView('accueil');
  }, []);

  // Centralisation du style avec useMemo pour la performance
  const mainWrapperStyle = useMemo(() => ({
    minHeight: '100vh',
    background: theme.bg,
    color: theme.text,
    display: 'flex',
    flexDirection: 'column'
  }), []);

  // Amélioration de la fonction de login pour s'assurer que les données sont valides
  const handleLoginSuccess = (userData) => {
    if (userData && userData.role) {
      setUser(userData);
      // La vue basculera automatiquement grâce au rendu conditionnel
    } else {
      console.error("Données utilisateur incomplètes reçues lors de la connexion");
    }
  };

  const renderContent = () => {
    // 1. Rendu basé sur l'authentification (Prioritaire)
    if (user) {
      const props = { user, onLogout: handleLogout };
      
      switch (user.role) {
        case 'admin':
          return <AdminDashboard {...props} />;
        case 'agent':
          return <DashboardPersonnel {...props} />;
        case 'client':
          return <DashboardClient {...props} />;
        default:
          console.warn(`Rôle inconnu: ${user.role}. Déconnexion de sécurité.`);
          handleLogout();
          return null;
      }
    }

    // 2. Navigation pour les utilisateurs non connectés
    if (view === 'login') {
      return (
        <Login 
          onLogin={handleLoginSuccess} 
          onBack={() => setView('accueil')} 
        />
      );
    }

    // Vue par défaut (Landing Page)
    return (
      <div style={mainWrapperStyle}>
        <LandingPage onConnect={() => setView('login')} />
      </div>
    );
  };

  return (
    <>
      {/* Configuration optimale pour les notifications */}
      <ToastContainer 
        theme="dark" 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {renderContent()}
    </>
  );
}