import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import Reports from './components/Reports/Reports';
import MetaAds from './components/MetaAds/MetaAds';
import GoogleAnalytics from './components/GoogleAnalytics/GoogleAnalytics';
import Companies from './components/Admin/Companies';
import Settings from './components/Settings/Settings';
import DebugInfo from './components/Debug/DebugInfo';
import ClearStorage from './components/Debug/ClearStorage';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      dark: '#115293',
      light: '#42a5f5'
    },
    secondary: {
      main: '#dc004e',
      dark: '#9a0036',
      light: '#ff5983'
    },
    success: {
      main: '#2e7d32',
      dark: '#1b5e20',
      light: '#4caf50'
    },
    background: {
      default: '#f5f5f5'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 500
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 12
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    }
  }
});

// Componente temporário para páginas não implementadas
const ComingSoon = ({ title }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '60vh',
    textAlign: 'center'
  }}>
    <h2>{title}</h2>
    <p>Esta página está em desenvolvimento.</p>
  </div>
);

function App() {
  // Capturar erros globais
  React.useEffect(() => {
    const handleError = (event) => {
      console.error('Erro global capturado:', event.error);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  try {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <DebugInfo />
          <ClearStorage />
          <Router>
          <Routes>
            {/* Rota de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rota raiz - redireciona para dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Rotas protegidas com layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    <Route path="/meta-ads" element={<MetaAds />} />
                    
                    <Route path="/google-analytics" element={<GoogleAnalytics />} />
                    
                    <Route path="/reports" element={<Reports />} />
                    
                    <Route 
                      path="/admin/companies" 
                      element={
                        <ProtectedRoute allowedRoles={['super_admin']}>
                          <Companies />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Rota 404 */}
                    <Route path="*" element={<ComingSoon title="Página não encontrada" />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    );
  } catch (error) {
    console.error('Erro no App:', error);
    return <div>Erro na aplicação: {error.message}</div>;
  }
}

export default App;
