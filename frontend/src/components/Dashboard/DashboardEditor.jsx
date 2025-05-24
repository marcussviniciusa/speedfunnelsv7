import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { dashboardAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const DashboardEditor = ({ open, onClose, onSave, currentConfig = null }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [widgets, setWidgets] = useState([]);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [editingWidget, setEditingWidget] = useState(false);
  const [loading, setLoading] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState({
    id: '',
    title: '',
    type: 'card', // card, chart, table
    chartType: 'bar', // bar, line, area, pie
    metrics: [],
    size: 'medium', // small, medium, large
    color: '#1976d2',
    position: { x: 0, y: 0 },
    filters: {},
    comparison: false,
    comparisonPeriod: 'previous'
  });

  const { user } = useAuth();

  // Métricas disponíveis para seleção
  const metricsOptions = [
    { id: 'meta_spend', name: 'Meta Ads - Gasto', source: 'meta', type: 'currency' },
    { id: 'meta_impressions', name: 'Meta Ads - Impressões', source: 'meta', type: 'number' },
    { id: 'meta_clicks', name: 'Meta Ads - Cliques', source: 'meta', type: 'number' },
    { id: 'meta_ctr', name: 'Meta Ads - CTR', source: 'meta', type: 'percentage' },
    { id: 'meta_cpm', name: 'Meta Ads - CPM', source: 'meta', type: 'currency' },
    { id: 'meta_reach', name: 'Meta Ads - Alcance', source: 'meta', type: 'number' },
    
    // Métricas de conversão Meta Ads
    { id: 'meta_purchases', name: 'Meta Ads - Compras', source: 'meta', type: 'number' },
    { id: 'meta_purchase_value', name: 'Meta Ads - Valor Compras', source: 'meta', type: 'currency' },
    { id: 'meta_add_to_cart', name: 'Meta Ads - Carrinho', source: 'meta', type: 'number' },
    { id: 'meta_view_content', name: 'Meta Ads - Visualizar Página', source: 'meta', type: 'number' },
    { id: 'meta_leads', name: 'Meta Ads - Leads', source: 'meta', type: 'number' },
    { id: 'meta_initiate_checkout', name: 'Meta Ads - Iniciar Checkout', source: 'meta', type: 'number' },
    
    { id: 'ga_sessions', name: 'GA - Sessões', source: 'ga', type: 'number' },
    { id: 'ga_users', name: 'GA - Usuários', source: 'ga', type: 'number' },
    { id: 'ga_pageviews', name: 'GA - Visualizações', source: 'ga', type: 'number' },
    { id: 'combined_roi', name: 'ROI Combinado', source: 'combined', type: 'percentage' },
    { id: 'combined_cost_per_session', name: 'Custo por Sessão', source: 'combined', type: 'currency' }
  ];

  // Templates de widgets pré-definidos
  const widgetTemplates = [
    {
      id: 'meta_overview',
      title: 'Visão Geral Meta Ads',
      type: 'chart',
      chartType: 'bar',
      metrics: ['meta_spend', 'meta_impressions', 'meta_clicks'],
      size: 'large',
      color: '#1976d2'
    },
    {
      id: 'meta_conversions',
      title: 'Conversões Meta Ads',
      type: 'chart',
      chartType: 'bar',
      metrics: ['meta_purchases', 'meta_add_to_cart', 'meta_leads'],
      size: 'large',
      color: '#4caf50'
    },
    {
      id: 'meta_ecommerce',
      title: 'E-commerce Meta Ads',
      type: 'chart',
      chartType: 'line',
      metrics: ['meta_purchase_value', 'meta_view_content', 'meta_initiate_checkout'],
      size: 'large',
      color: '#ff9800'
    },
    {
      id: 'ga_overview',
      title: 'Visão Geral Google Analytics',
      type: 'chart',
      chartType: 'line',
      metrics: ['ga_sessions', 'ga_users', 'ga_pageviews'],
      size: 'large',
      color: '#2e7d32'
    },
    {
      id: 'spend_card',
      title: 'Total Investido',
      type: 'card',
      metrics: ['meta_spend'],
      size: 'small',
      color: '#d32f2f'
    },
    {
      id: 'conversions_card',
      title: 'Total Compras',
      type: 'card',
      metrics: ['meta_purchases'],
      size: 'small',
      color: '#4caf50'
    },
    {
      id: 'revenue_card',
      title: 'Receita Meta Ads',
      type: 'card',
      metrics: ['meta_purchase_value'],
      size: 'small',
      color: '#ff9800'
    },
    {
      id: 'sessions_card',
      title: 'Total Sessões',
      type: 'card',
      metrics: ['ga_sessions'],
      size: 'small',
      color: '#ed6c02'
    },
    {
      id: 'roi_analysis',
      title: 'Análise de ROI',
      type: 'chart',
      chartType: 'area',
      metrics: ['combined_roi', 'combined_cost_per_session'],
      size: 'medium',
      color: '#9c27b0',
      comparison: true
    }
  ];

  useEffect(() => {
    if (open) {
      loadCurrentConfig();
    }
  }, [open, currentConfig]);

  const loadCurrentConfig = () => {
    if (currentConfig && currentConfig.widgets && currentConfig.widgets.length > 0) {
      console.log('🔄 Carregando configuração existente:', currentConfig);
      console.log('📋 Widgets salvos originais:', currentConfig.widgets);
      
      const mappedWidgets = currentConfig.widgets.map((savedWidget, index) => {
        // Mapear tipo do backend para frontend
        let frontendType = savedWidget.type;
        if (savedWidget.type === 'metric') frontendType = 'card';
        if (savedWidget.type === 'kpi') frontendType = 'card';
        
        return {
          id: savedWidget.id || `widget_${index}`,
          title: savedWidget.title || 'Widget sem título',
          type: frontendType, // Usar tipo mapeado para frontend
          chartType: savedWidget.chartConfig?.chartType || savedWidget.chartType || 'bar',
          // Converter métricas para strings para compatibilidade com interface
          metrics: savedWidget.metrics ? savedWidget.metrics.map(metric => 
            typeof metric === 'string' ? metric : (metric?.name || metric?.id)
          ) : [],
          size: savedWidget.size || 'medium',
          color: savedWidget.color || (savedWidget.chartConfig?.colors && savedWidget.chartConfig.colors[0]) || '#1976d2',
          position: savedWidget.position || { x: 0, y: index },
          filters: savedWidget.filters || {},
          comparison: savedWidget.comparison || false,
          comparisonPeriod: savedWidget.comparisonPeriod || 'previous'
        };
      });
      
      console.log('✅ Widgets mapeados para o editor:', mappedWidgets);
      setWidgets(mappedWidgets);
    } else {
      // Configuração padrão
      setWidgets([
        { ...widgetTemplates[2], id: 'widget_1', position: { x: 0, y: 0 } },
        { ...widgetTemplates[3], id: 'widget_2', position: { x: 1, y: 0 } },
        { ...widgetTemplates[0], id: 'widget_3', position: { x: 0, y: 1 } },
        { ...widgetTemplates[1], id: 'widget_4', position: { x: 0, y: 2 } }
      ]);
    }
  };

  const handleAddWidget = (template = null) => {
    const newWidget = template ? {
      ...template,
      id: `widget_${Date.now()}`,
      position: { x: 0, y: widgets.length }
    } : {
      ...widgetConfig,
      id: `widget_${Date.now()}`,
      position: { x: 0, y: widgets.length }
    };

    setWidgets([...widgets, newWidget]);
    
    if (!template) {
      resetWidgetConfig();
    }
  };

  const handleEditWidget = (widget) => {
    setSelectedWidget(widget);
    setWidgetConfig({
      ...widget
    });
    setEditingWidget(true);
  };

  const handleSaveWidget = () => {
    if (selectedWidget) {
      // Editar widget existente
      setWidgets(widgets.map(w => 
        w.id === selectedWidget.id ? { ...widgetConfig, id: selectedWidget.id } : w
      ));
    } else {
      // Adicionar novo widget com as configurações atuais
      const newWidget = {
        ...widgetConfig,
        id: `widget_${Date.now()}`,
        position: { x: 0, y: widgets.length }
      };
      setWidgets([...widgets, newWidget]);
    }
    
    setEditingWidget(false);
    setSelectedWidget(null);
    resetWidgetConfig();
  };

  const handleDeleteWidget = (widgetId) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  const resetWidgetConfig = () => {
    setWidgetConfig({
      id: '',
      title: '',
      type: 'card',
      chartType: 'bar',
      metrics: [],
      size: 'medium',
      color: '#1976d2',
      position: { x: 0, y: 0 },
      filters: {},
      comparison: false,
      comparisonPeriod: 'previous'
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualizar posições
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: { ...item.position, y: index }
    }));

    setWidgets(updatedItems);
  };

  const handleSaveDashboard = async () => {
    setLoading(true);
    try {
      console.log('🔧 Widgets antes do mapping:', widgets);
      
      // Mapear widgets para estrutura do backend
      const mappedWidgets = widgets.map((widget, index) => {
        // Mapear tipo do frontend para backend
        let backendType = widget.type;
        if (widget.type === 'card') backendType = 'metric';
        
        return {
          id: widget.id,
          type: backendType, // Usar tipo mapeado para backend
          title: widget.title,
          position: {
            x: widget.position?.x || 0,
            y: widget.position?.y || index,
            w: widget.size === 'small' ? 4 : widget.size === 'medium' ? 6 : 12,
            h: widget.type === 'card' ? 2 : 4
          },
          dataSource: widget.metrics.some(m => {
            const metricId = typeof m === 'string' ? m : (m?.id || m?.name || '');
            return metricId.startsWith('meta_');
          }) 
            ? 'meta_ads' 
            : widget.metrics.some(m => {
                const metricId = typeof m === 'string' ? m : (m?.id || m?.name || '');
                return metricId.startsWith('ga_');
              }) 
            ? 'google_analytics' 
            : 'combined',
          metrics: widget.metrics.map((metricData, index) => {
            // Extrair ID da métrica se for objeto
            const metricId = typeof metricData === 'string' ? metricData : (metricData?.id || metricData?.name || `metric-${index}`);
            const metric = metricsOptions.find(m => m.id === metricId);
            return {
              name: metricId,
              label: metric?.name || metricId,
              source: metric?.source || 'combined'
            };
          }),
          chartConfig: {
            chartType: widget.chartType || 'bar',
            colors: [widget.color || '#1976d2'],
            showLegend: true,
            showGrid: true
          },
          filters: {
            dateRange: {
              preset: 'last_30_days'
            }
          },
          isVisible: true
        };
      });

      console.log('📊 Widgets após mapping:', mappedWidgets);

      const dashboardConfig = {
        name: `Dashboard ${user.name} - ${new Date().toLocaleDateString()}`,
        description: 'Dashboard personalizado criado pelo editor',
        widgets: mappedWidgets,
        layout: {
          cols: 12,
          rowHeight: 200,
          margin: { x: 10, y: 10 }
        },
        globalFilters: {
          dateRange: {
            preset: 'last_30_days'
          },
          accounts: {
            metaAds: [],
            googleAnalytics: []
          }
        },
        isDefault: true,
        isShared: false
      };

      await dashboardAPI.saveConfig(dashboardConfig);
      onSave && onSave(dashboardConfig);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWidgetPreview = (widget) => {
    return (
      <Card sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" color={widget.color}>
              {widget.title || 'Widget sem título'}
            </Typography>
            <Box>
              <IconButton 
                size="small" 
                onClick={() => handleEditWidget(widget)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDeleteWidget(widget.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tipo: {widget.type} | Tamanho: {widget.size}
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {widget.metrics.map((metricId, index) => {
              // Extrair ID da métrica se for objeto
              const actualMetricId = typeof metricId === 'string' ? metricId : (metricId?.name || metricId?.id || `metric-${index}`);
              const metric = metricsOptions.find(m => m.id === actualMetricId);
              
              return (
                <Chip 
                  key={typeof metricId === 'string' ? metricId : `metric-${index}`}
                  label={metric?.name || actualMetricId}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              );
            })}
          </Box>
          
          {widget.comparison && (
            <Typography variant="caption" color="primary" display="block" mt={1}>
              ✓ Comparação ativada ({widget.comparisonPeriod})
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          Editor de Dashboard
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Widgets" />
            <Tab label="Layout" />
            <Tab label="Templates" />
          </Tabs>
        </Box>

        {/* Aba Widgets */}
        {activeTab === 0 && (
          <Box p={3}>
            <Grid container spacing={3}>
              {/* Lista de Widgets */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Widgets Ativos</Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => setEditingWidget(true)}
                    variant="contained"
                    size="small"
                  >
                    Novo Widget
                  </Button>
                </Box>

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="widgets">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {widgets.map((widget, index) => (
                          <Draggable key={widget.id} draggableId={widget.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                              >
                                <Box display="flex" alignItems="center">
                                  <div {...provided.dragHandleProps}>
                                    <DragIcon color="action" sx={{ mr: 1 }} />
                                  </div>
                                  <Box flex={1}>
                                    {renderWidgetPreview(widget)}
                                  </Box>
                                </Box>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </Grid>

              {/* Configuração de Widget */}
              <Grid size={{ xs: 12, md: 6 }}>
                {editingWidget && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {selectedWidget ? 'Editar Widget' : 'Novo Widget'}
                    </Typography>

                    <TextField
                      fullWidth
                      label="Título do Widget"
                      value={widgetConfig.title}
                      onChange={(e) => setWidgetConfig({
                        ...widgetConfig,
                        title: e.target.value
                      })}
                      margin="normal"
                    />

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Tipo de Widget</InputLabel>
                      <Select
                        value={widgetConfig.type}
                        onChange={(e) => setWidgetConfig({
                          ...widgetConfig,
                          type: e.target.value
                        })}
                        label="Tipo de Widget"
                      >
                        <MenuItem value="card">Card de Métrica</MenuItem>
                        <MenuItem value="chart">Gráfico</MenuItem>
                        <MenuItem value="table">Tabela</MenuItem>
                      </Select>
                    </FormControl>

                    {widgetConfig.type === 'chart' && (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Tipo de Gráfico</InputLabel>
                        <Select
                          value={widgetConfig.chartType}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig,
                            chartType: e.target.value
                          })}
                          label="Tipo de Gráfico"
                        >
                          <MenuItem value="bar">Barras</MenuItem>
                          <MenuItem value="line">Linha</MenuItem>
                          <MenuItem value="area">Área</MenuItem>
                          <MenuItem value="pie">Pizza</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Métricas</InputLabel>
                      <Select
                        multiple
                        value={widgetConfig.metrics}
                        onChange={(e) => setWidgetConfig({
                          ...widgetConfig,
                          metrics: e.target.value
                        })}
                        label="Métricas"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value, index) => {
                              // Extrair ID da métrica se for objeto
                              const actualValue = typeof value === 'string' ? value : (value?.id || value?.name || `metric-${index}`);
                              const metric = metricsOptions.find(m => m.id === actualValue);
                              return (
                                <Chip 
                                  key={typeof value === 'string' ? value : `metric-${index}`} 
                                  label={metric?.name || actualValue}
                                  size="small"
                                />
                              );
                            })}
                          </Box>
                        )}
                      >
                        {metricsOptions.map((metric) => (
                          <MenuItem key={metric.id} value={metric.id}>
                            {metric.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Tamanho</InputLabel>
                      <Select
                        value={widgetConfig.size}
                        onChange={(e) => setWidgetConfig({
                          ...widgetConfig,
                          size: e.target.value
                        })}
                        label="Tamanho"
                      >
                        <MenuItem value="small">Pequeno (4 colunas)</MenuItem>
                        <MenuItem value="medium">Médio (6 colunas)</MenuItem>
                        <MenuItem value="large">Grande (12 colunas)</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Cor"
                      type="color"
                      value={widgetConfig.color}
                      onChange={(e) => setWidgetConfig({
                        ...widgetConfig,
                        color: e.target.value
                      })}
                      margin="normal"
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={widgetConfig.comparison}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig,
                            comparison: e.target.checked
                          })}
                        />
                      }
                      label="Ativar comparação entre períodos"
                    />

                    {widgetConfig.comparison && (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Período de Comparação</InputLabel>
                        <Select
                          value={widgetConfig.comparisonPeriod}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig,
                            comparisonPeriod: e.target.value
                          })}
                          label="Período de Comparação"
                        >
                          <MenuItem value="previous">Período Anterior</MenuItem>
                          <MenuItem value="lastYear">Ano Anterior</MenuItem>
                          <MenuItem value="lastMonth">Mês Anterior</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    <Box mt={3} display="flex" gap={2}>
                      <Button
                        variant="contained"
                        onClick={handleSaveWidget}
                        startIcon={<SaveIcon />}
                        disabled={!widgetConfig.title || widgetConfig.metrics.length === 0}
                      >
                        Salvar Widget
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          setEditingWidget(false);
                          setSelectedWidget(null);
                          resetWidgetConfig();
                        }}
                        startIcon={<CancelIcon />}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Aba Layout */}
        {activeTab === 1 && (
          <Box p={3}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Use a funcionalidade de arrastar e soltar na aba "Widgets" para reorganizar o layout.
              O sistema automatically ajusta o posicionamento baseado na ordem dos widgets.
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              Preview do Layout
            </Typography>
            
            <Grid container spacing={2}>
              {widgets.map((widget, index) => (
                <Grid 
                  size={{ 
                    xs: 12, 
                    sm: widget.size === 'small' ? 4 : widget.size === 'medium' ? 6 : 12 
                  }}
                  key={widget.id}
                >
                  <Card sx={{ minHeight: 150, border: 2, borderColor: widget.color, borderStyle: 'dashed' }}>
                    <CardContent>
                      <Typography variant="h6" color={widget.color}>
                        {widget.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Posição: {index + 1} | Tipo: {widget.type} | Tamanho: {widget.size}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Aba Templates */}
        {activeTab === 2 && (
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Templates Pré-definidos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Adicione widgets rapidamente usando templates pré-configurados.
            </Typography>

            <Grid container spacing={2}>
              {widgetTemplates.map((template) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color={template.color}>
                        {template.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Tipo: {template.type} | Tamanho: {template.size}
                      </Typography>
                      
                      <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                        {template.metrics.map((metricId, index) => {
                          // Extrair ID da métrica se for objeto
                          const actualMetricId = typeof metricId === 'string' ? metricId : (metricId?.id || metricId?.name || `metric-${index}`);
                          const metric = metricsOptions.find(m => m.id === actualMetricId);
                          return (
                            <Chip 
                              key={typeof metricId === 'string' ? metricId : `metric-${index}`}
                              label={metric?.name || actualMetricId}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleAddWidget(template)}
                        startIcon={<AddIcon />}
                      >
                        Adicionar
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveDashboard} 
          variant="contained"
          disabled={loading || widgets.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Salvando...' : 'Salvar Dashboard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DashboardEditor; 