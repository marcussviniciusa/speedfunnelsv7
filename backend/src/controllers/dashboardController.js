import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import Company from '../models/Company.js';
import DashboardConfig from '../models/DashboardConfig.js';
import { resolveCompanyId } from '../utils/companyResolver.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Função para descriptografar dados sensíveis
const decrypt = (encryptedData) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.CRYPTO_SECRET_KEY, 'hex');
  
  try {
    // Se é string, pode ser dados antigos ou JSON
    if (typeof encryptedData === 'string') {
      try {
        // Tentar fazer parse para ver se é JSON
        const parsed = JSON.parse(encryptedData);
        
        if (parsed.iv && parsed.encrypted) {
          // Dados novos com IV
          const iv = Buffer.from(parsed.iv, 'hex');
          const decipher = crypto.createDecipheriv(algorithm, key, iv);
          
          let decrypted = decipher.update(parsed.encrypted, 'hex', 'utf8');
          decrypted += decipher.final('utf8');
          
          return decrypted;
        } else if (typeof parsed.encrypted === 'string') {
          // Objeto com apenas encrypted (fallback)
          return decryptLegacy(parsed.encrypted);
        } else {
          // JSON mas não tem estrutura esperada, tentar como string simples
          return decryptLegacy(encryptedData);
        }
      } catch (parseError) {
        // Não é JSON válido, é string simples (dados muito antigos)
        return decryptLegacy(encryptedData);
      }
    } else if (typeof encryptedData === 'object' && encryptedData.iv && encryptedData.encrypted) {
      // Objeto direto com IV
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } else if (typeof encryptedData === 'object' && encryptedData.encrypted) {
      // Objeto sem IV
      return decryptLegacy(encryptedData.encrypted);
    } else {
      // Formato não reconhecido
      throw new Error('Formato de dados criptografados não reconhecido');
    }
    
  } catch (error) {
    console.error('Erro na descriptografia:', error.message);
    throw new Error('Falha ao descriptografar dados. Pode ser necessário reconfigurar as contas.');
  }
};

// Função para descriptografar dados do método antigo (sem IV)
const decryptLegacy = (encryptedText) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.CRYPTO_SECRET_KEY, 'hex');
  
  try {
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro na descriptografia legacy:', error);
    throw new Error('Falha ao descriptografar dados. Pode ser necessário reconfigurar as contas.');
  }
};

// Função para converter datas relativas em formato YYYY-MM-DD
const convertDateToISO = (dateString) => {
  const today = new Date();
  
  switch (dateString) {
    case 'today':
      return today.toISOString().split('T')[0];
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    case '7daysAgo':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return sevenDaysAgo.toISOString().split('T')[0];
    case '30daysAgo':
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return thirtyDaysAgo.toISOString().split('T')[0];
    case '90daysAgo':
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return ninetyDaysAgo.toISOString().split('T')[0];
    case 'thisMonth':
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return thisMonthStart.toISOString().split('T')[0];
    case 'lastMonth':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return lastMonthStart.toISOString().split('T')[0];
    default:
      // Se já está no formato YYYY-MM-DD ou é uma data válida, retorna como está
      return dateString;
  }
};

// Função para salvar credenciais temporariamente
const saveCredentialsFile = (credentials, filename) => {
  const credentialsDir = path.join(process.cwd(), 'temp', 'credentials');
  
  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir, { recursive: true });
  }
  
  const filePath = path.join(credentialsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(credentials, null, 2));
  
  return filePath;
};

// Função para remover arquivo de credenciais temporário
const removeCredentialsFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error removing credentials file:', error);
  }
};

