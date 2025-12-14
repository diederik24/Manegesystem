import React, { useState } from 'react';
import { Search, Plus, CreditCard, Calendar, User, Filter } from 'lucide-react';

const Leskaarten: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockCards = [
    { id: '1', name: 'Anna Klijn', lessons: 10, used: 3, expires: '2025-12-31', status: 'Actief' },
    { id: '2', name: 'Amy', lessons: 20, used: 15, expires: '2025-11-30', status: 'Actief' },
    { id: '3', name: 'Fleur', lessons: 5, used: 5, expires: '2025-10-15', status: 'Opgebruikt' },
    { id: '4', name: 'Meya Loef', lessons: 10, used: 2, expires: '2026-01-31', status: 'Actief' },
  ];

  const filteredCards = mockCards.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Leskaarten</h1>
          <p className="text-slate-500 mt-1">Beheer leskaarten en abonnementen.</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
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
            const percentage = (card.used / card.lessons) * 100;
            const remaining = card.lessons - card.used;
            
            return (
              <div key={card.id} className="bg-gradient-to-br from-white to-brand-bg rounded-3xl p-6 shadow-soft border border-brand-soft/30 hover:border-brand-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                      <CreditCard className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-dark">{card.name}</h3>
                      <p className="text-xs text-slate-500">{card.status}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-600">Lessen gebruikt</span>
                      <span className="font-bold text-brand-dark">{card.used} / {card.lessons}</span>
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
                      <span>Verloopt: {new Date(card.expires).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <span className="text-sm font-bold text-brand-primary">{remaining} over</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Leskaarten;

