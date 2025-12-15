import React, { useState } from 'react';
import { FileText, Calendar, X, ArrowLeft, Filter } from 'lucide-react';
import { ViewState } from '../types';

interface Betaalverzoek {
  id: string;
  klantId: string;
  klantNaam: string;
  klantType: 'Pension' | 'Manege';
  datum: string;
  type: 'Pension' | 'Leskaart';
  bedrag: number;
  omschrijving: string;
  status: 'verstuurd' | 'betaald';
}

interface FacturatieBekijkenProps {
  onNavigate?: (view: ViewState) => void;
}

const FacturatieBekijken: React.FC<FacturatieBekijkenProps> = ({ onNavigate }) => {
  const [betaalverzoekFilter, setBetaalverzoekFilter] = useState<'Alle' | 'Pension' | 'Manege'>('Alle');
  const [vanDatum, setVanDatum] = useState<string>('');
  const [totDatum, setTotDatum] = useState<string>('');

  // Mock data voor betaalverzoeken (later uit Supabase halen)
  const mockBetaalverzoeken: Betaalverzoek[] = [
    {
      id: '1',
      klantId: '1',
      klantNaam: 'Caroline Seeters',
      klantType: 'Pension',
      datum: '2025-01-15',
      type: 'Pension',
      bedrag: 250.00,
      omschrijving: 'Maandelijkse stalling januari',
      status: 'verstuurd'
    },
    {
      id: '2',
      klantId: '2',
      klantNaam: 'Gisela Verduijn',
      klantType: 'Pension',
      datum: '2025-01-15',
      type: 'Pension',
      bedrag: 250.00,
      omschrijving: 'Maandelijkse stalling januari',
      status: 'betaald'
    },
    {
      id: '3',
      klantId: '3',
      klantNaam: 'Hanneke Nijenhuis',
      klantType: 'Pension',
      datum: '2025-01-16',
      type: 'Leskaart',
      bedrag: 45.00,
      omschrijving: 'Leskaart 10 lessen',
      status: 'verstuurd'
    },
    {
      id: '4',
      klantId: '4',
      klantNaam: 'Jane van Zon',
      klantType: 'Pension',
      datum: '2025-01-17',
      type: 'Leskaart',
      bedrag: 45.00,
      omschrijving: 'Leskaart 10 lessen',
      status: 'betaald'
    }
  ];

  const filteredBetaalverzoeken = mockBetaalverzoeken.filter(b => {
    // Filter op klant type
    const matchesKlantType = betaalverzoekFilter === 'Alle' || b.klantType === betaalverzoekFilter;
    
    // Filter op datum
    let matchesDatum = true;
    if (vanDatum || totDatum) {
      const betaalverzoekDatum = new Date(b.datum);
      if (vanDatum) {
        const van = new Date(vanDatum);
        van.setHours(0, 0, 0, 0);
        if (betaalverzoekDatum < van) matchesDatum = false;
      }
      if (totDatum) {
        const tot = new Date(totDatum);
        tot.setHours(23, 59, 59, 999);
        if (betaalverzoekDatum > tot) matchesDatum = false;
      }
    }
    
    return matchesKlantType && matchesDatum;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            {onNavigate && (
              <button
                onClick={() => onNavigate(ViewState.FINANCIEEL)}
                className="p-2 hover:bg-brand-bg rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">Facturatie Bekijken</h1>
              <p className="text-slate-500 mt-1">Overzicht van betaalverzoeken</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-wrap">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filter op klant type:</span>
            {(['Alle', 'Pension', 'Manege'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setBetaalverzoekFilter(filter)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  betaalverzoekFilter === filter
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-bg text-slate-600 hover:bg-brand-soft/50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          
          {/* Datum Filters */}
          <div className="flex items-center space-x-3 flex-wrap">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Van datum:</label>
              <input
                type="date"
                value={vanDatum}
                onChange={(e) => setVanDatum(e.target.value)}
                lang="nl-NL"
                className="px-3 py-2 border border-brand-soft/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white text-slate-700"
                placeholder="Selecteer datum"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-slate-700 whitespace-nowrap">Tot datum:</label>
              <input
                type="date"
                value={totDatum}
                onChange={(e) => setTotDatum(e.target.value)}
                lang="nl-NL"
                className="px-3 py-2 border border-brand-soft/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white text-slate-700"
                placeholder="Selecteer datum"
              />
            </div>
            {(vanDatum || totDatum) && (
              <button
                onClick={() => {
                  setVanDatum('');
                  setTotDatum('');
                }}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-brand-bg rounded-xl transition-colors"
                title="Wis datum filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredBetaalverzoeken.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-soft border border-transparent p-12 text-center text-slate-400">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium text-brand-dark mb-2">Geen betaalverzoeken gevonden</p>
          <p>Er zijn nog geen betaalverzoeken verstuurd voor {betaalverzoekFilter === 'Alle' ? 'alle klanten' : betaalverzoekFilter.toLowerCase() + ' klanten'}.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabel */}
          <div className="bg-white rounded-3xl shadow-soft border border-transparent overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-brand-bg/50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Datum</th>
                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Klant</th>
                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Type</th>
                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Omschrijving</th>
                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs text-right">Bedrag</th>
                    <th className="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBetaalverzoeken.map((betaalverzoek) => (
                    <tr key={betaalverzoek.id} className="hover:bg-brand-bg/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700">{formatDate(betaalverzoek.datum)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-brand-dark">{betaalverzoek.klantNaam}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            <span className={`px-2 py-0.5 rounded ${
                              betaalverzoek.klantType === 'Pension' 
                                ? 'bg-purple-50 text-purple-700' 
                                : 'bg-brand-bg text-brand-primary'
                            }`}>
                              {betaalverzoek.klantType}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          betaalverzoek.type === 'Pension'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {betaalverzoek.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{betaalverzoek.omschrijving}</td>
                      <td className="px-6 py-4 text-right font-bold text-brand-dark">€ {betaalverzoek.bedrag.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          betaalverzoek.status === 'betaald'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {betaalverzoek.status === 'betaald' ? 'Betaald' : 'Verstuurd'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Samenvatting */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
              <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Totaal Verstuurd</p>
              <p className="text-3xl font-bold text-brand-dark">
                {filteredBetaalverzoeken.filter(b => b.status === 'verstuurd').length}
              </p>
            </div>
            <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
              <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Totaal Betaald</p>
              <p className="text-3xl font-bold text-green-600">
                {filteredBetaalverzoeken.filter(b => b.status === 'betaald').length}
              </p>
            </div>
            <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
              <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Totaal Bedrag</p>
              <p className="text-3xl font-bold text-brand-dark">
                € {filteredBetaalverzoeken.reduce((sum, b) => sum + b.bedrag, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturatieBekijken;

