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
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Campaign as CampaignIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { metaAdsAPI } from '../../services/api';

const MetaAds = () => {
  // Estados principais
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados do modal
  const [openDialog, setOpenDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountId: '',
    accountName: '',
    accessToken: ''
  });

  // Carregar contas ao montar o componente
  useEffect(() => {
    loadAccounts();
  }, []);

  // Carregar lista de contas
  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await metaAdsAPI.getAccounts();
      console.log('Meta Ads Response:', response.data);
      // Verificar se é data.data.accounts ou data.accounts
      const accounts = response.data.data?.accounts || response.data.data || response.data.accounts || [];
      setAccounts(accounts);
    } catch (err) {
      setError('Erro ao carregar contas: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova conta
  const handleAddAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await metaAdsAPI.addAccount(newAccount);
      setSuccess('Conta Meta Ads adicionada com sucesso!');
      setOpenDialog(false);
      setNewAccount({ accountId: '', accountName: '', accessToken: '' });
      await loadAccounts();
    } catch (err) {
      setError('Erro ao adicionar conta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Remover conta
  const handleRemoveAccount = async (accountId) => {
    if (!window.confirm('Tem certeza que deseja remover esta conta?')) return;

    try {
      setLoading(true);
      setError(null);
      
      await metaAdsAPI.removeAccount(accountId);
      setSuccess('Conta removida com sucesso!');
      await loadAccounts();
    } catch (err) {
      setError('Erro ao remover conta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Testar conexão
  const handleTestConnection = async (accountId) => {
    try {
      setLoading(true);
      setError(null);
      
      await metaAdsAPI.testConnection(accountId);
      setSuccess('Conexão testada com sucesso!');
      await loadAccounts();
    } catch (err) {
      setError('Erro na conexão: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Renderizar status da conta
  const renderAccountStatus = (account) => {
    const isActive = account.isActive;
    return (
      <Chip
        icon={isActive ? <CheckCircleIcon /> : <ErrorIcon />}
        label={isActive ? 'Ativa' : 'Inativa'}
        color={isActive ? 'success' : 'error'}
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
          Gerenciamento Meta Ads
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAccounts}
            disabled={loading}
          >
            Atualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            disabled={loading}
          >
            Adicionar Conta
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
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total de Contas
                  </Typography>
                  <Typography variant="h6">
                    {accounts.length}
                  </Typography>
                </Box>
                <CampaignIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Contas Ativas
                  </Typography>
                  <Typography variant="h6">
                    {accounts.filter(acc => acc.isActive).length}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de contas */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome da Conta</TableCell>
                <TableCell>Account ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Última Sincronização</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma conta Meta Ads configurada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.accountId}>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>{account.accountId}</TableCell>
                    <TableCell>{renderAccountStatus(account)}</TableCell>
                    <TableCell>
                      {account.lastSync 
                        ? new Date(account.lastSync).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleTestConnection(account.accountId)}
                        disabled={loading}
                        title="Testar Conexão"
                      >
                        <TrendingUpIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveAccount(account.accountId)}
                        disabled={loading}
                        title="Remover Conta"
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

      {/* Dialog para adicionar conta */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Conta Meta Ads</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Nome da Conta"
              fullWidth
              margin="normal"
              value={newAccount.accountName}
              onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
              placeholder="Ex: Minha Empresa - Meta Ads"
            />
            <TextField
              label="Account ID"
              fullWidth
              margin="normal"
              value={newAccount.accountId}
              onChange={(e) => setNewAccount({ ...newAccount, accountId: e.target.value })}
              placeholder="Ex: 123456789012345"
              helperText="ID da conta de anúncios (sem o prefixo 'act_')"
            />
            <TextField
              label="Access Token"
              fullWidth
              margin="normal"
              type="password"
              value={newAccount.accessToken}
              onChange={(e) => setNewAccount({ ...newAccount, accessToken: e.target.value })}
              placeholder="Token de acesso do Meta Business"
              helperText="Token obtido no Meta Business Manager"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddAccount} 
            variant="contained"
            disabled={!newAccount.accountId || !newAccount.accessToken || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MetaAds; 