import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  Analytics as AnalyticsIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  Public as PublicIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { sharedReportsAPI } from '../../services/api';

const SharedReportsManager = () => {
  // Estados principais
  const [sharedReports, setSharedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  });

  // Estados de dialogs
  const [statsDialog, setStatsDialog] = useState({ open: false, shareId: null, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, shareId: null, title: '' });

  // Carregar dados ao montar
  useEffect(() => {
    loadSharedReports();
  }, [statusFilter]);

  // Carregar relatórios compartilhados
  const loadSharedReports = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 10,
        status: statusFilter
      };

      const response = await sharedReportsAPI.listSharedReports(params);
      
      setSharedReports(response.data.data.reports);
      setPagination(response.data.data.pagination);

    } catch (err) {
      setError('Erro ao carregar relatórios compartilhados');
      console.error('❌ [SharedReportsManager] Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copiar URL para clipboard
  const handleCopyUrl = async (publicUrl) => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setSuccess('URL copiada para a área de transferência!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Erro ao copiar URL');
    }
  };

  // Abrir relatório público
  const handleOpenPublic = (publicUrl) => {
    window.open(publicUrl, '_blank');
  };

  // Carregar estatísticas
  const handleViewStats = async (shareId) => {
    try {
      setStatsDialog({ open: true, shareId, data: null });
      
      const response = await sharedReportsAPI.getReportStats(shareId);
      setStatsDialog(prev => ({ ...prev, data: response.data.data }));

    } catch (err) {
      setError('Erro ao carregar estatísticas');
      setStatsDialog({ open: false, shareId: null, data: null });
    }
  };

  // Deletar relatório compartilhado
  const handleDelete = async () => {
    try {
      await sharedReportsAPI.deleteSharedReport(deleteDialog.shareId);
      setSuccess('Relatório removido com sucesso!');
      setDeleteDialog({ open: false, shareId: null, title: '' });
      loadSharedReports(); // Recarregar lista
    } catch (err) {
      setError('Erro ao remover relatório');
    }
  };

  // Filtrar relatórios por busca
  const filteredReports = sharedReports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Obter status do relatório
  const getReportStatus = (report) => {
    if (!report.isActive) {
      return { label: 'Inativo', color: 'default' };
    }
    if (report.isExpired) {
      return { label: 'Expirado', color: 'error' };
    }
    return { label: 'Ativo', color: 'success' };
  };

  return (
    <Box>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          🔗 Relatórios Compartilhados
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => loadSharedReports()}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Box>

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

      {/* Filtros e Busca */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por título ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativos</MenuItem>
                <MenuItem value="inactive">Inativos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {pagination.totalRecords} relatório{pagination.totalRecords !== 1 ? 's' : ''} encontrado{pagination.totalRecords !== 1 ? 's' : ''}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Relatórios */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredReports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum relatório compartilhado encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compartilhe um relatório na aba "Resultados" para começar.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredReports.map((report) => {
            const status = getReportStatus(report);
            
            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={report.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Cabeçalho do Card */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {report.hasPassword && (
                          <Tooltip title="Protegido por senha">
                            <LockIcon fontSize="small" color="warning" />
                          </Tooltip>
                        )}
                        {report.expiresAt && (
                          <Tooltip title={`Expira em: ${formatDate(report.expiresAt)}`}>
                            <ScheduleIcon fontSize="small" color="info" />
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Título e Descrição */}
                    <Typography variant="h6" gutterBottom noWrap>
                      {report.title}
                    </Typography>
                    
                    {report.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {report.description.length > 100 
                          ? `${report.description.substring(0, 100)}...`
                          : report.description
                        }
                      </Typography>
                    )}

                    {/* Estatísticas */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {report.accessStats.totalViews || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Visualizações
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary">
                          {report.accessStats.uniqueViewers || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Únicos
                        </Typography>
                      </Box>
                    </Box>

                    {/* Metadados */}
                    <Typography variant="caption" color="text.secondary" display="block">
                      Criado por: {report.createdBy?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Em: {formatDate(report.createdAt)}
                    </Typography>
                    {report.accessStats.lastAccessed && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Último acesso: {formatDate(report.accessStats.lastAccessed)}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: '100%' }}>
                      <Tooltip title="Copiar URL">
                        <IconButton 
                          size="small"
                          onClick={() => handleCopyUrl(report.publicUrl)}
                        >
                          <CopyIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Abrir Público">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenPublic(report.publicUrl)}
                        >
                          <PublicIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Ver Estatísticas">
                        <IconButton 
                          size="small"
                          onClick={() => handleViewStats(report.shareId)}
                        >
                          <AnalyticsIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Remover">
                        <IconButton 
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ 
                            open: true, 
                            shareId: report.shareId, 
                            title: report.title 
                          })}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Paginação */}
      {pagination.total > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            disabled={pagination.current === 1}
            onClick={() => loadSharedReports(pagination.current - 1)}
          >
            Anterior
          </Button>
          <Typography sx={{ mx: 2, alignSelf: 'center' }}>
            Página {pagination.current} de {pagination.total}
          </Typography>
          <Button
            variant="outlined"
            disabled={pagination.current === pagination.total}
            onClick={() => loadSharedReports(pagination.current + 1)}
          >
            Próxima
          </Button>
        </Box>
      )}

      {/* Dialog de Estatísticas */}
      <Dialog
        open={statsDialog.open}
        onClose={() => setStatsDialog({ open: false, shareId: null, data: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📊 Estatísticas de Acesso
        </DialogTitle>
        <DialogContent>
          {!statsDialog.data ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Estatísticas Básicas */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Resumo Geral
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {statsDialog.data.basic.totalViews}
                      </Typography>
                      <Typography variant="caption">
                        Total de Visualizações
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="secondary">
                        {statsDialog.data.basic.uniqueViewers}
                      </Typography>
                      <Typography variant="caption">
                        Visitantes Únicos
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Última Visualização
                      </Typography>
                      <Typography variant="body2">
                        {statsDialog.data.basic.lastAccessed 
                          ? formatDate(statsDialog.data.basic.lastAccessed)
                          : 'Nunca acessado'
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              {/* Top Visualizadores */}
              {statsDialog.data.topViewers?.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Top Visualizadores
                  </Typography>
                  <List>
                    {statsDialog.data.topViewers.slice(0, 5).map((viewer, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={`IP: ${viewer.ip.substring(0, 10)}...`}
                          secondary={`${viewer.views} visualizações`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}

              {/* Visualizações por País */}
              {statsDialog.data.viewsByCountry?.length > 0 && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    Por País
                  </Typography>
                  <List>
                    {statsDialog.data.viewsByCountry.slice(0, 5).map((country, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={country.country}
                          secondary={`${country.views} visualizações`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog({ open: false, shareId: null, data: null })}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, shareId: null, title: '' })}
      >
        <DialogTitle>
          🗑️ Confirmar Remoção
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o relatório compartilhado <strong>"{deleteDialog.title}"</strong>?
          </Typography>
          <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
            ⚠️ Esta ação não pode ser desfeita e o link público deixará de funcionar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, shareId: null, title: '' })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SharedReportsManager; 