import React, { useState, useEffect } from 'react';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, Check, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Member } from '../types';

interface ApiKey {
  id: string;
  member_id: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  notes: string | null;
  member?: {
    name: string;
    email: string;
  };
}

const ApiKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Haal API keys op
  useEffect(() => {
    fetchApiKeys();
  }, []);

  // Haal members op voor dropdown
  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select(`
          id,
          member_id,
          api_key,
          is_active,
          created_at,
          last_used_at,
          expires_at,
          notes,
          members:member_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        return;
      }

      const mappedKeys: ApiKey[] = (data || []).map((key: any) => ({
        ...key,
        member: key.members
      }));

      setApiKeys(mappedKeys);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching members:', error);
        return;
      }

      setMembers((data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email || ''
      })));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateApiKey = () => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const base64 = btoa(String.fromCharCode(...randomBytes));
    return 'mk_' + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const createApiKey = async () => {
    if (!selectedMember) {
      alert('Selecteer een klant');
      return;
    }

    try {
      // Check of er al een actieve key bestaat
      const existingKey = apiKeys.find(
        k => k.member_id === selectedMember && k.is_active
      );

      if (existingKey) {
        const confirm = window.confirm(
          `Er bestaat al een actieve API key voor deze klant. Wil je deze deactiveren en een nieuwe aanmaken?`
        );
        if (!confirm) return;

        // Deactiveer oude key
        await supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('id', existingKey.id);
      }

      const newApiKey = generateApiKey();
      const member = members.find(m => m.id === selectedMember);

      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          member_id: selectedMember,
          api_key: newApiKey,
          is_active: true,
          notes: `Aangemaakt voor ${member?.name || 'Onbekend'}`
        }])
        .select(`
          id,
          member_id,
          api_key,
          is_active,
          created_at,
          last_used_at,
          expires_at,
          notes,
          members:member_id (
            name,
            email
          )
        `)
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        alert('Fout bij aanmaken API key: ' + error.message);
        return;
      }

      const newKey: ApiKey = {
        ...data,
        member: data.members
      };

      setApiKeys([newKey, ...apiKeys]);
      setShowNewKeyModal(false);
      setSelectedMember('');
      setVisibleKeys(new Set([newKey.id]));
      alert('API key succesvol aangemaakt!');
    } catch (error: any) {
      console.error('Error:', error);
      alert('Fout bij aanmaken API key: ' + error.message);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) {
        console.error('Error updating API key:', error);
        alert('Fout bij updaten API key: ' + error.message);
        return;
      }

      setApiKeys(apiKeys.map(k => 
        k.id === keyId ? { ...k, is_active: !currentStatus } : k
      ));
    } catch (error: any) {
      console.error('Error:', error);
      alert('Fout bij updaten API key: ' + error.message);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Weet je zeker dat je deze API key wilt verwijderen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Error deleting API key:', error);
        alert('Fout bij verwijderen API key: ' + error.message);
        return;
      }

      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (error: any) {
      console.error('Error:', error);
      alert('Fout bij verwijderen API key: ' + error.message);
    }
  };

  const filteredKeys = apiKeys.filter(key => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      key.member?.name?.toLowerCase().includes(search) ||
      key.member?.email?.toLowerCase().includes(search) ||
      key.api_key.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark mb-2">API Key Beheer</h2>
          <p className="text-slate-500">Beheer API keys voor klanten om hun data op te halen</p>
        </div>
        <button
          onClick={() => setShowNewKeyModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white rounded-2xl shadow-soft shadow-brand-primary/30 transition-all transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe API Key</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Zoek op klant naam, email of API key..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
        />
      </div>

      {/* API Keys List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-slate-500">API keys laden...</p>
        </div>
      ) : filteredKeys.length === 0 ? (
        <div className="text-center py-12 bg-brand-bg rounded-3xl">
          <Key className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Geen API keys gevonden</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredKeys.map((key) => {
            const isVisible = visibleKeys.has(key.id);
            const isCopied = copiedKey === key.id;

            return (
              <div
                key={key.id}
                className={`bg-white rounded-3xl shadow-soft border border-transparent p-6 ${
                  !key.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        key.is_active ? 'bg-brand-primary/10' : 'bg-slate-200'
                      }`}>
                        <Key className={`w-5 h-5 ${
                          key.is_active ? 'text-brand-primary' : 'text-slate-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-brand-dark">
                          {key.member?.name || 'Onbekende klant'}
                        </h3>
                        <p className="text-sm text-slate-500">{key.member?.email || 'Geen email'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        key.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {key.is_active ? 'Actief' : 'Inactief'}
                      </span>
                    </div>

                    <div className="mt-4 p-4 bg-brand-bg rounded-2xl">
                      <div className="flex items-center justify-between">
                        <code className="text-sm font-mono text-slate-700 break-all flex-1">
                          {isVisible ? key.api_key : '••••••••••••••••••••••••••••••••'}
                        </code>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title={isVisible ? 'Verberg key' : 'Toon key'}
                          >
                            {isVisible ? (
                              <EyeOff className="w-4 h-4 text-slate-600" />
                            ) : (
                              <Eye className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(key.api_key, key.id)}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title="Kopieer key"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Aangemaakt:</span>{' '}
                        {new Date(key.created_at).toLocaleDateString('nl-NL')}
                      </div>
                      <div>
                        <span className="font-medium">Laatst gebruikt:</span>{' '}
                        {key.last_used_at
                          ? new Date(key.last_used_at).toLocaleDateString('nl-NL')
                          : 'Nog niet gebruikt'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 ml-4">
                    <button
                      onClick={() => toggleKeyStatus(key.id, key.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        key.is_active
                          ? 'hover:bg-red-50 text-red-600'
                          : 'hover:bg-green-50 text-green-600'
                      }`}
                      title={key.is_active ? 'Deactiveer' : 'Activeer'}
                    >
                      {key.is_active ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                      title="Verwijder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowNewKeyModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-brand-dark">Nieuwe API Key</h3>
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Selecteer klant
                </label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-3 bg-brand-bg border border-brand-soft/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                >
                  <option value="">Selecteer een klant...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-2xl transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={createApiKey}
                className="flex-1 px-4 py-3 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-2xl transition-colors"
              >
                API Key Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManagement;







