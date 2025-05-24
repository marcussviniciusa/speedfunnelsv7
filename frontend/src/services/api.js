import axios from 'axios';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para lidar com respostas
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de Autenticação
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  updateNotifications: (data) => api.put('/auth/notifications', data),
  updatePreferences: (data) => api.put('/auth/preferences', data)
};

// Serviços de Administração
export const adminAPI = {
  // Empresas
  getCompanies: (params) => api.get('/admin/companies', { params }),
  createCompany: (data) => api.post('/admin/companies', data),
  getCompanyById: (id) => api.get(`/admin/companies/${id}`),
  updateCompany: (id, data) => api.put(`/admin/companies/${id}`, data),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`),
  
  // Usuários da empresa
  getCompanyUsers: (companyId, params) => 
    api.get(`/admin/companies/${companyId}/users`, { params })
};

// Serviços Meta Ads
export const metaAdsAPI = {
  // Contas
  getAccounts: (params) => api.get('/meta-ads/accounts', { params }),
  addAccount: (data) => api.post('/meta-ads/accounts', data),
  removeAccount: (accountId, params) => 
    api.delete(`/meta-ads/accounts/${accountId}`, { params }),
  testConnection: (accountId, params) => 
    api.get(`/meta-ads/accounts/${accountId}/test`, { params }),
  
  // Dados
  getCampaigns: (accountId, params) => 
    api.get(`/meta-ads/accounts/${accountId}/campaigns`, { params }),
  getInsights: (accountId, params) => 
    api.get(`/meta-ads/accounts/${accountId}/insights`, { params })
};

// Serviços Google Analytics
export const googleAnalyticsAPI = {
  // Contas
  getAccounts: (params) => api.get('/google-analytics/accounts', { params }),
  addAccount: (data) => api.post('/google-analytics/accounts', data),
  removeAccount: (propertyId, params) => 
    api.delete(`/google-analytics/accounts/${propertyId}`, { params }),
  testConnection: (propertyId, params) => 
    api.get(`/google-analytics/accounts/${propertyId}/test`, { params }),
  
  // Dados
  getData: (propertyId, params) => 
    api.get(`/google-analytics/accounts/${propertyId}/data`, { params })
};

// Serviços Dashboard
export const dashboardAPI = {
  // Dados consolidados
  getData: (params) => api.get('/dashboard/data', { params }),
  
  // Configurações
  getConfigs: (params) => api.get('/dashboard/configs', { params }),
  saveConfig: (data) => api.post('/dashboard/configs', data),
  getConfigById: (id) => api.get(`/dashboard/configs/${id}`),
  updateConfig: (id, data) => api.put(`/dashboard/configs/${id}`, data),
  deleteConfig: (id) => api.delete(`/dashboard/configs/${id}`)
};

// Serviços de Relatórios
export const reportsAPI = {
  generateAdvancedReport: (config) => api.post('/reports/generate', config),
  getAvailableFields: () => api.get('/reports/fields'),
  getPredefinedReports: () => api.get('/reports/predefined'),
  getSegmentationOptions: () => api.get('/reports/segmentation-options')
};

export default api; 