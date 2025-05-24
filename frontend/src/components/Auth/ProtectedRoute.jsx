import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Carregando...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Redirecionar para login com a localização atual
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permissões de role se especificado
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        p={4}
      >
        <Typography variant="h4" color="error">
          Acesso Negado
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Você não tem permissão para acessar esta página.
        </Typography>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute; 