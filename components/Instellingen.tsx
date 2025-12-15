import React, { useState } from 'react';
import DatabaseTest from './DatabaseTest';
import { Settings, User, Mail, Bell, Shield, Save, Database } from 'lucide-react';

const Instellingen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'notifications' | 'security' | 'database'>('general');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Instellingen</h1>
          <p className="text-slate-500 mt-1">Configureer uw manege details en systeemvoorkeuren.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-soft border border-transparent p-4 space-y-2">
            {[
              { key: 'general', label: 'Algemeen', icon: Settings },
              { key: 'users', label: 'Gebruikers', icon: User },
              { key: 'notifications', label: 'Notificaties', icon: Bell },
              { key: 'security', label: 'Beveiliging', icon: Shield },
              { key: 'database', label: 'Database', icon: Database },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                    activeTab === tab.key
                      ? 'bg-brand-primary text-white shadow-soft shadow-brand-primary/30'
                      : 'text-slate-600 hover:bg-brand-bg'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl shadow-soft border border-transparent p-8">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-brand-dark mb-6">Algemene Instellingen</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Manege Naam</label>
                    <input
                      type="text"
                      defaultValue="Manege Duiksehoef"
                      className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Adres</label>
                    <input
                      type="email"
                      defaultValue="info@duiksehoef.nl"
                      className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Telefoonnummer</label>
                    <input
                      type="tel"
                      defaultValue="0416 123456"
                      className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Adres</label>
                    <textarea
                      rows={3}
                      defaultValue="Duikse Hoef 1, 5175 PG Loon op Zand"
                      className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  </div>
                </div>
                <button className="flex items-center space-x-2 px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
                  <Save className="w-4 h-4" />
                  <span>Opslaan</span>
                </button>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-brand-dark mb-6">Gebruikersbeheer</h2>
                <div className="text-center py-12 text-slate-400">
                  <User className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>Gebruikersbeheer functionaliteit komt binnenkort beschikbaar.</p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-brand-dark mb-6">Notificaties</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Email notificaties', description: 'Ontvang updates via email', enabled: true },
                    { label: 'Push notificaties', description: 'Ontvang meldingen in de browser', enabled: false },
                    { label: 'SMS notificaties', description: 'Ontvang belangrijke updates via SMS', enabled: false },
                  ].map((setting, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-brand-bg rounded-2xl">
                      <div>
                        <div className="font-medium text-brand-dark">{setting.label}</div>
                        <div className="text-sm text-slate-500">{setting.description}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={setting.enabled} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-brand-dark mb-6">Beveiliging</h2>
                <div className="text-center py-12 text-slate-400">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>Beveiligingsinstellingen komen binnenkort beschikbaar.</p>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-brand-dark mb-6">Database Verbinding</h2>
                <DatabaseTest />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instellingen;

