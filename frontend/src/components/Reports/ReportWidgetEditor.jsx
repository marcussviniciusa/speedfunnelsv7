import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  TextField
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableIcon,
  Dashboard as CardIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const ReportWidgetEditor = ({ 
  value = [], 
  onChange, 
  reportType = 'combined',
  onPreview = null
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedWidgets, setSelectedWidgets] = useState(value);
  const [editingWidget, setEditingWidget] = useState(null);
  const [widgetConfig, setWidgetConfig] = useState({
    id: '',
    title: '',
    type: 'card',
    chartType: 'bar',
    metrics: [],
    size: 'medium',
    color: '#1976d2',
    showTrend: false,
    isTemporalChart: false
  });

  // Métricas disponíveis baseadas no tipo de relatório
  const getAvailableMetrics = () => {
    const allMetrics = [
      // Meta Ads - Básicas
      { id: 'meta_spend', name: 'Gasto', source: 'meta', type: 'currency', icon: '💰' },
      { id: 'meta_impressions', name: 'Impressões', source: 'meta', type: 'number', icon: '👁️' },
      { id: 'meta_clicks', name: 'Cliques', source: 'meta', type: 'number', icon: '🖱️' },
      { id: 'meta_reach', name: 'Alcance', source: 'meta', type: 'number', icon: '📡' },
      { id: 'meta_ctr', name: 'CTR', source: 'meta', type: 'percentage', icon: '📊' },
      { id: 'meta_cpm', name: 'CPM', source: 'meta', type: 'currency', icon: '💵' },
      
      // Meta Ads - Conversões
      { id: 'meta_purchases', name: 'Compras', source: 'meta', type: 'number', icon: '🛒' },
      { id: 'meta_purchase_value', name: 'Valor das Compras', source: 'meta', type: 'currency', icon: '💰' },
      { id: 'meta_add_to_cart', name: 'Carrinho', source: 'meta', type: 'number', icon: '🛍️' },
      { id: 'meta_view_content', name: 'Visualizações', source: 'meta', type: 'number', icon: '👁️' },
      { id: 'meta_leads', name: 'Leads', source: 'meta', type: 'number', icon: '👤' },
      { id: 'meta_initiate_checkout', name: 'Checkout', source: 'meta', type: 'number', icon: '💳' },
      
      // Google Analytics
      { id: 'ga_sessions', name: 'Sessões', source: 'ga', type: 'number', icon: '👥' },
      { id: 'ga_users', name: 'Usuários', source: 'ga', type: 'number', icon: '👤' },
      { id: 'ga_pageviews', name: 'Visualizações de Página', source: 'ga', type: 'number', icon: '📄' },
      { id: 'ga_bounce_rate', name: 'Taxa de Rejeição', source: 'ga', type: 'percentage', icon: '↩️' },
      
      // Combinadas
      { id: 'combined_roi', name: 'ROI', source: 'combined', type: 'percentage', icon: '📈' },
      { id: 'combined_cost_per_session', name: 'Custo por Sessão', source: 'combined', type: 'currency', icon: '💸' },
      
      // Dimensão Temporal
      { id: 'date_dimension', name: 'Data', source: 'temporal', type: 'date', icon: '📅' }
    ];

    // Filtrar métricas baseadas no tipo de relatório
    switch (reportType) {
      case 'meta':
        return allMetrics.filter(m => m.source === 'meta');
      case 'ga':
        return allMetrics.filter(m => m.source === 'ga');
      case 'combined':
      default:
        return allMetrics;
    }
  };

  // Templates de widgets pré-definidos
  const getWidgetTemplates = () => {
    const templates = [
      {
        id: 'meta_overview',
        title: 'Visão Geral Meta Ads',
        description: 'Principais métricas do Meta Ads',
        type: 'chart',
        chartType: 'bar',
        metrics: ['meta_spend', 'meta_impressions', 'meta_clicks'],
        size: 'large',
        color: '#1976d2',
        category: 'Meta Ads'
      },
      {
        id: 'meta_conversions',
        title: 'Conversões Meta Ads',
        description: 'Compras, carrinho e leads',
        type: 'chart',
        chartType: 'bar',
        metrics: ['meta_purchases', 'meta_add_to_cart', 'meta_leads'],
        size: 'large',
        color: '#4caf50',
        category: 'Meta Ads'
      },
      {
        id: 'meta_ecommerce',
        title: 'E-commerce Meta Ads',
        description: 'Funil de conversão completo',
        type: 'chart',
        chartType: 'line',
        metrics: ['meta_purchase_value', 'meta_view_content', 'meta_initiate_checkout'],
        size: 'large',
        color: '#ff9800',
        category: 'Meta Ads'
      },
      {
        id: 'ga_traffic',
        title: 'Tráfego Google Analytics',
        description: 'Sessões, usuários e pageviews',
        type: 'chart',
        chartType: 'area',
        metrics: ['ga_sessions', 'ga_users', 'ga_pageviews'],
        size: 'large',
        color: '#2e7d32',
        category: 'Google Analytics'
      },
      {
        id: 'spend_summary',
        title: 'Resumo de Gastos',
        description: 'Total investido em anúncios',
        type: 'card',
        metrics: ['meta_spend'],
        size: 'small',
        color: '#d32f2f',
        category: 'Cards'
      },
      {
        id: 'conversions_summary',
        title: 'Resumo de Compras',
        description: 'Total de vendas geradas',
        type: 'card',
        metrics: ['meta_purchases'],
        size: 'small',
        color: '#4caf50',
        category: 'Cards'
      },
      {
        id: 'performance_table',
        title: 'Tabela de Performance',
        description: 'Dados detalhados em tabela',
        type: 'table',
        metrics: ['meta_spend', 'meta_clicks', 'meta_purchases', 'ga_sessions'],
        size: 'large',
        color: '#9c27b0',
        category: 'Tabelas'
      },
      
      // Templates Temporais
      {
        id: 'meta_spend_evolution',
        title: 'Evolução de Gastos Meta Ads',
        description: 'Gasto por data ao longo do período',
        type: 'chart',
        chartType: 'line',
        metrics: ['date_dimension', 'meta_spend'],
        size: 'large',
        color: '#d32f2f',
        category: 'Evolução Temporal',
        isTemporalChart: true
      },
      {
        id: 'conversions_evolution',
        title: 'Evolução de Conversões',
        description: 'Compras e leads por data',
        type: 'chart',
        chartType: 'area',
        metrics: ['date_dimension', 'meta_purchases', 'meta_leads'],
        size: 'large',
        color: '#4caf50',
        category: 'Evolução Temporal',
        isTemporalChart: true
      },
      {
        id: 'traffic_evolution',
        title: 'Evolução do Tráfego',
        description: 'Sessões e usuários por data',
        type: 'chart',
        chartType: 'line',
        metrics: ['date_dimension', 'ga_sessions', 'ga_users'],
        size: 'large',
        color: '#2e7d32',
        category: 'Evolução Temporal',
        isTemporalChart: true
      },
      {
        id: 'performance_evolution',
        title: 'Performance Geral no Tempo',
        description: 'Gasto, cliques e sessões por data',
        type: 'chart',
        chartType: 'bar',
        metrics: ['date_dimension', 'meta_spend', 'meta_clicks', 'ga_sessions'],
        size: 'large',
        color: '#ff9800',
        category: 'Evolução Temporal',
        isTemporalChart: true
      }
    ];

    // Filtrar templates baseados no tipo de relatório
    return templates.filter(template => {
      const templateMetrics = getAvailableMetrics().map(m => m.id);
      return template.metrics.some(metric => templateMetrics.includes(metric));
    });
  };

  // Atualizar selectedWidgets quando value muda
  useEffect(() => {
    setSelectedWidgets(value);
  }, [value]);

  // Notificar mudanças
  useEffect(() => {
    if (onChange) {
      onChange(selectedWidgets);
    }
  }, [selectedWidgets, onChange]);

  // Adicionar widget template
  const handleAddTemplate = (template) => {
    const newWidget = {
      ...template,
      id: `widget_${Date.now()}`,
      order: selectedWidgets.length
    };
    setSelectedWidgets([...selectedWidgets, newWidget]);
  };

  // Adicionar widget personalizado
  const handleAddCustomWidget = () => {
    const newWidget = {
      ...widgetConfig,
      id: `custom_${Date.now()}`,
      order: selectedWidgets.length
    };
    setSelectedWidgets([...selectedWidgets, newWidget]);
    resetWidgetConfig();
  };

  // Editar widget
  const handleEditWidget = (widget) => {
    setWidgetConfig(widget);
    setEditingWidget(widget.id);
    setActiveTab(2); // Ir para aba de configuração personalizada
  };

  // Salvar widget editado
  const handleSaveWidget = () => {
    if (editingWidget) {
      setSelectedWidgets(widgets => 
        widgets.map(w => w.id === editingWidget ? widgetConfig : w)
      );
    }
    setEditingWidget(null);
    resetWidgetConfig();
  };

  // Remover widget
  const handleRemoveWidget = (widgetId) => {
    setSelectedWidgets(widgets => widgets.filter(w => w.id !== widgetId));
  };

  // Resetar configuração
  const resetWidgetConfig = () => {
    setWidgetConfig({
      id: '',
      title: '',
      type: 'card',
      chartType: 'bar',
      metrics: [],
      size: 'medium',
      color: '#1976d2',
      showTrend: false,
      isTemporalChart: false
    });
  };

  // Obter ícone do tipo de widget
  const getWidgetTypeIcon = (type, chartType = null) => {
    switch (type) {
      case 'card':
        return <CardIcon />;
      case 'table':
        return <TableIcon />;
      case 'chart':
        switch (chartType) {
          case 'line':
            return <LineChartIcon />;
          case 'pie':
            return <PieChartIcon />;
          case 'bar':
          default:
            return <BarChartIcon />;
        }
      default:
        return <CardIcon />;
    }
  };

  // Obter cor da categoria
  const getCategoryColor = (category) => {
    const colors = {
      'Meta Ads': 'primary',
      'Google Analytics': 'success', 
      'Cards': 'warning',
      'Tabelas': 'secondary'
    };
    return colors[category] || 'default';
  };

  // Renderizar templates disponíveis
  const renderTemplates = () => {
    const templates = getWidgetTemplates();
    const categories = [...new Set(templates.map(t => t.category))];

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Templates de Widgets
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Selecione templates pré-configurados para adicionar rapidamente ao seu relatório.
        </Typography>

        {categories.map(category => (
          <Accordion key={category} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {category}
              </Typography>
              <Chip 
                label={templates.filter(t => t.category === category).length}
                size="small"
                color={getCategoryColor(category)}
                sx={{ ml: 1 }}
              />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {templates
                  .filter(template => template.category === category)
                  .map(template => (
                    <Grid size={{ xs: 12, md: 6 }} key={template.id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            boxShadow: 3,
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s'
                          }
                        }}
                        onClick={() => handleAddTemplate(template)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getWidgetTypeIcon(template.type, template.chartType)}
                            <Typography variant="subtitle1" sx={{ ml: 1 }}>
                              {template.title}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {template.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {template.metrics.slice(0, 3).map(metricId => {
                              const metric = getAvailableMetrics().find(m => m.id === metricId);
                              return metric ? (
                                <Chip 
                                  key={metricId}
                                  label={metric.icon + ' ' + metric.name}
                                  size="small"
                                  variant="outlined"
                                />
                              ) : null;
                            })}
                            {template.metrics.length > 3 && (
                              <Chip 
                                label={`+${template.metrics.length - 3}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  // Renderizar widgets selecionados
  const renderSelectedWidgets = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Widgets Selecionados ({selectedWidgets.length})
        </Typography>
        {onPreview && selectedWidgets.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={() => onPreview(selectedWidgets)}
          >
            Visualizar
          </Button>
        )}
      </Box>

      {selectedWidgets.length === 0 ? (
        <Alert severity="info">
          Nenhum widget selecionado. Use a aba "Templates" para adicionar widgets rapidamente.
        </Alert>
      ) : (
        <List>
          {selectedWidgets.map((widget, index) => (
            <ListItem key={widget.id} divider>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                {getWidgetTypeIcon(widget.type, widget.chartType)}
              </Box>
              <ListItemText
                primary={widget.title}
                secondary={
                  <span style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    <Chip label={widget.type} size="small" variant="outlined" />
                    <Chip label={widget.size} size="small" variant="outlined" />
                    <Chip 
                      label={`${widget.metrics?.length || 0} métricas`}
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </span>
                }
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => handleEditWidget(widget)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => handleRemoveWidget(widget.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );

  // Renderizar configuração personalizada
  const renderCustomConfig = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        {editingWidget ? 'Editar Widget' : 'Widget Personalizado'}
      </Typography>

      <Grid container spacing={2}>
        {/* Título */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Título do Widget"
            value={widgetConfig.title}
            onChange={(e) => setWidgetConfig({ ...widgetConfig, title: e.target.value })}
            variant="outlined"
            size="small"
          />
        </Grid>

        {/* Tipo e Tamanho */}
        <Grid size={{ xs: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              value={widgetConfig.type}
              label="Tipo"
              onChange={(e) => setWidgetConfig({ ...widgetConfig, type: e.target.value })}
            >
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="chart">Gráfico</MenuItem>
              <MenuItem value="table">Tabela</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Tamanho</InputLabel>
            <Select
              value={widgetConfig.size}
              label="Tamanho"
              onChange={(e) => setWidgetConfig({ ...widgetConfig, size: e.target.value })}
            >
              <MenuItem value="small">Pequeno</MenuItem>
              <MenuItem value="medium">Médio</MenuItem>
              <MenuItem value="large">Grande</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Tipo de Gráfico (se aplicável) */}
        {widgetConfig.type === 'chart' && (
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Gráfico</InputLabel>
              <Select
                value={widgetConfig.chartType}
                label="Tipo de Gráfico"
                onChange={(e) => setWidgetConfig({ ...widgetConfig, chartType: e.target.value })}
              >
                <MenuItem value="bar">Barras</MenuItem>
                <MenuItem value="line">Linha</MenuItem>
                <MenuItem value="area">Área</MenuItem>
                <MenuItem value="pie">Pizza</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Métricas */}
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Métricas</InputLabel>
            <Select
              multiple
              value={widgetConfig.metrics || []}
              label="Métricas"
              onChange={(e) => setWidgetConfig({ ...widgetConfig, metrics: e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((metricId) => {
                    const metric = getAvailableMetrics().find(m => m.id === metricId);
                    return (
                      <Chip
                        key={metricId}
                        label={metric ? metric.icon + ' ' + metric.name : metricId}
                        size="small"
                      />
                    );
                  })}
                </Box>
              )}
            >
              {getAvailableMetrics().map((metric) => (
                <MenuItem key={metric.id} value={metric.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 8 }}>{metric.icon}</span>
                    {metric.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Cor */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Cor:</Typography>
            {['#1976d2', '#2e7d32', '#d32f2f', '#ed6c02', '#9c27b0', '#00796b'].map(color => (
              <Box
                key={color}
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  border: widgetConfig.color === color ? '2px solid #000' : '1px solid #ccc',
                  borderRadius: '50%',
                  cursor: 'pointer'
                }}
                onClick={() => setWidgetConfig({ ...widgetConfig, color })}
              />
            ))}
          </Box>
        </Grid>

        {/* Opções extras */}
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={widgetConfig.showTrend || false}
                onChange={(e) => setWidgetConfig({ ...widgetConfig, showTrend: e.target.checked })}
              />
            }
            label="Mostrar tendência"
          />
        </Grid>
        
        {/* Dados Temporais */}
        {widgetConfig.type === 'chart' && (
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={widgetConfig.isTemporalChart || false}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    let newMetrics = widgetConfig.metrics || [];
                    
                    if (isChecked) {
                      // Adicionar métrica de data se não estiver presente
                      if (!newMetrics.includes('date_dimension')) {
                        newMetrics = ['date_dimension', ...newMetrics];
                      }
                    } else {
                      // Remover métrica de data
                      newMetrics = newMetrics.filter(m => m !== 'date_dimension');
                    }
                    
                    setWidgetConfig({ 
                      ...widgetConfig, 
                      isTemporalChart: isChecked,
                      metrics: newMetrics
                    });
                  }}
                />
              }
              label="Gráfico com evolução temporal"
            />
            {widgetConfig.isTemporalChart && (
              <Alert severity="info" sx={{ mt: 1 }}>
                📅 <strong>Dados Temporais Habilitados:</strong> O gráfico mostrará a evolução das métricas ao longo do tempo. A métrica "Data" foi adicionada automaticamente.
              </Alert>
            )}
          </Grid>
        )}

        {/* Botões */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => {
                setEditingWidget(null);
                resetWidgetConfig();
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={editingWidget ? handleSaveWidget : handleAddCustomWidget}
              disabled={!widgetConfig.title || !widgetConfig.metrics || widgetConfig.metrics.length === 0}
            >
              {editingWidget ? 'Salvar Alterações' : 'Adicionar Widget'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        🎛️ Editor de Widgets para Relatórios
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure os widgets que irão compor seu relatório visual. Escolha entre templates prontos ou crie widgets personalizados.
      </Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Templates" />
        <Tab label="Selecionados" />
        <Tab label="Personalizado" />
      </Tabs>

      {activeTab === 0 && renderTemplates()}
      {activeTab === 1 && renderSelectedWidgets()}
      {activeTab === 2 && renderCustomConfig()}
    </Paper>
  );
};

export default ReportWidgetEditor; 