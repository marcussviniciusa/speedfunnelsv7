import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  AttachMoney as AttachMoneyIcon,
  PeopleAlt as PeopleAltIcon,
  Settings as SettingsIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardAPI, metaAdsAPI, googleAnalyticsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CustomDatePicker from '../common/CustomDatePicker';
import DashboardEditor from './DashboardEditor';
import CustomWidget from './CustomWidget';
import ExportPDFButton from './ExportPDFButton';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '30daysAgo',
    endDate: 'today'
  });
  const [selectedAccounts, setSelectedAccounts] = useState({
    metaAccounts: [],
    gaAccounts: []
  });
  const [availableAccounts, setAvailableAccounts] = useState({
    metaAccounts: [],
    gaAccounts: []
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    loadAvailableAccounts();
    loadDashboardConfig();
    loadDashboardData();
  }, []);

  const loadAvailableAccounts = async () => {
    try {
      // Carregar contas Meta Ads
      const metaResponse = await metaAdsAPI.getAccounts();
      setAvailableAccounts(prev => ({
        ...prev,
        metaAccounts: metaResponse.data.data.accounts || []
      }));

      // Carregar contas Google Analytics
      const gaResponse = await googleAnalyticsAPI.getAccounts();
      setAvailableAccounts(prev => ({
        ...prev,
        gaAccounts: gaResponse.data.data.accounts || []
      }));
    } catch (error) {
      console.error('Error loading available accounts:', error);
    }
  };

  const loadDashboardConfig = async () => {
    try {
      console.log('🔍 Buscando configurações de dashboard...');
      const response = await dashboardAPI.getConfigs({ 
        isDefault: true 
      });
      
      console.log('📡 Resposta da API configs:', response.data);
      
      if (response.data.data && response.data.data.dashboardConfigs && response.data.data.dashboardConfigs.length > 0) {
        const config = response.data.data.dashboardConfigs[0];
        console.log('✅ Configuração encontrada:', config);
        console.log('📊 Widgets na configuração:', config.widgets);
        setDashboardConfig(config);
      } else {
        console.log('ℹ️ Nenhuma configuração padrão encontrada, buscando qualquer configuração...');
        // Tenta buscar qualquer configuração do usuário
        const allConfigsResponse = await dashboardAPI.getConfigs();
        console.log('🔍 Todas as configurações:', allConfigsResponse.data);
        
        if (allConfigsResponse.data.data && allConfigsResponse.data.data.dashboardConfigs && allConfigsResponse.data.data.dashboardConfigs.length > 0) {
          const config = allConfigsResponse.data.data.dashboardConfigs[0];
          console.log('✅ Usando primeira configuração encontrada:', config);
          setDashboardConfig(config);
        } else {
          console.log('ℹ️ Nenhuma configuração de dashboard encontrada, usando layout padrão');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração do dashboard:', error);
      // Continua com layout padrão
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        ...dateRange,
        metaAccounts: Array.isArray(selectedAccounts.metaAccounts) 
          ? selectedAccounts.metaAccounts.join(',') 
          : selectedAccounts.metaAccounts,
        gaAccounts: Array.isArray(selectedAccounts.gaAccounts) 
          ? selectedAccounts.gaAccounts.join(',') 
          : selectedAccounts.gaAccounts
      };

      console.log('🔍 [Dashboard] Carregando dados com params:', params);
      const response = await dashboardAPI.getData(params);
      console.log('🔍 [Dashboard] Resposta da API:', response.data);
      console.log('🔍 [Dashboard] Dados recebidos:', response.data.data);
      
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      
      // 🔧 DEBUG TEMPORÁRIO: Usar dados mockados em caso de erro
      console.log('⚠️ [Dashboard] Erro na API, usando dados mockados para debug');
      const mockData = {
        metaAds: {
          accounts: [
            {
              accountId: 'mock123',
              accountName: 'Conta Mock',
              spend: 1500.50,
              impressions: 25000,
              clicks: 850,
              reach: 18000,
              ctr: 3.4,
              cpm: 12.5
            }
          ],
          totalSpend: 1500.50,
          totalImpressions: 25000,
          totalClicks: 850,
          totalReach: 18000,
          avgCTR: 3.4,
          avgCPM: 12.5
        },
        googleAnalytics: {
          accounts: [
            {
              propertyId: 'mock456',
              propertyName: 'Site Mock',
              sessions: 5200,
              users: 3800,
              pageviews: 15600,
              avgSessionDuration: 145,
              bounceRate: 42.3
            }
          ],
          totalSessions: 5200,
          totalUsers: 3800,
          totalPageviews: 15600,
          avgSessionDuration: 145,
          bounceRate: 42.3
        },
        summary: {
          totalSpend: 1500.50,
          totalSessions: 5200,
          activeCampaigns: 1
        }
      };
      
      console.log('🔍 [Dashboard] Dados mockados:', mockData);
      setDashboardData(mockData);
      
      setError(`Usando dados mockados para debug: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleAccountSelection = (type) => (event) => {
    setSelectedAccounts(prev => ({
      ...prev,
      [type]: event.target.value
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const handleOpenEditor = () => {
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
  };

  const handleSaveDashboard = async (config) => {
    setDashboardConfig(config);
    console.log('💾 Configuração salva:', config);
    
    // Recarregar configuração do backend para garantir persistência
    await loadDashboardConfig();
    
    // Recarregar dados se necessário
    loadDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visão geral dos seus dados de Meta Ads e Google Analytics
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <ExportPDFButton 
              dashboardData={dashboardData}
              dateRange={dateRange}
              selectedAccounts={selectedAccounts}
            />
            <Tooltip title="Editar Dashboard">
              <IconButton 
                onClick={handleOpenEditor}
                color="primary"
                size="large"
                sx={{ 
                  bgcolor: 'primary.main', 
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <CustomDatePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={handleDateRangeChange}
              label="Período"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Contas Meta Ads</InputLabel>
              <Select
                multiple
                value={Array.isArray(selectedAccounts.metaAccounts) ? selectedAccounts.metaAccounts : []}
                onChange={handleAccountSelection('metaAccounts')}
                label="Contas Meta Ads"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const account = availableAccounts.metaAccounts.find(acc => acc.accountId === value);
                      return <Chip key={value} label={account?.accountName || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {availableAccounts.metaAccounts.map((account) => (
                  <MenuItem key={account.accountId} value={account.accountId}>
                    {account.accountName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Contas Google Analytics</InputLabel>
              <Select
                multiple
                value={Array.isArray(selectedAccounts.gaAccounts) ? selectedAccounts.gaAccounts : []}
                onChange={handleAccountSelection('gaAccounts')}
                label="Contas Google Analytics"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const account = availableAccounts.gaAccounts.find(acc => acc.propertyId === value);
                      return <Chip key={value} label={account?.propertyName || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {availableAccounts.gaAccounts.map((account) => (
                  <MenuItem key={account.propertyId} value={account.propertyId}>
                    {account.propertyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Button
              variant="contained"
              onClick={loadDashboardData}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              fullWidth
            >
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {dashboardData && (
        <>
          {/* Renderizar widgets personalizados se existir configuração */}
          {dashboardConfig && dashboardConfig.widgets && dashboardConfig.widgets.length > 0 ? (
            <Grid container spacing={3} mb={3}>
              {dashboardConfig.widgets.map((widget, index) => {
                // Converter métricas de objetos para strings para compatibilidade com CustomWidget
                const normalizedWidget = {
                  ...widget,
                  type: widget.type === 'metric' ? 'card' : widget.type,
                  metrics: widget.metrics ? widget.metrics.map(metric => 
                    typeof metric === 'string' ? metric : (metric?.name || metric?.id || `metric-${index}`)
                  ) : []
                };
                
                console.log(`🔍 [Dashboard] Renderizando widget ${index}:`, widget);
                console.log(`🔍 [Dashboard] Widget normalizado ${index}:`, normalizedWidget);
                console.log(`🔍 [Dashboard] DashboardData a ser passado:`, dashboardData);
                
                return (
                  <Grid
                    key={widget.id || `widget-${index}`}
                    size={{
                      xs: 12,
                      sm: widget.position?.w === 4 ? 6 : widget.position?.w === 6 ? 6 : 12,
                      md: widget.position?.w === 4 ? 4 : widget.position?.w === 6 ? 6 : 12
                    }}
                  >
                    <CustomWidget
                      widget={normalizedWidget}
                      data={dashboardData}
                      loading={loading}
                    />
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            /* Layout padrão - quando não há configuração personalizada */
            <>
              {/* Métricas principais */}
              <Grid container spacing={3} mb={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <AttachMoneyIcon color="primary" fontSize="large" />
                        <Box>
                          <Typography variant="h4" color="primary">
                            {formatCurrency(dashboardData.metaAds.totalSpend)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Investido (Meta Ads)
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <VisibilityIcon color="secondary" fontSize="large" />
                        <Box>
                          <Typography variant="h4" color="secondary">
                            {formatNumber(dashboardData.metaAds.totalImpressions)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Impressões
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <PeopleAltIcon color="success" fontSize="large" />
                        <Box>
                          <Typography variant="h4" color="success.main">
                            {formatNumber(dashboardData.googleAnalytics.totalSessions)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Sessões (GA)
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <TrendingUpIcon color="info" fontSize="large" />
                        <Box>
                          <Typography variant="h4" color="info.main">
                            {dashboardData.metaAds.avgCTR.toFixed(2)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            CTR Médio
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Gráficos */}
              <Grid container spacing={3}>
                {/* Comparação de gastos por conta Meta Ads */}
                {dashboardData.metaAds.accounts.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Gastos por Conta Meta Ads
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dashboardData.metaAds.accounts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="accountName" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [formatCurrency(value), 'Gasto']} />
                            <Bar dataKey="spend" fill="#1976d2" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Comparação de sessões por conta GA */}
                {dashboardData.googleAnalytics.accounts.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Sessões por Propriedade GA
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={dashboardData.googleAnalytics.accounts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="propertyName" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [formatNumber(value), 'Sessões']} />
                            <Bar dataKey="sessions" fill="#2e7d32" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Resumo consolidado */}
                <Grid size={{ xs: 12 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Resumo Consolidado
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Contas Meta Ads Ativas
                          </Typography>
                          <Typography variant="h5">
                            {dashboardData.metaAds.accounts.length}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Propriedades GA Ativas
                          </Typography>
                          <Typography variant="h5">
                            {dashboardData.googleAnalytics.accounts.length}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            Período Analisado
                          </Typography>
                          <Typography variant="h6">
                            {dateRange.startDate === '30daysAgo' ? 'Últimos 30 dias' : 
                             dateRange.startDate === '7daysAgo' ? 'Últimos 7 dias' : 
                             'Últimos 90 dias'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </>
          )}
        </>
      )}

      {/* Editor de Dashboard */}
      <DashboardEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveDashboard}
        currentConfig={dashboardConfig}
      />
    </Box>
  );
};

export default Dashboard; 