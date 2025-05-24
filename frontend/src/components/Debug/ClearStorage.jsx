import React from 'react';

const ClearStorage = () => {
  const clearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 50, 
      right: 10, 
      background: 'red', 
      color: 'white',
      border: '1px solid black', 
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <button onClick={clearStorage} style={{ color: 'white', background: 'red', border: 'none' }}>
        Limpar Storage
      </button>
    </div>
  );
};

export default ClearStorage; 