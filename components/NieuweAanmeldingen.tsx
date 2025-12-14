import React, { useState } from 'react';
import { Mail, Phone, Calendar, User, Check, X, Clock } from 'lucide-react';

const NieuweAanmeldingen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const mockApplications = [
    { 
      id: '1', 
      name: 'Emma van Zandwijk', 
      email: 'hestervanzandwijk@gmail.com', 
      phone: '06 19075588',
      date: '2025-12-15',
      status: 'pending',
      message: 'Interesse in privélessen'
    },
    { 
      id: '2', 
      name: 'Jane van Zon', 
      email: 'Jane.vanzon@gmail.com', 
      phone: '0623831581',
      date: '2025-12-14',
      status: 'approved',
      message: 'Wil graag starten met groepslessen'
    },
    { 
      id: '3', 
      name: 'Dewi van Zwol-Lakerveld', 
      email: 'd.lakerveld@outlook.com', 
      phone: '0623768102',
      date: '2025-12-13',
      status: 'pending',
      message: 'Vraag over pensionstalling'
    },
  ];

  const filteredApplications = selectedFilter === 'all' 
    ? mockApplications 
    : mockApplications.filter(app => app.status === selectedFilter);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Nieuwe Aanmeldingen</h1>
          <p className="text-slate-500 mt-1">Beheer nieuwe aanmeldingen en verzoeken.</p>
        </div>
      </div>

      <div className="flex space-x-3 mb-6">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'pending', label: 'In behandeling' },
          { key: 'approved', label: 'Goedgekeurd' },
          { key: 'rejected', label: 'Afgewezen' }
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setSelectedFilter(filter.key as any)}
            className={`px-5 py-2.5 rounded-2xl font-medium transition-all ${
              selectedFilter === filter.key
                ? 'bg-brand-primary text-white shadow-soft shadow-brand-primary/30'
                : 'bg-white text-slate-600 border border-brand-soft/50 hover:bg-brand-bg'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApplications.map((app) => (
          <div key={app.id} className="bg-white rounded-3xl shadow-soft border border-transparent p-6 hover:border-brand-soft/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-brand-dark text-lg mb-1">{app.name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{app.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{app.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(app.date).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                app.status === 'pending' 
                  ? 'bg-orange-50 text-orange-700' 
                  : app.status === 'approved'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {app.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                {app.status === 'approved' && <Check className="w-3 h-3 inline mr-1" />}
                {app.status === 'rejected' && <X className="w-3 h-3 inline mr-1" />}
                {app.status === 'pending' ? 'In behandeling' : app.status === 'approved' ? 'Goedgekeurd' : 'Afgewezen'}
              </span>
            </div>

            {app.message && (
              <div className="bg-brand-bg rounded-2xl p-4 mb-4">
                <p className="text-sm text-slate-700">{app.message}</p>
              </div>
            )}

            {app.status === 'pending' && (
              <div className="flex space-x-3 pt-4 border-t border-brand-soft/50">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-2xl hover:bg-green-100 transition-colors font-medium">
                  <Check className="w-4 h-4" />
                  <span>Goedkeuren</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-2xl hover:bg-red-100 transition-colors font-medium">
                  <X className="w-4 h-4" />
                  <span>Afwijzen</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NieuweAanmeldingen;

