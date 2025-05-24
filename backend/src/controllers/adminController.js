import Company from '../models/Company.js';
import User from '../models/User.js';

// Listar todas as empresas (apenas super admin)
export const getCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
    
    // Construir filtros
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }

    // Paginação
    const skip = (page - 1) * limit;
    
    const companies = await Company.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Company.countDocuments(filter);
    
    res.json({
      status: 'success',
      data: {
        companies,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Criar nova empresa
export const createCompany = async (req, res) => {
  try {
    const {
      name,
      email,
      cnpj,
      phone,
      address
    } = req.body;

    // Validações básicas
    if (!name || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'Nome e email da empresa são obrigatórios'
      });
    }

    // Verificar se o email já existe
    const existingCompany = await Company.findOne({ email: email.toLowerCase() });
    if (existingCompany) {
      return res.status(400).json({
        status: 'error',
        message: 'Email já está em uso por outra empresa'
      });
    }

    // Criar empresa
    const companyData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdBy: req.user._id
    };

    if (cnpj) companyData.cnpj = cnpj.trim();
    if (phone) companyData.phone = phone.trim();
    if (address) companyData.address = address;

    const company = new Company(companyData);
    await company.save();

    // Buscar empresa com dados do criador
    const companyWithCreator = await Company.findById(company._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Empresa criada com sucesso',
      data: {
        company: companyWithCreator
      }
    });
  } catch (error) {
    console.error('Create company error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        status: 'error',
        message: `${field === 'email' ? 'Email' : 'Slug'} já está em uso`
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

// Obter empresa por ID
export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id)
      .populate('createdBy', 'name email');

    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Buscar estatísticas da empresa
    const userCount = await User.countDocuments({ company: company._id });
    const activeUserCount = await User.countDocuments({ 
      company: company._id, 
      isActive: true 
    });

    res.json({
      status: 'success',
      data: {
        company,
        stats: {
          totalUsers: userCount,
          activeUsers: activeUserCount,
          metaAccounts: company.metaAccounts.length,
          googleAnalyticsAccounts: company.googleAnalyticsAccounts.length
        }
      }
    });
  } catch (error) {
    console.error('Get company by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar empresa
export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      cnpj,
      phone,
      address,
      settings,
      subscription,
      isActive
    } = req.body;

    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Verificar se o email já existe em outra empresa
    if (email && email.toLowerCase() !== company.email) {
      const existingCompany = await Company.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingCompany) {
        return res.status(400).json({
          status: 'error',
          message: 'Email já está em uso por outra empresa'
        });
      }
    }

    // Atualizar campos
    if (name) company.name = name.trim();
    if (email) company.email = email.toLowerCase().trim();
    if (cnpj !== undefined) company.cnpj = cnpj ? cnpj.trim() : null;
    if (phone !== undefined) company.phone = phone ? phone.trim() : null;
    if (address) company.address = { ...company.address, ...address };
    if (settings) company.settings = { ...company.settings, ...settings };
    if (subscription) company.subscription = { ...company.subscription, ...subscription };
    if (isActive !== undefined) company.isActive = isActive;

    await company.save();

    // Buscar empresa atualizada
    const updatedCompany = await Company.findById(company._id)
      .populate('createdBy', 'name email');

    res.json({
      status: 'success',
      message: 'Empresa atualizada com sucesso',
      data: {
        company: updatedCompany
      }
    });
  } catch (error) {
    console.error('Update company error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        status: 'error',
        message: 'Email já está em uso por outra empresa'
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

// Listar usuários de uma empresa
export const getCompanyUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, search = '', role = 'all', status = 'all' } = req.query;

    // Verificar se a empresa existe
    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Construir filtros
    const filter = { company: id };
    
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

    // Paginação
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);
    
    res.json({
      status: 'success',
      data: {
        users,
        company: {
          _id: company._id,
          name: company.name,
          email: company.email
        },
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get company users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Remover empresa (soft delete)
export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Verificar se há usuários ativos na empresa
    const activeUsers = await User.countDocuments({ 
      company: id, 
      isActive: true 
    });

    if (activeUsers > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Não é possível remover a empresa. Há ${activeUsers} usuário(s) ativo(s) vinculado(s) a ela.`
      });
    }

    // Soft delete
    company.isActive = false;
    await company.save();

    // Desativar todos os usuários da empresa
    await User.updateMany(
      { company: id },
      { isActive: false }
    );

    res.json({
      status: 'success',
      message: 'Empresa desativada com sucesso'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
}; 