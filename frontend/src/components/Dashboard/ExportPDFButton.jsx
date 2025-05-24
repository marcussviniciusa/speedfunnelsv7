import React, { useState } from 'react';
import {
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  GetApp as DownloadIcon,
  Settings as SettingsIcon,
  Visibility as PreviewIcon
} from '@mui/icons-material';
import axios from 'axios';

const ExportPDFButton = ({ dashboardData, dateRange = {}, selectedAccounts = {} }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [pdfConfig, setPdfConfig] = useState({
    title: 'Relatório de Dashboard',
    companyName: '',
    primaryColor: '#1976d2',
    format: 'A4',
    landscape: false,
    template: 'dashboard'
  });

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleQuickExport = async (template = 'dashboard') => {
    setLoading(true);
    setError('');
    handleMenuClose();

    try {
      const exportData = {
        startDate: dateRange.startDate || '30daysAgo',
        endDate: dateRange.endDate || 'today',
        metaAccounts: selectedAccounts.metaAccounts?.join(',') || '',
        gaAccounts: selectedAccounts.gaAccounts?.join(',') || '',
        config: {
          ...pdfConfig,
          template,
          dateRange: formatDateRange(dateRange.startDate, dateRange.endDate)
        }
      };

      const response = await axios.post('/api/pdf/dashboard', exportData, {
        responseType: 'blob'
      });

      // Criar URL para download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-${template}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ PDF exportado com sucesso');

    } catch (error) {
      console.error('❌ Erro ao exportar PDF:', error);
      setError(error.response?.data?.message || 'Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    setError('');
    handleMenuClose();

    try {
      const previewData = {
        reportData: dashboardData,
        config: {
          ...pdfConfig,
          dateRange: formatDateRange(dateRange.startDate, dateRange.endDate)
        },
        template: pdfConfig.template
      };

      const response = await axios.post('/api/pdf/preview', previewData);
      
      // Abrir preview em nova aba
      const newWindow = window.open();
      newWindow.document.write(response.data);
      newWindow.document.close();

    } catch (error) {
      console.error('❌ Erro ao gerar preview:', error);
      setError(error.response?.data?.message || 'Erro ao gerar preview');
    } finally {
      setLoading(false);
    }
  };

  const handleConfiguredExport = async () => {
    setConfigDialogOpen(false);
    await handleQuickExport(pdfConfig.template);
  };

  const formatDateRange = (startDate, endDate) => {
    if (startDate === '30daysAgo' && endDate === 'today') {
      return 'Últimos 30 dias';
    }
    if (startDate === '7daysAgo' && endDate === 'today') {
      return 'Últimos 7 dias';
    }
    if (startDate === '90daysAgo' && endDate === 'today') {
      return 'Últimos 90 dias';
    }
    return `${startDate} até ${endDate}`;
  };

  return (
    <>
      {/* Botão principal */}
      <Tooltip title="Exportar PDF">
        <IconButton
          onClick={handleMenuOpen}
          disabled={loading}
          color="primary"
          size="large"
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : <PdfIcon />}
        </IconButton>
      </Tooltip>

      {/* Menu de opções */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleQuickExport('dashboard')}>
          <DownloadIcon sx={{ mr: 1 }} />
          Relatório Completo
        </MenuItem>
        <MenuItem onClick={() => handleQuickExport('executive')}>
          <DownloadIcon sx={{ mr: 1 }} />
          Resumo Executivo
        </MenuItem>
        <MenuItem onClick={handlePreview}>
          <PreviewIcon sx={{ mr: 1 }} />
          Visualizar Preview
        </MenuItem>
        <MenuItem onClick={() => setConfigDialogOpen(true)}>
          <SettingsIcon sx={{ mr: 1 }} />
          Configurar PDF
        </MenuItem>
      </Menu>

      {/* Dialog de configuração */}
      <Dialog 
        open={configDialogOpen} 
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configurar PDF</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título do Relatório"
                value={pdfConfig.title}
                onChange={(e) => setPdfConfig({
                  ...pdfConfig,
                  title: e.target.value
                })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome da Empresa"
                value={pdfConfig.companyName}
                onChange={(e) => setPdfConfig({
                  ...pdfConfig,
                  companyName: e.target.value
                })}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Template</InputLabel>
                <Select
                  value={pdfConfig.template}
                  onChange={(e) => setPdfConfig({
                    ...pdfConfig,
                    template: e.target.value
                  })}
                  label="Template"
                >
                  <MenuItem value="dashboard">Dashboard Completo</MenuItem>
                  <MenuItem value="executive">Resumo Executivo</MenuItem>
                  <MenuItem value="detailed">Relatório Detalhado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Formato</InputLabel>
                <Select
                  value={pdfConfig.format}
                  onChange={(e) => setPdfConfig({
                    ...pdfConfig,
                    format: e.target.value
                  })}
                  label="Formato"
                >
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                  <MenuItem value="Legal">Legal</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cor Primária"
                type="color"
                value={pdfConfig.primaryColor}
                onChange={(e) => setPdfConfig({
                  ...pdfConfig,
                  primaryColor: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfiguredExport}
            variant="contained"
            startIcon={<PdfIcon />}
          >
            Gerar PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert de erro */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mt: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}
    </>
  );
};

export default ExportPDFButton; 