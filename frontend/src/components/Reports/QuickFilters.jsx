import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Divider,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Visibility as ViewsIcon,
  PeopleAlt as UsersIcon,
  Speed as PerformanceIcon
} from '@mui/icons-material';

const QuickFilters = ({ onApplyFilter, reportType = 'combined' }) => {
  // Filtros rápidos pré-definidos
  const quickFilters = {
    meta: [
      {
        id: 'meta_high_spend',
        label: 'Alto Gasto',
        description: 'Campanhas com gasto > R$ 1.000',
        icon: <MoneyIcon color="error" />,
        color: 'error',
        filter: {
          field: 'meta_spend',
          operator: '>',
          value: '1000',
          enabled: true
        }
      },
      {
        id: 'meta_low_ctr',
        label: 'CTR Baixo',
        description: 'CTR menor que 1%',
        icon: <TrendingUpIcon color="warning" />,
        color: 'warning',
        filter: {
          field: 'meta_ctr',
          operator: '<',
          value: '1',
          enabled: true
        }
      },
      {
        id: 'meta_high_impressions',
        label: 'Alto Alcance',
        description: 'Impressões > 10.000',
        icon: <ViewsIcon color="success" />,
        color: 'success',
        filter: {
          field: 'meta_impressions',
          operator: '>',
          value: '10000',
          enabled: true
        }
      }
    ],
    ga: [
      {
        id: 'ga_high_sessions',
        label: 'Muitas Sessões',
        description: 'Sessões > 1.000',
        icon: <UsersIcon color="primary" />,
        color: 'primary',
        filter: {
          field: 'ga_sessions',
          operator: '>',
          value: '1000',
          enabled: true
        }
      },
      {
        id: 'ga_high_bounce',
        label: 'Alta Rejeição',
        description: 'Taxa de rejeição > 70%',
        icon: <PerformanceIcon color="warning" />,
        color: 'warning',
        filter: {
          field: 'ga_bounce_rate',
          operator: '>',
          value: '70',
          enabled: true
        }
      },
      {
        id: 'ga_mobile_traffic',
        label: 'Tráfego Mobile',
        description: 'Apenas dispositivos móveis',
        icon: <ViewsIcon color="secondary" />,
        color: 'secondary',
        filter: {
          field: 'ga_device_category',
          operator: '=',
          value: 'mobile',
          enabled: true
        }
      }
    ],
    combined: [
      {
        id: 'high_performance',
        label: 'Alta Performance',
        description: 'Campanhas eficientes',
        icon: <TrendingUpIcon color="success" />,
        color: 'success',
        filters: [
          {
            field: 'meta_ctr',
            operator: '>',
            value: '2',
            enabled: true
          },
          {
            field: 'ga_bounce_rate',
            operator: '<',
            value: '50',
            enabled: true
          }
        ]
      },
      {
        id: 'high_cost_low_sessions',
        label: 'Alto Custo',
        description: 'Alto gasto, poucas sessões',
        icon: <MoneyIcon color="error" />,
        color: 'error',
        filters: [
          {
            field: 'meta_spend',
            operator: '>',
            value: '500',
            enabled: true
          },
          {
            field: 'ga_sessions',
            operator: '<',
            value: '100',
            enabled: true
          }
        ]
      }
    ]
  };

  // Filtros por período comum
  const periodFilters = [
    {
      id: 'last_7_days',
      label: 'Últimos 7 dias',
      period: { startDate: '7daysAgo', endDate: 'today' }
    },
    {
      id: 'last_30_days',
      label: 'Últimos 30 dias',
      period: { startDate: '30daysAgo', endDate: 'today' }
    },
    {
      id: 'this_month',
      label: 'Este mês',
      period: { startDate: 'thisMonth', endDate: 'today' }
    },
    {
      id: 'last_month',
      label: 'Mês passado',
      period: { startDate: 'lastMonth', endDate: 'thisMonth' }
    }
  ];

  // Obter filtros disponíveis baseado no tipo de relatório
  const getAvailableQuickFilters = () => {
    switch (reportType) {
      case 'meta':
        return quickFilters.meta;
      case 'ga':
        return quickFilters.ga;
      case 'combined':
      default:
        return [...quickFilters.combined, ...quickFilters.meta.slice(0, 2), ...quickFilters.ga.slice(0, 2)];
    }
  };

  // Aplicar filtro rápido
  const handleApplyQuickFilter = (quickFilter) => {
    if (quickFilter.filter) {
      // Filtro único
      onApplyFilter([{ 
        ...quickFilter.filter,
        id: Date.now()
      }]);
    } else if (quickFilter.filters) {
      // Múltiplos filtros
      onApplyFilter(quickFilter.filters.map((filter, index) => ({
        ...filter,
        id: Date.now() + index
      })));
    }
  };

  // Aplicar filtro de período
  const handleApplyPeriodFilter = (periodFilter) => {
    onApplyFilter([], periodFilter.period);
  };

  const availableFilters = getAvailableQuickFilters();

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🚀 Filtros Rápidos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Aplique filtros comuns com um clique
      </Typography>

      {/* Filtros de Performance */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Filtros de Performance
        </Typography>
        <Grid container spacing={1}>
          {availableFilters.map((filter) => (
            <Grid item key={filter.id}>
              <Tooltip title={filter.description} arrow>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={filter.icon}
                  onClick={() => handleApplyQuickFilter(filter)}
                  sx={{
                    borderColor: `${filter.color}.main`,
                    color: `${filter.color}.main`,
                    '&:hover': {
                      bgcolor: `${filter.color}.light`,
                      borderColor: `${filter.color}.main`
                    }
                  }}
                >
                  {filter.label}
                </Button>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Filtros de Período */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Períodos Comuns
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {periodFilters.map((period) => (
            <Chip
              key={period.id}
              label={period.label}
              onClick={() => handleApplyPeriodFilter(period)}
              clickable
              variant="outlined"
              color="primary"
              sx={{
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Dica */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
        <Typography variant="caption">
          ✨ <strong>Dica:</strong> Os filtros rápidos são combinados com seus filtros personalizados. 
          Use-os para análises comuns e depois refine com filtros específicos.
        </Typography>
      </Box>
    </Paper>
  );
};

export default QuickFilters; 