import React, { useState } from 'react';
import Layout from './components/Layout';
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
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);

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
        return <Finance />;
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;