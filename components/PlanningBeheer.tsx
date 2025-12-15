import React, { useState } from 'react';
import { 
  Calendar, 
  Printer, 
  UserX, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Search,
  FileText
} from 'lucide-react';
import { ViewState } from '../types';
import { MOCK_MEMBERS } from '../constants';

interface LesEvent {
  id: string;
  datum: string;
  tijd: string;
  groep: string;
  type: string;
  instructeur?: string;
  deelnemers: {
    id: string;
    naam: string;
    aanwezig: boolean;
    afwezigReden?: string;
  }[];
}

const PlanningBeheer: React.FC<{ onNavigate?: (view: ViewState) => void }> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data voor lessen op een dag
  const [lessen, setLessen] = useState<LesEvent[]>([]);

  const handleToggleAanwezigheid = (lesId: string, deelnemerId: string) => {
    setLessen(prev => prev.map(les => {
      if (les.id === lesId) {
        return {
          ...les,
          deelnemers: les.deelnemers.map(d => 
            d.id === deelnemerId 
              ? { ...d, aanwezig: !d.aanwezig, afwezigReden: d.aanwezig ? 'Afwezig' : undefined }
              : d
          )
        };
      }
      return les;
    }));
  };

  const handleSetAfwezigReden = (lesId: string, deelnemerId: string, reden: string) => {
    setLessen(prev => prev.map(les => {
      if (les.id === lesId) {
        return {
          ...les,
          deelnemers: les.deelnemers.map(d => 
            d.id === deelnemerId 
              ? { ...d, afwezigReden: reden }
              : d
          )
        };
      }
      return les;
    }));
  };

  const handlePrintDagPlanning = () => {
    window.print();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const gefilterdeLessen = lessen.filter(les => 
    les.groep.toLowerCase().includes(searchTerm.toLowerCase()) ||
    les.deelnemers.some(d => d.naam.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate && onNavigate(ViewState.PLANNING)}
            className="p-2 hover:bg-brand-bg rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-brand-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-brand-dark">Planning Beheer</h1>
            <p className="text-slate-500 mt-1">Beheer aanwezigheid en print les planningen</p>
          </div>
        </div>
        <button
          onClick={handlePrintDagPlanning}
          className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all font-medium"
        >
          <Printer className="w-5 h-5" />
          <span>Print Dag Planning</span>
        </button>
      </div>

      {/* Datum Selectie */}
      <div className="bg-white rounded-2xl shadow-soft border border-brand-soft/30 p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-brand-primary" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Selecteer datum:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-brand-soft rounded-lg text-brand-dark font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-brand-dark">{formatDate(selectedDate)}</h2>
            <p className="text-sm text-slate-500">{gefilterdeLessen.length} lessen gepland</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-soft border border-brand-soft/30 p-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Zoek op groep of deelnemer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-brand-soft rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          />
        </div>
      </div>

      {/* Lessen Overzicht */}
      <div className="space-y-4">
        {gefilterdeLessen.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft border border-brand-soft/30 p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Geen lessen gevonden voor deze datum</p>
          </div>
        ) : (
          gefilterdeLessen.map(les => (
            <div key={les.id} className="bg-white rounded-2xl shadow-soft border border-brand-soft/30 overflow-hidden print:break-inside-avoid">
              {/* Les Header */}
              <div className="bg-gradient-to-r from-brand-primary to-pink-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{les.groep}</h3>
                    <div className="flex items-center space-x-4 text-sm opacity-90">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{les.tijd}</span>
                      </div>
                      <span>•</span>
                      <span>{les.type}</span>
                      {les.instructeur && (
                        <>
                          <span>•</span>
                          <span>Instructeur: {les.instructeur}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90">Deelnemers</div>
                    <div className="text-3xl font-bold">
                      {les.deelnemers.filter(d => d.aanwezig).length} / {les.deelnemers.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deelnemers Lijst */}
              <div className="p-6">
                <div className="space-y-3">
                  {les.deelnemers.map(deelnemer => (
                    <div
                      key={deelnemer.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                        deelnemer.aanwezig
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {deelnemer.aanwezig ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className={`font-semibold ${deelnemer.aanwezig ? 'text-green-800' : 'text-red-800'}`}>
                            {deelnemer.naam}
                          </p>
                          {!deelnemer.aanwezig && deelnemer.afwezigReden && (
                            <p className="text-xs text-red-600 mt-1">Reden: {deelnemer.afwezigReden}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!deelnemer.aanwezig && (
                          <select
                            value={deelnemer.afwezigReden || ''}
                            onChange={(e) => handleSetAfwezigReden(les.id, deelnemer.id, e.target.value)}
                            className="px-3 py-1.5 text-xs border border-red-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="">Selecteer reden</option>
                            <option value="Ziek">Ziek</option>
                            <option value="Afgemeld">Afgemeld</option>
                            <option value="Niet gekomen">Niet gekomen</option>
                            <option value="Anders">Anders</option>
                          </select>
                        )}
                        <button
                          onClick={() => handleToggleAanwezigheid(les.id, deelnemer.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            deelnemer.aanwezig
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {deelnemer.aanwezig ? 'Afwezig' : 'Aanwezig'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .bg-white {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          button, select {
            display: none !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default PlanningBeheer;

