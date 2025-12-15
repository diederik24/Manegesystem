import React, { useState } from 'react';
import { Download, Plus, Search, FileText, TrendingUp, CreditCard, Mail, CheckCircle, AlertCircle, Filter, X, Calendar, User, Clock, Send } from 'lucide-react';
import { MOCK_TRANSACTIONS, MOCK_FACTUREN } from '../constants';
import { Factuur } from '../types';

const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overzicht' | 'openstaand' | 'betaald' | 'achterstallig'>('overzicht');
  const [klantTypeFilter, setKlantTypeFilter] = useState<'Alle' | 'Pension' | 'Manege'>('Alle');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacturen, setSelectedFacturen] = useState<string[]>([]);
  const [showVerstuurModal, setShowVerstuurModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [facturen, setFacturen] = useState<Factuur[]>(MOCK_FACTUREN);

  // Filter facturen
  const getFilteredFacturen = () => {
    return facturen.filter(factuur => {
      const matchesKlantType = klantTypeFilter === 'Alle' || factuur.klantType === klantTypeFilter;
      const matchesSearch = 
        factuur.klantNaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factuur.factuurnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factuur.omschrijving.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'openstaand') {
        matchesTab = factuur.status === 'Open';
      } else if (activeTab === 'betaald') {
        matchesTab = factuur.status === 'Betaald';
      } else if (activeTab === 'achterstallig') {
        matchesTab = factuur.status === 'Achterstallig';
      }
      
      return matchesKlantType && matchesSearch && matchesTab;
    });
  };

  const filteredFacturen = getFilteredFacturen();

  // Statistieken
  const betaaldeFacturen = facturen.filter(f => f.status === 'Betaald');
  const openstaandeFacturen = facturen.filter(f => f.status === 'Open');
  const achterstalligeFacturen = facturen.filter(f => f.status === 'Achterstallig');
  const facturenVoorHerinnering = facturen.filter(f => 
    f.status !== 'Betaald' && f.aantalHerinneringen < 2
  );

  const totaalOpenstaand = openstaandeFacturen.reduce((sum, f) => sum + f.bedrag, 0);
  const totaalBetaald = betaaldeFacturen.reduce((sum, f) => sum + f.bedrag, 0);
  const totaalAchterstallig = achterstalligeFacturen.reduce((sum, f) => sum + f.bedrag, 0);

  // Bepaal laatste maandelijkse stalling factuur datum
  const stallingFacturen = facturen.filter(f => 
    f.klantType === 'Pension' && f.omschrijving.toLowerCase().includes('stalling')
  );
  const laatsteStallingFactuur = stallingFacturen.length > 0
    ? stallingFacturen.sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())[0]
    : null;

  const handleSelectFactuur = (factuurId: string) => {
    setSelectedFacturen(prev =>
      prev.includes(factuurId)
        ? prev.filter(id => id !== factuurId)
        : [...prev, factuurId]
    );
  };

  const handleSelectAll = () => {
    const facturenVoorHerinneringIds = facturenVoorHerinnering
      .filter(f => filteredFacturen.some(ff => ff.id === f.id))
      .map(f => f.id);
    
    if (selectedFacturen.length === facturenVoorHerinneringIds.length) {
      setSelectedFacturen([]);
    } else {
      setSelectedFacturen(facturenVoorHerinneringIds);
    }
  };

  const handleVerstuurTweedeHerinnering = () => {
    const vandaag = new Date().toISOString().split('T')[0];
    
    setFacturen(prev => prev.map(factuur => {
      if (selectedFacturen.includes(factuur.id)) {
        return {
          ...factuur,
          tweedeHerinneringVerstuurd: vandaag,
          aantalHerinneringen: 2
        };
      }
      return factuur;
    }));

    setSelectedFacturen([]);
    setShowVerstuurModal(false);
    alert(`✅ ${selectedFacturen.length} tweede herinneringen zijn verstuurd!`);
  };

  const getStatusBadge = (status: Factuur['status']) => {
    switch (status) {
      case 'Betaald':
        return <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Betaald
        </span>;
      case 'Open':
        return <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
          Open
        </span>;
      case 'Achterstallig':
        return <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Achterstallig
        </span>;
      case 'Verwerkt':
        return <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
          Verwerkt
        </span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getDaysOverdue = (vervaldatum: string) => {
    const today = new Date();
    const verval = new Date(vervaldatum);
    const diffTime = today.getTime() - verval.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const selectedTotal = selectedFacturen.reduce((sum, id) => {
    const factuur = facturen.find(f => f.id === id);
    return sum + (factuur?.bedrag || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-brand-dark">Financieel</h1>
          <p className="text-slate-500 mt-1">Facturatie, betalingen en incasso (SEPA).</p>
          
          {/* Maandelijkse Stalling Status */}
          {laatsteStallingFactuur && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-medium">
                  Maandelijkse stalling verstuurd: <span className="font-bold">{formatDate(laatsteStallingFactuur.datum)}</span>
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-brand-soft/50 text-slate-600 rounded-2xl hover:bg-brand-bg shadow-sm transition-colors">
            <Download className="w-4 h-4" />
            <span>Export SEPA</span>
          </button>
          <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
            <Plus className="w-4 h-4" />
            <span>Nieuwe Factuur</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('overzicht')}
          className="bg-gradient-to-br from-brand-primary to-pink-600 rounded-2xl p-6 text-white shadow-soft shadow-brand-primary/40 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-pink-100 text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full">Openstaand</span>
          </div>
          <h3 className="text-3xl font-bold mb-1 relative z-10">€ {totaalOpenstaand.toFixed(2)}</h3>
          <p className="text-pink-100 text-xs font-medium relative z-10">{openstaandeFacturen.length + achterstalligeFacturen.length} facturen</p>
        </div>

        <div 
          onClick={() => setActiveTab('betaald')}
          className="bg-white rounded-2xl p-6 border border-transparent shadow-soft group hover:border-green-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-2.5 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Betaald</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-dark mb-1">€ {totaalBetaald.toFixed(2)}</h3>
          <p className="text-green-600 text-xs flex items-center font-semibold">
            <span className="mr-1.5 bg-green-100 px-1.5 py-0.5 rounded text-xs">{betaaldeFacturen.length}</span> facturen
          </p>
        </div>

        <div 
          onClick={() => setActiveTab('achterstallig')}
          className="bg-white rounded-2xl p-6 border border-transparent shadow-soft group hover:border-red-200 hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-50 p-2.5 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Achterstallig</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-dark mb-1">{achterstalligeFacturen.length}</h3>
          <p className="text-red-600 text-xs font-semibold">€ {totaalAchterstallig.toFixed(2)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-transparent shadow-soft group hover:border-orange-200 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-2.5 rounded-xl">
              <Mail className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Herinneringen</span>
          </div>
          <h3 className="text-2xl font-bold text-brand-dark mb-1">{facturenVoorHerinnering.length}</h3>
          <p className="text-slate-500 text-xs font-medium">Klaar voor 2e herinnering</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-soft border border-transparent overflow-hidden">
        <div className="border-b border-slate-100 px-6 pt-4 flex space-x-6">
          {[
            { key: 'overzicht', label: 'Overzicht', count: facturen.length },
            { key: 'openstaand', label: 'Openstaand', count: openstaandeFacturen.length },
            { key: 'betaald', label: 'Betaald', count: betaaldeFacturen.length },
            { key: 'achterstallig', label: 'Achterstallig', count: achterstalligeFacturen.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-4 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === tab.key
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-slate-400 hover:text-brand-primary/70'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="p-6 border-b border-slate-50 bg-brand-bg/30">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Klant Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-600 mr-2">Klant:</span>
              {(['Alle', 'Pension', 'Manege'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setKlantTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    klantTypeFilter === type
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-brand-bg border border-brand-soft/50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md w-full lg:ml-auto">
              <div className="relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Zoek op klant, factuurnummer..." 
                  className="w-full pl-10 pr-4 py-2 border-none bg-white rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-soft/50 text-slate-600"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-brand-soft/50">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table' ? 'bg-brand-primary text-white' : 'text-slate-600'
                }`}
              >
                Tabel
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'cards' ? 'bg-brand-primary text-white' : 'text-slate-600'
                }`}
              >
                Kaarten
              </button>
            </div>
          </div>
        </div>

        {/* Geselecteerde facturen actie */}
        {selectedFacturen.length > 0 && (
          <div className="bg-gradient-to-r from-brand-primary to-pink-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs opacity-90 mb-0.5">Geselecteerd</div>
                  <div className="text-xl font-bold">
                    {selectedFacturen.length} {selectedFacturen.length === 1 ? 'factuur' : 'facturen'}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/30"></div>
                <div>
                  <div className="text-xs opacity-90 mb-0.5">Totaalbedrag</div>
                  <div className="text-xl font-bold">€ {selectedTotal.toFixed(2)}</div>
                </div>
              </div>
              <button
                onClick={() => setShowVerstuurModal(true)}
                className="px-6 py-2.5 bg-white text-brand-primary rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-lg flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Verstuur 2e Herinnering</span>
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {filteredFacturen.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Geen facturen gevonden</p>
              <p className="text-slate-400 text-sm mt-1">Probeer andere filters of zoektermen</p>
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-bg/50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
                  <tr>
                    {facturenVoorHerinnering.length > 0 && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedFacturen.length > 0 && selectedFacturen.length === facturenVoorHerinnering.filter(f => filteredFacturen.some(ff => ff.id === f.id)).length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">Factuur</th>
                    <th className="px-4 py-3">Klant</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Vervaldatum</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Herinneringen</th>
                    <th className="px-4 py-3 text-right">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFacturen.map(factuur => {
                    const kanHerinneringSturen = factuur.status !== 'Betaald' && factuur.aantalHerinneringen < 2;
                    const isSelected = selectedFacturen.includes(factuur.id);
                    const daysOverdue = getDaysOverdue(factuur.vervaldatum);

                    return (
                      <tr 
                        key={factuur.id} 
                        className={`hover:bg-brand-bg/50 transition-colors ${isSelected ? 'bg-brand-bg' : ''}`}
                      >
                        {facturenVoorHerinnering.length > 0 && (
                          <td className="px-4 py-4">
                            {kanHerinneringSturen && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectFactuur(factuur.id)}
                                className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
                              />
                            )}
                          </td>
                        )}
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-bold text-brand-dark">{factuur.factuurnummer}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{formatDate(factuur.datum)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-brand-dark">{factuur.klantNaam}</p>
                            <p className="text-xs text-slate-400">{factuur.klantEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            factuur.klantType === 'Pension' 
                              ? 'bg-purple-50 text-purple-700' 
                              : 'bg-brand-bg text-brand-primary'
                          }`}>
                            {factuur.klantType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <div>
                              <p className="text-slate-600 text-xs">{formatDate(factuur.vervaldatum)}</p>
                              {daysOverdue > 0 && (
                                <p className="text-xs text-red-500 font-medium mt-0.5">{daysOverdue} dag{daysOverdue !== 1 ? 'en' : ''} te laat</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(factuur.status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            {factuur.aantalHerinneringen > 0 && (
                              <span className="text-xs text-slate-500">
                                {factuur.aantalHerinneringen === 1 && factuur.eersteHerinneringVerstuurd && (
                                  <>1e: {formatDate(factuur.eersteHerinneringVerstuurd)}</>
                                )}
                                {factuur.aantalHerinneringen === 2 && factuur.tweedeHerinneringVerstuurd && (
                                  <>2e: {formatDate(factuur.tweedeHerinneringVerstuurd)}</>
                                )}
                              </span>
                            )}
                            {kanHerinneringSturen && (
                              <span className="text-xs text-orange-600 font-semibold">
                                Klaar voor {factuur.aantalHerinneringen === 0 ? '1e' : '2e'} herinnering
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-bold text-brand-dark">€ {factuur.bedrag.toFixed(2)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFacturen.map(factuur => {
                const kanHerinneringSturen = factuur.status !== 'Betaald' && factuur.aantalHerinneringen < 2;
                const isSelected = selectedFacturen.includes(factuur.id);
                const daysOverdue = getDaysOverdue(factuur.vervaldatum);

                return (
                  <div
                    key={factuur.id}
                    className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                      isSelected 
                        ? 'border-brand-primary bg-brand-bg/30 shadow-lg' 
                        : 'border-brand-soft/30 hover:border-brand-primary/50 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {kanHerinneringSturen && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectFactuur(factuur.id)}
                              className="w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
                            />
                          )}
                          <p className="font-bold text-brand-dark">{factuur.factuurnummer}</p>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{formatDate(factuur.datum)}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="font-semibold text-brand-dark text-sm">{factuur.klantNaam}</p>
                            <p className="text-xs text-slate-400">{factuur.klantEmail}</p>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(factuur.status)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Type:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          factuur.klantType === 'Pension' 
                            ? 'bg-purple-50 text-purple-700' 
                            : 'bg-brand-bg text-brand-primary'
                        }`}>
                          {factuur.klantType}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Vervaldatum:
                        </span>
                        <span className="text-slate-600 font-medium">{formatDate(factuur.vervaldatum)}</span>
                      </div>
                      {daysOverdue > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-500 font-semibold">Te laat:</span>
                          <span className="text-red-500 font-bold">{daysOverdue} dag{daysOverdue !== 1 ? 'en' : ''}</span>
                        </div>
                      )}
                      {factuur.aantalHerinneringen > 0 && (
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                          <span className="text-slate-500">Herinneringen:</span>
                          <span className="text-slate-600">
                            {factuur.aantalHerinneringen === 1 && factuur.eersteHerinneringVerstuurd && (
                              <>1e: {formatDate(factuur.eersteHerinneringVerstuurd)}</>
                            )}
                            {factuur.aantalHerinneringen === 2 && factuur.tweedeHerinneringVerstuurd && (
                              <>2e: {formatDate(factuur.tweedeHerinneringVerstuurd)}</>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{factuur.omschrijving}</p>
                        <p className="text-xl font-bold text-brand-dark">€ {factuur.bedrag.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Verstuur 2e Herinnering Modal */}
      {showVerstuurModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowVerstuurModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-dark">2e Herinnering Versturen</h2>
                <button onClick={() => setShowVerstuurModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-900 mb-1">Weet je het zeker?</div>
                    <div className="text-sm text-orange-700">
                      Je staat op het punt om <strong>{selectedFacturen.length}</strong> tweede herinneringen te versturen naar klanten.
                      Het totaalbedrag is <strong>€ {selectedTotal.toFixed(2)}</strong>.
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 text-sm">
                De herinneringen worden automatisch gegenereerd en naar de klanten gestuurd via e-mail.
                Je kunt de status van de betalingen volgen in het overzicht.
              </p>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowVerstuurModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleVerstuurTweedeHerinnering}
                className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>Ja, verstuur herinneringen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
