import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';

const Settings = () => {
  const { user, updateUser } = useAuth();
  
  // Estados principais
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados do perfil
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });

  // Estados da senha
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Estados de notificações
  const [notifications, setNotifications] = useState({
    emailReports: true,
    pushNotifications: true,
    weeklyDigest: false,
    alertsThreshold: true
  });

  // Estados de preferências
  const [preferences, setPreferences] = useState({
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    darkMode: false,
    autoRefresh: true
  });

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Salvar perfil
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.updateProfile(profile);
      updateUser(response.data.user);
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err) {
      setError('Erro ao atualizar perfil: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Alterar senha
  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      setLoading(true);
      setError(null);
      
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccess('Senha alterada com sucesso!');
      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Erro ao alterar senha: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Salvar notificações
  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.updateNotifications(notifications);
      setSuccess('Configurações de notificação atualizadas!');
    } catch (err) {
      setError('Erro ao atualizar notificações: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Salvar preferências
  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authAPI.updatePreferences(preferences);
      setSuccess('Preferências atualizadas!');
    } catch (err) {
      setError('Erro ao atualizar preferências: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Typography variant="h4" gutterBottom>
        Configurações
      </Typography>

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

      <Grid container spacing={3}>
        {/* Perfil do Usuário */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Perfil do Usuário</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  src={profile.avatar} 
                  sx={{ width: 64, height: 64, mr: 2 }}
                >
                  {profile.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">{profile.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.role === 'super_admin' ? 'Super Administrador' : 'Usuário'}
                  </Typography>
                </Box>
              </Box>

              <TextField
                label="Nome Completo"
                fullWidth
                margin="normal"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
              <TextField
                label="E-mail"
                fullWidth
                margin="normal"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
              <TextField
                label="Telefone"
                fullWidth
                margin="normal"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
                disabled={loading}
                sx={{ mt: 2 }}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : 'Salvar Perfil'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Segurança */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Segurança</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Mantenha sua conta segura alterando sua senha regularmente.
              </Typography>

              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setPasswordDialog(true)}
                fullWidth
                sx={{ mb: 2 }}
              >
                Alterar Senha
              </Button>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Informações da Conta
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Último login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conta criada em: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Notificações */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Notificações</Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailReports}
                    onChange={(e) => setNotifications({ ...notifications, emailReports: e.target.checked })}
                  />
                }
                label="Relatórios por E-mail"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.pushNotifications}
                    onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                  />
                }
                label="Notificações Push"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.weeklyDigest}
                    onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                  />
                }
                label="Resumo Semanal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.alertsThreshold}
                    onChange={(e) => setNotifications({ ...notifications, alertsThreshold: e.target.checked })}
                  />
                }
                label="Alertas de Threshold"
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveNotifications}
                disabled={loading}
                sx={{ mt: 2 }}
                fullWidth
              >
                Salvar Notificações
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Preferências */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferências
              </Typography>

              <TextField
                select
                label="Idioma"
                fullWidth
                margin="normal"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </TextField>

              <TextField
                select
                label="Fuso Horário"
                fullWidth
                margin="normal"
                value={preferences.timezone}
                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                <option value="America/New_York">New York (UTC-5)</option>
                <option value="Europe/London">London (UTC+0)</option>
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.darkMode}
                    onChange={(e) => setPreferences({ ...preferences, darkMode: e.target.checked })}
                  />
                }
                label="Modo Escuro"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.autoRefresh}
                    onChange={(e) => setPreferences({ ...preferences, autoRefresh: e.target.checked })}
                  />
                }
                label="Atualização Automática"
              />

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePreferences}
                disabled={loading}
                sx={{ mt: 2 }}
                fullWidth
              >
                Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para alterar senha */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Senha Atual"
              fullWidth
              margin="normal"
              type={showPasswords.current ? 'text' : 'password'}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Nova Senha"
              fullWidth
              margin="normal"
              type={showPasswords.new ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              helperText="Mínimo de 6 caracteres"
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Confirmar Nova Senha"
              fullWidth
              margin="normal"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    edge="end"
                  >
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Alterar Senha'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings; 