// Simple version to test
import React from 'react';

const SimpleDashboard = () => {
  return (
    <div style={{ 
      padding: '40px', 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#1e293b', fontSize: '32px', marginBottom: '20px' }}>
        Manege Duiksehoef Dashboard
      </h1>
      <p style={{ color: '#64748b', fontSize: '18px' }}>
        Als je dit ziet, werkt React!
      </p>
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#ec4899', marginBottom: '10px' }}>Statistieken</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '5px' }}>Lessen Vandaag</p>
            <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>18</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '5px' }}>Omzet Vandaag</p>
            <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>€ 1.250</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '5px' }}>Actieve Ruiters</p>
            <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>452</p>
          </div>
          <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '5px' }}>Zorg & Welzijn</p>
            <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>3</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;

