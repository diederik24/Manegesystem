import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreHorizontal, Mail, Phone, Calendar, Heart, Activity, X, Save, Edit, MapPin, User } from 'lucide-react';
import { MOCK_HORSES } from '../constants';
import { supabase } from '../lib/supabase';
import { Member, Horse } from '../types';

const Stamgegevens: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pension' | 'manege' | 'paarden'>('pension');
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberHorsesMap, setMemberHorsesMap] = useState<Record<string, string[]>>({});
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState<Member | null>(null);

  // Haal members op uit Supabase
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching members:', error);
        } else {
          // Map Supabase data naar Member interface
          const mappedMembers: Member[] = (data || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email || '',
            phone: m.phone || '',
            status: m.status || 'Actief',
            balance: parseFloat(m.balance) || 0,
            klantType: m.klant_type || undefined,
            adres: m.adres || '',
            postcode: m.postcode || '',
            plaats: m.plaats || '',
            factuurAdres: m.factuur_adres || '',
            factuurPostcode: m.factuur_postcode || '',
            factuurPlaats: m.factuur_plaats || '',
            factuurOntvangen: m.factuur_ontvangen ?? false,
            factuurEmail: m.factuur_email || ''
          }));
          setMembers(mappedMembers);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  // Haal horses op uit Supabase
  useEffect(() => {
    const fetchHorses = async () => {
      try {
        const { data: horsesData, error: horsesError } = await supabase
          .from('horses')
          .select('*')
          .order('name', { ascending: true });

        if (horsesError) {
          console.error('Error fetching horses:', horsesError);
          return;
        }

        // Haal eigenaren op voor paarden die een owner_id hebben
        const ownerIds = [...new Set((horsesData || []).map((h: any) => h.owner_id).filter(Boolean))];
        let ownersMap = {};
        
        if (ownerIds.length > 0) {
          const { data: ownersData } = await supabase
            .from('members')
            .select('id, name')
            .in('id', ownerIds);
          
          if (ownersData) {
            ownersMap = ownersData.reduce((acc: Record<string, string>, owner: any) => {
              acc[owner.id] = owner.name;
              return acc;
            }, {});
          }
        }

        // Map Supabase data naar Horse interface
        const mappedHorses: Horse[] = (horsesData || []).map((h: any) => ({
          id: h.id,
          name: h.name,
          breed: h.breed || 'Onbekend',
          birthDate: h.birth_date ? new Date(h.birth_date).toLocaleDateString('nl-NL') : '',
          available: h.available ?? true,
          type: h.type || 'Manege',
          owner: h.owner_id ? ownersMap[h.owner_id] : undefined
        }));
        setHorses(mappedHorses);

        // Maak een map van member ID naar paarden namen
        const horsesByOwner = {};
        (horsesData || []).forEach((h: any) => {
          if (h.owner_id) {
            if (!horsesByOwner[h.owner_id]) {
              horsesByOwner[h.owner_id] = [];
            }
            horsesByOwner[h.owner_id].push(h.name);
          }
        });
        setMemberHorsesMap(horsesByOwner);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchHorses();
  }, []);

  const filteredHorses = horses.filter(h => 
    h.type === 'Manege' && h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter klanten op type
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'pension') {
      return matchesSearch && m.klantType === 'Pension';
    } else if (activeTab === 'manege') {
      return matchesSearch && m.klantType === 'Manege';
    }
    return false;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Stamgegevens</h1>
          <p className="text-slate-500 mt-1">Beheer uw manegefamilie.</p>
        </div>
        <button className="flex items-center space-x-2 px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105">
          <Plus className="w-4 h-4" />
          <span>
            {activeTab === 'pension' ? 'Pension Klant Toevoegen' : 
             activeTab === 'manege' ? 'Manege Klant Toevoegen' : 
             'Paard Toevoegen'}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-transparent overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-slate-100 px-8 pt-6 flex space-x-8">
          <button 
            onClick={() => setActiveTab('pension')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${activeTab === 'pension' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-brand-primary/70'}`}
          >
            Pension Klanten
          </button>
          <button 
            onClick={() => setActiveTab('manege')}
            className={`pb-4 text-base font-semibold border-b-2 transition-all ${activeTab === 'manege' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-brand-primary/70'}`}
          >
            Manege Klanten
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
              placeholder={`Zoek in ${activeTab === 'pension' ? 'pension klanten' : activeTab === 'manege' ? 'manege klanten' : 'paarden'}...`} 
              className="w-full pl-12 pr-4 py-3 border-none bg-white rounded-2xl shadow-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-soft/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm">
            {activeTab === 'paarden' 
              ? `${filteredHorses.length} paarden` 
              : `${filteredMembers.length} ${activeTab === 'pension' ? 'pension' : 'manege'} klanten`}
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-slate-50">
              {activeTab !== 'paarden' ? (
                <tr>
                  <th className="px-8 py-5">Naam</th>
                  <th className="px-6 py-5">Contact</th>
                  <th className="px-6 py-5">Type</th>
                  <th className="px-6 py-5">Adres</th>
                  <th className="px-6 py-5">Postcode</th>
                  <th className="px-6 py-5">Stad</th>
                  <th className="px-6 py-5">Status</th>
                  {activeTab === 'pension' && (
                    <th className="px-6 py-5">Paard(en)</th>
                  )}
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
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'pension' ? 9 : 8} className="px-8 py-12 text-center text-slate-400">
                    Laden...
                  </td>
                </tr>
              ) : activeTab !== 'paarden' ? (
                filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'pension' ? 9 : 8} className="px-8 py-12 text-center text-slate-400">
                      Geen {activeTab === 'pension' ? 'pension' : 'manege'} klanten gevonden
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map(member => (
                    <tr 
                      key={member.id} 
                      className="hover:bg-brand-bg/50 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedMember(member);
                        setEditedMember({ ...member });
                        setShowMemberModal(true);
                        setIsEditing(false);
                      }}
                    >
                      <td className="px-8 py-5 font-bold text-brand-dark">{member.name}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col space-y-1.5">
                          {member.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3.5 h-3.5 text-brand-primary/60" />
                              <span>{member.email}</span>
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3.5 h-3.5 text-brand-primary/60" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {!member.email && !member.phone && (
                            <span className="text-slate-400 text-xs">Geen contactgegevens</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          member.klantType === 'Pension' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                            : 'bg-brand-bg text-brand-primary border border-brand-soft'
                        }`}>
                          {member.klantType || 'Onbekend'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {(member as any).adres ? (
                          <span className="text-slate-700 text-sm">{(member as any).adres}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {(member as any).postcode ? (
                          <span className="text-slate-700 text-sm">{(member as any).postcode}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {(member as any).plaats ? (
                          <span className="text-slate-700 text-sm">{(member as any).plaats}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
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
                      {activeTab === 'pension' && (
                        <td className="px-6 py-5">
                          {memberHorsesMap[member.id] && memberHorsesMap[member.id].length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {memberHorsesMap[member.id].map((horseName, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100"
                                >
                                  {horseName}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Geen paarden</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-5 text-right">
                        <button className="text-slate-300 hover:text-brand-primary transition-colors p-2 hover:bg-white rounded-full">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )
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

      {/* Klant Detail Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMemberModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-brand-dark">{selectedMember.name}</h2>
                <p className="text-slate-500 text-sm mt-1">Klant overzicht</p>
              </div>
              <div className="flex items-center space-x-3">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-xl transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Bewerken</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMemberModal(false);
                    setIsEditing(false);
                    setSelectedMember(null);
                    setEditedMember(null);
                  }}
                  className="p-2 hover:bg-brand-bg rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {isEditing && editedMember ? (
                // Edit Mode
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Naam</label>
                      <input
                        type="text"
                        value={editedMember.name}
                        onChange={(e) => setEditedMember({ ...editedMember, name: e.target.value })}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                      <select
                        value={editedMember.status}
                        onChange={(e) => setEditedMember({ ...editedMember, status: e.target.value as any })}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="Actief">Actief</option>
                        <option value="Wachtlijst">Wachtlijst</option>
                        <option value="Inactief">Inactief</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editedMember.email}
                        onChange={(e) => setEditedMember({ ...editedMember, email: e.target.value })}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Telefoon</label>
                      <input
                        type="tel"
                        value={editedMember.phone}
                        onChange={(e) => setEditedMember({ ...editedMember, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Adres</label>
                      <input
                        type="text"
                        value={(editedMember as any).adres || ''}
                        onChange={(e) => setEditedMember({ ...editedMember, adres: e.target.value } as any)}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Postcode</label>
                      <input
                        type="text"
                        value={(editedMember as any).postcode || ''}
                        onChange={(e) => setEditedMember({ ...editedMember, postcode: e.target.value } as any)}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Plaats</label>
                      <input
                        type="text"
                        value={(editedMember as any).plaats || ''}
                        onChange={(e) => setEditedMember({ ...editedMember, plaats: e.target.value } as any)}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Klant Type</label>
                      <select
                        value={editedMember.klantType || ''}
                        onChange={(e) => setEditedMember({ ...editedMember, klantType: e.target.value as any })}
                        className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      >
                        <option value="">Selecteer type</option>
                        <option value="Pension">Pension</option>
                        <option value="Manege">Manege</option>
                      </select>
                    </div>
                  </div>

                  {/* Factuur Instellingen Sectie */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-bold text-brand-dark mb-4">Factuur Instellingen</h3>
                    <div className="space-y-6">
                      {/* Toggle Switch */}
                      <div className="flex items-center justify-between p-4 bg-brand-bg/30 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-brand-dark">Wil factuur ontvangen</p>
                          <p className="text-xs text-slate-500">Schakel aan als deze klant facturen wil ontvangen</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(editedMember as any).factuurOntvangen ?? false}
                            onChange={(e) => setEditedMember({ ...editedMember, factuurOntvangen: e.target.checked } as any)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>

                      {/* Factuur Email - alleen tonen als toggle aan staat */}
                      {(editedMember as any).factuurOntvangen && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Factuur Email Adres</label>
                          <input
                            type="email"
                            value={(editedMember as any).factuurEmail || ''}
                            onChange={(e) => setEditedMember({ ...editedMember, factuurEmail: e.target.value } as any)}
                            placeholder={selectedMember.email || "Email adres voor facturen"}
                            className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            {selectedMember.email 
                              ? `Laat leeg om "${selectedMember.email}" te gebruiken` 
                              : "Voer het email adres in waar facturen naartoe moeten"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedMember({ ...selectedMember });
                      }}
                      className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
                    >
                      Annuleren
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('members')
                            .update({
                              name: editedMember.name,
                              email: editedMember.email || null,
                              phone: editedMember.phone || null,
                              status: editedMember.status,
                              klant_type: editedMember.klantType || null,
                              adres: (editedMember as any).adres || null,
                              postcode: (editedMember as any).postcode || null,
                              plaats: (editedMember as any).plaats || null,
                              factuur_adres: (editedMember as any).factuurAdres || null,
                              factuur_postcode: (editedMember as any).factuurPostcode || null,
                              factuur_plaats: (editedMember as any).factuurPlaats || null,
                              factuur_ontvangen: (editedMember as any).factuurOntvangen ?? false,
                              factuur_email: (editedMember as any).factuurEmail || null
                            })
                            .eq('id', editedMember.id);

                          if (error) {
                            console.error('Error updating member:', error);
                            alert('Fout bij opslaan: ' + error.message);
                          } else {
                            // Update local state
                            setMembers(members.map(m => m.id === editedMember.id ? editedMember : m));
                            setSelectedMember(editedMember);
                            setIsEditing(false);
                            alert('Gegevens opgeslagen!');
                          }
                        } catch (error: any) {
                          console.error('Error:', error);
                          alert('Fout bij opslaan: ' + error.message);
                        }
                      }}
                      className="px-6 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Opslaan</span>
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="space-y-6">
                  {/* Contactgegevens */}
                  <div className="bg-brand-bg/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Contactgegevens</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMember.email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-brand-primary/60" />
                          <div>
                            <p className="text-xs text-slate-500">Email</p>
                            <p className="text-sm font-medium text-brand-dark">{selectedMember.email}</p>
                          </div>
                        </div>
                      )}
                      {selectedMember.phone && (
                        <div className="flex items-center space-x-3">
                          <Phone className="w-4 h-4 text-brand-primary/60" />
                          <div>
                            <p className="text-xs text-slate-500">Telefoon</p>
                            <p className="text-sm font-medium text-brand-dark">{selectedMember.phone}</p>
                          </div>
                        </div>
                      )}
                      {(selectedMember as any).adres && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-4 h-4 text-brand-primary/60 mt-1" />
                          <div>
                            <p className="text-xs text-slate-500">Adres</p>
                            <p className="text-sm font-medium text-brand-dark">
                              {(selectedMember as any).adres}
                              {(selectedMember as any).postcode && `, ${(selectedMember as any).postcode}`}
                              {(selectedMember as any).plaats && ` ${(selectedMember as any).plaats}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Factuuradres */}
                  {((selectedMember as any).factuurAdres || (selectedMember as any).factuurPostcode || (selectedMember as any).factuurPlaats) && (
                    <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100">
                      <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <span>Factuuradres</span>
                      </h3>
                      <p className="text-sm font-medium text-brand-dark">
                        {(selectedMember as any).factuurAdres || (selectedMember as any).adres}
                        {((selectedMember as any).factuurPostcode || (selectedMember as any).postcode) && `, ${(selectedMember as any).factuurPostcode || (selectedMember as any).postcode}`}
                        {((selectedMember as any).factuurPlaats || (selectedMember as any).plaats) && ` ${(selectedMember as any).factuurPlaats || (selectedMember as any).plaats}`}
                      </p>
                    </div>
                  )}

                  {/* Status & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-brand-bg/30 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-brand-dark mb-4">Status</h3>
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                        selectedMember.status === 'Actief' ? 'bg-green-100 text-green-700' : 
                        selectedMember.status === 'Wachtlijst' ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedMember.status}
                      </span>
                    </div>
                    <div className="bg-brand-bg/30 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-brand-dark mb-4">Klant Type</h3>
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold ${
                        selectedMember.klantType === 'Pension' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : 'bg-brand-bg text-brand-primary border border-brand-soft'
                      }`}>
                        {selectedMember.klantType || 'Onbekend'}
                      </span>
                    </div>
                  </div>

                  {/* Factuur Instellingen */}
                  <div className="bg-brand-bg/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-brand-dark mb-4">Factuur Instellingen</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-brand-dark">Wil factuur ontvangen</p>
                          <p className="text-xs text-slate-500">Deze klant ontvangt facturen</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                          (selectedMember as any).factuurOntvangen
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {(selectedMember as any).factuurOntvangen ? 'Aan' : 'Uit'}
                        </div>
                      </div>
                      {(selectedMember as any).factuurOntvangen && (
                        <div className="flex items-center space-x-3 pt-2 border-t border-slate-200">
                          <Mail className="w-4 h-4 text-brand-primary/60" />
                          <div>
                            <p className="text-xs text-slate-500">Factuur Email</p>
                            <p className="text-sm font-medium text-brand-dark">
                              {(selectedMember as any).factuurEmail || selectedMember.email || 'Geen email ingesteld'}
                              {!(selectedMember as any).factuurEmail && selectedMember.email && (
                                <span className="text-slate-400 ml-1">(contact email)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Paarden */}
                  {memberHorsesMap[selectedMember.id] && memberHorsesMap[selectedMember.id].length > 0 && (
                    <div className="bg-brand-bg/30 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center space-x-2">
                        <Heart className="w-5 h-5" />
                        <span>Paarden ({memberHorsesMap[selectedMember.id].length})</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {memberHorsesMap[selectedMember.id].map((horseName, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 border border-purple-100"
                          >
                            {horseName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stamgegevens;