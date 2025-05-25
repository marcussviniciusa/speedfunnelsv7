import axios from 'axios';

// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
  // Removido headers globais para permitir FormData
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Só definir Content-Type se não for FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
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
  deleteCompanyPermanently: (id) => api.delete(`/admin/companies/${id}/permanent`),
  
  // Usuários
  getAllUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  resetUserPassword: (id, data) => api.put(`/admin/users/${id}/password`, data),
  deleteUserPermanently: (id) => api.delete(`/admin/users/${id}/permanent`),
  
  // Usuários da empresa
  getCompanyUsers: (companyId, params) => 
    api.get(`/admin/companies/${companyId}/users`, { params }),
  createCompanyUser: (companyId, data) => 
    api.post(`/admin/companies/${companyId}/users`, data)
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

// Serviços de Relatórios Compartilhados
export const sharedReportsAPI = {
  // Criar novo compartilhamento
  createSharedReport: (data) => api.post('/shared-reports', data),
  
  // Listar relatórios compartilhados da empresa
  listSharedReports: (params = {}) => api.get('/shared-reports', { params }),
  
  // Acessar relatório público (sem autenticação)
  getPublicReport: (shareId, password = null) => {
    const config = { 
      headers: {},
      validateStatus: (status) => status < 500 // Aceitar 401/404/410 como respostas válidas
    };
    
    if (password) {
      return axios.post(`${API_BASE_URL}/shared-reports/public/${shareId}`, { password }, config);
    } else {
      return axios.get(`${API_BASE_URL}/shared-reports/public/${shareId}`, config);
    }
  },
  
  // Atualizar configurações de compartilhamento
  updateSharedReport: (shareId, data) => api.put(`/shared-reports/${shareId}`, data),
  
  // Deletar relatório compartilhado
  deleteSharedReport: (shareId) => api.delete(`/shared-reports/${shareId}`),
  
  // Obter estatísticas detalhadas
  getReportStats: (shareId) => api.get(`/shared-reports/${shareId}/stats`)
};

export default api; 