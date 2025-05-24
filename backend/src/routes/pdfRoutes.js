import express from 'express';
import pdfController from '../controllers/pdfController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/pdf/test
 * @desc Testar geração básica de PDF
 * @access Public (para facilitar testes)
 */
router.get('/test', async (req, res) => {
  try {
    const { default: PdfService } = await import('../services/PdfService.js');
    
    const testData = {
      metaAds: {
        totalSpend: 5000,
        totalImpressions: 100000,
        totalClicks: 2500,
        avgCTR: 2.5,
        accounts: [
          {
            accountName: 'Conta Teste',
            spend: 5000,
            impressions: 100000,
            clicks: 2500,
            ctr: 2.5
          }
        ]
      },
      googleAnalytics: {
        totalSessions: 15000,
        totalUsers: 10000,
        totalPageviews: 45000,
        accounts: [
          {
            propertyName: 'Site Teste',
            sessions: 15000,
            users: 10000,
            pageviews: 45000
          }
        ]
      }
    };

    const config = {
      title: 'Teste de PDF',
      companyName: 'SpeedFunnels Teste',
      primaryColor: '#1976d2',
      dateRange: 'Teste - Janeiro 2025'
    };

    const htmlContent = PdfService.generateDashboardHTML(testData, config);
    const pdfBuffer = await PdfService.generatePDF(htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="teste.pdf"');
    res.send(pdfBuffer);

    console.log('✅ PDF de teste gerado com sucesso');
  } catch (error) {
    console.error('❌ Erro no teste de PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no teste de PDF',
      error: error.message
    });
  }
});

// Middleware de autenticação obrigatório para as demais rotas
router.use(authenticate);

/**
 * @route POST /api/pdf/dashboard
 * @desc Gerar PDF do dashboard atual
 * @access Private (todos os usuários autenticados)
 */
router.post('/dashboard', pdfController.generateDashboardPDF);

/**
 * @route POST /api/pdf/report
 * @desc Gerar PDF de relatório personalizado
 * @access Private (todos os usuários autenticados)
 */
router.post('/report', pdfController.generateReportPDF);

/**
 * @route POST /api/pdf/preview
 * @desc Gerar preview HTML do PDF (sem gerar o arquivo)
 * @access Private (todos os usuários autenticados)
 */
router.post('/preview', pdfController.previewPDF);

export default router; 