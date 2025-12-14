import React, { useState } from 'react';
import { Search, Plus, MoreHorizontal, Mail, Phone, Calendar, Heart, Activity } from 'lucide-react';
import { MOCK_HORSES, MOCK_MEMBERS } from '../constants';

const Stamgegevens: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'paarden' | 'klanten'>('klanten');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHorses = MOCK_HORSES.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMembers = MOCK_MEMBERS.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Stamgegevens</h1>
          <p className="text-slate-500 mt-1">Beheer uw manegefamilie.</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
          <Plus className="w-4 h-4" />
          <span>Toevoegen</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-transparent overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-100 px-8 pt-6 flex space-x-8">
          <button 
            onClick={() => setActiveTab('klanten')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${activeTab === 'klanten' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-brand-primary/70'}`}
          >
            Klanten & Relaties
          </button>
          <button 
            onClick={() => setActiveTab('paarden')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${activeTab === 'paarden' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-brand-primary/70'}`}
          >
            Paarden & Pony's
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-slate-50 bg-brand-bg/30 flex justify-between items-center">
          <div className="relative max-w-md w-full group">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder={`Zoek in ${activeTab}...`} 
              className="w-full pl-12 pr-4 py-3 border-none bg-white rounded-2xl shadow-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-soft/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm">
            {activeTab === 'klanten' ? `${filteredMembers.length} relaties` : `${filteredHorses.length} paarden`}
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-slate-50">
              {activeTab === 'klanten' ? (
                <tr>
                  <th className="px-8 py-5">Naam</th>
                  <th className="px-6 py-5">Contact</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Saldo</th>
                  <th className="px-6 py-5 text-right">Acties</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-8 py-5 w-4"></th>
                  <th className="px-8 py-5">Naam</th>
                  <th className="px-6 py-5">Ras</th>
                  <th className="px-6 py-5">Type</th>
                  <th className="px-6 py-5">Geboren</th>
                  <th className="px-6 py-5">Beschikbaar</th>
                  <th className="px-6 py-5 text-right">Acties</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activeTab === 'klanten' ? (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-brand-bg/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-brand-dark">{member.name}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 text-brand-primary/60" />
                          <span>{member.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3.5 h-3.5 text-brand-primary/60" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        member.status === 'Actief' ? 'bg-green-100 text-green-700' : 
                        member.status === 'Wachtlijst' ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold">
                      <span className={member.balance < 0 ? 'text-red-500' : 'text-slate-600'}>
                        € {member.balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-slate-300 hover:text-brand-primary transition-colors p-2 hover:bg-white rounded-full">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                filteredHorses.map(horse => (
                  <tr key={horse.id} className="hover:bg-brand-bg/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className={`w-3 h-3 rounded-full ${horse.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </td>
                    <td className="px-8 py-5 font-bold text-brand-dark flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-brand-soft/30 flex items-center justify-center text-sm font-bold text-brand-primary">
                        {horse.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span>{horse.name}</span>
                    </td>
                    <td className="px-6 py-5">{horse.breed}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        horse.type === 'Manege' ? 'bg-brand-bg border-brand-soft text-brand-primary' : 'bg-purple-50 border-purple-100 text-purple-700'
                      }`}>
                        {horse.type}
                      </span>
                      {horse.owner && <div className="text-xs text-slate-400 mt-1.5 ml-1">Eig: {horse.owner}</div>}
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-xs font-medium">
                       <div className="flex items-center space-x-1.5">
                         <Calendar className="w-3.5 h-3.5 text-slate-400" />
                         <span>{horse.birthDate}</span>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       {horse.available ? (
                         <div className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-3 py-1.5 rounded-xl w-fit">
                           <Heart className="w-3 h-3 fill-current mr-2" />
                           Inzetbaar
                         </div>
                       ) : (
                        <div className="flex items-center text-red-500 text-xs font-bold bg-red-50 px-3 py-1.5 rounded-xl w-fit">
                          <Activity className="w-3 h-3 mr-2" />
                          Rust / Ziek
                        </div>
                       )}
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button className="text-slate-300 hover:text-brand-primary transition-colors p-2 hover:bg-white rounded-full">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Stamgegevens;