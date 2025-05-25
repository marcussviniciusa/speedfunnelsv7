import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  GetApp as ExportIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Dashboard as WidgetIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import { reportsAPI } from '../../services/api';
import ReportVisualization from './ReportVisualization';
import PredefinedReports from './PredefinedReports';
import SegmentationPanel from './SegmentationPanel';
import SimpleFilters from './SimpleFilters';
import QuickFilters from './QuickFilters';
import SavedFilters from './SavedFilters';
import FilterStats from './FilterStats';
import ReportWidgetEditor from './ReportWidgetEditor';
import ReportWidgetPreview from './ReportWidgetPreview';
import SharedReportsManager from './SharedReportsManager';
import CustomDatePicker from '../common/CustomDatePicker';

const Reports = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Estados de filtros simplificados
  const [simpleFilters, setSimpleFilters] = useState([]);

  // Estados de widgets
  const [selectedWidgets, setSelectedWidgets] = useState([]);
  const [showWidgetPreview, setShowWidgetPreview] = useState(false);

  // Estados de configuração do relatório
  const [reportConfig, setReportConfig] = useState({
    reportType: 'combined',
    startDate: '30daysAgo',
    endDate: 'today',
    metaAccounts: '',
    gaAccounts: '',
    segmentation: {},
    widgets: []
  });

  // Estados de relatórios pré-definidos
  const [predefinedReports, setPredefinedReports] = useState([]);
  const [segmentationOptions, setSegmentationOptions] = useState({});

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Atualizar config quando widgets mudam
  useEffect(() => {
    setReportConfig(prev => ({ ...prev, widgets: selectedWidgets }));
  }, [selectedWidgets]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar relatórios pré-definidos
      const reportsResponse = await reportsAPI.getPredefinedReports();
      setPredefinedReports(reportsResponse.data.data.reports);

      // Carregar opções de segmentação
      const segmentationResponse = await reportsAPI.getSegmentationOptions();
      setSegmentationOptions(segmentationResponse.data.data);

    } catch (err) {
      setError('Erro ao carregar configurações: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Gerar relatório personalizado
  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const reportPayload = {
        ...reportConfig,
        simpleFilters: simpleFilters.filter(f => f.enabled && f.field && f.value),
        widgets: selectedWidgets
      };

      console.log('📊 [Reports] Gerando relatório com payload:', reportPayload);

      const response = await reportsAPI.generateAdvancedReport(reportPayload);
      setReportData(response.data.data);

      // Navegação inteligente após gerar relatório
      if (selectedWidgets.length > 0) {
        // Se há widgets configurados, ir para aba de Resultados 
        // (que agora terá a aba Widgets automaticamente)
        setActiveTab(2);
        console.log('📊 [Reports] Navegando para Resultados (com widgets)');
      } else {
        // Se não há widgets, ir para aba de Resultados com visualização tradicional
        setActiveTab(2);
        console.log('📊 [Reports] Navegando para Resultados (visualização tradicional)');
      }

    } catch (err) {
      setError('Erro ao gerar relatório: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar relatório pré-definido
  const applyPredefinedReport = async (report) => {
    try {
      setLoading(true);
      setError(null);

      // Atualizar configuração com o relatório pré-definido
      setReportConfig(prev => ({
        ...prev,
        reportType: report.config.reportType,
        startDate: report.config.defaultDateRange || '30daysAgo',
        endDate: 'today',
        segmentation: report.config.segmentation || {}
      }));

      // Aplicar filtros do relatório pré-definido
      if (report.config.simpleFilters) {
        setSimpleFilters(report.config.simpleFilters);
      }

      const response = await reportsAPI.generateAdvancedReport(report.config);
      setReportData(response.data.data);
      setActiveTab(2); // Ir para aba de resultados

    } catch (err) {
      setError('Erro ao aplicar relatório pré-definido: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros rápidos
  const handleApplyQuickFilters = (quickFilter) => {
    // Adicionar filtro rápido aos filtros simples
    const newFilter = {
      id: `quick_${Date.now()}`,
      field: quickFilter.field,
      operator: quickFilter.operator,
      value: quickFilter.value,
      enabled: true
    };
    setSimpleFilters(prev => [...prev, newFilter]);
  };

  // Resetar filtros
  const resetFilters = () => {
    setSimpleFilters([]);
    setReportData(null);
    setError(null);
  };

  // Preview de widgets
  const handleWidgetPreview = (widgets) => {
    setSelectedWidgets(widgets);
    setShowWidgetPreview(true);
    if (reportData) {
      setActiveTab(4); // Ir para aba de widgets
    } else {
      // Se não há dados, gerar relatório primeiro
      generateReport();
    }
  };

  // Renderizar conteúdo das abas
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Relatórios Personalizados
        return (
          <Grid container spacing={3}>
            {/* Painel de Configuração */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper sx={{ p: 3, height: 'fit-content' }}>
                <Typography variant="h6" gutterBottom>
                  Configuração do Relatório
                </Typography>

                {/* Tipo de Relatório */}
                <FormControl fullWidth margin="normal">
                  <InputLabel>Tipo de Relatório</InputLabel>
                  <Select
                    value={reportConfig.reportType}
                    onChange={(e) => setReportConfig({ ...reportConfig, reportType: e.target.value })}
                  >
                    <MenuItem value="combined">Combinado (Meta + GA)</MenuItem>
                    <MenuItem value="meta">Apenas Meta Ads</MenuItem>
                    <MenuItem value="ga">Apenas Google Analytics</MenuItem>
                  </Select>
                </FormControl>

                {/* Período */}
                <Box sx={{ mt: 2 }}>
                  <CustomDatePicker
                    startDate={reportConfig.startDate}
                    endDate={reportConfig.endDate}
                    onChange={(dateRange) => setReportConfig({ 
                      ...reportConfig, 
                      startDate: dateRange.startDate,
                      endDate: dateRange.endDate
                    })}
                    label="Período do Relatório"
                    size="small"
                  />
                </Box>

                {/* Indicador de Widgets */}
                {selectedWidgets.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary" gutterBottom>
                      📊 {selectedWidgets.length} widget{selectedWidgets.length > 1 ? 's' : ''} selecionado{selectedWidgets.length > 1 ? 's' : ''}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setActiveTab(3)}
                      startIcon={<WidgetIcon />}
                    >
                      Editar Widgets
                    </Button>
                  </Box>
                )}

                {/* Botões de Ação */}
                <Box sx={{ mt: 3, display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={generateReport}
                    disabled={loading}
                    fullWidth
                  >
                    Gerar Relatório
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={resetFilters}
                    fullWidth
                  >
                    Resetar Filtros
                  </Button>
                </Box>
              </Paper>

              {/* Painel de Segmentação */}
              <Box sx={{ mt: 2 }}>
                <SegmentationPanel
                  options={segmentationOptions}
                  value={reportConfig.segmentation}
                  onChange={(segmentation) => setReportConfig({ ...reportConfig, segmentation })}
                  reportType={reportConfig.reportType}
                />
              </Box>
            </Grid>

            {/* Área de Filtros */}
            <Grid size={{ xs: 12, md: 8 }}>
              {/* Filtros Salvos */}
              <SavedFilters
                currentFilters={simpleFilters.filter(f => f.enabled && f.field && f.value)}
                onApplyFilters={setSimpleFilters}
                reportType={reportConfig.reportType}
              />
              
              {/* Filtros Rápidos */}
              <QuickFilters
                onApplyFilter={handleApplyQuickFilters}
                reportType={reportConfig.reportType}
              />
              
              {/* SimpleFilters */}
              <SimpleFilters
                value={simpleFilters}
                onChange={setSimpleFilters}
                reportType={reportConfig.reportType}
              />
              
              {/* Estatísticas dos Filtros */}
              <FilterStats
                simpleFilters={simpleFilters}
                reportType={reportConfig.reportType}
                reportData={reportData}
              />
            </Grid>
          </Grid>
        );

      case 1: // Relatórios Pré-definidos
        return (
          <PredefinedReports
            reports={predefinedReports}
            onApply={applyPredefinedReport}
            loading={loading}
          />
        );

      case 2: // Visualização dos Resultados (Tabelas/Gráficos tradicionais)
        return (
          <ReportVisualization
            data={reportData}
            config={reportConfig}
            loading={loading}
          />
        );

      case 3: // Editor de Widgets
        return (
          <ReportWidgetEditor
            value={selectedWidgets}
            onChange={setSelectedWidgets}
            reportType={reportConfig.reportType}
            onPreview={handleWidgetPreview}
          />
        );

      case 4: // Preview de Widgets
        return (
          <ReportWidgetPreview
            widgets={selectedWidgets}
            data={reportData}
            loading={loading}
            onRefresh={generateReport}
            reportConfig={reportConfig}
          />
        );

      case 5: // Gerenciar Compartilhamentos
        return (
          <SharedReportsManager />
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sistema de Relatórios Avançados
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Abas principais */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Relatórios Personalizados" />
          <Tab label="Relatórios Pré-definidos" />
          <Tab 
            label={`Resultados ${reportData ? '(Dados carregados)' : ''}`}
            disabled={!reportData}
          />
          <Tab 
            label={`Widgets ${selectedWidgets.length > 0 ? `(${selectedWidgets.length})` : ''}`}
            icon={<WidgetIcon />}
          />
          <Tab 
            label="Visualização Widgets"
            disabled={!reportData || selectedWidgets.length === 0}
          />
          <Tab 
            label="🔗 Compartilhamentos"
            icon={<ShareIcon />}
          />
        </Tabs>
      </Paper>

      {/* Conteúdo das abas */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderTabContent()
      )}
    </Box>
  );
};

export default Reports; 