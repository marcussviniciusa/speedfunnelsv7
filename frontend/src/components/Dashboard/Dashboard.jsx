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
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  AttachMoney as AttachMoneyIcon,
  PeopleAlt as PeopleAltIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { dashboardAPI, metaAdsAPI, googleAnalyticsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CustomDatePicker from '../common/CustomDatePicker';

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

  const { user } = useAuth();

  useEffect(() => {
    loadAvailableAccounts();
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

      const response = await dashboardAPI.getData(params);
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.response?.data?.message || 'Erro ao carregar dados do dashboard');
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
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral dos seus dados de Meta Ads e Google Analytics
        </Typography>
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
                        <Tooltip formatter={(value) => [formatCurrency(value), 'Gasto']} />
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
                        <Tooltip formatter={(value) => [formatNumber(value), 'Sessões']} />
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
    </Box>
  );
};

export default Dashboard; 