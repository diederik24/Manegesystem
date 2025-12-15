import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DatabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test 1: Check if we can connect to Supabase
      const { data, error } = await supabase.from('members').select('count', { count: 'exact', head: true });
      
      if (error) {
        // If members table doesn't exist, try to check connection differently
        const { error: connectionError } = await supabase.auth.getSession();
        
        if (connectionError && connectionError.message.includes('Invalid API key')) {
          setConnectionStatus('error');
          setErrorMessage('Invalid API key. Check your VITE_SUPABASE_ANON_KEY in .env.local');
          return;
        }
        
        if (connectionError && connectionError.message.includes('Failed to fetch')) {
          setConnectionStatus('error');
          setErrorMessage('Cannot connect to Supabase. Check your VITE_SUPABASE_URL in .env.local');
          return;
        }
        
        // Table might not exist yet, but connection works
        setConnectionStatus('connected');
        setErrorMessage('Connected! But tables might not exist yet. Run the SQL commands in Supabase SQL Editor.');
        return;
      }

      // Test 2: Get counts from all tables
      const tables = ['members', 'calendar_events', 'consumptie_kaarten', 'transactions'];
      const counts: Record<string, number> = {};

      for (const table of tables) {
        try {
          const { count, error: countError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            counts[table] = count || 0;
          }
        } catch (e) {
          counts[table] = -1; // Table doesn't exist
        }
      }

      setTableCounts(counts);
      setConnectionStatus('connected');
      setErrorMessage('');
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Unknown error occurred');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-soft border border-transparent">
      <h2 className="text-2xl font-bold text-brand-dark mb-4">Database Verbinding Test</h2>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'error' ? 'bg-red-500' :
            'bg-yellow-500 animate-pulse'
          }`}></div>
          <span className="font-medium text-brand-dark">
            {connectionStatus === 'connected' ? 'Verbonden met Supabase' :
             connectionStatus === 'error' ? 'Verbindingsfout' :
             'Testen verbinding...'}
          </span>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className={`p-4 rounded-lg ${
            connectionStatus === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm ${
              connectionStatus === 'error' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {errorMessage}
            </p>
          </div>
        )}

        {/* Table Counts */}
        {connectionStatus === 'connected' && Object.keys(tableCounts).length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-brand-dark mb-2">Tabel Status:</h3>
            <div className="space-y-2">
              {Object.entries(tableCounts).map(([table, count]) => (
                <div key={table} className="flex items-center justify-between p-2 bg-brand-bg rounded-lg">
                  <span className="text-sm text-brand-dark capitalize">{table.replace('_', ' ')}</span>
                  <span className={`text-sm font-medium ${
                    count === -1 ? 'text-red-500' : 'text-green-600'
                  }`}>
                    {count === -1 ? 'Niet gevonden' : `${count} rijen`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment Variables Check */}
        <div className="mt-4 p-4 bg-brand-bg rounded-lg">
          <h3 className="font-medium text-brand-dark mb-2">Environment Variables:</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <span className={import.meta.env.VITE_SUPABASE_URL ? 'text-green-600' : 'text-red-500'}>
                {import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗'}
              </span>
              <span className="text-slate-600">
                VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? 'Ingesteld' : 'Niet ingesteld'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={import.meta.env.VITE_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-500'}>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗'}
              </span>
              <span className="text-slate-600">
                VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Ingesteld' : 'Niet ingesteld'}
              </span>
            </div>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={testConnection}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white rounded-lg transition-colors font-medium"
        >
          Opnieuw Testen
        </button>
      </div>
    </div>
  );
};

export default DatabaseTest;

