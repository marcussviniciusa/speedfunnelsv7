import express from 'express';
import {
  addMetaAccount,
  getMetaAccounts,
  getCampaigns,
  getCampaignInsights,
  removeMetaAccount,
  testMetaConnection
} from '../controllers/metaAdsController.js';
import {
  authenticate,
  requireSameCompany
} from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas de gerenciamento de contas Meta Ads
router.post('/accounts', addMetaAccount);
router.get('/accounts', getMetaAccounts);
router.delete('/accounts/:accountId', removeMetaAccount);

// Rotas de teste de conexão
router.get('/accounts/:accountId/test', testMetaConnection);

// Rotas de dados de campanhas
router.get('/accounts/:accountId/campaigns', getCampaigns);
router.get('/accounts/:accountId/insights', getCampaignInsights);

export default router; 