// Obter dados consolidados do dashboard
export const getDashboardData = async (req, res) => {
  try {
    const { 
      startDate = '30daysAgo',
      endDate = 'today',
      metaAccounts = '',
      gaAccounts = ''
    } = req.query;

    const companyId = await resolveCompanyId(req);

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Converter datas para formato ISO
    const sinceDate = convertDateToISO(startDate);
    const untilDate = convertDateToISO(endDate);

    const dashboardData = {
      company: {
        _id: company._id,
        name: company.name
      },
      dateRange: { startDate, endDate },
      metaAds: {
        accounts: [],
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalReach: 0,
        avgCTR: 0,
        avgCPM: 0,
        totalPurchases: 0,
        totalPurchaseValue: 0,
        totalAddToCart: 0,
        totalViewContent: 0,
        totalLeads: 0,
        totalInitiateCheckout: 0
      },
      googleAnalytics: {
        accounts: [],
        totalSessions: 0,
        totalUsers: 0,
        totalPageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0
      },
      summary: {
        activeCampaigns: 0,
        totalSpend: 0,
        totalSessions: 0
      }
    };

    // Processar contas Meta Ads
    const metaAccountIds = metaAccounts ? metaAccounts.split(',') : 
      company.metaAccounts.filter(acc => acc.isActive).map(acc => acc.accountId);

    for (const accountId of metaAccountIds) {
      try {
        const metaAccount = company.metaAccounts.find(
          acc => acc.accountId === accountId && acc.isActive
        );

        if (!metaAccount) continue;

        // Descriptografar token
        const encryptedData = JSON.parse(metaAccount.accessToken);
        const accessToken = decrypt(encryptedData);

        // Configurar API
        FacebookAdsApi.init(accessToken);
        const account = new AdAccount(`act_${accountId}`);

        // Buscar insights com datas convertidas e métricas de conversão
        const insights = await account.getInsights([], {
          level: 'account',
          time_range: { 
            since: sinceDate,
            until: untilDate
          },
          fields: [
            'spend',
            'impressions', 
            'clicks',
            'reach',
            'ctr',
            'cpm',
            'actions',  // Ações/Conversões
            'action_values',  // Valores das conversões
            'conversions',  // Conversões totais
            'conversion_values'  // Valores das conversões
          ]
        });

        if (insights.length > 0) {
          const insight = insights[0];
          
          // Extrair métricas de conversão
          const extractConversionMetric = (actions, actionType) => {
            if (!actions || !Array.isArray(actions)) return 0;
            const action = actions.find(a => a.action_type === actionType);
            return action ? parseFloat(action.value) || 0 : 0;
          };

          const extractConversionValue = (actionValues, actionType) => {
            if (!actionValues || !Array.isArray(actionValues)) return 0;
            const actionValue = actionValues.find(a => a.action_type === actionType);
            return actionValue ? parseFloat(actionValue.value) || 0 : 0;
          };

          const accountData = {
            accountId,
            accountName: metaAccount.accountName,
            spend: parseFloat(insight.spend) || 0,
            impressions: parseInt(insight.impressions) || 0,
            clicks: parseInt(insight.clicks) || 0,
            reach: parseInt(insight.reach) || 0,
            ctr: parseFloat(insight.ctr) || 0,
            cpm: parseFloat(insight.cpm) || 0,
            // Métricas de conversão
            purchases: extractConversionMetric(insight.actions, 'purchase'),
            purchaseValue: extractConversionValue(insight.action_values, 'purchase'),
            addToCart: extractConversionMetric(insight.actions, 'add_to_cart'),
            addToCartValue: extractConversionValue(insight.action_values, 'add_to_cart'),
            viewContent: extractConversionMetric(insight.actions, 'view_content'),
            viewContentValue: extractConversionValue(insight.action_values, 'view_content'),
            initiateCheckout: extractConversionMetric(insight.actions, 'initiate_checkout'),
            initiateCheckoutValue: extractConversionValue(insight.action_values, 'initiate_checkout'),
            leads: extractConversionMetric(insight.actions, 'lead'),
            leadValue: extractConversionValue(insight.action_values, 'lead'),
            completeRegistration: extractConversionMetric(insight.actions, 'complete_registration'),
            completeRegistrationValue: extractConversionValue(insight.action_values, 'complete_registration'),
            // Conversões personalizadas
            customConversions: insight.conversions ? parseFloat(insight.conversions) || 0 : 0,
            customConversionsValue: insight.conversion_values ? parseFloat(insight.conversion_values) || 0 : 0,
            // Todas as ações para referência
            allActions: insight.actions || [],
            allActionValues: insight.action_values || []
          };

          dashboardData.metaAds.accounts.push(accountData);
          dashboardData.metaAds.totalSpend += accountData.spend;
          dashboardData.metaAds.totalImpressions += accountData.impressions;
          dashboardData.metaAds.totalClicks += accountData.clicks;
          dashboardData.metaAds.totalReach += accountData.reach;
          
          // Somar métricas de conversão
          dashboardData.metaAds.totalPurchases = (dashboardData.metaAds.totalPurchases || 0) + accountData.purchases;
          dashboardData.metaAds.totalPurchaseValue = (dashboardData.metaAds.totalPurchaseValue || 0) + accountData.purchaseValue;
          dashboardData.metaAds.totalAddToCart = (dashboardData.metaAds.totalAddToCart || 0) + accountData.addToCart;
          dashboardData.metaAds.totalViewContent = (dashboardData.metaAds.totalViewContent || 0) + accountData.viewContent;
          dashboardData.metaAds.totalLeads = (dashboardData.metaAds.totalLeads || 0) + accountData.leads;
          dashboardData.metaAds.totalInitiateCheckout = (dashboardData.metaAds.totalInitiateCheckout || 0) + accountData.initiateCheckout;
        }
      } catch (error) {
        console.error(`Error fetching Meta Ads data for account ${accountId}:`, error);
      }
    }

    // Calcular médias Meta Ads
    if (dashboardData.metaAds.accounts.length > 0) {
      dashboardData.metaAds.avgCTR = dashboardData.metaAds.accounts
        .reduce((sum, acc) => sum + acc.ctr, 0) / dashboardData.metaAds.accounts.length;
      dashboardData.metaAds.avgCPM = dashboardData.metaAds.accounts
        .reduce((sum, acc) => sum + acc.cpm, 0) / dashboardData.metaAds.accounts.length;
      
      // Inicializar totais de conversão se não existem
      dashboardData.metaAds.totalPurchases = dashboardData.metaAds.totalPurchases || 0;
      dashboardData.metaAds.totalPurchaseValue = dashboardData.metaAds.totalPurchaseValue || 0;
      dashboardData.metaAds.totalAddToCart = dashboardData.metaAds.totalAddToCart || 0;
      dashboardData.metaAds.totalViewContent = dashboardData.metaAds.totalViewContent || 0;
      dashboardData.metaAds.totalLeads = dashboardData.metaAds.totalLeads || 0;
      dashboardData.metaAds.totalInitiateCheckout = dashboardData.metaAds.totalInitiateCheckout || 0;
    }

    // Processar contas Google Analytics
    const gaPropertyIds = gaAccounts ? gaAccounts.split(',') : 
      company.googleAnalyticsAccounts.filter(acc => acc.isActive).map(acc => acc.propertyId);

    for (const propertyId of gaPropertyIds) {
      try {
        const gaAccount = company.googleAnalyticsAccounts.find(
          acc => acc.propertyId === propertyId && acc.isActive
        );

        if (!gaAccount) continue;

        // Descriptografar credenciais
        const encryptedData = JSON.parse(gaAccount.credentials);
        const credentials = JSON.parse(decrypt(encryptedData));

        // Salvar credenciais temporariamente
        const tempFilename = `dashboard_${Date.now()}_${companyId}_${propertyId}.json`;
        const tempCredentialsFile = saveCredentialsFile(credentials, tempFilename);

        try {
          // Configurar cliente Google Analytics
          const analyticsDataClient = new BetaAnalyticsDataClient({
            keyFilename: tempCredentialsFile
          });

          // Buscar dados principais com datas convertidas
          const [response] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: sinceDate, endDate: untilDate }],
            metrics: [
              { name: 'sessions' },
              { name: 'screenPageViews' },
              { name: 'activeUsers' }
            ]
          });

          if (response.rows && response.rows.length > 0) {
            const row = response.rows[0];
            const accountData = {
              propertyId,
              propertyName: gaAccount.propertyName,
              sessions: parseInt(row.metricValues[0].value) || 0,
              pageviews: parseInt(row.metricValues[1].value) || 0,
              users: parseInt(row.metricValues[2].value) || 0,
              avgSessionDuration: 0,
              bounceRate: 0
            };

            dashboardData.googleAnalytics.accounts.push(accountData);
            dashboardData.googleAnalytics.totalSessions += accountData.sessions;
            dashboardData.googleAnalytics.totalUsers += accountData.users;
            dashboardData.googleAnalytics.totalPageviews += accountData.pageviews;
          }

        } finally {
          // Sempre remover arquivo temporário
          removeCredentialsFile(tempCredentialsFile);
        }

      } catch (error) {
        console.error(`Error fetching Google Analytics data for property ${propertyId}:`, error);
      }
    }

    // Calcular médias Google Analytics
    if (dashboardData.googleAnalytics.accounts.length > 0) {
      dashboardData.googleAnalytics.avgSessionDuration = dashboardData.googleAnalytics.accounts
        .reduce((sum, acc) => sum + acc.avgSessionDuration, 0) / dashboardData.googleAnalytics.accounts.length;
      dashboardData.googleAnalytics.bounceRate = dashboardData.googleAnalytics.accounts
        .reduce((sum, acc) => sum + acc.bounceRate, 0) / dashboardData.googleAnalytics.accounts.length;
    }

    // Calcular resumo
    dashboardData.summary.totalSpend = dashboardData.metaAds.totalSpend;
    dashboardData.summary.totalSessions = dashboardData.googleAnalytics.totalSessions;
    dashboardData.summary.activeCampaigns = dashboardData.metaAds.accounts.length;

    res.json({
      status: 'success',
      data: dashboardData
    });

  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Salvar configuração de dashboard
