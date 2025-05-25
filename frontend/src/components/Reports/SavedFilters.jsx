import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Bookmark as BookmarkIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';

const SavedFilters = ({ 
  currentFilters = [], 
  onApplyFilters, 
  reportType = 'combined' 
}) => {
  const [savedFilters, setSavedFilters] = useState([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');
  const [editingFilter, setEditingFilter] = useState(null);
  const [alert, setAlert] = useState(null);

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    loadSavedFilters();
  }, []);

  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('speedfunnels_saved_filters');
      if (saved) {
        setSavedFilters(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error);
    }
  };

  const saveSavedFilters = (filters) => {
    try {
      localStorage.setItem('speedfunnels_saved_filters', JSON.stringify(filters));
      setSavedFilters(filters);
    } catch (error) {
      console.error('Erro ao salvar filtros:', error);
      setAlert({ type: 'error', message: 'Erro ao salvar filtros' });
    }
  };

  // Abrir dialog para salvar filtros atuais
  const handleSaveFilters = () => {
    if (currentFilters.length === 0) {
      setAlert({ type: 'warning', message: 'Nenhum filtro ativo para salvar' });
      return;
    }
    setFilterName('');
    setFilterDescription('');
    setSaveDialogOpen(true);
  };

  // Salvar filtros com nome e descrição
  const confirmSaveFilters = () => {
    if (!filterName.trim()) {
      setAlert({ type: 'error', message: 'Nome do filtro é obrigatório' });
      return;
    }

    const newFilter = {
      id: Date.now(),
      name: filterName.trim(),
      description: filterDescription.trim(),
      reportType,
      filters: [...currentFilters],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, newFilter];
    saveSavedFilters(updatedFilters);

    setSaveDialogOpen(false);
    setAlert({ type: 'success', message: 'Filtros salvos com sucesso!' });
  };

  // Aplicar filtros salvos
  const applyFilter = (savedFilter) => {
    onApplyFilters(savedFilter.filters);
    setAlert({ type: 'success', message: `Filtro "${savedFilter.name}" aplicado!` });
  };

  // Deletar filtro salvo
  const deleteFilter = (filterId) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    saveSavedFilters(updatedFilters);
    setAlert({ type: 'info', message: 'Filtro removido' });
  };

  // Editar filtro salvo
  const editFilter = (filter) => {
    setEditingFilter(filter);
    setFilterName(filter.name);
    setFilterDescription(filter.description);
    setEditDialogOpen(true);
  };

  // Confirmar edição do filtro
  const confirmEditFilter = () => {
    if (!filterName.trim()) {
      setAlert({ type: 'error', message: 'Nome do filtro é obrigatório' });
      return;
    }

    const updatedFilters = savedFilters.map(f => 
      f.id === editingFilter.id 
        ? {
            ...f,
            name: filterName.trim(),
            description: filterDescription.trim(),
            updatedAt: new Date().toISOString()
          }
        : f
    );

    saveSavedFilters(updatedFilters);
    setEditDialogOpen(false);
    setEditingFilter(null);
    setAlert({ type: 'success', message: 'Filtro atualizado!' });
  };

  // Exportar filtros
  const exportFilters = () => {
    const dataStr = JSON.stringify(savedFilters, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `speedfunnels_filtros_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    setAlert({ type: 'success', message: 'Filtros exportados!' });
  };

  // Importar filtros
  const importFilters = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedFilters = JSON.parse(e.target.result);
        if (Array.isArray(importedFilters)) {
          const mergedFilters = [...savedFilters, ...importedFilters.map(f => ({
            ...f,
            id: Date.now() + Math.random(),
            importedAt: new Date().toISOString()
          }))];
          saveSavedFilters(mergedFilters);
          setAlert({ type: 'success', message: `${importedFilters.length} filtros importados!` });
        } else {
          setAlert({ type: 'error', message: 'Formato de arquivo inválido' });
        }
      } catch (error) {
        setAlert({ type: 'error', message: 'Erro ao importar filtros' });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Obter filtros por tipo de relatório
  const getFiltersByType = () => {
    return savedFilters.filter(f => f.reportType === reportType || f.reportType === 'combined');
  };

  const filteredSavedFilters = getFiltersByType();

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookmarkIcon color="secondary" />
          <Typography variant="h6">
            Filtros Salvos
          </Typography>
          {filteredSavedFilters.length > 0 && (
            <Chip 
              label={`${filteredSavedFilters.length} salvos`}
              size="small" 
              color="secondary" 
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Salvar filtros atuais">
            <span>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveFilters}
                disabled={currentFilters.length === 0}
              >
                Salvar
              </Button>
            </span>
          </Tooltip>
          
          <Tooltip title="Exportar filtros">
            <IconButton size="small" onClick={exportFilters}>
              <CloudUploadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Importar filtros">
            <IconButton size="small" component="label">
              <CloudDownloadIcon />
              <input type="file" hidden accept=".json" onChange={importFilters} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alerta */}
      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      {/* Lista de filtros salvos */}
      {filteredSavedFilters.length > 0 ? (
        <List dense>
          {filteredSavedFilters.map((filter) => (
            <Accordion key={filter.id} elevation={1}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                  <Typography variant="subtitle1">{filter.name}</Typography>
                  <Chip 
                    label={filter.reportType} 
                    size="small" 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    label={`${filter.filters.length} filtros`} 
                    size="small" 
                    color="secondary" 
                    variant="outlined" 
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  {filter.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {filter.description}
                    </Typography>
                  )}
                  
                  {/* Preview dos filtros */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {filter.filters.slice(0, 3).map((f, index) => (
                      <Chip
                        key={index}
                        label={`${f.field} ${f.operator} ${f.value}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    ))}
                    {filter.filters.length > 3 && (
                      <Chip
                        label={`+${filter.filters.length - 3} mais`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Ações */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => applyFilter(filter)}
                    >
                      Aplicar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => editFilter(filter)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => deleteFilter(filter.id)}
                    >
                      Remover
                    </Button>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Criado: {new Date(filter.createdAt).toLocaleDateString('pt-BR')}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </List>
      ) : (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <BookmarkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Nenhum filtro salvo ainda
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure alguns filtros e clique em "Salvar" para reutilizá-los depois
          </Typography>
        </Box>
      )}

      {/* Dialog para salvar filtros */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Salvar Filtros</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Nome do Filtro"
            fullWidth
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            placeholder="Ex: Campanhas Alta Performance"
          />
          <TextField
            margin="normal"
            label="Descrição (opcional)"
            fullWidth
            multiline
            rows={2}
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
            placeholder="Descreva o que este filtro faz..."
          />
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filtros que serão salvos:
            </Typography>
            {currentFilters.slice(0, 3).map((filter, index) => (
              <Chip
                key={index}
                label={`${filter.field} ${filter.operator} ${filter.value}`}
                size="small"
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
            {currentFilters.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{currentFilters.length - 3} filtros adicionais
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmSaveFilters} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar filtros */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Filtro</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Nome do Filtro"
            fullWidth
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />
          <TextField
            margin="normal"
            label="Descrição (opcional)"
            fullWidth
            multiline
            rows={2}
            value={filterDescription}
            onChange={(e) => setFilterDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={confirmEditFilter} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dica */}
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'secondary.light', borderRadius: 1, color: 'secondary.contrastText' }}>
        <Typography variant="caption">
          💾 <strong>Dica:</strong> Salve combinações de filtros úteis para reutilizar rapidamente. 
          Você pode exportar/importar filtros para compartilhar com a equipe.
        </Typography>
      </Box>
    </Paper>
  );
};

export default SavedFilters; 