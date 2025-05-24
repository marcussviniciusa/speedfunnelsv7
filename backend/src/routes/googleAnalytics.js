import express from 'express';
import multer from 'multer';
import {
  addGoogleAnalyticsAccount,
  getGoogleAnalyticsAccounts,
  getAnalyticsData,
  removeGoogleAnalyticsAccount,
  testGoogleAnalyticsConnection,
  diagnoseGAProperty
} from '../controllers/googleAnalyticsController.js';
import {
  authenticate
} from '../middleware/auth.js';

const router = express.Router();

// Configurar multer para upload de arquivos JSON
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limite
  },
  fileFilter: (req, file, cb) => {
    // Aceitar qualquer arquivo que termine com .json ou tenha mimetype de JSON
    if (file.mimetype === 'application/json' || 
        file.mimetype === 'text/json' ||
        file.originalname.toLowerCase().endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos JSON são permitidos'), false);
    }
  }
});

// Rotas de gerenciamento de contas Google Analytics
router.post('/accounts', upload.single('credentialsFile'), authenticate, addGoogleAnalyticsAccount);
router.get('/accounts', authenticate, getGoogleAnalyticsAccounts);
router.delete('/accounts/:propertyId', authenticate, removeGoogleAnalyticsAccount);

// Rotas de teste de conexão
router.get('/accounts/:propertyId/test', authenticate, testGoogleAnalyticsConnection);

// Rota de diagnóstico avançado para propriedades problemáticas
router.get('/accounts/:propertyId/diagnose', authenticate, diagnoseGAProperty);

// Rotas de dados do Google Analytics
router.get('/accounts/:propertyId/data', authenticate, getAnalyticsData);

export default router; 