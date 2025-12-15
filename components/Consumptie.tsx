import React, { useState } from 'react';
import { Search, Plus, Coffee, ShoppingCart, TrendingUp, Filter, CreditCard, Send, CheckCircle, Clock, X } from 'lucide-react';
import { ConsumptieKaart, ConsumptieItem } from '../types';
import { MOCK_MEMBERS } from '../constants';

const Consumptie: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kaarten' | 'facturatie'>('kaarten');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKaarten, setSelectedKaarten] = useState<string[]>([]);
  const [showVerstuurModal, setShowVerstuurModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showNieuweKaartModal, setShowNieuweKaartModal] = useState(false);
  const [selectedKaart, setSelectedKaart] = useState<ConsumptieKaart | null>(null);
  const [newItemNaam, setNewItemNaam] = useState('');
  const [newItemPrijs, setNewItemPrijs] = useState('');
  const [newItemAantal, setNewItemAantal] = useState('1');
  
  // Nieuwe kaart formulier state
  const [nieuweKaartKlant, setNieuweKaartKlant] = useState<typeof MOCK_MEMBERS[0] | null>(null);
  const [nieuweKaartDatum, setNieuweKaartDatum] = useState(new Date().toISOString().split('T')[0]);
  const [nieuweKaartItems, setNieuweKaartItems] = useState<Record<string, { aantal: number; bedrag: number }>>({});
  const [klantGekozen, setKlantGekozen] = useState(false);
  const [klantZoekTerm, setKlantZoekTerm] = useState('');

  // Mock producten die beschikbaar zijn
  const beschikbareProducten = [
    { naam: 'Koffie', prijs: 2.50 },
    { naam: 'Thee', prijs: 2.00 },
    { naam: 'Koekje', prijs: 1.50 },
    { naam: 'Chips', prijs: 2.75 },
    { naam: 'Frisdrank', prijs: 2.25 },
    { naam: 'Appelsap', prijs: 2.50 },
    { naam: 'Chocoladereep', prijs: 1.75 },
  ];

  // Consumptie items uit het formulier
  const consumptieItems = [
    'Koffie/thee',
    'cappuccino/espresso',
    'chocomelk',
    'choco met slagr',
    'fris',
    'Ice tea',
    'Ice tea green',
    'bier',
    'wijn',
    'chips/snoep/koek',
    'tosti',
    'friet (met)',
    'friet speciaal',
    'kroket/frikandel',
    'broodje',
  ];

  // Mock consumptiekaarten
  const [consumptieKaarten, setConsumptieKaarten] = useState<ConsumptieKaart[]>([]);

  const getStatusBadge = (status: ConsumptieKaart['status']) => {
    switch (status) {
      case 'open':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Open</span>;
      case 'klaar_voor_facturatie':
        return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Klaar voor facturatie</span>;
      case 'betaalverzoek_verstuurd':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Betaalverzoek verstuurd</span>;
      case 'betaald':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Betaald</span>;
    }
  };

  const filteredKaarten = consumptieKaarten.filter(kaart =>
    kaart.klantNaam.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kaart.datum.includes(searchTerm)
  );

  const openKaarten = filteredKaarten.filter(k => k.status === 'open' || k.status === 'klaar_voor_facturatie');
  const facturatieKaarten = filteredKaarten.filter(k => k.status === 'klaar_voor_facturatie');

  const handleSelectKaart = (kaartId: string) => {
    setSelectedKaarten(prev =>
      prev.includes(kaartId)
        ? prev.filter(id => id !== kaartId)
        : [...prev, kaartId]
    );
  };

  const handleSelectAll = () => {
    if (selectedKaarten.length === facturatieKaarten.length) {
      setSelectedKaarten([]);
    } else {
      setSelectedKaarten(facturatieKaarten.map(k => k.id));
    }
  };

  const handleAddItem = () => {
    if (!selectedKaart || !newItemNaam || !newItemPrijs) return;

    const prijs = parseFloat(newItemPrijs);
    const aantal = parseInt(newItemAantal);
    const totaal = prijs * aantal;

    const newItem: ConsumptieItem = {
      id: `${selectedKaart.id}-${Date.now()}`,
      naam: newItemNaam,
      prijs: prijs,
      aantal: aantal,
      totaal: totaal,
    };

    setConsumptieKaarten(prev =>
      prev.map(kaart =>
        kaart.id === selectedKaart.id
          ? {
              ...kaart,
              items: [...kaart.items, newItem],
              totaalBedrag: kaart.totaalBedrag + totaal,
            }
          : kaart
      )
    );

    setShowAddItemModal(false);
    setNewItemNaam('');
    setNewItemPrijs('');
    setNewItemAantal('1');
    setSelectedKaart(null);
  };

  const handleUpdateNieuweKaartItem = (itemNaam: string, field: 'aantal' | 'bedrag', value: number) => {
    setNieuweKaartItems(prev => ({
      ...prev,
      [itemNaam]: {
        ...prev[itemNaam],
        [field]: value,
        aantal: field === 'aantal' ? value : (prev[itemNaam]?.aantal || 0),
        bedrag: field === 'bedrag' ? value : (prev[itemNaam]?.bedrag || 0),
      },
    }));
  };

  const handleSaveNieuweKaart = (klaarVoorFacturatie: boolean = false) => {
    if (!nieuweKaartKlant || !nieuweKaartDatum) {
      alert('Selecteer een klant en datum');
      return;
    }

    const items: ConsumptieItem[] = Object.entries(nieuweKaartItems)
      .filter(([_, data]) => data.aantal > 0 && data.bedrag > 0)
      .map(([naam, data], index) => ({
        id: `new-${Date.now()}-${index}`,
        naam: naam,
        prijs: data.bedrag / data.aantal,
        aantal: data.aantal,
        totaal: data.bedrag,
      }));

    const totaalBedrag = items.reduce((sum, item) => sum + item.totaal, 0);

    const newKaart: ConsumptieKaart = {
      id: Date.now().toString(),
      klantId: nieuweKaartKlant.id,
      klantNaam: nieuweKaartKlant.name,
      klantEmail: nieuweKaartKlant.email,
      datum: nieuweKaartDatum,
      items: items,
      totaalBedrag: totaalBedrag,
      status: klaarVoorFacturatie ? 'klaar voor facturatie' : 'open',
    };

    setConsumptieKaarten([...consumptieKaarten, newKaart]);
    setShowNieuweKaartModal(false);
    setNieuweKaartKlant(null);
    setNieuweKaartDatum(new Date().toISOString().split('T')[0]);
    setNieuweKaartItems({});
    setKlantGekozen(false);
    setKlantZoekTerm('');
  };

  const berekenTotaal = () => {
    return Object.values(nieuweKaartItems).reduce((sum, item) => sum + (item.bedrag || 0), 0);
  };

  const handleVerstuurBetaalverzoeken = () => {
    // Simuleer het versturen van betaalverzoeken
    setConsumptieKaarten(prev =>
      prev.map(kaart =>
        selectedKaarten.includes(kaart.id)
          ? { ...kaart, status: 'betaalverzoek_verstuurd' as const }
          : kaart
      )
    );
    setSelectedKaarten([]);
    setShowVerstuurModal(false);
    alert(`✅ ${selectedKaarten.length} betaalverzoeken zijn verstuurd!`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const totalSelected = selectedKaarten.reduce((sum, id) => {
    const kaart = consumptieKaarten.find(k => k.id === id);
    return sum + (kaart?.totaalBedrag || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Consumptie</h1>
          <p className="text-slate-500 mt-1">Beheer consumptiekaarten en batch facturatie.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('kaarten')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'kaarten'
              ? 'text-brand-primary border-b-2 border-brand-primary'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Consumptiekaarten</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('facturatie')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'facturatie'
              ? 'text-brand-primary border-b-2 border-brand-primary'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Batch Facturatie</span>
            {facturatieKaarten.length > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {facturatieKaarten.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Consumptiekaarten Tab */}
      {activeTab === 'kaarten' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-transparent shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Open</span>
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-brand-dark">
                {consumptieKaarten.filter(k => k.status === 'open').length}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-transparent shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Klaar voor facturatie</span>
                <CreditCard className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-brand-dark">
                {facturatieKaarten.length}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-transparent shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Verstuurd</span>
                <Send className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-brand-dark">
                {consumptieKaarten.filter(k => k.status === 'betaalverzoek_verstuurd').length}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-transparent shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-sm font-medium">Totaal openstaand</span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                € {openKaarten.reduce((sum, k) => sum + k.totaalBedrag, 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-soft border border-transparent p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Zoek op klantnaam of datum..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
              <button
                onClick={() => {
                  setShowNieuweKaartModal(true);
                  setNieuweKaartKlant(null);
                  setNieuweKaartDatum(new Date().toISOString().split('T')[0]);
                  setNieuweKaartItems({});
                  setKlantGekozen(false);
                  setKlantZoekTerm('');
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-xl shadow-soft transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Nieuwe Kaart</span>
              </button>
            </div>
          </div>

          {/* Kaarten Lijst */}
          <div className="space-y-4">
            {filteredKaarten.map((kaart) => (
              <div key={kaart.id} className="bg-white rounded-2xl shadow-soft border border-transparent p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-brand-dark">{kaart.klantNaam}</h3>
                      {getStatusBadge(kaart.status)}
                    </div>
                    <p className="text-slate-500 text-sm">{formatDate(kaart.datum)}</p>
                    <p className="text-slate-400 text-xs mt-1">{kaart.klantEmail}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Totaal</div>
                    <div className="text-2xl font-bold text-brand-primary">€ {kaart.totaalBedrag.toFixed(2)}</div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4 space-y-2">
                  {kaart.items.length > 0 ? (
                    kaart.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-brand-bg rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Coffee className="w-4 h-4 text-brand-primary" />
                          <span className="font-medium text-brand-dark">{item.naam}</span>
                          <span className="text-slate-400">×</span>
                          <span className="text-slate-500">{item.aantal}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-brand-dark">€ {item.totaal.toFixed(2)}</div>
                          <div className="text-xs text-slate-400">€ {item.prijs.toFixed(2)} per stuk</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm italic">Geen items toegevoegd</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setSelectedKaart(kaart);
                      setShowAddItemModal(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-bg hover:bg-brand-soft text-brand-dark rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Item toevoegen</span>
                  </button>
                  {kaart.status === 'open' && (
                    <button
                      onClick={() => {
                        setConsumptieKaarten(prev =>
                          prev.map(k =>
                            k.id === kaart.id ? { ...k, status: 'klaar_voor_facturatie' as const } : k
                          )
                        );
                      }}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Markeer als klaar voor facturatie
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Facturatie Tab */}
      {activeTab === 'facturatie' && (
        <div className="space-y-6">
          {/* Header met acties */}
          <div className="bg-white rounded-2xl shadow-soft border border-transparent p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-brand-dark mb-2">Klaar voor facturatie</h2>
                <p className="text-slate-500 text-sm">
                  Selecteer de consumptiekaarten die je wilt factureren en verstuur alle betaalverzoeken in één keer.
                </p>
              </div>
              {facturatieKaarten.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-brand-bg hover:bg-brand-soft text-brand-dark rounded-lg transition-colors font-medium"
                >
                  {selectedKaarten.length === facturatieKaarten.length ? 'Deselecteer alles' : 'Selecteer alles'}
                </button>
              )}
            </div>
          </div>

          {/* Geselecteerde samenvatting */}
          {selectedKaarten.length > 0 && (
            <div className="bg-gradient-to-r from-brand-primary to-pink-600 rounded-2xl p-6 text-white shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90 mb-1">Geselecteerd voor facturatie</div>
                  <div className="text-3xl font-bold">
                    {selectedKaarten.length} {selectedKaarten.length === 1 ? 'kaart' : 'kaarten'}
                  </div>
                  <div className="text-lg mt-2 opacity-90">Totaalbedrag: € {totalSelected.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => setShowVerstuurModal(true)}
                  className="px-8 py-4 bg-white text-brand-primary rounded-xl font-bold text-lg hover:bg-slate-50 transition-colors shadow-lg flex items-center space-x-2"
                >
                  <Send className="w-6 h-6" />
                  <span>Verstuur alle betaalverzoeken</span>
                </button>
              </div>
            </div>
          )}

          {/* Kaarten lijst */}
          {facturatieKaarten.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-soft border border-transparent p-12 text-center">
              <CreditCard className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-brand-dark mb-2">Geen kaarten klaar voor facturatie</h3>
              <p className="text-slate-500">
                Markeer consumptiekaarten als "klaar voor facturatie" om ze hier te zien.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {facturatieKaarten.map((kaart) => (
                <div
                  key={kaart.id}
                  className={`bg-white rounded-2xl shadow-soft border-2 transition-all ${
                    selectedKaarten.includes(kaart.id)
                      ? 'border-brand-primary bg-brand-bg/30'
                      : 'border-transparent'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedKaarten.includes(kaart.id)}
                        onChange={() => handleSelectKaart(kaart.id)}
                        className="mt-1 w-5 h-5 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-brand-dark">{kaart.klantNaam}</h3>
                            <p className="text-slate-500 text-sm">{formatDate(kaart.datum)}</p>
                            <p className="text-slate-400 text-xs mt-1">{kaart.klantEmail}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-brand-primary">€ {kaart.totaalBedrag.toFixed(2)}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {kaart.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 bg-brand-bg rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Coffee className="w-4 h-4 text-brand-primary" />
                                <span className="text-sm font-medium text-brand-dark">
                                  {item.naam} × {item.aantal}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-brand-dark">€ {item.totaal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && selectedKaart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAddItemModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-dark">Item toevoegen</h2>
                <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-slate-500 text-sm mt-1">Kaart van: {selectedKaart.klantNaam}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product</label>
                <select
                  value={newItemNaam}
                  onChange={(e) => {
                    setNewItemNaam(e.target.value);
                    const product = beschikbareProducten.find(p => p.naam === e.target.value);
                    if (product) setNewItemPrijs(product.prijs.toString());
                  }}
                  className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="">Selecteer product</option>
                  {beschikbareProducten.map((product) => (
                    <option key={product.naam} value={product.naam}>
                      {product.naam} - € {product.prijs.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prijs</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemPrijs}
                    onChange={(e) => setNewItemPrijs(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Aantal</label>
                  <input
                    type="number"
                    value={newItemAantal}
                    onChange={(e) => setNewItemAantal(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-100 border-0 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    min="1"
                  />
                </div>
              </div>

              {newItemNaam && newItemPrijs && newItemAantal && (
                <div className="bg-brand-bg p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Totaal:</span>
                    <span className="font-bold text-brand-primary text-lg">
                      € {(parseFloat(newItemPrijs) * parseInt(newItemAantal)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItemNaam || !newItemPrijs}
                className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verstuur Betaalverzoeken Modal */}
      {showVerstuurModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowVerstuurModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-dark">Betaalverzoeken versturen</h2>
                <button onClick={() => setShowVerstuurModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Send className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-900 mb-1">Weet je het zeker?</div>
                    <div className="text-sm text-orange-700">
                      Je staat op het punt om <strong>{selectedKaarten.length}</strong> betaalverzoeken te versturen naar klanten.
                      Het totaalbedrag is <strong>€ {totalSelected.toFixed(2)}</strong>.
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 text-sm">
                De betaallinks worden automatisch gegenereerd en naar de klanten gestuurd via e-mail.
                Je kunt de status van de betalingen volgen in het overzicht.
              </p>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowVerstuurModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleVerstuurBetaalverzoeken}
                className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-5 h-5" />
                <span>Ja, verstuur alle betaalverzoeken</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nieuwe Consumptiekaart Formulier Modal */}
      {showNieuweKaartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto lg:left-72 lg:right-0" onClick={() => setShowNieuweKaartModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 my-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-dark">Nieuwe Consumptiekaart</h2>
                <button onClick={() => setShowNieuweKaartModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Klant Selectie */}
            {!klantGekozen ? (
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Selecteer Klant:</label>
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        value={klantZoekTerm}
                        onChange={(e) => setKlantZoekTerm(e.target.value)}
                        placeholder="Zoek klant..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {MOCK_MEMBERS.filter(member => 
                      member.name.toLowerCase().includes(klantZoekTerm.toLowerCase()) ||
                      member.email.toLowerCase().includes(klantZoekTerm.toLowerCase())
                    ).map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setNieuweKaartKlant(member);
                          setKlantGekozen(true);
                          setKlantZoekTerm('');
                        }}
                        className="w-full text-left p-3 bg-brand-bg hover:bg-brand-soft rounded-lg transition-colors border border-transparent hover:border-brand-primary/20"
                      >
                        <p className="font-medium text-brand-dark">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Formulier Content */}
                <div className="p-4 overflow-y-auto flex-1">
                  {/* Header velden */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Naam:</label>
                      <button
                        onClick={() => {
                          setKlantGekozen(false);
                          setKlantZoekTerm('');
                        }}
                        className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 text-left transition-colors cursor-pointer"
                      >
                        {nieuweKaartKlant?.name}
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Datum:</label>
                      <input
                        type="date"
                        value={nieuweKaartDatum}
                        onChange={(e) => setNieuweKaartDatum(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                  </div>

                  {/* Tabel */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden mb-2">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="px-2 py-2 text-left text-xs font-bold text-slate-700 border-b border-slate-300">
                            Consumptie *
                          </th>
                          <th className="px-2 py-2 text-center text-xs font-bold text-slate-700 border-b border-slate-300 w-20">
                            aantal
                          </th>
                          <th className="px-2 py-2 text-right text-xs font-bold text-slate-700 border-b border-slate-300 w-24">
                            bedrag
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumptieItems.map((item, index) => (
                          <tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="px-2 py-1.5 text-xs text-slate-700">
                              {item}
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min="0"
                                value={nieuweKaartItems[item]?.aantal || ''}
                                onChange={(e) => handleUpdateNieuweKaartItem(item, 'aantal', parseInt(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 border border-slate-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={nieuweKaartItems[item]?.bedrag || ''}
                                onChange={(e) => handleUpdateNieuweKaartItem(item, 'bedrag', parseFloat(e.target.value) || 0)}
                                className="w-full px-1.5 py-1 border border-slate-300 rounded text-right text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        ))}
                        {/* Totaal rij */}
                        <tr className="bg-slate-50 font-bold">
                          <td className="px-2 py-2 text-xs text-slate-700">totaal:</td>
                          <td className="px-2 py-2"></td>
                          <td className="px-2 py-2 text-right text-brand-primary text-sm">
                            € {berekenTotaal().toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Voetnoot */}
                  <p className="text-xs text-slate-500 italic">
                    *Het is alleen toegestaan frisdranken en koffie/thee zelf te pakken
                  </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 flex gap-3">
                  <button
                    onClick={() => setKlantGekozen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm rounded-lg transition-colors"
                  >
                    Terug
                  </button>
                  <button
                    onClick={() => setShowNieuweKaartModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={() => handleSaveNieuweKaart(false)}
                    className="flex-1 bg-brand-primary hover:bg-brand-hover text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Kaart Opslaan
                  </button>
                  <button
                    onClick={() => handleSaveNieuweKaart(true)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    Klaar zetten voor betaalverzoek
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Consumptie;
