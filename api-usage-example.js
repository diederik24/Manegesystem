/**
 * Voorbeeld: Hoe de API te gebruiken in je andere webapp
 * 
 * Dit bestand toont hoe je de Manegeplan API kunt aanroepen
 * om klantdata op te halen met een API key.
 */

// ============================================
// Basis API Call
// ============================================

async function getCustomerData(apiKey) {
  try {
    const response = await fetch(
      'https://jouw-domein.vercel.app/api/get-customer-data',
      {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch customer data');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================
// Gebruik Voorbeeld
// ============================================

async function displayCustomerInfo() {
  // Haal de API key op (bijv. uit localStorage, config, etc.)
  const apiKey = localStorage.getItem('customer_api_key');
  
  if (!apiKey) {
    console.error('API key niet gevonden');
    return;
  }

  try {
    const data = await getCustomerData(apiKey);
    
    // Klantgegevens
    console.log('Klant:', data.customer.name);
    console.log('Email:', data.customer.email);
    console.log('Saldo:', data.customer.balance);
    
    // Lessen
    console.log('Lessen:', data.lessons.length);
    data.lessons.forEach(les => {
      console.log(`- ${les.name} op ${les.day} om ${les.time}`);
    });
    
    // Leskaarten
    console.log('Resterende lessen:', data.totaalResterendeLessen);
    data.leskaarten.forEach(kaart => {
      console.log(`- Leskaart: ${kaart.resterendeLessen} lessen over`);
    });
    
    // Openstaande transacties
    if (data.openstaandeTransacties.length > 0) {
      console.log('Openstaande facturen:', data.openstaandeTransacties.length);
    }
    
    return data;
  } catch (error) {
    console.error('Fout bij ophalen klantdata:', error);
  }
}

// ============================================
// React Component Voorbeeld
// ============================================

/*
import React, { useState, useEffect } from 'react';

function CustomerDashboard() {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const apiKey = localStorage.getItem('customer_api_key');
        if (!apiKey) {
          setError('API key niet gevonden');
          setLoading(false);
          return;
        }

        const response = await fetch(
          'https://jouw-domein.vercel.app/api/get-customer-data',
          {
            headers: {
              'X-API-Key': apiKey
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setCustomerData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Laden...</div>;
  if (error) return <div>Fout: {error}</div>;
  if (!customerData) return <div>Geen data</div>;

  return (
    <div>
      <h1>Welkom, {customerData.customer.name}!</h1>
      
      <div>
        <h2>Mijn Lessen</h2>
        {customerData.lessons.map(les => (
          <div key={les.id}>
            {les.name} - {les.day} {les.time}
          </div>
        ))}
      </div>

      <div>
        <h2>Leskaarten</h2>
        <p>Resterende lessen: {customerData.totaalResterendeLessen}</p>
        {customerData.leskaarten.map(kaart => (
          <div key={kaart.id}>
            {kaart.resterendeLessen} lessen over (tot {kaart.eindDatum})
          </div>
        ))}
      </div>

      {customerData.openstaandeTransacties.length > 0 && (
        <div>
          <h2>Openstaande Facturen</h2>
          {customerData.openstaandeTransacties.map(transactie => (
            <div key={transactie.id}>
              {transactie.description}: €{transactie.amount}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
*/

// ============================================
// Error Handling Voorbeeld
// ============================================

async function getCustomerDataWithErrorHandling(apiKey) {
  try {
    const response = await fetch(
      'https://jouw-domein.vercel.app/api/get-customer-data',
      {
        headers: {
          'X-API-Key': apiKey
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Handle verschillende error codes
      switch (data.code) {
        case 'MISSING_API_KEY':
          console.error('API key ontbreekt');
          break;
        case 'INVALID_API_KEY':
          console.error('API key is ongeldig of verlopen');
          // Mogelijk de gebruiker naar login sturen
          break;
        case 'CUSTOMER_NOT_FOUND':
          console.error('Klant niet gevonden');
          break;
        default:
          console.error('Onbekende fout:', data.error);
      }
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    // Network errors, etc.
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Netwerk fout - controleer je internet verbinding');
    }
    throw error;
  }
}

// ============================================
// Polling Voorbeeld (voor real-time updates)
// ============================================

function startPolling(apiKey, intervalMs = 60000) {
  const interval = setInterval(async () => {
    try {
      const data = await getCustomerData(apiKey);
      // Update UI met nieuwe data
      console.log('Data bijgewerkt:', data);
      // Bijv. update state in React component
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

// Gebruik:
// const stopPolling = startPolling(apiKey, 60000); // Elke minuut
// Later: stopPolling();

// ============================================
// Export voor gebruik in andere modules
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCustomerData,
    getCustomerDataWithErrorHandling,
    startPolling
  };
}








