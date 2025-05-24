import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DebugInfo = () => {
  const { user, isAuthenticated, loading } = useAuth();

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      border: '1px solid black', 
      padding: '10px',
      zIndex: 9999,
      fontSize: '12px'
    }}>
      <div><strong>Debug Info:</strong></div>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
      <div>User: {user ? user.name : 'null'}</div>
      <div>Token: {localStorage.getItem('token') ? 'exists' : 'null'}</div>
      <div>URL: {window.location.pathname}</div>
    </div>
  );
};

export default DebugInfo; 