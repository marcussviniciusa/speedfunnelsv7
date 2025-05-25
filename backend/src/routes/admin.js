import express from 'express';
import {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  getCompanyUsers,
  deleteCompany,
  deleteCompanyPermanently
} from '../controllers/adminController.js';
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserStatus,
  createCompanyUser,
  resetUserPassword,
  deleteUserPermanently
} from '../controllers/userController.js';
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
router.delete('/companies/:id/permanent', deleteCompanyPermanently);  // Deletar empresa permanentemente

// Rotas de usuários de empresa
router.get('/companies/:id/users', getCompanyUsers);

// Rotas de gerenciamento de usuários
router.get('/users', getAllUsers);              // Listar todos usuários
router.post('/users', createUser);              // Criar usuário
router.get('/users/:id', getUserById);          // Obter usuário específico
router.put('/users/:id', updateUser);           // Atualizar usuário
router.delete('/users/:id', deleteUser);        // Deletar usuário

// Operações específicas de usuários
router.put('/users/:id/role', updateUserRole);           // Alterar role
router.put('/users/:id/status', updateUserStatus);       // Ativar/desativar
router.put('/users/:id/password', resetUserPassword);    // Resetar senha

// Delete permanente (hard delete) - CUIDADO: ação irreversível
router.delete('/users/:id/permanent', deleteUserPermanently);  // Deletar permanentemente

// Criar usuário para empresa específica
router.post('/companies/:id/users', createCompanyUser);  // Criar usuário para empresa

export default router; 