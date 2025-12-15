import React, { useState } from 'react';
import { Search, Plus, Home, Calendar, User, Heart } from 'lucide-react';
import { MOCK_HORSES } from '../constants';

const Pensionstalling: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const pensionHorses = MOCK_HORSES.filter(horse => horse.type === 'Pension');
  const filteredHorses = pensionHorses.filter(horse => 
    horse.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Pensionstalling</h1>
          <p className="text-slate-500 mt-1">Beheer pensionpaarden en stallingen.</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
          <Plus className="w-4 h-4" />
          <span>Nieuw Pension</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-transparent hover:border-brand-soft/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-brand-bg p-3 rounded-2xl">
              <Home className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase">Totaal</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-1">{pensionHorses.length}</h3>
          <p className="text-slate-500 text-sm">Pensionpaarden</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-transparent hover:border-brand-soft/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-50 p-3 rounded-2xl">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase">Beschikbaar</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-1">
            {pensionHorses.filter(h => h.available).length}
          </h3>
          <p className="text-slate-500 text-sm">Vrije plaatsen</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft border border-transparent hover:border-brand-soft/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-50 p-3 rounded-2xl">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase">Deze maand</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-1">€ 2.450</h3>
          <p className="text-slate-500 text-sm">Verwachte omzet</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoek pensionklant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredHorses.map((horse) => (
            <div key={horse.id} className="flex items-center justify-between p-5 bg-brand-bg rounded-2xl hover:bg-brand-soft/50 transition-all group">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                  <Heart className="w-7 h-7 text-brand-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-brand-dark text-lg">{horse.name}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-slate-500">{horse.breed}</span>
                    {horse.owner && (
                      <>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center space-x-1 text-sm text-slate-500">
                          <User className="w-3 h-3" />
                          <span>{horse.owner}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  horse.available 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {horse.available ? 'Beschikbaar' : 'Bezet'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pensionstalling;