export const saveDashboardConfig = async (req, res) => {
  try {
    const {
      name,
      description = '',
      widgets = [],
      layout = {},
      globalFilters = {},
      exportSettings = {},
      isDefault = false,
      isShared = false
    } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Nome do dashboard é obrigatório'
      });
    }

    const companyId = await resolveCompanyId(req);

    const dashboardConfig = new DashboardConfig({
      name: name.trim(),
      description: description.trim(),
      company: companyId,
      user: req.user._id,
      widgets,
      layout,
      globalFilters,
      exportSettings,
      isDefault,
      isShared
    });

    await dashboardConfig.save();

    res.status(201).json({
      status: 'success',
      message: 'Configuração de dashboard salva com sucesso',
      data: {
        dashboardConfig
      }
    });

  } catch (error) {
    console.error('Save dashboard config error:', error);
    
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Listar configurações de dashboard
export const getDashboardConfigs = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { isDefault } = req.query;

    // Buscar dashboards do usuário e dashboards compartilhados
    const filter = {
      company: companyId,
      $or: [
        { user: req.user._id },
        { isShared: true }
      ]
    };

    // Adicionar filtro por isDefault se especificado
    if (isDefault !== undefined) {
      filter.isDefault = isDefault === 'true';
    }

    console.log('🔍 Filtros aplicados no getDashboardConfigs:', filter);

    const dashboardConfigs = await DashboardConfig.find(filter)
      .populate('user', 'name email')
      .sort({ isDefault: -1, lastAccessed: -1 });

    console.log('📊 Configurações encontradas:', dashboardConfigs.length);

    res.json({
      status: 'success',
      data: {
        dashboardConfigs
      }
    });

  } catch (error) {
    console.error('Get dashboard configs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Obter configuração de dashboard por ID
export const getDashboardConfigById = async (req, res) => {
  try {
    const { id } = req.params;

    const dashboardConfig = await DashboardConfig.findById(id)
      .populate('user', 'name email')
      .populate('company', 'name');

    if (!dashboardConfig) {
      return res.status(404).json({
        status: 'error',
        message: 'Configuração de dashboard não encontrada'
      });
    }

    // Verificar permissões
    if (req.user.role !== 'super_admin') {
      if (dashboardConfig.company._id.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      if (dashboardConfig.user._id.toString() !== req.user._id.toString() && !dashboardConfig.isShared) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }
    }

    // Atualizar último acesso
    dashboardConfig.lastAccessed = new Date();
    await dashboardConfig.save();

    res.json({
      status: 'success',
      data: {
        dashboardConfig
      }
    });

  } catch (error) {
    console.error('Get dashboard config by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar configuração de dashboard
export const updateDashboardConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      widgets,
      layout,
      globalFilters,
      exportSettings,
      isDefault,
      isShared
    } = req.body;

    const dashboardConfig = await DashboardConfig.findById(id);

    if (!dashboardConfig) {
      return res.status(404).json({
        status: 'error',
        message: 'Configuração de dashboard não encontrada'
      });
    }

    // Verificar permissões
    if (req.user.role !== 'super_admin') {
      if (dashboardConfig.company.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      if (dashboardConfig.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Apenas o criador pode editar este dashboard'
        });
      }
    }

    // Atualizar campos
    if (name) dashboardConfig.name = name.trim();
    if (description !== undefined) dashboardConfig.description = description.trim();
    if (widgets) dashboardConfig.widgets = widgets;
    if (layout) dashboardConfig.layout = { ...dashboardConfig.layout, ...layout };
    if (globalFilters) dashboardConfig.globalFilters = { ...dashboardConfig.globalFilters, ...globalFilters };
    if (exportSettings) dashboardConfig.exportSettings = { ...dashboardConfig.exportSettings, ...exportSettings };
    if (isDefault !== undefined) dashboardConfig.isDefault = isDefault;
    if (isShared !== undefined) dashboardConfig.isShared = isShared;

    await dashboardConfig.save();

    res.json({
      status: 'success',
      message: 'Configuração de dashboard atualizada com sucesso',
      data: {
        dashboardConfig
      }
    });

  } catch (error) {
    console.error('Update dashboard config error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Remover configuração de dashboard
export const deleteDashboardConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const dashboardConfig = await DashboardConfig.findById(id);

    if (!dashboardConfig) {
      return res.status(404).json({
        status: 'error',
        message: 'Configuração de dashboard não encontrada'
      });
    }

    // Verificar permissões
    if (req.user.role !== 'super_admin') {
      if (dashboardConfig.company.toString() !== req.user.company._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Acesso negado'
        });
      }

      if (dashboardConfig.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Apenas o criador pode remover este dashboard'
        });
      }
    }

    await DashboardConfig.findByIdAndDelete(id);

    res.json({
      status: 'success',
      message: 'Configuração de dashboard removida com sucesso'
    });

  } catch (error) {
    console.error('Delete dashboard config error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
}; 