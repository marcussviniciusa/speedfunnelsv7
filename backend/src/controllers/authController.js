import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';

// Função para gerar tokens JWT
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário por email
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('company', 'name slug isActive');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário inativo. Entre em contato com o administrador.'
      });
    }

    // Verificar se a empresa está ativa (exceto super_admin)
    if (user.role !== 'super_admin' && (!user.company || !user.company.isActive)) {
      return res.status(401).json({
        status: 'error',
        message: 'Empresa inativa. Entre em contato com o administrador.'
      });
    }

    // Gerar tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Salvar refresh token no usuário
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Remover dados sensíveis da resposta
    const userResponse = user.toJSON();

    res.json({
      status: 'success',
      message: 'Login realizado com sucesso',
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Registro (apenas para super_admin criar usuários)
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user', companyId } = req.body;

    // Validações básicas
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se o email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email já está em uso'
      });
    }

    // Se não é super_admin, deve ter companyId
    if (role !== 'super_admin' && !companyId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID da empresa é obrigatório para usuários não super admin'
      });
    }

    // Verificar se a empresa existe (se aplicável)
    let company = null;
    if (companyId) {
      company = await Company.findById(companyId);
      if (!company) {
        return res.status(400).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }
    }

    // Criar usuário
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role
    };

    if (company) {
      userData.company = company._id;
    }

    const user = new User(userData);
    await user.save();

    // Gerar tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Salvar refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Buscar usuário com dados da empresa para resposta
    const userWithCompany = await User.findById(user._id)
      .populate('company', 'name slug')
      .select('-password -refreshToken');

    res.status(201).json({
      status: 'success',
      message: 'Usuário criado com sucesso',
      data: {
        user: userWithCompany,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email já está em uso'
      });
    }

    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const user = req.user; // Vem do middleware validateRefreshToken

    // Gerar novos tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Salvar novo refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Buscar dados atualizados do usuário
    const userWithCompany = await User.findById(user._id)
      .populate('company', 'name slug isActive')
      .select('-password -refreshToken');

    res.json({
      status: 'success',
      message: 'Token renovado com sucesso',
      data: {
        user: userWithCompany,
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const user = req.user;

    // Remover refresh token
    user.refreshToken = null;
    await user.save();

    res.json({
      status: 'success',
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Verificar token atual
export const me = async (req, res) => {
  try {
    const user = req.user; // Vem do middleware authenticate

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar perfil do usuário
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, avatar } = req.body;
    const userId = req.user._id;

    // Validações básicas
    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Nome e email são obrigatórios'
      });
    }

    // Verificar se o email já existe (se foi alterado)
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Este email já está em uso por outro usuário'
        });
      }
    }

    // Atualizar dados do usuário
    const updateData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
    };

    if (phone) updateData.phone = phone.trim();
    if (avatar) updateData.avatar = avatar.trim();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).populate('company', 'name slug isActive')
      .select('-password -refreshToken');

    res.json({
      status: 'success',
      message: 'Perfil atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email já está em uso'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Alterar senha
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validações básicas
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // Buscar usuário com senha
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar configurações de notificação
export const updateNotifications = async (req, res) => {
  try {
    const { emailReports, pushNotifications, weeklyDigest, alertsThreshold } = req.body;
    const userId = req.user._id;

    const updateData = {
      'preferences.notifications': {
        emailReports: emailReports !== undefined ? emailReports : true,
        pushNotifications: pushNotifications !== undefined ? pushNotifications : true,
        weeklyDigest: weeklyDigest !== undefined ? weeklyDigest : false,
        alertsThreshold: alertsThreshold !== undefined ? alertsThreshold : true
      }
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).populate('company', 'name slug isActive')
      .select('-password -refreshToken');

    res.json({
      status: 'success',
      message: 'Configurações de notificação atualizadas com sucesso',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar preferências gerais
export const updatePreferences = async (req, res) => {
  try {
    const { language, timezone, darkMode, autoRefresh } = req.body;
    const userId = req.user._id;

    const updateData = {
      'preferences.general': {
        language: language || 'pt-BR',
        timezone: timezone || 'America/Sao_Paulo',
        darkMode: darkMode !== undefined ? darkMode : false,
        autoRefresh: autoRefresh !== undefined ? autoRefresh : true
      }
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).populate('company', 'name slug isActive')
      .select('-password -refreshToken');

    res.json({
      status: 'success',
      message: 'Preferências atualizadas com sucesso',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
}; 