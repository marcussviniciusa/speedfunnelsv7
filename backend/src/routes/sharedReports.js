import express from 'express';
import {
  createSharedReport,
  getPublicReport,
  listSharedReports,
  updateSharedReport,
  deleteSharedReport,
  getReportStats
} from '../controllers/sharedReportsController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = express.Router();

// 🔗 Criar novo compartilhamento (autenticado)
router.post(
  '/',
  authenticate,
  requirePermission(['user', 'admin', 'super_admin']),
  createSharedReport
);

// 📋 Listar relatórios compartilhados da empresa (autenticado)
router.get(
  '/',
  authenticate,
  requirePermission(['user', 'admin', 'super_admin']),
  listSharedReports
);

// 👁️ Acessar relatório público (SEM autenticação)
router.post('/public/:shareId', getPublicReport);
router.get('/public/:shareId', getPublicReport);

// ✏️ Atualizar configurações de compartilhamento (autenticado)
router.put(
  '/:shareId',
  authenticate,
  requirePermission(['user', 'admin', 'super_admin']),
  updateSharedReport
);

// 🗑️ Deletar relatório compartilhado (autenticado)
router.delete(
  '/:shareId',
  authenticate,
  requirePermission(['user', 'admin', 'super_admin']),
  deleteSharedReport
);

// 📊 Obter estatísticas detalhadas (autenticado)
router.get(
  '/:shareId/stats',
  authenticate,
  requirePermission(['user', 'admin', 'super_admin']),
  getReportStats
);

export default router; 