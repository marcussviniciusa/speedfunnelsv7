import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Grid,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  FilterAlt as FilterIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const FilterStats = ({ 
  simpleFilters = [], 
  reportType = 'combined',
  reportData = null 
}) => {
  // Calcular estatísticas dos filtros
  const getFilterStats = () => {
    const activeFilters = simpleFilters.filter(f => f.enabled && f.field && f.value);
    
    const stats = {
      total: simpleFilters.length,
      active: activeFilters.length,
      inactive: simpleFilters.length - activeFilters.length,
      byType: {
        meta: activeFilters.filter(f => f.field.startsWith('meta_')).length,
        ga: activeFilters.filter(f => f.field.startsWith('ga_')).length,
        combined: activeFilters.filter(f => f.field.startsWith('total_') || f.field.startsWith('cost_')).length
      },
      byOperator: {
        equals: activeFilters.filter(f => f.operator === '=').length,
        greater: activeFilters.filter(f => f.operator === '>').length,
        less: activeFilters.filter(f => f.operator === '<').length,
        contains: activeFilters.filter(f => f.operator === 'contains').length,
        other: activeFilters.filter(f => !['=', '>', '<', 'contains'].includes(f.operator)).length
      }
    };

    return stats;
  };

  // Calcular impacto dos filtros (simulado)
  const getFilterImpact = () => {
    const activeFilters = simpleFilters.filter(f => f.enabled && f.field && f.value);
    
    if (activeFilters.length === 0) {
      return { estimated: 100, complexity: 'Baixa', performance: 'Ótima' };
    }

    // Simular impacto baseado no número e tipo de filtros
    const complexityScore = activeFilters.length * 10 + 
      activeFilters.filter(f => f.operator === 'contains').length * 5;
    
    const estimated = Math.max(10, 100 - complexityScore);
    const complexity = complexityScore < 20 ? 'Baixa' : complexityScore < 50 ? 'Média' : 'Alta';
    const performance = estimated > 80 ? 'Ótima' : estimated > 60 ? 'Boa' : estimated > 40 ? 'Regular' : 'Lenta';

    return { estimated, complexity, performance };
  };

  // Obter sugestões de otimização
  const getOptimizationTips = () => {
    const activeFilters = simpleFilters.filter(f => f.enabled && f.field && f.value);
    const tips = [];

    if (activeFilters.length > 5) {
      tips.push('Considere salvar esta combinação de filtros para reutilização');
    }

    const containsFilters = activeFilters.filter(f => f.operator === 'contains');
    if (containsFilters.length > 2) {
      tips.push('Muitos filtros "contém" podem impactar a performance');
    }

    if (activeFilters.length === 0) {
      tips.push('Use filtros rápidos para análises comuns');
    }

    const metaFilters = activeFilters.filter(f => f.field.startsWith('meta_'));
    const gaFilters = activeFilters.filter(f => f.field.startsWith('ga_'));
    
    if (metaFilters.length > 0 && gaFilters.length > 0) {
      tips.push('Filtros combinados Meta+GA oferecem insights mais ricos');
    }

    return tips;
  };

  const stats = getFilterStats();
  const impact = getFilterImpact();
  const tips = getOptimizationTips();

  if (stats.total === 0) {
    return null; // Não mostrar nada se não há filtros
  }

  return (
    <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <AssessmentIcon color="primary" />
        <Typography variant="subtitle1">
          Estatísticas dos Filtros
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {/* Resumo Geral */}
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h4" color="primary">
              {stats.active}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Filtros Ativos
            </Typography>
            {stats.inactive > 0 && (
              <Typography variant="caption" color="text.secondary" display="block">
                ({stats.inactive} inativos)
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Distribuição por Tipo */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Por Fonte de Dados
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {stats.byType.meta > 0 && (
                <Chip 
                  label={`Meta: ${stats.byType.meta}`} 
                  size="small" 
                  color="error" 
                  variant="outlined" 
                />
              )}
              {stats.byType.ga > 0 && (
                <Chip 
                  label={`GA: ${stats.byType.ga}`} 
                  size="small" 
                  color="success" 
                  variant="outlined" 
                />
              )}
              {stats.byType.combined > 0 && (
                <Chip 
                  label={`Geral: ${stats.byType.combined}`} 
                  size="small" 
                  color="primary" 
                  variant="outlined" 
                />
              )}
            </Box>
          </Box>
        </Grid>

        {/* Performance Estimada */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Performance Estimada
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={impact.estimated} 
                sx={{ 
                  flexGrow: 1, 
                  height: 8, 
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: impact.estimated > 70 ? 'success.main' : 
                            impact.estimated > 40 ? 'warning.main' : 'error.main'
                  }
                }} 
              />
              <Typography variant="caption" color="text.secondary">
                {impact.performance}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Complexidade: {impact.complexity}
            </Typography>
          </Box>
        </Grid>

        {/* Distribuição por Operador */}
        {stats.active > 0 && (
          <Grid item xs={12}>
            <Box sx={{ p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Operadores Utilizados
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {stats.byOperator.equals > 0 && (
                  <Chip label={`Igualdade: ${stats.byOperator.equals}`} size="small" variant="outlined" />
                )}
                {stats.byOperator.greater > 0 && (
                  <Chip label={`Maior que: ${stats.byOperator.greater}`} size="small" variant="outlined" />
                )}
                {stats.byOperator.less > 0 && (
                  <Chip label={`Menor que: ${stats.byOperator.less}`} size="small" variant="outlined" />
                )}
                {stats.byOperator.contains > 0 && (
                  <Chip label={`Contém: ${stats.byOperator.contains}`} size="small" variant="outlined" />
                )}
                {stats.byOperator.other > 0 && (
                  <Chip label={`Outros: ${stats.byOperator.other}`} size="small" variant="outlined" />
                )}
              </Box>
            </Box>
          </Grid>
        )}

        {/* Dicas de Otimização */}
        {tips.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 1, color: 'info.contrastText' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }} gutterBottom>
                💡 Dicas de Otimização:
              </Typography>
              {tips.map((tip, index) => (
                <Typography key={index} variant="caption" display="block">
                  • {tip}
                </Typography>
              ))}
            </Box>
          </Grid>
        )}

        {/* Resumo de Dados (se disponível) */}
        {reportData && (
          <Grid item xs={12}>
            <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1, color: 'success.contrastText' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }} gutterBottom>
                📊 Dados do Relatório:
              </Typography>
              {reportData.metaAds && (
                <Typography variant="caption" display="block">
                  • Meta Ads: {reportData.metaAds.campaigns?.length || 0} campanhas, 
                  R$ {(reportData.metaAds.totalSpend || 0).toLocaleString('pt-BR')} gastos
                </Typography>
              )}
              {reportData.googleAnalytics && (
                <Typography variant="caption" display="block">
                  • Google Analytics: {(reportData.googleAnalytics.totalSessions || 0).toLocaleString('pt-BR')} sessões, 
                  {(reportData.googleAnalytics.totalUsers || 0).toLocaleString('pt-BR')} usuários
                </Typography>
              )}
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default FilterStats; 