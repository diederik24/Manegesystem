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
import { ViewState } from './types';
import { BarChart3 } from 'lucide-react';

// Placeholder components for views not yet fully implemented to keep the file structure clean
const RapportagesPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400">
    <div className="bg-white p-12 rounded-3xl shadow-soft border border-transparent text-center max-w-md relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-bg/50"></div>
      <div className="relative z-10">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <BarChart3 className="w-10 h-10 text-brand-primary" />
        </div>
        <h2 className="text-2xl font-bold text-brand-dark mb-3">Rapportages</h2>
        <p className="text-slate-500 mb-6">
          Hier vind u uitgebreide overzichten van werkstaat paarden, uren instructeurs en omzetanalyses.
        </p>
        <button className="text-brand-primary font-bold hover:text-brand-hover transition-colors">Download voorbeeld PDF</button>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard />;
      case ViewState.PLANNING:
        return <Planning />;
      case ViewState.STAMGEGEVENS:
        return <Stamgegevens />;
      case ViewState.FINANCIEEL:
        return <Finance />;
      case ViewState.RAPPORTAGES:
        return <RapportagesPlaceholder />;
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