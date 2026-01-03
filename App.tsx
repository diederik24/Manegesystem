import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Planning from './components/Planning';
import Stamgegevens from './components/Stamgegevens';
import Finance from './components/Finance';
import Leskaarten from './components/Leskaarten';
import Pensionstalling from './components/Pensionstalling';
import NieuweAanmeldingen from './components/NieuweAanmeldingen';
import Consumptie from './components/Consumptie';
import Instellingen from './components/Instellingen';
import Rapportages from './components/Rapportages';
import HelpInfo from './components/HelpInfo';
import ZorgWelzijn from './components/ZorgWelzijn';
import PlanningBeheer from './components/PlanningBeheer';
import FacturatieBekijken from './components/FacturatieBekijken';
import Afmeldingen from './components/Afmeldingen';
import { ViewState } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  React.useEffect(() => {
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard onNavigate={setCurrentView} />;
      case ViewState.PLANNING:
        return <Planning onNavigate={setCurrentView} />;
      case ViewState.PLANNING_BEHEER:
        return <PlanningBeheer onNavigate={setCurrentView} />;
      case ViewState.STAMGEGEVENS:
        return <Stamgegevens />;
      case ViewState.FINANCIEEL:
        return <Finance onNavigate={setCurrentView} />;
      case ViewState.FACTURATIE_BEKIJKEN:
        return <FacturatieBekijken onNavigate={setCurrentView} />;
      case ViewState.RAPPORTAGES:
        return <Rapportages />;
      case ViewState.LESKAARTEN:
        return <Leskaarten />;
      case ViewState.PENSIONSTALLING:
        return <Pensionstalling />;
      case ViewState.NIEUWE_AANMELDINGEN:
        return <NieuweAanmeldingen />;
      case ViewState.CONSUMPTIE:
        return <Consumptie />;
      case ViewState.INSTELLINGEN:
        return <Instellingen />;
      case ViewState.HELP_INFO:
        return <HelpInfo onNavigate={setCurrentView} />;
      case ViewState.ZORG_WELZIJN:
        return <ZorgWelzijn />;
      case ViewState.AFMELDINGEN:
        return <Afmeldingen onNavigate={setCurrentView} />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-dark">Laden...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;