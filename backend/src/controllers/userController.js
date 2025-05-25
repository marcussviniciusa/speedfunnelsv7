import User from '../models/User.js';
import Company from '../models/Company.js';
import bcrypt from 'bcrypt';

// Listar todos os usuários (apenas super admin)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = 'all', status = 'all', company = 'all' } = req.query;
    
    // Construir filtros
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role !== 'all') {
      filter.role = role;
    }
    
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }
    
    if (company !== 'all') {
      filter.company = company;
    }

    // Paginação
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .populate('company', 'name email')
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    
    // Estatísticas gerais
    const stats = {
      total: await User.countDocuments(),
      active: await User.countDocuments({ isActive: true }),
      inactive: await User.countDocuments({ isActive: false }),
      byRole: {
        super_admin: await User.countDocuments({ role: 'super_admin' }),
        admin: await User.countDocuments({ role: 'admin' }),
        user: await User.countDocuments({ role: 'user' })
      }
    };
    
    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        },
        stats
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Criar novo usuário
export const createUser = async (req, res) => {
  try {
    console.log('🔍 [createUser] Dados recebidos:', {
      body: req.body,
      headers: req.headers['content-type'],
      user: req.user?.email
    });

    const {
      name,
      email,
      password,
      role = 'user',
      company,
      isActive = true
    } = req.body;

    console.log('🔍 [createUser] Dados extraídos:', {
      name,
      email,
      password: password ? `[${password.length} chars] ${password.substring(0, 3)}...` : 'UNDEFINED',
      role,
      company,
      isActive
    });

    // 🔬 DEBUG PROFUNDO DA SENHA
    if (password) {
      console.log('🔬 [createUser] DEBUG SENHA COMPLETA:');
      console.log('  - Senha original:', JSON.stringify(password));
      console.log('  - Tipo:', typeof password);
      console.log('  - Length:', password.length);
      console.log('  - Bytes:', [...password].map(c => c.charCodeAt(0)));
      console.log('  - É string?:', typeof password === 'string');
      console.log('  - Primeiro char:', password.charCodeAt(0));
      console.log('  - Último char:', password.charCodeAt(password.length - 1));
      console.log('  - Tem espaços no início/fim?:', password !== password.trim());
      console.log('  - Versão trimmed:', JSON.stringify(password.trim()));
    }

    // Validações básicas
    if (!name || !email || !password) {
      console.log('❌ [createUser] Validação básica falhou:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({
        status: 'error',
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    // Validar role
    const validRoles = ['super_admin', 'admin', 'user'];
    if (!validRoles.includes(role)) {
      console.log('❌ [createUser] Role inválido:', role);
      return res.status(400).json({
        status: 'error',
        message: 'Role inválido. Valores permitidos: super_admin, admin, user'
      });
    }

    // Verificar se email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('❌ [createUser] Email já existe:', email);
      return res.status(400).json({
        status: 'error',
        message: 'Email já está em uso'
      });
    }

    // Validar empresa (obrigatória exceto para super_admin)
    if (role !== 'super_admin' && !company) {
      console.log('❌ [createUser] Empresa obrigatória para role:', role);
      return res.status(400).json({
        status: 'error',
        message: 'Empresa é obrigatória para este tipo de usuário'
      });
    }

    if (company) {
      const companyExists = await Company.findById(company);
      if (!companyExists) {
        console.log('❌ [createUser] Empresa não encontrada:', company);
        return res.status(400).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }
      console.log('✅ [createUser] Empresa válida:', companyExists.name);
    }

    // Validar senha forte
    console.log('🔍 [createUser] Validando senha...');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('❌ [createUser] Senha não atende critérios:', {
        length: password.length,
        hasLower: /[a-z]/.test(password),
        hasUpper: /[A-Z]/.test(password),
        hasDigit: /\d/.test(password),
        hasSymbol: /[@$!%*?&]/.test(password)
      });
      return res.status(400).json({
        status: 'error',
        message: 'Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo'
      });
    }
    console.log('✅ [createUser] Senha válida');

    // Criar usuário (senha será criptografada pelo middleware pre-save do modelo)
    console.log('🔍 [createUser] Preparando dados do usuário...');
    console.log('📝 [createUser] Senha será criptografada pelo middleware do modelo User');
    
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Senha em texto plano - será hasheada pelo pre-save
      role,
      isActive,
      createdBy: req.user._id
    };

    if (company) {
      userData.company = company;
    }

    console.log('🔍 [createUser] Dados para salvar:', {
      ...userData,
      password: `[${userData.password.length} chars] texto plano (será hasheada pelo pre-save)`
    });

    const user = new User(userData);
    await user.save();

    console.log('✅ [createUser] Usuário salvo no DB:', user._id);

    // Teste imediato da senha
    console.log('🧪 [createUser] Testando senha após criação...');
    const testResult = await user.comparePassword(password);
    console.log('🧪 [createUser] Resultado do teste:', testResult ? '✅ SUCESSO' : '❌ FALHA');

    if (!testResult) {
      console.log('🚨 [createUser] ALERTA: Senha não funciona após criação!');
      console.log('🚨 [createUser] Dados de debug:', {
        passwordOriginal: password,
        passwordHash: user.password,
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
        bcryptVersion: require('bcrypt/package.json').version
      });
    }

    // Buscar usuário criado com dados da empresa
    const createdUser = await User.findById(user._id)
      .populate('company', 'name email')
      .select('-password -refreshToken');

    console.log('✅ [createUser] Usuário criado com sucesso:', {
      id: createdUser._id,
      email: createdUser.email,
      passwordTest: testResult ? 'PASSOU' : 'FALHOU'
    });

    res.status(201).json({
      status: 'success',
      message: 'Usuário criado com sucesso',
      data: {
        user: createdUser
      }
    });
  } catch (error) {
    console.error('❌ [createUser] Erro geral:', error);
    
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

// Obter usuário por ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('company', 'name email slug')
      .select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Estatísticas do usuário (se necessário no futuro)
    const stats = {
      loginCount: user.loginCount || 0,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.json({
      status: 'success',
      data: {
        user,
        stats
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar usuário
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      role,
      company,
      isActive
    } = req.body;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Validar role se fornecido
    if (role) {
      const validRoles = ['super_admin', 'admin', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: 'Role inválido. Valores permitidos: super_admin, admin, user'
        });
      }
    }

    // Verificar se o email já existe em outro usuário
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Email já está em uso por outro usuário'
        });
      }
    }

    // Validar empresa se fornecida
    if (company) {
      const companyExists = await Company.findById(company);
      if (!companyExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Empresa não encontrada'
        });
      }
    }

    // Validar se empresa é obrigatória para o role
    const newRole = role || user.role;
    if (newRole !== 'super_admin' && !company && !user.company) {
      return res.status(400).json({
        status: 'error',
        message: 'Empresa é obrigatória para este tipo de usuário'
      });
    }

    // Atualizar campos
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (company) user.company = company;
    if (isActive !== undefined) user.isActive = isActive;

    user.updatedAt = new Date();
    await user.save();

    // Buscar usuário atualizado
    const updatedUser = await User.findById(user._id)
      .populate('company', 'name email')
      .select('-password -refreshToken');

    res.json({
      status: 'success',
      message: 'Usuário atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email já está em uso por outro usuário'
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

// Deletar usuário (soft delete)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir deletar o próprio usuário
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Não é possível deletar seu próprio usuário'
      });
    }

    // Soft delete
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();

    res.json({
      status: 'success',
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar role do usuário
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        status: 'error',
        message: 'Role é obrigatório'
      });
    }

    const validRoles = ['super_admin', 'admin', 'user'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Role inválido. Valores permitidos: super_admin, admin, user'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    user.role = role;
    user.updatedAt = new Date();
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('company', 'name email')
      .select('-password -refreshToken');

    res.json({
      status: 'success',
      message: 'Role atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar status do usuário
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Status é obrigatório'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir desativar o próprio usuário
    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Não é possível desativar seu próprio usuário'
      });
    }

    user.isActive = isActive;
    user.updatedAt = new Date();
    
    if (!isActive) {
      user.deletedAt = new Date();
    } else {
      user.deletedAt = null;
    }
    
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('company', 'name email')
      .select('-password -refreshToken');

    res.json({
      status: 'success',
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Criar usuário para uma empresa específica
export const createCompanyUser = async (req, res) => {
  try {
    const { id: companyId } = req.params;
    const { name, email, password, role = 'user' } = req.body;

    // Verificar se a empresa existe
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Usar a função createUser mas forçando a empresa
    req.body.company = companyId;
    
    return createUser(req, res);
  } catch (error) {
    console.error('Create company user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Resetar senha do usuário
export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Nova senha é obrigatória'
      });
    }

    // Validar senha forte
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e símbolo'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Definir nova senha (será criptografada pelo middleware pre-save)
    user.password = newPassword;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      status: 'success',
      message: 'Senha resetada com sucesso'
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar usuário permanentemente (hard delete)
export const deleteUserPermanently = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir deletar o próprio usuário
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'Não é possível deletar permanentemente seu próprio usuário'
      });
    }

    // Permitir que super_admin delete outros super_admins se necessário
    // (Restrição removida a pedido do usuário)

    // Salvar dados do usuário antes de deletar (para logs)
    const deletedUserInfo = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      deletedBy: req.user._id,
      deletedAt: new Date()
    };

    // Hard delete - remove completamente do banco
    await User.findByIdAndDelete(id);

    console.log('User permanently deleted:', deletedUserInfo);

    res.json({
      status: 'success',
      message: 'Usuário deletado permanentemente com sucesso'
    });
  } catch (error) {
    console.error('Delete user permanently error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
}; 