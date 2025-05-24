import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware para verificar se o usuário está autenticado
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de acesso necessário'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .populate('company', 'name slug isActive')
      .select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário inativo'
      });
    }

    // Verificar se a empresa do usuário está ativa (exceto super_admin)
    if (user.role !== 'super_admin' && (!user.company || !user.company.isActive)) {
      return res.status(401).json({
        status: 'error',
        message: 'Empresa inativa'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expirado'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Middleware para verificar se o usuário é super admin
export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Acesso negado: privilégios de super administrador necessários'
    });
  }
  next();
};

// Middleware para verificar se o usuário é admin ou super admin
export const requireAdmin = (req, res, next) => {
  if (!['admin', 'super_admin'].includes(req.user?.role)) {
    return res.status(403).json({
      status: 'error',
      message: 'Acesso negado: privilégios de administrador necessários'
    });
  }
  next();
};

// Middleware para verificar se o usuário pertence à mesma empresa do recurso
export const requireSameCompany = (req, res, next) => {
  // Super admin tem acesso a todas as empresas
  if (req.user?.role === 'super_admin') {
    return next();
  }

  // Verificar se o usuário pertence à empresa especificada
  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
  
  if (companyId && req.user?.company?._id.toString() !== companyId) {
    return res.status(403).json({
      status: 'error',
      message: 'Acesso negado: você não tem permissão para acessar dados desta empresa'
    });
  }
  
  next();
};

// Middleware para verificar permissões específicas por roles
export const requirePermission = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Usuário não autenticado'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Acesso negado: permissões insuficientes'
      });
    }

    next();
  };
};

// Middleware para validar refresh token
export const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token necessário'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token inválido'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Refresh token inválido ou expirado'
      });
    }

    console.error('Refresh token validation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
}; 