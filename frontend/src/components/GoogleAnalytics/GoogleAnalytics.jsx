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
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Analytics as AnalyticsIcon,
  CloudUpload as CloudUploadIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { googleAnalyticsAPI } from '../../services/api';

const GoogleAnalytics = () => {
  // Estados principais
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados do modal
  const [openDialog, setOpenDialog] = useState(false);
  const [newAccount, setNewAccount] = useState({
    propertyId: '',
    propertyName: '',
    serviceAccountEmail: '',
    credentialsFile: null
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
      const response = await googleAnalyticsAPI.getAccounts();
      console.log('Google Analytics Response:', response.data);
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
      
      const formData = new FormData();
      formData.append('propertyId', newAccount.propertyId);
      formData.append('propertyName', newAccount.propertyName);
      formData.append('serviceAccountEmail', newAccount.serviceAccountEmail);
      if (newAccount.credentialsFile) {
        formData.append('credentialsFile', newAccount.credentialsFile);
      }

      await googleAnalyticsAPI.addAccount(formData);
      setSuccess('Conta Google Analytics adicionada com sucesso!');
      setOpenDialog(false);
      setNewAccount({
        propertyId: '',
        propertyName: '',
        serviceAccountEmail: '',
        credentialsFile: null
      });
      await loadAccounts();
    } catch (err) {
      setError('Erro ao adicionar conta: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Remover conta
  const handleRemoveAccount = async (propertyId) => {
    if (!window.confirm('Tem certeza que deseja remover esta propriedade?')) return;

    try {
      setLoading(true);
      setError(null);
      
      await googleAnalyticsAPI.removeAccount(propertyId);
      setSuccess('Propriedade removida com sucesso!');
      await loadAccounts();
    } catch (err) {
      setError('Erro ao remover propriedade: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Testar conexão
  const handleTestConnection = async (propertyId) => {
    try {
      setLoading(true);
      setError(null);
      
      await googleAnalyticsAPI.testConnection(propertyId);
      setSuccess('Conexão testada com sucesso!');
      await loadAccounts();
    } catch (err) {
      setError('Erro na conexão: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Upload de arquivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      setNewAccount({ ...newAccount, credentialsFile: file });
    } else {
      setError('Por favor, selecione um arquivo JSON válido');
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
          Gerenciamento Google Analytics
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
            Adicionar Propriedade
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
                    Total de Propriedades
                  </Typography>
                  <Typography variant="h6">
                    {accounts.length}
                  </Typography>
                </Box>
                <AnalyticsIcon color="primary" />
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
                    Propriedades Ativas
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

      {/* Instruções */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Como configurar Google Analytics:
        </Typography>
        <Typography variant="body2">
          1. Acesse o Google Cloud Console<br/>
          2. Crie uma Service Account<br/>
          3. Faça download do arquivo JSON de credenciais<br/>
          4. Adicione a Service Account como usuário na propriedade GA4<br/>
          5. Configure aqui usando o Property ID e o arquivo JSON
        </Typography>
      </Alert>

      {/* Tabela de contas */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome da Propriedade</TableCell>
                <TableCell>Property ID</TableCell>
                <TableCell>Service Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Última Sincronização</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Nenhuma propriedade Google Analytics configurada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.propertyId}>
                    <TableCell>{account.propertyName}</TableCell>
                    <TableCell>{account.propertyId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {account.serviceAccountEmail}
                      </Typography>
                    </TableCell>
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
                        onClick={() => handleTestConnection(account.propertyId)}
                        disabled={loading}
                        title="Testar Conexão"
                      >
                        <TrendingUpIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveAccount(account.propertyId)}
                        disabled={loading}
                        title="Remover Propriedade"
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
        <DialogTitle>Adicionar Propriedade Google Analytics</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Nome da Propriedade"
              fullWidth
              margin="normal"
              value={newAccount.propertyName}
              onChange={(e) => setNewAccount({ ...newAccount, propertyName: e.target.value })}
              placeholder="Ex: Meu Site - GA4"
            />
            <TextField
              label="Property ID"
              fullWidth
              margin="normal"
              value={newAccount.propertyId}
              onChange={(e) => setNewAccount({ ...newAccount, propertyId: e.target.value })}
              placeholder="Ex: 123456789"
              helperText="ID da propriedade GA4 (somente números)"
            />
            <TextField
              label="Service Account Email"
              fullWidth
              margin="normal"
              value={newAccount.serviceAccountEmail}
              onChange={(e) => setNewAccount({ ...newAccount, serviceAccountEmail: e.target.value })}
              placeholder="Ex: service-account@projeto.iam.gserviceaccount.com"
              helperText="Email da Service Account configurada no Google Cloud"
            />
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Upload Arquivo JSON de Credenciais
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleFileUpload}
                />
              </Button>
              {newAccount.credentialsFile && (
                <FormHelperText>
                  Arquivo selecionado: {newAccount.credentialsFile.name}
                </FormHelperText>
              )}
              <FormHelperText>
                Arquivo JSON baixado do Google Cloud Console
              </FormHelperText>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleAddAccount} 
            variant="contained"
            disabled={!newAccount.propertyId || !newAccount.credentialsFile || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleAnalytics; 