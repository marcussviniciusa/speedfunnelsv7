import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Alert,
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import CustomWidget from '../Dashboard/CustomWidget';

const ReportWidgetPreview = ({ 
  widgets = [], 
  data = null, 
  loading = false, 
  onRefresh = null,
  reportConfig = {} 
}) => {
  // Função para mapear tamanho do widget para Grid
  const getGridSize = (size) => {
    switch (size) {
      case 'small':
        return { xs: 12, sm: 6, md: 4 };
      case 'medium':
        return { xs: 12, sm: 6, md: 6 };
      case 'large':
        return { xs: 12 };
      default:
        return { xs: 12, sm: 6, md: 6 };
    }
  };

  // Se não há widgets selecionados
  if (!widgets || widgets.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          📊 Nenhum widget selecionado para visualização
        </Alert>
        <Typography variant="body2" color="text.secondary">
          Use o Editor de Widgets para selecionar e configurar os widgets que deseja incluir neste relatório.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            📊 Pré-visualização dos Widgets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {widgets.length} widget{widgets.length > 1 ? 's' : ''} configurado{widgets.length > 1 ? 's' : ''} 
            {reportConfig.reportType && ` • Tipo: ${reportConfig.reportType === 'combined' ? 'Meta + GA' : 
              reportConfig.reportType === 'meta' ? 'Meta Ads' : 'Google Analytics'}`}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onRefresh && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRefresh}
              disabled={loading}
            >
              Atualizar
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<ExportIcon />}
            disabled={!data || loading}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Estado sem dados */}
      {!data && !loading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          ⚠️ Execute o relatório para visualizar os dados nos widgets
        </Alert>
      )}

      {/* Grid de Widgets */}
      <Grid container spacing={3}>
        {widgets.map((widget, index) => {
          const gridSize = getGridSize(widget.size);
          
          return (
            <Grid 
              key={widget.id || `widget-${index}`}
              size={gridSize}
            >
              <CustomWidget
                widget={widget}
                data={data}
                loading={loading}
              />
            </Grid>
          );
        })}
      </Grid>

      {/* Informações adicionais */}
      {data && (
        <Card sx={{ mt: 3, backgroundColor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              ℹ️ Informações do Relatório
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Período
                </Typography>
                <Typography variant="body2">
                  {reportConfig.startDate} até {reportConfig.endDate}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Contas Meta Ads
                </Typography>
                <Typography variant="body2">
                  {data.metaAds?.accounts?.length || 0} conectada{data.metaAds?.accounts?.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Propriedades GA
                </Typography>
                <Typography variant="body2">
                  {data.googleAnalytics?.accounts?.length || 0} conectada{data.googleAnalytics?.accounts?.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Widgets
                </Typography>
                <Typography variant="body2">
                  {widgets.length} configurado{widgets.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Resumo dos tipos de widgets */}
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {widgets.reduce((acc, widget) => {
          const typeCount = acc.find(item => item.type === widget.type);
          if (typeCount) {
            typeCount.count++;
          } else {
            acc.push({ type: widget.type, count: 1 });
          }
          return acc;
        }, []).map(({ type, count }) => {
          const typeLabels = {
            'card': 'Cards',
            'chart': 'Gráficos', 
            'table': 'Tabelas'
          };
          
          const typeColors = {
            'card': 'warning',
            'chart': 'primary',
            'table': 'secondary'
          };
          
          return (
            <Box
              key={type}
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: `${typeColors[type]}.main`,
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              {count} {typeLabels[type] || type}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ReportWidgetPreview; 