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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  SupervisorAccount as SupervisorAccountIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const Users = () => {
  // Estados principais
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [stats, setStats] = useState({});

  // Estados de paginação e filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');

  // Estados do modal
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    company: '',
    isActive: true
  });
  const [newPassword, setNewPassword] = useState('');

  // Estados do menu de ações
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Carregar dados ao montar o componente
  useEffect(() => {
    loadUsers();
    loadCompanies();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter, companyFilter]);

  // Carregar lista de usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        company: companyFilter
      };

      const response = await adminAPI.getAllUsers(params);
      console.log('Users Response:', response.data);
      
      const { users: usersData, pagination, stats: userStats } = response.data.data;
      
      setUsers(usersData || []);
      setTotalUsers(pagination?.totalRecords || 0);
      setStats(userStats || {});
    } catch (err) {
      setError('Erro ao carregar usuários: ' + (err.response?.data?.message || err.message));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de empresas
  const loadCompanies = async () => {
    try {
      const response = await adminAPI.getCompanies({ limit: 100 });
      const companiesData = response.data.data?.companies || response.data.companies || response.data.data || response.data || [];
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    }
  };

  // Adicionar/Editar usuário
  const handleSaveUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (editMode) {
        await adminAPI.updateUser(currentUser._id, currentUser);
        setSuccess('Usuário atualizado com sucesso!');
      } else {
        await adminAPI.createUser(currentUser);
        setSuccess('Usuário criado com sucesso!');
      }
      
      setOpenDialog(false);
      resetForm();
      await loadUsers();
    } catch (err) {
      setError('Erro ao salvar usuário: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Deletar usuário
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja desativar este usuário?')) return;

    try {
      setLoading(true);
      setError(null);
      
      await adminAPI.deleteUser(userId);
      setSuccess('Usuário desativado com sucesso!');
      await loadUsers();
    } catch (err) {
      setError('Erro ao desativar usuário: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Deletar usuário permanentemente
  const handleDeleteUserPermanently = async (userId) => {
    if (!window.confirm('⚠️ ATENÇÃO: Esta ação irá DELETAR PERMANENTEMENTE o usuário!\n\nEsta ação NÃO PODE ser desfeita. O usuário será removido completamente do sistema.\n\nTem certeza que deseja continuar?')) return;
    
    // Segunda confirmação para ação crítica
    if (!window.confirm('CONFIRMAÇÃO FINAL:\n\nDigite "DELETAR" para confirmar a exclusão permanente.\n\nEsta é sua última chance de cancelar!')) return;

    try {
      setLoading(true);
      setError(null);
      
      await adminAPI.deleteUserPermanently(userId);
      setSuccess('Usuário deletado permanentemente!');
      await loadUsers();
    } catch (err) {
      setError('Erro ao deletar usuário permanentemente: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Alterar status do usuário
  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminAPI.updateUserStatus(userId, { isActive: !isActive });
      setSuccess(`Usuário ${!isActive ? 'ativado' : 'desativado'} com sucesso!`);
      await loadUsers();
    } catch (err) {
      setError('Erro ao alterar status: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Alterar role do usuário
  const handleChangeUserRole = async (userId, newRole) => {
    try {
      setLoading(true);
      setError(null);
      
      await adminAPI.updateUserRole(userId, { role: newRole });
      setSuccess('Role alterado com sucesso!');
      await loadUsers();
    } catch (err) {
      setError('Erro ao alterar role: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Resetar senha
  const handleResetPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await adminAPI.resetUserPassword(selectedUser._id, { newPassword });
      setSuccess('Senha resetada com sucesso!');
      setOpenPasswordDialog(false);
      setNewPassword('');
    } catch (err) {
      setError('Erro ao resetar senha: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para edição
  const handleEditUser = (user) => {
    setCurrentUser({
      ...user,
      company: user.company?._id || '',
      password: '' // Não pré-preencher senha
    });
    setEditMode(true);
    setOpenDialog(true);
  };

  // Abrir modal para novo usuário
  const handleAddUser = () => {
    resetForm();
    setEditMode(false);
    setOpenDialog(true);
  };

  // Reset do formulário
  const resetForm = () => {
    setCurrentUser({
      name: '',
      email: '',
      password: '',
      role: 'user',
      company: '',
      isActive: true
    });
  };

  // Filtros
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setCompanyFilter('all');
    setPage(0);
  };

  // Menu de ações
  const handleMenuClick = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  // Renderizar role com ícone
  const renderUserRole = (role) => {
    const roleConfig = {
      super_admin: { label: 'Super Admin', color: 'error', icon: <SupervisorAccountIcon /> },
      admin: { label: 'Admin', color: 'warning', icon: <AdminPanelSettingsIcon /> },
      user: { label: 'Usuário', color: 'primary', icon: <PersonIcon /> }
    };

    const config = roleConfig[role] || roleConfig.user;

    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        variant="outlined"
        size="small"
      />
    );
  };

  // Renderizar status do usuário
  const renderUserStatus = (user) => {
    const isActive = user.isActive;
    return (
      <Chip
        icon={isActive ? <CheckCircleIcon /> : <CancelIcon />}
        label={isActive ? 'Ativo' : 'Inativo'}
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
          Gerenciamento de Usuários
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddUser}
            disabled={loading}
          >
            Novo Usuário
          </Button>
        </Box>
      </Box>

      {/* Mensagens de erro e sucesso */}
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

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Usuários
              </Typography>
              <Typography variant="h4">
                {stats.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Usuários Ativos
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Administradores
              </Typography>
              <Typography variant="h4" color="warning.main">
                {(stats.byRole?.admin || 0) + (stats.byRole?.super_admin || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Usuários Comuns
              </Typography>
              <Typography variant="h4" color="primary.main">
                {stats.byRole?.user || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Nome ou email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="user">Usuário</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Empresa</InputLabel>
              <Select
                value={companyFilter}
                label="Empresa"
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                <MenuItem value="all">Todas</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company._id} value={company._id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={clearFilters}
            >
              Limpar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de usuários */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Nenhum usuário encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      {user.name}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{renderUserRole(user.role)}</TableCell>
                  <TableCell>
                    {user.company ? user.company.name : '-'}
                  </TableCell>
                  <TableCell>{renderUserStatus(user)}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Mais ações">
                      <IconButton
                        onClick={(e) => handleMenuClick(e, user)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </TableContainer>

      {/* Menu de ações */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleEditUser(selectedUser);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          setOpenPasswordDialog(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <LockIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Resetar Senha</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleToggleUserStatus(selectedUser._id, selectedUser.isActive);
          handleMenuClose();
        }}>
          <ListItemIcon>
            {selectedUser?.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {selectedUser?.isActive ? 'Desativar' : 'Ativar'}
          </ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => {
          handleDeleteUser(selectedUser._id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Desativar</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            handleDeleteUserPermanently(selectedUser._id);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteForeverIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Deletar Permanentemente</ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog de criação/edição */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                value={currentUser.name}
                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={currentUser.email}
                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                required
              />
            </Grid>
            {!editMode && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Senha"
                  type="password"
                  value={currentUser.password}
                  onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                  required
                  helperText="Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={currentUser.role}
                  label="Role"
                  onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                >
                  <MenuItem value="user">Usuário</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="super_admin">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Empresa</InputLabel>
                <Select
                  value={currentUser.company}
                  label="Empresa"
                  onChange={(e) => setCurrentUser({ ...currentUser, company: e.target.value })}
                  disabled={currentUser.role === 'super_admin'}
                >
                  <MenuItem value="">Selecione uma empresa</MenuItem>
                  {companies.map((company) => (
                    <MenuItem key={company._id} value={company._id}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentUser.isActive}
                    onChange={(e) => setCurrentUser({ ...currentUser, isActive: e.target.checked })}
                  />
                }
                label="Usuário ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (editMode ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de reset de senha */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Resetar Senha - {selectedUser?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nova Senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
            helperText="Mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={loading || !newPassword}
          >
            {loading ? <CircularProgress size={20} /> : 'Resetar Senha'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 