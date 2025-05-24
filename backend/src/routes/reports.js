import express from 'express';
import { authenticate, requirePermission } from '../middleware/auth.js';
import {
  generateAdvancedReport,
  getAvailableFields,
  getPredefinedReports,
  getSegmentationOptions
} from '../controllers/reportsController.js';

const router = express.Router();

// Aplicar middleware de autenticação para todas as rotas
router.use(authenticate);

// Gerar relatório com filtros avançados
router.post(
  '/generate',
  requirePermission(['user', 'admin', 'super_admin']),
  generateAdvancedReport
);

// Obter campos disponíveis para filtros
router.get(
  '/fields',
  requirePermission(['user', 'admin', 'super_admin']),
  getAvailableFields
);

// Obter relatórios pré-definidos
router.get(
  '/predefined',
  requirePermission(['user', 'admin', 'super_admin']),
  getPredefinedReports
);

// Obter opções de segmentação
router.get(
  '/segmentation-options',
  requirePermission(['user', 'admin', 'super_admin']),
  getSegmentationOptions
);

export default router; 