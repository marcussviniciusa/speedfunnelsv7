import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Avatar,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Schedule as ScheduleIcon,
  Public as PublicIcon,
  Business as BusinessIcon,
  Share as ShareIcon,
  BarChart as ChartIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { sharedReportsAPI } from '../../services/api';
import ReportVisualization from '../Reports/ReportVisualization';

// Temas disponíveis
const getTheme = (themeName) => {
  const baseTheme = {
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
      borderRadius: 8,
    },
  };

  switch (themeName) {
    case 'dark':
      return createTheme({
        ...baseTheme,
        palette: {
          mode: 'dark',
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#f48fb1',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
        },
      });
    
    case 'corporate':
      return createTheme({
        ...baseTheme,
        palette: {
          mode: 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
        },
      });
    
    default: // light
      return createTheme({
        ...baseTheme,
        palette: {
          mode: 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      });
  }
};

const PublicReportViewer = () => {
  const { shareId } = useParams();
  
  // Estados principais
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  
  // Estados para autenticação
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);
  
  // Estados auxiliares
  const [theme, setTheme] = useState(getTheme('light'));

  // Carregar relatório ao montar
  useEffect(() => {
    if (shareId) {
      loadReport();
    }
  }, [shareId]);

  // Atualizar tema quando reportData muda
  useEffect(() => {
    if (reportData?.shareSettings?.theme) {
      setTheme(getTheme(reportData.shareSettings.theme));
    }
  }, [reportData]);

  // Carregar relatório público
  const loadReport = async (passwordAttempt = null) => {
    try {
      setLoading(true);
      setError(null);
      setPasswordError('');

      const response = await sharedReportsAPI.getPublicReport(shareId, passwordAttempt);
      
      if (response.status === 200) {
        setReportData(response.data.data);
        setRequiresPassword(false);
      }
      
    } catch (err) {
      console.error('❌ [PublicReportViewer] Erro:', err);
      
      if (err.response?.status === 401 && err.response?.data?.requiresPassword) {
        setRequiresPassword(true);
        setError(null);
      } else if (err.response?.status === 401) {
        setPasswordError('Senha incorreta');
      } else if (err.response?.status === 404) {
        setError('Relatório não encontrado ou foi desativado');
      } else if (err.response?.status === 410) {
        setError('Este relatório expirou');
      } else if (err.response?.status === 403) {
        setError('Acesso não permitido deste domínio');
      } else {
        setError('Erro ao carregar relatório: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
      setAuthenticating(false);
    }
  };

  // Submeter senha
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setPasswordError('Digite a senha');
      return;
    }
    
    setAuthenticating(true);
    await loadReport(password);
  };

  // Formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Renderizar cabeçalho público
  const renderPublicHeader = () => (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          {reportData?.shareSettings?.customLogo ? (
            <Avatar
              src={reportData.shareSettings.customLogo}
              alt="Logo"
              sx={{ width: 40, height: 40 }}
            />
          ) : (
            <ChartIcon sx={{ fontSize: 32 }} />
          )}
          
          <Box>
            <Typography variant="h6" color="inherit" noWrap>
              {reportData?.title || 'Relatório Público'}
            </Typography>
            
            {reportData?.shareSettings?.showCompanyInfo && reportData?.company?.name && (
              <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                {reportData.company.name}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Visualizações">
            <Chip
              icon={<VisibilityIcon />}
              label={reportData?.accessStats?.totalViews || 0}
              color="secondary"
              size="small"
            />
          </Tooltip>
          
          {reportData?.shareSettings?.allowPdfDownload && (
            <Tooltip title="Download PDF">
              <IconButton color="inherit">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );

  // Renderizar formulário de senha
  const renderPasswordForm = () => (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Card sx={{ p: 4, width: '100%', maxWidth: 400 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <LockIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Relatório Protegido
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Este relatório está protegido por senha. Digite a senha para continuar.
              </Typography>
            </Box>

            <form onSubmit={handlePasswordSubmit}>
              <TextField
                fullWidth
                type="password"
                label="Senha de Acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                sx={{ mb: 3 }}
                autoFocus
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={authenticating}
                startIcon={authenticating ? <CircularProgress size={20} /> : <LockIcon />}
              >
                {authenticating ? 'Verificando...' : 'Acessar Relatório'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );

  // Renderizar erro
  const renderError = () => (
    <Container maxWidth="md">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Card sx={{ p: 4, textAlign: 'center', maxWidth: 500 }}>
          <CardContent>
            <PublicIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom color="error">
              Ops! Algo deu errado
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              color="primary"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );

  // Renderizar loading
  const renderLoading = () => (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Carregando relatório...
        </Typography>
      </Box>
    </Box>
  );

  // Renderizar relatório completo
  const renderReport = () => (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {renderPublicHeader()}
      
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Informações do relatório */}
        {reportData?.description && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="body1">
              {reportData.description}
            </Typography>
          </Paper>
        )}

        {/* Metadados */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Criado em: {formatDate(reportData.createdAt)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {reportData.accessStats.totalViews} visualizações
                </Typography>
              </Box>
            </Grid>

            {reportData.accessStats.lastAccessed && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Último acesso: {formatDate(reportData.accessStats.lastAccessed)}
                </Typography>
              </Grid>
            )}

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Chip
                  label="Relatório Público"
                  color="success"
                  size="small"
                  icon={<PublicIcon />}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Conteúdo do relatório */}
        <ReportVisualization
          data={reportData.reportData}
          config={reportData.reportConfig}
          loading={false}
          isPublicView={true}
        />

        {/* Rodapé */}
        <Paper sx={{ p: 2, mt: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            Relatório gerado pelo SpeedFunnels
          </Typography>
        </Paper>
      </Container>
    </Box>
  );

  // Renderização principal
  return (
    <ThemeProvider theme={theme}>
      {loading && renderLoading()}
      {error && !loading && renderError()}
      {requiresPassword && !loading && !error && renderPasswordForm()}
      {reportData && !loading && !error && !requiresPassword && renderReport()}
    </ThemeProvider>
  );
};

export default PublicReportViewer; 