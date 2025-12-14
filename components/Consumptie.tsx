import React, { useState } from 'react';
import { Search, Plus, Coffee, ShoppingCart, TrendingUp, Filter } from 'lucide-react';

const Consumptie: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockItems = [
    { id: '1', name: 'Koffie', price: 2.50, category: 'Drank', stock: 45, sold: 23 },
    { id: '2', name: 'Thee', price: 2.00, category: 'Drank', stock: 30, sold: 15 },
    { id: '3', name: 'Koekje', price: 1.50, category: 'Snack', stock: 60, sold: 42 },
    { id: '4', name: 'Chips', price: 2.75, category: 'Snack', stock: 25, sold: 18 },
    { id: '5', name: 'Frisdrank', price: 2.25, category: 'Drank', stock: 40, sold: 28 },
  ];

  const filteredItems = mockItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = mockItems.reduce((sum, item) => sum + (item.sold * item.price), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Consumptie</h1>
          <p className="text-slate-500 mt-1">Beheer kantine en consumpties.</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
          <Plus className="w-4 h-4" />
          <span>Nieuw Product</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-primary to-pink-600 rounded-3xl p-8 text-white shadow-soft shadow-brand-primary/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-4xl font-bold mb-2 relative z-10">€ {totalRevenue.toFixed(2)}</h3>
          <p className="text-pink-100 text-sm font-medium relative z-10">Totale omzet deze maand</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-transparent shadow-soft group hover:border-brand-soft/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-green-50 p-3 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Verkocht</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-2">
            {mockItems.reduce((sum, item) => sum + item.sold, 0)}
          </h3>
          <p className="text-green-600 text-sm flex items-center font-bold">
            <span className="mr-1.5 bg-green-100 px-1.5 py-0.5 rounded text-xs">+12%</span> t.o.v. vorige maand
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-transparent shadow-soft group hover:border-brand-soft/30 transition-all">
          <div className="flex items-center justify-between mb-6">
            <div className="bg-orange-50 p-3 rounded-2xl">
              <Coffee className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Producten</span>
          </div>
          <h3 className="text-3xl font-bold text-brand-dark mb-2">{mockItems.length}</h3>
          <p className="text-slate-500 text-sm">Actieve producten</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-transparent p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Zoek product..."
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

        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-5 bg-brand-bg rounded-2xl hover:bg-brand-soft/50 transition-all group">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-brand-primary transition-colors">
                  <Coffee className="w-6 h-6 text-brand-primary group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-brand-dark">{item.name}</h3>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-slate-500">{item.category}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-500">Voorraad: {item.stock}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <div className="text-sm text-slate-500">Verkocht</div>
                  <div className="font-bold text-brand-dark">{item.sold}x</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Prijs</div>
                  <div className="font-bold text-brand-primary">€ {item.price.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Omzet</div>
                  <div className="font-bold text-green-600">€ {(item.sold * item.price).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Consumptie;

