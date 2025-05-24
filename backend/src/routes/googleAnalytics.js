import express from 'express';
import {
  addGoogleAnalyticsAccount,
  getGoogleAnalyticsAccounts,
  getAnalyticsData,
  removeGoogleAnalyticsAccount,
  testGoogleAnalyticsConnection
} from '../controllers/googleAnalyticsController.js';
import {
  authenticate
} from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas de gerenciamento de contas Google Analytics
router.post('/accounts', addGoogleAnalyticsAccount);
router.get('/accounts', getGoogleAnalyticsAccounts);
router.delete('/accounts/:propertyId', removeGoogleAnalyticsAccount);

// Rotas de teste de conexão
router.get('/accounts/:propertyId/test', testGoogleAnalyticsConnection);

// Rotas de dados do Google Analytics
router.get('/accounts/:propertyId/data', getAnalyticsData);

export default router; 