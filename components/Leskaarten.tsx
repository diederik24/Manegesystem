import React, { useState } from 'react';
import { Search, Plus, CreditCard, Calendar, User, Filter, X, Clock } from 'lucide-react';
import { Leskaart, RecurringLesson } from '../types';
import { MOCK_MEMBERS } from '../constants';

const Leskaarten: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewKaartModal, setShowNewKaartModal] = useState(false);
  const [selectedKlant, setSelectedKlant] = useState<typeof MOCK_MEMBERS[0] | null>(null);
  const [totaalLessen, setTotaalLessen] = useState(10);
  const [eindDatum, setEindDatum] = useState('');

  // Mock recurring lessons data - later uit Planning component of database halen
  const recurringLessons: RecurringLesson[] = [
    { id: '1', name: 'Groep1', dayOfWeek: 1, time: '14:00', type: 'Dressuurles', instructor: '', maxParticipants: 8, color: 'blue', participantIds: ['1'] },
    { id: '2', name: 'Groep2', dayOfWeek: 1, time: '15:00', type: 'Springles', instructor: 'Marieke', maxParticipants: 8, color: 'teal', participantIds: ['2'] },
    { id: '3', name: 'Groep3', dayOfWeek: 1, time: '16:30', type: 'Dressuurles', instructor: 'Tom', maxParticipants: 8, color: 'orange', participantIds: ['3'] },
    { id: '4', name: 'Groep4', dayOfWeek: 2, time: '19:00', type: 'Groepsles', instructor: 'Sarah', maxParticipants: 10, color: 'amber', participantIds: ['4'] },
  ];

  const getLessenVoorKlant = (klantId: string): RecurringLesson[] => {
    return recurringLessons.filter(lesson => lesson.participantIds.includes(klantId));
  };

  const formatDagVanWeek = (dayOfWeek: number): string => {
    const dagen = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];
    return dagen[dayOfWeek];
  };

  const [leskaarten, setLeskaarten] = useState<Leskaart[]>([]);

  const filteredCards = leskaarten.filter(card => 
    card.klantNaam.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLeskaart = () => {
    if (!selectedKlant || !eindDatum) {
      alert('Selecteer een klant en einddatum');
      return;
    }

    const newKaart: Leskaart = {
      id: Date.now().toString(),
      klantId: selectedKlant.id,
      klantNaam: selectedKlant.name,
      totaalLessen: totaalLessen,
      gebruikteLessen: 0,
      resterendeLessen: totaalLessen,
      startDatum: new Date().toISOString().split('T')[0],
      eindDatum: eindDatum,
      status: 'actief',
    };

    setLeskaarten([...leskaarten, newKaart]);
    setShowNewKaartModal(false);
    setSelectedKlant(null);
    setTotaalLessen(10);
    setEindDatum('');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Leskaarten</h1>
          <p className="text-slate-500 mt-1">Beheer leskaarten en abonnementen.</p>
        </div>
        <button 
          onClick={() => setShowNewKaartModal(true)}
          className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe Leskaart</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoek op naam..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>
          <button className="flex items-center space-x-2 px-5 py-3 bg-white border border-brand-soft/50 text-slate-600 rounded-2xl hover:bg-brand-bg shadow-sm transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => {
            const percentage = (card.gebruikteLessen / card.totaalLessen) * 100;
            const lessenVoorKlant = getLessenVoorKlant(card.klantId);
            
            return (
              <div key={card.id} className="bg-gradient-to-br from-white to-brand-bg rounded-3xl p-6 shadow-soft border border-brand-soft/30 hover:border-brand-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                      <CreditCard className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-dark">{card.klantNaam}</h3>
                      <p className="text-xs text-slate-500 capitalize">{card.status}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Les informatie */}
                  {lessenVoorKlant.length > 0 && (
                    <div className="pb-3 border-b border-brand-soft/50">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-brand-primary" />
                        <span className="text-xs font-medium text-slate-700">Rijdt bij:</span>
                      </div>
                      <div className="space-y-1">
                        {lessenVoorKlant.map((les) => (
                          <div key={les.id} className="text-xs text-slate-600">
                            <span className="font-medium">{les.name}</span>
                            {' - '}
                            <span>{formatDagVanWeek(les.dayOfWeek)} {les.time}</span>
                            {les.instructor && (
                              <span className="text-slate-500"> ({les.instructor})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Lessen gebruikt</span>
                      <span className="font-bold text-brand-dark">{card.gebruikteLessen} / {card.totaalLessen} lessen</span>
                    </div>
                    <div className="w-full bg-brand-soft rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-primary to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-brand-soft/50">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Verloopt: {new Date(card.eindDatum).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <span className="text-sm font-bold text-brand-primary">{card.resterendeLessen} over</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nieuwe Leskaart Modal */}
      {showNewKaartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowNewKaartModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-dark">Nieuwe Leskaart</h2>
                <button onClick={() => setShowNewKaartModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Klant:</label>
                <select
                  value={selectedKlant?.id || ''}
                  onChange={(e) => {
                    const klant = MOCK_MEMBERS.find(m => m.id === e.target.value);
                    setSelectedKlant(klant || null);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">Selecteer klant...</option>
                  {MOCK_MEMBERS.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Aantal lessen:</label>
                <input
                  type="number"
                  min="1"
                  value={totaalLessen}
                  onChange={(e) => setTotaalLessen(parseInt(e.target.value) || 10)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Einddatum:</label>
                <input
                  type="date"
                  value={eindDatum}
                  onChange={(e) => setEindDatum(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowNewKaartModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateLeskaart}
                className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Leskaart Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leskaarten;

