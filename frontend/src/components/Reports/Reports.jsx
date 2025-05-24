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
  FilterList as FilterIcon
} from '@mui/icons-material';
import { QueryBuilder, formatQuery } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import { reportsAPI } from '../../services/api';
import ReportVisualization from './ReportVisualization';
import PredefinedReports from './PredefinedReports';
import SegmentationPanel from './SegmentationPanel';
import CustomDatePicker from '../common/CustomDatePicker';

const Reports = () => {
  // Estados principais
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  // Estados do QueryBuilder
  const [query, setQuery] = useState({
    combinator: 'and',
    rules: []
  });
  const [fields, setFields] = useState([]);

  // Estados de configuração do relatório
  const [reportConfig, setReportConfig] = useState({
    reportType: 'combined',
    startDate: '30daysAgo',
    endDate: 'today',
    metaAccounts: '',
    gaAccounts: '',
    segmentation: {}
  });

  // Estados de relatórios pré-definidos
  const [predefinedReports, setPredefinedReports] = useState([]);
  const [segmentationOptions, setSegmentationOptions] = useState({});

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Carregar campos para filtros
      const fieldsResponse = await reportsAPI.getAvailableFields();
      const fieldsData = fieldsResponse.data.data.fields.map(field => ({
        name: field.name,
        label: field.label,
        datatype: field.datatype,
        operators: field.operators || ['=', '!=', '>', '<', '>=', '<='],
        values: field.values,
        category: field.category
      }));
      setFields(fieldsData);

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
        queryBuilderRule: query.rules.length > 0 ? query : null
      };

      const response = await reportsAPI.generateAdvancedReport(reportPayload);
      setReportData(response.data.data);

    } catch (err) {
      setError('Erro ao gerar relatório: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar relatório pré-definido
  const applyPredefinedReport = async (reportConfig) => {
    try {
      setLoading(true);
      setError(null);

      // Atualizar configurações
      setReportConfig({
        ...reportConfig,
        startDate: reportConfig.defaultDateRange || '30daysAgo',
        endDate: 'today'
      });

      // Atualizar query se existe
      if (reportConfig.queryBuilderRule) {
        setQuery(reportConfig.queryBuilderRule);
      }

      // Gerar relatório
      const response = await reportsAPI.generateAdvancedReport({
        ...reportConfig,
        startDate: reportConfig.defaultDateRange || '30daysAgo',
        endDate: 'today'
      });
      setReportData(response.data.data);

    } catch (err) {
      setError('Erro ao aplicar relatório: ' + err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resetar filtros
  const resetFilters = () => {
    setQuery({ combinator: 'and', rules: [] });
    setReportConfig({
      reportType: 'combined',
      startDate: '30daysAgo',
      endDate: 'today',
      metaAccounts: '',
      gaAccounts: '',
      segmentation: {}
    });
    setReportData(null);
  };

  // Render das abas
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

            {/* QueryBuilder */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FilterIcon sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Filtros Avançados
                  </Typography>
                </Box>

                {fields.length > 0 && (
                  <Box sx={{ '& .queryBuilder': { border: '1px solid #ddd', borderRadius: 1 } }}>
                    <QueryBuilder
                      fields={fields}
                      query={query}
                      onQueryChange={setQuery}
                      addRuleToNewGroups
                      resetOnFieldChange
                      resetOnOperatorChange
                      controlClassnames={{
                        queryBuilder: 'queryBuilder'
                      }}
                    />
                  </Box>
                )}

                {/* Preview da Query */}
                {query.rules.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Preview da Consulta:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                      <pre style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(query, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Paper>
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

      case 2: // Visualização dos Resultados
        return (
          <ReportVisualization
            data={reportData}
            config={reportConfig}
            loading={loading}
          />
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
        >
          <Tab label="Relatórios Personalizados" />
          <Tab label="Relatórios Pré-definidos" />
          <Tab 
            label={`Resultados ${reportData ? '(Dados carregados)' : ''}`}
            disabled={!reportData}
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