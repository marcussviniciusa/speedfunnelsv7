import Company from '../models/Company.js';

/**
 * Resolve o companyId para requisições
 * Para super admins: usa o companyId da query/params ou a primeira empresa ativa
 * Para outros usuários: usa a empresa do usuário
 */
export const resolveCompanyId = async (req) => {
  let companyId;
  
  if (req.user.role === 'super_admin') {
    // Tentar obter companyId de query params, params ou body
    companyId = req.query.companyId || req.params.companyId || req.body.companyId;
    
    if (!companyId) {
      // Se super admin não especificou companyId, usar a primeira empresa ativa
      const firstCompany = await Company.findOne({ isActive: true }).select('_id');
      if (!firstCompany) {
        throw new Error('Nenhuma empresa ativa encontrada. Crie uma empresa primeiro.');
      }
      companyId = firstCompany._id;
    }
  } else {
    // Para usuários normais, usar a empresa associada
    if (!req.user.company || !req.user.company._id) {
      throw new Error('Usuário não possui empresa associada');
    }
    companyId = req.user.company._id;
  }
  
  return companyId;
};

/**
 * Middleware para resolver companyId automaticamente
 */
export const companyResolver = async (req, res, next) => {
  try {
    req.companyId = await resolveCompanyId(req);
    next();
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}; 