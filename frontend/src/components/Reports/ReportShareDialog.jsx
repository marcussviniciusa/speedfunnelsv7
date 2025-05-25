import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  Divider,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Share as ShareIcon,
  FileCopy as CopyIcon,
  Visibility as ViewIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { sharedReportsAPI } from '../../services/api';

const ReportShareDialog = ({ 
  open, 
  onClose, 
  reportData, 
  reportConfig, 
  onSuccess 
}) => {
  // Estados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shareResult, setShareResult] = useState(null);
  
  // Configurações de compartilhamento
  const [shareSettings, setShareSettings] = useState({
    title: '',
    description: '',
    isActive: true,
    allowComments: false,
    showCompanyInfo: true,
    password: '',
    expiresAt: null,
    allowedDomains: [],
    allowPdfDownload: true,
    theme: 'light',
    customLogo: ''
  });

  // Estados auxiliares
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  // Limpar ao abrir/fechar
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      setShareResult(null);
      setShareSettings({
        title: `Relatório ${reportConfig?.reportType || 'Personalizado'} - ${new Date().toLocaleDateString('pt-BR')}`,
        description: '',
        isActive: true,
        allowComments: false,
        showCompanyInfo: true,
        password: '',
        expiresAt: null,
        allowedDomains: [],
        allowPdfDownload: true,
        theme: 'light',
        customLogo: ''
      });
    }
  }, [open, reportConfig]);

  // Validações
  const isValid = () => {
    return shareSettings.title.trim() !== '' && reportData && reportConfig;
  };

  // Criar compartilhamento
  const handleCreateShare = async () => {
    if (!isValid()) {
      setError('Preencha o título do relatório');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        reportData,
        reportConfig,
        shareSettings: {
          ...shareSettings,
          // Remover senha vazia
          password: shareSettings.password.trim() || null,
          // Filtrar domínios vazios
          allowedDomains: shareSettings.allowedDomains.filter(d => d.trim())
        }
      };

      console.log('🔗 [ReportShareDialog] Criando compartilhamento:', payload);

      const response = await sharedReportsAPI.createSharedReport(payload);
      
      setShareResult(response.data.data);
      setSuccess('Relatório compartilhado com sucesso!');
      
      if (onSuccess) {
        onSuccess(response.data.data);
      }

    } catch (err) {
      console.error('❌ [ReportShareDialog] Erro:', err);
      setError(err.response?.data?.message || 'Erro ao compartilhar relatório');
    } finally {
      setLoading(false);
    }
  };

  // Copiar URL para clipboard
  const handleCopyUrl = async () => {
    if (!shareResult?.publicUrl) return;

    try {
      await navigator.clipboard.writeText(shareResult.publicUrl);
      setSuccess('URL copiada para a área de transferência!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erro ao copiar URL');
    }
  };

  // Adicionar domínio permitido
  const handleAddDomain = () => {
    if (newDomain.trim() && !shareSettings.allowedDomains.includes(newDomain.trim())) {
      setShareSettings(prev => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, newDomain.trim()]
      }));
      setNewDomain('');
    }
  };

  // Remover domínio
  const handleRemoveDomain = (domain) => {
    setShareSettings(prev => ({
      ...prev,
      allowedDomains: prev.allowedDomains.filter(d => d !== domain)
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon color="primary" />
            <Typography variant="h6">
              Compartilhar Relatório
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* Alertas */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Resultado do compartilhamento */}
          {shareResult && (
            <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  🎉 Relatório Compartilhado com Sucesso!
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    value={shareResult.publicUrl}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copiar URL">
                            <IconButton onClick={handleCopyUrl} size="small">
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Abrir em nova aba">
                            <IconButton 
                              onClick={() => window.open(shareResult.publicUrl, '_blank')}
                              size="small"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  <strong>ID do Compartilhamento:</strong> {shareResult.shareId}
                </Typography>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={3}>
            {/* Configurações Básicas */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon />
                Configurações Básicas
              </Typography>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Título do Relatório Compartilhado"
                value={shareSettings.title}
                onChange={(e) => setShareSettings({ ...shareSettings, title: e.target.value })}
                required
                helperText="Este título será exibido na página pública"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrição (Opcional)"
                value={shareSettings.description}
                onChange={(e) => setShareSettings({ ...shareSettings, description: e.target.value })}
                helperText="Descrição adicional sobre o relatório"
              />
            </Grid>

            {/* Opções de Visibilidade */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareSettings.isActive}
                    onChange={(e) => setShareSettings({ ...shareSettings, isActive: e.target.checked })}
                  />
                }
                label="Relatório Ativo"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareSettings.showCompanyInfo}
                    onChange={(e) => setShareSettings({ ...shareSettings, showCompanyInfo: e.target.checked })}
                  />
                }
                label="Mostrar Informações da Empresa"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareSettings.allowComments}
                    onChange={(e) => setShareSettings({ ...shareSettings, allowComments: e.target.checked })}
                  />
                }
                label="Permitir Comentários"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={shareSettings.allowPdfDownload}
                    onChange={(e) => setShareSettings({ ...shareSettings, allowPdfDownload: e.target.checked })}
                  />
                }
                label="Permitir Download PDF"
              />
            </Grid>

            {/* Tema */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tema Visual</InputLabel>
                <Select
                  value={shareSettings.theme}
                  label="Tema Visual"
                  onChange={(e) => setShareSettings({ ...shareSettings, theme: e.target.value })}
                >
                  <MenuItem value="light">Claro</MenuItem>
                  <MenuItem value="dark">Escuro</MenuItem>
                  <MenuItem value="corporate">Corporativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Configurações Avançadas */}
            <Grid size={{ xs: 12 }}>
              <Button
                variant="outlined"
                onClick={() => setShowAdvanced(!showAdvanced)}
                startIcon={<LockIcon />}
                sx={{ mt: 2 }}
              >
                {showAdvanced ? 'Ocultar' : 'Mostrar'} Configurações Avançadas
              </Button>
            </Grid>

            {showAdvanced && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon />
                    Segurança e Restrições
                  </Typography>
                </Grid>

                {/* Senha de Proteção */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="password"
                    label="Senha de Proteção (Opcional)"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })}
                    helperText="Deixe vazio para acesso público"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                {/* Data de Expiração */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <DateTimePicker
                    label="Data de Expiração (Opcional)"
                    value={shareSettings.expiresAt}
                    onChange={(date) => setShareSettings({ ...shareSettings, expiresAt: date })}
                    minDateTime={new Date()}
                    slots={{
                      textField: (params) => (
                        <TextField
                          {...params}
                          fullWidth
                          helperText="Deixe vazio para nunca expirar"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <ScheduleIcon />
                              </InputAdornment>
                            )
                          }}
                        />
                      )
                    }}
                  />
                </Grid>

                {/* Domínios Permitidos */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Domínios Permitidos (Opcional)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="exemplo.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                    />
                    <Button variant="outlined" onClick={handleAddDomain}>
                      Adicionar
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {shareSettings.allowedDomains.map((domain, index) => (
                      <Chip
                        key={index}
                        label={domain}
                        onDelete={() => handleRemoveDomain(domain)}
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>

                {/* Logo Personalizado */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="URL do Logo Personalizado (Opcional)"
                    value={shareSettings.customLogo}
                    onChange={(e) => setShareSettings({ ...shareSettings, customLogo: e.target.value })}
                    helperText="URL da imagem do logo a ser exibida no relatório público"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Cancelar
          </Button>
          
          {!shareResult && (
            <Button
              onClick={handleCreateShare}
              variant="contained"
              disabled={loading || !isValid()}
              startIcon={loading ? <CircularProgress size={20} /> : <ShareIcon />}
            >
              {loading ? 'Compartilhando...' : 'Compartilhar Relatório'}
            </Button>
          )}
          
          {shareResult && (
            <Button
              onClick={() => window.open(shareResult.publicUrl, '_blank')}
              variant="contained"
              startIcon={<ViewIcon />}
            >
              Visualizar Relatório Público
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ReportShareDialog; 