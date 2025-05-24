import express from 'express';
import {
  getDashboardData,
  saveDashboardConfig,
  getDashboardConfigs,
  getDashboardConfigById,
  updateDashboardConfig,
  deleteDashboardConfig
} from '../controllers/dashboardController.js';
import {
  authenticate
} from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rota principal para dados do dashboard
router.get('/data', getDashboardData);

// Rotas de configuração de dashboard
router.post('/configs', saveDashboardConfig);
router.get('/configs', getDashboardConfigs);
router.get('/configs/:id', getDashboardConfigById);
router.put('/configs/:id', updateDashboardConfig);
router.delete('/configs/:id', deleteDashboardConfig);

export default router; 