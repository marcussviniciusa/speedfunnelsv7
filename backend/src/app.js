import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seudominio.com'] // Substitua pelo domínio em produção
    : ['http://localhost:3000', 'http://localhost:5173'], // Vite usa porta 5173
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Route para health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'SpeedFunnels API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Importar rotas
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import metaAdsRoutes from './routes/metaAds.js';
import googleAnalyticsRoutes from './routes/googleAnalytics.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes from './routes/reports.js';

// Routes principais
app.get('/api', (req, res) => {
  res.json({
    message: 'SpeedFunnels API v1.0',
    version: '1.0.0',
    routes: {
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/dashboard',
      reports: '/api/reports',
      meta: '/api/meta-ads',
      analytics: '/api/google-analytics'
    }
  });
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/meta-ads', metaAdsRoutes);
app.use('/api/google-analytics', googleAnalyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 SpeedFunnels Backend Server is running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📊 Health Check: http://localhost:${PORT}/health
🔗 API Base: http://localhost:${PORT}/api
  `);
});

export default app; 