import React from 'react';
import { Download, Plus, Search, FileText, TrendingUp, CreditCard } from 'lucide-react';
import { MOCK_TRANSACTIONS } from '../constants';

const Finance: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Financieel</h1>
          <p className="text-slate-500 mt-1">Facturatie, betalingen en incasso (SEPA).</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-primary to-pink-600 rounded-3xl p-8 text-white shadow-soft shadow-brand-primary/40 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="flex items-center justify-between mb-6 relative z-10">
             <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
               <FileText className="w-6 h-6 text-white" />
             </div>
             <span className="text-pink-100 text-sm font-bold bg-white/10 px-3 py-1 rounded-full">Openstaand</span>
           </div>
           <h3 className="text-4xl font-bold mb-2 relative z-10">€ 4.250</h3>
           <p className="text-pink-100 text-sm font-medium relative z-10">32 openstaande facturen</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-transparent shadow-soft group hover:border-brand-soft/30 transition-all">
           <div className="flex items-center justify-between mb-6">
             <div className="bg-green-50 p-3 rounded-2xl">
               <TrendingUp className="w-6 h-6 text-green-600" />
             </div>
             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Omzet deze maand</span>
           </div>
           <h3 className="text-3xl font-bold text-brand-dark mb-2">€ 12.840</h3>
           <p className="text-green-600 text-sm flex items-center font-bold">
             <span className="mr-1.5 bg-green-100 px-1.5 py-0.5 rounded text-xs">+8.2%</span> t.o.v. vorige maand
           </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-transparent shadow-soft group hover:border-brand-soft/30 transition-all">
           <div className="flex items-center justify-between mb-6">
             <div className="bg-orange-50 p-3 rounded-2xl">
               <CreditCard className="w-6 h-6 text-orange-600" />
             </div>
             <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Volgende Incasso</span>
           </div>
           <h3 className="text-3xl font-bold text-brand-dark mb-2">28 Okt</h3>
           <p className="text-slate-500 text-sm font-medium">Verwacht totaal: € 8.450</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-transparent overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-brand-bg/20">
          <h3 className="font-bold text-brand-dark text-lg">Recente Transacties</h3>
          <div className="relative group">
             <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2 group-focus-within:text-brand-primary transition-colors" />
             <input type="text" placeholder="Zoek transactie..." className="pl-12 pr-4 py-2.5 border-none bg-white rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-soft/50 text-slate-600 w-64" />
          </div>
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-slate-50">
            <tr>
              <th className="px-8 py-5">Datum</th>
              <th className="px-6 py-5">Omschrijving</th>
              <th className="px-6 py-5">Klant</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-8 py-5 text-right">Bedrag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_TRANSACTIONS.map(tx => (
              <tr key={tx.id} className="hover:bg-brand-bg/30 transition-colors">
                <td className="px-8 py-5 text-slate-500 font-medium">{tx.date}</td>
                <td className="px-6 py-5 font-bold text-brand-dark">{tx.description}</td>
                <td className="px-6 py-5 font-medium">{tx.memberName}</td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    tx.type === 'Incasso' ? 'bg-purple-50 text-purple-700' :
                    tx.type === 'Factuur' ? 'bg-brand-bg text-brand-primary' :
                    'bg-green-50 text-green-700'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-5">
                   <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    tx.status === 'Betaald' || tx.status === 'Verwerkt' ? 'bg-green-50 text-green-700 border-green-100' : 
                    'bg-orange-50 text-orange-700 border-orange-100'
                  }`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right font-bold text-brand-dark">
                  € {tx.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Finance;