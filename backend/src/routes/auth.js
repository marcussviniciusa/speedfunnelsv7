import express from 'express';
import {
  login,
  register,
  refreshToken,
  logout,
  me,
  updateProfile,
  changePassword,
  updateNotifications,
  updatePreferences
} from '../controllers/authController.js';
import {
  authenticate,
  requireSuperAdmin,
  validateRefreshToken
} from '../middleware/auth.js';

const router = express.Router();

// Rotas públicas
router.post('/login', login);
router.post('/refresh-token', validateRefreshToken, refreshToken);

// Rotas protegidas
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.put('/notifications', authenticate, updateNotifications);
router.put('/preferences', authenticate, updatePreferences);

// Rotas apenas para super admin
router.post('/register', authenticate, requireSuperAdmin, register);

export default router; 