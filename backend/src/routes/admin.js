import express from 'express';
import {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  getCompanyUsers,
  deleteCompany
} from '../controllers/adminController.js';
import {
  authenticate,
  requireSuperAdmin
} from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação e verificação de super admin em todas as rotas
router.use(authenticate);
router.use(requireSuperAdmin);

// Rotas de gerenciamento de empresas
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

// Rotas de usuários de empresa
router.get('/companies/:id/users', getCompanyUsers);

export default router; 