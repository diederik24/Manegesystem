import React, { useState } from 'react';
import { 
  FileText, 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign, 
  Download, 
  Printer,
  FileDown,
  BarChart3,
  Receipt,
  Coffee,
  CreditCard
} from 'lucide-react';

interface RapportageType {
  id: string;
  titel: string;
  beschrijving: string;
  icon: React.ElementType;
  kleur: string;
}

const Rapportages: React.FC = () => {
  const [selectedRapportage, setSelectedRapportage] = useState<string | null>(null);
  const [periode, setPeriode] = useState<'week' | 'maand' | 'kwartaal' | 'jaar'>('maand');
  const [startDatum, setStartDatum] = useState(new Date().toISOString().split('T')[0]);
  const [eindDatum, setEindDatum] = useState(new Date().toISOString().split('T')[0]);

  const rapportageTypes: RapportageType[] = [
    {
      id: 'facturen',
      titel: 'Facturen',
      beschrijving: 'Genereer en druk facturen af voor klanten',
      icon: FileText,
      kleur: 'bg-blue-500'
    },
    {
      id: 'omzet',
      titel: 'Omzetrapportage',
      beschrijving: 'Overzicht van omzet per periode',
      icon: TrendingUp,
      kleur: 'bg-green-500'
    },
    {
      id: 'werkstaat-paarden',
      titel: 'Werkstaat Paarden',
      beschrijving: 'Overzicht van werkstaat per paard',
      icon: Calendar,
      kleur: 'bg-purple-500'
    },
    {
      id: 'uren-instructeurs',
      titel: 'Uren Instructeurs',
      beschrijving: 'Overzicht van gewerkte uren per instructeur',
      icon: Users,
      kleur: 'bg-orange-500'
    },
    {
      id: 'consumptie',
      titel: 'Consumptie Rapportage',
      beschrijving: 'Overzicht van consumptie-inkomsten',
      icon: Coffee,
      kleur: 'bg-pink-500'
    },
    {
      id: 'leskaarten',
      titel: 'Leskaarten Overzicht',
      beschrijving: 'Overzicht van verkochte leskaarten',
      icon: CreditCard,
      kleur: 'bg-indigo-500'
    }
  ];

  const handleGenereerRapportage = () => {
    if (!selectedRapportage) return;
    
    // Simuleer het genereren van een rapportage
    alert(`Rapportage "${rapportageTypes.find(r => r.id === selectedRapportage)?.titel}" wordt gegenereerd voor periode ${periode}`);
  };

  const handleAfdrukken = () => {
    if (!selectedRapportage) return;
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!selectedRapportage) return;
    alert(`PDF download wordt voorbereid voor "${rapportageTypes.find(r => r.id === selectedRapportage)?.titel}"`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Rapportages</h1>
          <p className="text-slate-600">Genereer en druk rapportages af</p>
        </div>
      </div>

      {/* Rapportage Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rapportageTypes.map((rapportage) => {
          const Icon = rapportage.icon;
          const isSelected = selectedRapportage === rapportage.id;
          
          return (
            <button
              key={rapportage.id}
              onClick={() => setSelectedRapportage(rapportage.id)}
              className={`bg-white rounded-xl p-6 shadow-soft border-2 transition-all text-left hover:shadow-lg ${
                isSelected 
                  ? 'border-brand-primary bg-brand-bg' 
                  : 'border-transparent hover:border-brand-soft'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${rapportage.kleur} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-2">{rapportage.titel}</h3>
              <p className="text-sm text-slate-600">{rapportage.beschrijving}</p>
            </button>
          );
        })}
      </div>

      {/* Configuratie Panel */}
      {selectedRapportage && (
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h2 className="text-xl font-bold text-brand-dark mb-6">
            {rapportageTypes.find(r => r.id === selectedRapportage)?.titel} Configuratie
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Periode Selectie */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Periode:</label>
              <select
                value={periode}
                onChange={(e) => setPeriode(e.target.value as 'week' | 'maand' | 'kwartaal' | 'jaar')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="week">Deze week</option>
                <option value="maand">Deze maand</option>
                <option value="kwartaal">Dit kwartaal</option>
                <option value="jaar">Dit jaar</option>
              </select>
            </div>

            {/* Datum Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Aangepaste periode:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDatum}
                  onChange={(e) => setStartDatum(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
                <input
                  type="date"
                  value={eindDatum}
                  onChange={(e) => setEindDatum(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Actie Knoppen */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenereerRapportage}
              className="flex items-center space-x-2 px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-lg shadow-soft transition-all"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Genereer Rapportage</span>
            </button>
            
            <button
              onClick={handleAfdrukken}
              className="flex items-center space-x-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5" />
              <span>Afdrukken</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
            >
              <FileDown className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Voorbeeld Overzicht */}
      {selectedRapportage && (
        <div className="bg-white rounded-xl p-6 shadow-soft">
          <h3 className="text-lg font-bold text-brand-dark mb-4">Voorbeeld Overzicht</h3>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-2">
              <strong>Rapportage:</strong> {rapportageTypes.find(r => r.id === selectedRapportage)?.titel}
            </p>
            <p className="text-sm text-slate-600 mb-2">
              <strong>Periode:</strong> {periode === 'week' ? 'Deze week' : periode === 'maand' ? 'Deze maand' : periode === 'kwartaal' ? 'Dit kwartaal' : 'Dit jaar'}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Datum range:</strong> {startDatum} tot {eindDatum}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 italic">
                Klik op "Genereer Rapportage" om het volledige rapport te zien
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rapportages;

