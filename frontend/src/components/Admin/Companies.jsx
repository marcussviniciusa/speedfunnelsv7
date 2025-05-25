import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const Companies = () => {
  // Estados principais
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados do modal
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCompany, setCurrentCompany] = useState({
    name: '',
    email: '',
    slug: '',
    isActive: true,
    description: ''
  });

  // Carregar empresas ao montar o componente
  useEffect(() => {
    loadCompanies();
  }, []);

  // Carregar lista de empresas
  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getCompanies();
      console.log('Companies Response:', response.data);
      // Verificar estrutura: data.data.companies || data.companies || data
      const companiesData = response.data.data?.companies || response.data.companies || response.data.data || response.data || [];
      // Garantir que seja sempre um array
      const companies = Array.isArray(companiesData) ? companiesData : [];
      console.log('Companies processed:', companies);
      setCompanies(companies);
    } catch (err) {
      setError('Erro ao carregar empresas: ' + (err.response?.data?.message || err.message));
      setCompanies([]); // Reset para array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  // Adicionar/Editar empresa
  const handleSaveCompany = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (editMode) {
        await adminAPI.updateCompany(currentCompany._id, currentCompany);
        setSuccess('Empresa atualizada com sucesso!');
      } else {
        await adminAPI.createCompany(currentCompany);
        setSuccess('Empresa criada com sucesso!');
      }
      
      setOpenDialog(false);
      resetForm();
      await loadCompanies();
    } catch (err) {
      setError('Erro ao salvar empresa: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Deletar empresa
  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta empresa?')) return;

    try {
      setLoading(true);
      setError(null);
      
      await adminAPI.deleteCompany(companyId);
      setSuccess('Empresa deletada com sucesso!');
      await loadCompanies();
    } catch (err) {
      setError('Erro ao deletar empresa: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para edição
  const handleEditCompany = (company) => {
    setCurrentCompany(company);
    setEditMode(true);
    setOpenDialog(true);
  };

  // Abrir modal para nova empresa
  const handleAddCompany = () => {
    resetForm();
    setEditMode(false);
    setOpenDialog(true);
  };

  // Reset do formulário
  const resetForm = () => {
    setCurrentCompany({
      name: '',
      email: '',
      slug: '',
      isActive: true,
      description: ''
    });
  };

  // Gerar slug automaticamente
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  // Renderizar status da empresa
  const renderCompanyStatus = (company) => {
    const isActive = company.isActive;
    return (
      <Chip
        icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
        label={isActive ? 'Ativa' : 'Inativa'}
        color={isActive ? 'success' : 'default'}
        variant="outlined"
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gerenciamento de Empresas
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadCompanies}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCompany}
            disabled={loading}
          >
            Nova Empresa
          </Button>
        </Box>
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

      {/* Cards de estatísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total de Empresas
                  </Typography>
                  <Typography variant="h6">
                    {companies.length}
                  </Typography>
                </Box>
                <BusinessIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Empresas Ativas
                  </Typography>
                  <Typography variant="h6">
                    {Array.isArray(companies) ? companies.filter(comp => comp.isActive).length : 0}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total de Usuários
                  </Typography>
                  <Typography variant="h6">
                    {Array.isArray(companies) ? companies.reduce((total, comp) => total + (comp.userCount || 0), 0) : 0}
                  </Typography>
                </Box>
                <PeopleIcon color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de empresas */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Usuários</TableCell>
                <TableCell>Data de Criação</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (!Array.isArray(companies) || companies.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (!Array.isArray(companies) || companies.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma empresa encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company._id}>
                    <TableCell>
                      <Typography variant="subtitle2">{company.name}</Typography>
                      {company.description && (
                        <Typography variant="body2" color="text.secondary">
                          {company.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {company.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>{renderCompanyStatus(company)}</TableCell>
                    <TableCell>{company.userCount || 0}</TableCell>
                    <TableCell>
                      {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => window.open(`/admin/users?company=${company._id}`, '_blank')}
                        disabled={loading}
                        title="Ver Usuários"
                        color="primary"
                      >
                        <PeopleIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditCompany(company)}
                        disabled={loading}
                        title="Editar Empresa"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCompany(company._id)}
                        disabled={loading}
                        title="Deletar Empresa"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog para adicionar/editar empresa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editMode ? 'Editar Empresa' : 'Nova Empresa'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Nome da Empresa"
              fullWidth
              margin="normal"
              value={currentCompany.name}
              onChange={(e) => {
                const name = e.target.value;
                setCurrentCompany({ 
                  ...currentCompany, 
                  name,
                  slug: generateSlug(name)
                });
              }}
              placeholder="Ex: Minha Empresa Ltda"
            />
            <TextField
              label="E-mail da Empresa"
              fullWidth
              margin="normal"
              type="email"
              value={currentCompany.email}
              onChange={(e) => setCurrentCompany({ ...currentCompany, email: e.target.value })}
              placeholder="Ex: contato@minhaempresa.com"
              helperText="E-mail principal da empresa"
            />
            <TextField
              label="Slug"
              fullWidth
              margin="normal"
              value={currentCompany.slug}
              onChange={(e) => setCurrentCompany({ ...currentCompany, slug: e.target.value })}
              placeholder="Ex: minha-empresa"
              helperText="URL amigável para a empresa (gerado automaticamente)"
            />
            <TextField
              label="Descrição"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={currentCompany.description}
              onChange={(e) => setCurrentCompany({ ...currentCompany, description: e.target.value })}
              placeholder="Descrição opcional da empresa"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={currentCompany.isActive}
                  onChange={(e) => setCurrentCompany({ ...currentCompany, isActive: e.target.checked })}
                />
              }
              label="Empresa Ativa"
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveCompany} 
            variant="contained"
            disabled={!currentCompany.name || !currentCompany.email || !currentCompany.slug || loading}
          >
            {loading ? <CircularProgress size={20} /> : (editMode ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies; 