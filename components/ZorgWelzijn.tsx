import React, { useState } from 'react';
import { 
  Heart, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search,
  Syringe,
  Pill,
  Activity
} from 'lucide-react';
import { MOCK_HORSES } from '../constants';

interface Ontworming {
  id: string;
  paardId: string;
  paardNaam: string;
  laatsteOntworming: string;
  volgendeOntworming: string;
  status: 'op_tijd' | 'bijna_aan' | 'achterstallig';
  type: string;
}

interface Vaccinatie {
  id: string;
  paardId: string;
  paardNaam: string;
  type: 'Rhinopneumonie' | 'Influenza' | 'Tetanus' | 'Anders';
  laatsteVaccinatie: string;
  volgendeVaccinatie: string;
  status: 'op_tijd' | 'bijna_aan' | 'achterstallig';
  opmerking?: string;
}

const ZorgWelzijn: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overzicht' | 'ontworming' | 'vaccinatie'>('overzicht');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data voor ontwormingen
  const [ontwormingen, setOntwormingen] = useState<Ontworming[]>([
    {
      id: '1',
      paardId: '1',
      paardNaam: 'Thunder',
      laatsteOntworming: '2025-09-15',
      volgendeOntworming: '2025-12-15',
      status: 'bijna_aan',
      type: 'Ivermectine'
    },
    {
      id: '2',
      paardId: '2',
      paardNaam: 'Zorro',
      laatsteOntworming: '2025-10-01',
      volgendeOntworming: '2026-01-01',
      status: 'op_tijd',
      type: 'Moxidectine'
    },
    {
      id: '3',
      paardId: '3',
      paardNaam: 'Spirit',
      laatsteOntworming: '2025-08-20',
      volgendeOntworming: '2025-11-20',
      status: 'achterstallig',
      type: 'Fenbendazol'
    },
  ]);

  // Mock data voor vaccinaties
  const [vaccinaties, setVaccinaties] = useState<Vaccinatie[]>([
    {
      id: '1',
      paardId: '1',
      paardNaam: 'Thunder',
      type: 'Rhinopneumonie',
      laatsteVaccinatie: '2025-03-15',
      volgendeVaccinatie: '2025-09-15',
      status: 'achterstallig',
      opmerking: 'Jaarlijkse booster nodig'
    },
    {
      id: '2',
      paardId: '2',
      paardNaam: 'Zorro',
      type: 'Rhinopneumonie',
      laatsteVaccinatie: '2025-09-01',
      volgendeVaccinatie: '2026-03-01',
      status: 'op_tijd',
    },
    {
      id: '3',
      paardId: '3',
      paardNaam: 'Spirit',
      type: 'Rhinopneumonie',
      laatsteVaccinatie: '2025-04-10',
      volgendeVaccinatie: '2025-10-10',
      status: 'bijna_aan',
    },
    {
      id: '4',
      paardId: '1',
      paardNaam: 'Thunder',
      type: 'Influenza',
      laatsteVaccinatie: '2025-06-15',
      volgendeVaccinatie: '2025-12-15',
      status: 'bijna_aan',
    },
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'op_tijd':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Op tijd
        </span>;
      case 'bijna_aan':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Binnenkort
        </span>;
      case 'achterstallig':
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Achterstallig
        </span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredOntwormingen = ontwormingen.filter(o => 
    o.paardNaam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVaccinaties = vaccinaties.filter(v => 
    v.paardNaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const achterstalligOntwormingen = ontwormingen.filter(o => o.status === 'achterstallig');
  const achterstalligVaccinaties = vaccinaties.filter(v => v.status === 'achterstallig');
  const bijnaAanOntwormingen = ontwormingen.filter(o => o.status === 'bijna_aan');
  const bijnaAanVaccinaties = vaccinaties.filter(v => v.status === 'bijna_aan');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Zorg & Welzijn</h1>
          <p className="text-slate-500 mt-1">Beheer ontwormingen en vaccinaties voor alle paarden.</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
          <Plus className="w-4 h-4" />
          <span>Nieuwe Registratie</span>
        </button>
      </div>

      {/* Alert Cards */}
      {(achterstalligOntwormingen.length > 0 || achterstalligVaccinaties.length > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-200 rounded-3xl p-6 flex items-start shadow-soft">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 mr-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-red-900 mb-2">Achterstallige behandelingen</p>
            <div className="space-y-1">
              {achterstalligOntwormingen.length > 0 && (
                <p className="text-sm text-red-800">
                  {achterstalligOntwormingen.length} ontworming{achterstalligOntwormingen.length > 1 ? 'en' : ''} achterstallig
                </p>
              )}
              {achterstalligVaccinaties.length > 0 && (
                <p className="text-sm text-red-800">
                  {achterstalligVaccinaties.length} vaccinatie{achterstalligVaccinaties.length > 1 ? 's' : ''} achterstallig
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-transparent hover:border-brand-soft/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-50 p-3 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase">Achterstallig</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-1">
            {achterstalligOntwormingen.length + achterstalligVaccinaties.length}
          </h3>
          <p className="text-slate-500 text-sm">Behandelingen</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-transparent hover:border-brand-soft/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-3 rounded-2xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase">Binnenkort</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-1">
            {bijnaAanOntwormingen.length + bijnaAanVaccinaties.length}
          </h3>
          <p className="text-slate-500 text-sm">Behandelingen</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-transparent hover:border-brand-soft/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-brand-bg p-3 rounded-2xl">
              <Pill className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase">Ontwormingen</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-1">{ontwormingen.length}</h3>
          <p className="text-slate-500 text-sm">Totaal geregistreerd</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-transparent hover:border-brand-soft/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-3 rounded-2xl">
              <Syringe className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase">Vaccinaties</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-1">{vaccinaties.length}</h3>
          <p className="text-slate-500 text-sm">Totaal geregistreerd</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-soft border border-transparent overflow-hidden">
        <div className="border-b border-slate-100 px-8 pt-6 flex space-x-8">
          <button 
            onClick={() => setActiveTab('overzicht')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${
              activeTab === 'overzicht' 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-slate-400 hover:text-brand-primary/70'
            }`}
          >
            Overzicht
          </button>
          <button 
            onClick={() => setActiveTab('ontworming')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${
              activeTab === 'ontworming' 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-slate-400 hover:text-brand-primary/70'
            }`}
          >
            Ontwormingen
          </button>
          <button 
            onClick={() => setActiveTab('vaccinatie')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${
              activeTab === 'vaccinatie' 
                ? 'border-brand-primary text-brand-primary' 
                : 'border-transparent text-slate-400 hover:text-brand-primary/70'
            }`}
          >
            Vaccinaties
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-50 bg-brand-bg/30">
          <div className="relative max-w-md w-full group">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Zoek op paardnaam..." 
              className="w-full pl-12 pr-4 py-3 border-none bg-white rounded-2xl shadow-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-soft/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overzicht' && (
            <div className="space-y-6">
              {/* Ontwormingen Overzicht */}
              <div>
                <h3 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-brand-primary" />
                  Ontwormingen
                </h3>
                <div className="space-y-3">
                  {filteredOntwormingen.map((ontworming) => {
                    const daysUntil = getDaysUntil(ontworming.volgendeOntworming);
                    return (
                      <div key={ontworming.id} className="bg-brand-bg rounded-2xl p-4 border border-brand-soft/30 hover:border-brand-primary/30 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-brand-dark">{ontworming.paardNaam}</h4>
                              {getStatusBadge(ontworming.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500 mb-1">Laatste ontworming</p>
                                <p className="font-medium text-brand-dark">{formatDate(ontworming.laatsteOntworming)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Volgende ontworming</p>
                                <p className="font-medium text-brand-dark">{formatDate(ontworming.volgendeOntworming)}</p>
                                {daysUntil >= 0 && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    Over {daysUntil} dag{daysUntil !== 1 ? 'en' : ''}
                                  </p>
                                )}
                                {daysUntil < 0 && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {Math.abs(daysUntil)} dag{Math.abs(daysUntil) !== 1 ? 'en' : ''} geleden
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-2">
                              <p className="text-xs text-slate-500">Type: <span className="font-medium text-brand-dark">{ontworming.type}</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vaccinaties Overzicht */}
              <div>
                <h3 className="text-xl font-bold text-brand-dark mb-4 flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-green-600" />
                  Vaccinaties
                </h3>
                <div className="space-y-3">
                  {filteredVaccinaties.map((vaccinatie) => {
                    const daysUntil = getDaysUntil(vaccinatie.volgendeVaccinatie);
                    return (
                      <div key={vaccinatie.id} className="bg-brand-bg rounded-2xl p-4 border border-brand-soft/30 hover:border-brand-primary/30 transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-brand-dark">{vaccinatie.paardNaam}</h4>
                              {getStatusBadge(vaccinatie.status)}
                            </div>
                            <div className="mb-2">
                              <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                                {vaccinatie.type}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-slate-500 mb-1">Laatste vaccinatie</p>
                                <p className="font-medium text-brand-dark">{formatDate(vaccinatie.laatsteVaccinatie)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Volgende vaccinatie</p>
                                <p className="font-medium text-brand-dark">{formatDate(vaccinatie.volgendeVaccinatie)}</p>
                                {daysUntil >= 0 && (
                                  <p className="text-xs text-slate-400 mt-1">
                                    Over {daysUntil} dag{daysUntil !== 1 ? 'en' : ''}
                                  </p>
                                )}
                                {daysUntil < 0 && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {Math.abs(daysUntil)} dag{Math.abs(daysUntil) !== 1 ? 'en' : ''} geleden
                                  </p>
                                )}
                              </div>
                            </div>
                            {vaccinatie.opmerking && (
                              <div className="mt-2">
                                <p className="text-xs text-slate-500 italic">{vaccinatie.opmerking}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ontworming' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-brand-dark mb-2">Ontwormingsschema</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    <strong>Standaard schema:</strong> Paarden worden meestal 4x per jaar ontwormd (elke 3 maanden). 
                    Het is aanbevolen om regelmatig mestonderzoek te doen om de effectiviteit te controleren en resistentie te voorkomen.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {filteredOntwormingen.map((ontworming) => {
                  const daysUntil = getDaysUntil(ontworming.volgendeOntworming);
                  return (
                    <div key={ontworming.id} className="bg-white rounded-2xl p-6 border border-brand-soft/30 hover:border-brand-primary/30 transition-all shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center">
                            <Pill className="w-6 h-6 text-brand-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-dark text-lg">{ontworming.paardNaam}</h4>
                            <p className="text-sm text-slate-500">Type: {ontworming.type}</p>
                          </div>
                        </div>
                        {getStatusBadge(ontworming.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Laatste ontworming</p>
                          <p className="font-medium text-brand-dark">{formatDate(ontworming.laatsteOntworming)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Volgende ontworming</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-brand-primary" />
                            <p className="font-medium text-brand-dark">{formatDate(ontworming.volgendeOntworming)}</p>
                          </div>
                          {daysUntil >= 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                              Over {daysUntil} dag{daysUntil !== 1 ? 'en' : ''}
                            </p>
                          )}
                          {daysUntil < 0 && (
                            <p className="text-xs text-red-500 mt-1 font-medium">
                              {Math.abs(daysUntil)} dag{Math.abs(daysUntil) !== 1 ? 'en' : ''} geleden
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'vaccinatie' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-brand-dark mb-2">Vaccinatieschema</h3>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <p className="text-sm text-green-800 leading-relaxed mb-2">
                      <strong>Rhinopneumonie (Rino):</strong> Meestal 2x per jaar (voorjaar en najaar) of volgens het schema van de dierenarts. 
                      Beschermt tegen EHV-1 en EHV-4.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      <strong>Influenza:</strong> Meestal 2x per jaar, vaak gecombineerd met Rhinopneumonie. 
                      Belangrijk voor paarden die in contact komen met andere paarden.
                    </p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                    <p className="text-sm text-orange-800 leading-relaxed">
                      <strong>Tetanus:</strong> Meestal 1x per jaar of om de 2-3 jaar, afhankelijk van het vaccin. 
                      Belangrijk voor alle paarden.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {filteredVaccinaties.map((vaccinatie) => {
                  const daysUntil = getDaysUntil(vaccinatie.volgendeVaccinatie);
                  return (
                    <div key={vaccinatie.id} className="bg-white rounded-2xl p-6 border border-brand-soft/30 hover:border-brand-primary/30 transition-all shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center">
                            <Syringe className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-dark text-lg">{vaccinatie.paardNaam}</h4>
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium mt-1 inline-block">
                              {vaccinatie.type}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(vaccinatie.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Laatste vaccinatie</p>
                          <p className="font-medium text-brand-dark">{formatDate(vaccinatie.laatsteVaccinatie)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Volgende vaccinatie</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <p className="font-medium text-brand-dark">{formatDate(vaccinatie.volgendeVaccinatie)}</p>
                          </div>
                          {daysUntil >= 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                              Over {daysUntil} dag{daysUntil !== 1 ? 'en' : ''}
                            </p>
                          )}
                          {daysUntil < 0 && (
                            <p className="text-xs text-red-500 mt-1 font-medium">
                              {Math.abs(daysUntil)} dag{Math.abs(daysUntil) !== 1 ? 'en' : ''} geleden
                            </p>
                          )}
                        </div>
                      </div>
                      {vaccinatie.opmerking && (
                        <div className="mt-4 pt-4 border-t border-brand-soft/30">
                          <p className="text-sm text-slate-600 italic">{vaccinatie.opmerking}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZorgWelzijn;

