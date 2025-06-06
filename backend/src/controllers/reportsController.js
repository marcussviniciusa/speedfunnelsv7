import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import Company from '../models/Company.js';
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

// Processar filtros simples
const processSimpleFilters = (simpleFilters = [], dataSource = 'all') => {
  const filters = {
    meta: [],
    ga: [],
    combined: []
  };

  if (!simpleFilters || simpleFilters.length === 0) {
    return filters;
  }

  simpleFilters.forEach(filter => {
    if (!filter.enabled || !filter.field || filter.value === '') {
      return;
    }

    const { field, operator, value } = filter;
    
    // Mapear campos para diferentes fontes de dados
    const fieldMapping = {
      // Meta Ads fields
      'meta_spend': { source: 'meta', field: 'spend', type: 'number' },
      'meta_impressions': { source: 'meta', field: 'impressions', type: 'number' },
      'meta_clicks': { source: 'meta', field: 'clicks', type: 'number' },
      'meta_ctr': { source: 'meta', field: 'ctr', type: 'number' },
      'meta_cpm': { source: 'meta', field: 'cpm', type: 'number' },
      'meta_campaign_name': { source: 'meta', field: 'campaign_name', type: 'string' },
      'meta_account_name': { source: 'meta', field: 'account_name', type: 'string' },
      
      // Google Analytics fields
      'ga_sessions': { source: 'ga', field: 'sessions', type: 'number' },
      'ga_users': { source: 'ga', field: 'users', type: 'number' },
      'ga_pageviews': { source: 'ga', field: 'pageviews', type: 'number' },
      'ga_bounce_rate': { source: 'ga', field: 'bounceRate', type: 'number' },
      'ga_session_duration': { source: 'ga', field: 'avgSessionDuration', type: 'number' },
      'ga_device_category': { source: 'ga', field: 'deviceCategory', type: 'string' },
      'ga_traffic_source': { source: 'ga', field: 'source', type: 'string' },
      
      // Combined fields
      'total_spend': { source: 'combined', field: 'totalSpend', type: 'number' },
      'total_sessions': { source: 'combined', field: 'totalSessions', type: 'number' },
      'cost_per_session': { source: 'combined', field: 'costPerSession', type: 'number' }
    };

    const fieldInfo = fieldMapping[field];
    if (!fieldInfo) return;

    const filterObj = {
      field: fieldInfo.field,
      operator,
      value: fieldInfo.type === 'number' ? parseFloat(value) : value,
      type: fieldInfo.type
    };

    // Adicionar ao array apropriado
    filters[fieldInfo.source].push(filterObj);
  });

  return filters;
};

// Processar filtros avançados usando QueryBuilder (manter compatibilidade)
const processAdvancedFilters = (queryBuilderRule, dataSource = 'all') => {
  const filters = {
    meta: [],
    ga: [],
    combined: []
  };

  if (!queryBuilderRule || !queryBuilderRule.rules) {
    return filters;
  }

  const processRule = (rule) => {
    if (rule.combinator) {
      // É um grupo
      const groupFilters = rule.rules.map(r => processRule(r));
      return {
        combinator: rule.combinator,
        filters: groupFilters
      };
    } else {
      // É uma regra individual
      const { field, operator, value } = rule;
      
      // Mapear campos para diferentes fontes de dados
      const fieldMapping = {
        // Meta Ads fields
        'meta_spend': { source: 'meta', field: 'spend', type: 'number' },
        'meta_impressions': { source: 'meta', field: 'impressions', type: 'number' },
        'meta_clicks': { source: 'meta', field: 'clicks', type: 'number' },
        'meta_ctr': { source: 'meta', field: 'ctr', type: 'number' },
        'meta_cpm': { source: 'meta', field: 'cpm', type: 'number' },
        'meta_campaign_name': { source: 'meta', field: 'campaign_name', type: 'string' },
        'meta_account_name': { source: 'meta', field: 'account_name', type: 'string' },
        
        // Google Analytics fields
        'ga_sessions': { source: 'ga', field: 'sessions', type: 'number' },
        'ga_users': { source: 'ga', field: 'users', type: 'number' },
        'ga_pageviews': { source: 'ga', field: 'pageviews', type: 'number' },
        'ga_bounce_rate': { source: 'ga', field: 'bounceRate', type: 'number' },
        'ga_session_duration': { source: 'ga', field: 'avgSessionDuration', type: 'number' },
        'ga_device_category': { source: 'ga', field: 'deviceCategory', type: 'string' },
        'ga_traffic_source': { source: 'ga', field: 'source', type: 'string' },
        
        // Combined fields
        'date_range': { source: 'combined', field: 'date', type: 'date' },
        'total_spend': { source: 'combined', field: 'totalSpend', type: 'number' },
        'total_sessions': { source: 'combined', field: 'totalSessions', type: 'number' }
      };

      const fieldInfo = fieldMapping[field];
      if (!fieldInfo) return null;

      const filter = {
        field: fieldInfo.field,
        operator,
        value,
        type: fieldInfo.type
      };

      return {
        source: fieldInfo.source,
        ...filter
      };
    }
  };

  const processedFilters = queryBuilderRule.rules.map(rule => processRule(rule)).filter(f => f);
  
  // Separar filtros por fonte de dados
  processedFilters.forEach(filter => {
    if (filter.source) {
      filters[filter.source].push(filter);
    } else if (filter.combinator) {
      filters.combined.push(filter);
    }
  });

  return filters;
};

// Aplicar filtros Meta Ads
const applyMetaFilters = (insights, filters) => {
  if (!filters || filters.length === 0) return insights;

  return insights.filter(insight => {
    return filters.every(filter => {
      const value = insight[filter.field];
      const filterValue = filter.type === 'number' ? parseFloat(filter.value) : filter.value;

      switch (filter.operator) {
        case '=':
          return value == filterValue;
        case '!=':
          return value != filterValue;
        case '>':
          return parseFloat(value) > filterValue;
        case '>=':
          return parseFloat(value) >= filterValue;
        case '<':
          return parseFloat(value) < filterValue;
        case '<=':
          return parseFloat(value) <= filterValue;
        case 'contains':
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'beginsWith':
          return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
        case 'endsWith':
          return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
        default:
          return true;
      }
    });
  });
};

// Aplicar filtros Google Analytics
const applyGAFilters = (data, filters) => {
  if (!filters || filters.length === 0) return data;
  
  // Similar logic to Meta filters but adapted for GA data structure
  return data.filter(item => {
    return filters.every(filter => {
      const value = item[filter.field];
      const filterValue = filter.type === 'number' ? parseFloat(filter.value) : filter.value;

      switch (filter.operator) {
        case '=':
          return value == filterValue;
        case '!=':
          return value != filterValue;
        case '>':
          return parseFloat(value) > filterValue;
        case '>=':
          return parseFloat(value) >= filterValue;
        case '<':
          return parseFloat(value) < filterValue;
        case '<=':
          return parseFloat(value) <= filterValue;
        case 'contains':
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        default:
          return true;
      }
    });
  });
};

// Gerar relatório com filtros avançados
export const generateAdvancedReport = async (req, res) => {
  try {
    const { 
      reportType = 'combined', 
      startDate = '30daysAgo', 
      endDate = 'today',
      metaAccounts = '',
      gaAccounts = '',
      segmentation = {},
      simpleFilters = [],
      widgets = []
    } = req.body;

    console.log('📊 [generateAdvancedReport] Iniciando geração de relatório:', {
      reportType,
      startDate,
      endDate,
      simpleFilters: simpleFilters?.length || 0,
      widgets: widgets?.length || 0
    });

    const companyId = await resolveCompanyId(req);
    console.log('📊 [generateAdvancedReport] CompanyId resolvido:', companyId);
    
    const company = await Company.findById(companyId);

    if (!company) {
      console.error('❌ [generateAdvancedReport] Empresa não encontrada:', companyId);
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    console.log('✅ [generateAdvancedReport] Empresa encontrada:', company.name);

    // Preparar dados do relatório
    const reportData = {
      company: {
        id: company._id,
        name: company.name
      },
      summary: {
        totalSpend: 0,
        totalSessions: 0,
        activeCampaigns: 0,
        activeProperties: 0
      },
      metaAds: {
        accounts: [],
        campaigns: [],
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalReach: 0,
        avgCTR: 0,
        avgCPM: 0,
        // Novas métricas de conversão
        totalPurchases: 0,
        totalPurchaseValue: 0,
        totalAddToCart: 0,
        totalViewContent: 0,
        totalLeads: 0,
        totalInitiateCheckout: 0
      },
      googleAnalytics: {
        accounts: [],
        segments: [],
        totalSessions: 0,
        totalUsers: 0,
        totalPageviews: 0,
        avgSessionDuration: 0,
        bounceRate: 0
      },
      // 🔧 NOVO: Dados temporais
      temporal: {
        metaAds: [],
        googleAnalytics: [],
        combined: []
      },
      widgets: widgets, // Incluir configuração de widgets
      filters: {
        applied: simpleFilters,
        segmentation: segmentation
      },
      config: {
        reportType,
        startDate,
        endDate,
        generatedAt: new Date().toISOString()
      }
    };

    // Converter datas para formato ISO
    const sinceDate = convertDateToISO(startDate);
    const untilDate = convertDateToISO(endDate);

    // Processar filtros (priorizar simpleFilters)
    let processedFilters;
    if (simpleFilters && simpleFilters.length > 0) {
      processedFilters = processSimpleFilters(simpleFilters, reportType);
      console.log('📊 [generateAdvancedReport] Usando filtros simples:', processedFilters);
    } else {
      processedFilters = { meta: [], ga: [], combined: [] };
      console.log('📊 [generateAdvancedReport] Nenhum filtro aplicado');
    }

    // Processar contas Meta Ads se incluídas no relatório
    if (reportType === 'meta' || reportType === 'combined') {
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

          // Buscar insights detalhados com datas convertidas
          const insights = await account.getInsights([], {
            level: segmentation.metaLevel || 'campaign',
            time_range: { 
              since: sinceDate,
              until: untilDate
            },
            fields: [
              'campaign_name',
              'campaign_id',
              'spend',
              'impressions', 
              'clicks',
              'reach',
              'ctr',
              'cpm',
              'actions',  // Ações/Conversões
              'action_values',  // Valores das conversões
              'conversions',  // Conversões totais
              'conversion_values',  // Valores das conversões
              'cost_per_result'  // Custo por resultado
            ]
          });

          // 🔧 NOVO: Buscar dados temporais se necessário
          let temporalInsights = null;
          const needsTemporalData = widgets && widgets.some(w => w.isTemporalChart);
          
          if (needsTemporalData) {
            console.log('📅 [generateAdvancedReport] Buscando dados temporais para widgets...');
            try {
              temporalInsights = await account.getInsights([], {
                level: 'account',
                time_range: { 
                  since: sinceDate,
                  until: untilDate
                },
                time_increment: 1, // Dados diários
                fields: [
                  'spend',
                  'impressions', 
                  'clicks',
                  'reach',
                  'ctr',
                  'cpm',
                  'actions',
                  'action_values',
                  'conversions',
                  'conversion_values'
                ]
              });
              console.log('📅 [generateAdvancedReport] Dados temporais obtidos:', temporalInsights.length, 'registros');
            } catch (error) {
              console.error('❌ [generateAdvancedReport] Erro ao buscar dados temporais:', error);
            }
          }

          // Função para extrair métricas de conversão específicas
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

          // Aplicar filtros
          const filteredInsights = applyMetaFilters(insights, processedFilters.meta);

          filteredInsights.forEach(insight => {
            const campaignData = {
              accountId,
              accountName: metaAccount.accountName,
              campaignId: insight.campaign_id,
              campaignName: insight.campaign_name,
              spend: parseFloat(insight.spend) || 0,
              impressions: parseInt(insight.impressions) || 0,
              clicks: parseInt(insight.clicks) || 0,
              reach: parseInt(insight.reach) || 0,
              ctr: parseFloat(insight.ctr) || 0,
              cpm: parseFloat(insight.cpm) || 0,
              conversions: insight.conversions || 0,
              costPerResult: parseFloat(insight.cost_per_result) || 0,
              // Métricas de conversão específicas
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

            reportData.metaAds.campaigns.push(campaignData);
            reportData.metaAds.totalSpend += campaignData.spend;
            reportData.metaAds.totalImpressions += campaignData.impressions;
            reportData.metaAds.totalClicks += campaignData.clicks;
            reportData.metaAds.totalReach += campaignData.reach;
            
            // Somar métricas de conversão nos totais
            reportData.metaAds.totalPurchases = (reportData.metaAds.totalPurchases || 0) + campaignData.purchases;
            reportData.metaAds.totalPurchaseValue = (reportData.metaAds.totalPurchaseValue || 0) + campaignData.purchaseValue;
            reportData.metaAds.totalAddToCart = (reportData.metaAds.totalAddToCart || 0) + campaignData.addToCart;
            reportData.metaAds.totalViewContent = (reportData.metaAds.totalViewContent || 0) + campaignData.viewContent;
            reportData.metaAds.totalLeads = (reportData.metaAds.totalLeads || 0) + campaignData.leads;
            reportData.metaAds.totalInitiateCheckout = (reportData.metaAds.totalInitiateCheckout || 0) + campaignData.initiateCheckout;
          });

          // 🔧 NOVO: Processar dados temporais se disponíveis
          if (temporalInsights && temporalInsights.length > 0) {
            console.log('📅 [generateAdvancedReport] Processando dados temporais...');
            
            temporalInsights.forEach(temporalInsight => {
              const dateStart = temporalInsight.date_start;
              const dateStop = temporalInsight.date_stop;
              
              const temporalData = {
                accountId,
                accountName: metaAccount.accountName,
                date: dateStart, // Data no formato YYYY-MM-DD
                dateDisplay: new Date(dateStart).toLocaleDateString('pt-BR'), // Data formatada
                spend: parseFloat(temporalInsight.spend) || 0,
                impressions: parseInt(temporalInsight.impressions) || 0,
                clicks: parseInt(temporalInsight.clicks) || 0,
                reach: parseInt(temporalInsight.reach) || 0,
                ctr: parseFloat(temporalInsight.ctr) || 0,
                cpm: parseFloat(temporalInsight.cpm) || 0,
                // Métricas de conversão temporais
                purchases: extractConversionMetric(temporalInsight.actions, 'purchase'),
                purchaseValue: extractConversionValue(temporalInsight.action_values, 'purchase'),
                addToCart: extractConversionMetric(temporalInsight.actions, 'add_to_cart'),
                viewContent: extractConversionMetric(temporalInsight.actions, 'view_content'),
                leads: extractConversionMetric(temporalInsight.actions, 'lead'),
                initiateCheckout: extractConversionMetric(temporalInsight.actions, 'initiate_checkout'),
                conversions: temporalInsight.conversions ? parseFloat(temporalInsight.conversions) || 0 : 0
              };
              
              reportData.temporal.metaAds.push(temporalData);
            });
            
            console.log('📅 [generateAdvancedReport] Dados temporais processados:', reportData.temporal.metaAds.length, 'registros');
          }

        } catch (error) {
          console.error(`Error fetching Meta Ads data for account ${accountId}:`, error);
        }
      }
    }

    // Processar contas Google Analytics se incluídas no relatório
    if (reportType === 'ga' || reportType === 'combined') {
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
          const tempFilename = `report_${Date.now()}_${companyId}_${propertyId}.json`;
          const tempCredentialsFile = saveCredentialsFile(credentials, tempFilename);

          try {
            // Configurar cliente Google Analytics
            const analyticsDataClient = new BetaAnalyticsDataClient({
              keyFilename: tempCredentialsFile
            });

            // Definir dimensões baseadas na segmentação
            const dimensions = [];
            if (segmentation.gaDimensions) {
              segmentation.gaDimensions.forEach(dim => {
                dimensions.push({ name: dim });
              });
            }

            // Buscar dados segmentados com datas convertidas
            const [response] = await analyticsDataClient.runReport({
              property: `properties/${propertyId}`,
              dateRanges: [{ startDate: sinceDate, endDate: untilDate }],
              dimensions,
              metrics: [
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'activeUsers' }
              ]
            });

            if (response.rows && response.rows.length > 0) {
              const processedData = response.rows.map(row => ({
                propertyId,
                propertyName: gaAccount.propertyName,
                dimensions: row.dimensionValues ? row.dimensionValues.map(d => d.value) : [],
                sessions: parseInt(row.metricValues[0].value) || 0,
                pageviews: parseInt(row.metricValues[1].value) || 0,
                users: parseInt(row.metricValues[2].value) || 0,
                avgSessionDuration: 0,
                bounceRate: 0
              }));

              // Aplicar filtros
              const filteredData = applyGAFilters(processedData, processedFilters.ga);

              filteredData.forEach(data => {
                reportData.googleAnalytics.segments.push(data);
                reportData.googleAnalytics.totalSessions += data.sessions;
                reportData.googleAnalytics.totalUsers += data.users;
                reportData.googleAnalytics.totalPageviews += data.pageviews;
              });
            }

          } finally {
            removeCredentialsFile(tempCredentialsFile);
          }
        } catch (error) {
          console.error(`Error fetching Google Analytics data for property ${propertyId}:`, error);
        }
      }
    }

    // Calcular resumo e ROI
    reportData.summary.activeCampaigns = reportData.metaAds.campaigns.length;
    reportData.summary.totalSpend = reportData.metaAds.totalSpend;
    reportData.summary.totalSessions = reportData.googleAnalytics.totalSessions;
    
    if (reportData.summary.totalSpend > 0 && reportData.summary.totalSessions > 0) {
      reportData.summary.conversionRate = (reportData.summary.totalSessions / reportData.metaAds.totalClicks * 100) || 0;
      // ROI simplificado: (sessions - spend) / spend * 100
      reportData.summary.roi = ((reportData.summary.totalSessions * 10 - reportData.summary.totalSpend) / reportData.summary.totalSpend * 100) || 0;
    }

    res.json({
      status: 'success',
      data: reportData
    });

  } catch (error) {
    console.error('Generate advanced report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// Obter campos disponíveis para filtros
export const getAvailableFields = async (req, res) => {
  try {
    const fields = [
      // Meta Ads fields
      {
        name: 'meta_spend',
        label: 'Meta Ads - Gasto',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads'
      },
      {
        name: 'meta_impressions',
        label: 'Meta Ads - Impressões',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads'
      },
      {
        name: 'meta_clicks',
        label: 'Meta Ads - Cliques',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads'
      },
      {
        name: 'meta_ctr',
        label: 'Meta Ads - CTR (%)',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads'
      },
      {
        name: 'meta_cpm',
        label: 'Meta Ads - CPM',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads'
      },
      {
        name: 'meta_campaign_name',
        label: 'Meta Ads - Nome da Campanha',
        datatype: 'string',
        operators: ['=', '!=', 'contains', 'beginsWith', 'endsWith'],
        category: 'Meta Ads'
      },
      {
        name: 'meta_account_name',
        label: 'Meta Ads - Nome da Conta',
        datatype: 'string',
        operators: ['=', '!=', 'contains', 'beginsWith', 'endsWith'],
        category: 'Meta Ads'
      },
      
      // Meta Ads - Métricas de Conversão
      {
        name: 'meta_purchases',
        label: 'Meta Ads - Compras',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads Conversões'
      },
      {
        name: 'meta_purchase_value',
        label: 'Meta Ads - Valor das Compras',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads Conversões'
      },
      {
        name: 'meta_add_to_cart',
        label: 'Meta Ads - Adicionar ao Carrinho',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads Conversões'
      },
      {
        name: 'meta_view_content',
        label: 'Meta Ads - Visualizar Página',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads Conversões'
      },
      {
        name: 'meta_leads',
        label: 'Meta Ads - Leads',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads Conversões'
      },
      {
        name: 'meta_initiate_checkout',
        label: 'Meta Ads - Iniciar Checkout',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Meta Ads Conversões'
      },
      
      // Google Analytics fields
      {
        name: 'ga_sessions',
        label: 'GA - Sessões',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Google Analytics'
      },
      {
        name: 'ga_users',
        label: 'GA - Usuários',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Google Analytics'
      },
      {
        name: 'ga_pageviews',
        label: 'GA - Visualizações de Página',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Google Analytics'
      },
      {
        name: 'ga_bounce_rate',
        label: 'GA - Taxa de Rejeição (%)',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Google Analytics'
      },
      {
        name: 'ga_session_duration',
        label: 'GA - Duração Média da Sessão',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Google Analytics'
      },
      {
        name: 'ga_device_category',
        label: 'GA - Categoria do Dispositivo',
        datatype: 'string',
        operators: ['=', '!=', 'contains'],
        category: 'Google Analytics',
        values: ['desktop', 'mobile', 'tablet']
      },
      {
        name: 'ga_traffic_source',
        label: 'GA - Fonte de Tráfego',
        datatype: 'string',
        operators: ['=', '!=', 'contains', 'beginsWith', 'endsWith'],
        category: 'Google Analytics'
      },
      
      // Combined fields
      {
        name: 'date_range',
        label: 'Período',
        datatype: 'date',
        operators: ['=', '!=', '>', '>=', '<', '<=', 'between'],
        category: 'Geral'
      },
      {
        name: 'total_spend',
        label: 'Gasto Total',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Geral'
      },
      {
        name: 'total_sessions',
        label: 'Total de Sessões',
        datatype: 'number',
        operators: ['=', '!=', '>', '>=', '<', '<='],
        category: 'Geral'
      }
    ];

    res.json({
      status: 'success',
      data: { fields }
    });

  } catch (error) {
    console.error('Get available fields error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Obter relatórios pré-definidos
export const getPredefinedReports = async (req, res) => {
  try {
    const predefinedReports = [
      {
        id: 'performance_overview',
        name: 'Visão Geral de Performance',
        description: 'Relatório consolidado com principais métricas de Meta Ads e Google Analytics',
        category: 'Geral',
        config: {
          reportType: 'combined',
          defaultDateRange: '30daysAgo',
          queryBuilderRule: null,
          segmentation: {},
          charts: ['spend_overview', 'sessions_overview', 'roi_chart']
        }
      },
      {
        id: 'meta_campaigns_analysis',
        name: 'Análise de Campanhas Meta',
        description: 'Análise detalhada do desempenho das campanhas Meta Ads',
        category: 'Meta Ads',
        config: {
          reportType: 'meta',
          defaultDateRange: '30daysAgo',
          queryBuilderRule: null,
          segmentation: {
            metaLevel: 'campaign'
          },
          charts: ['campaign_performance', 'spend_by_campaign', 'ctr_analysis']
        }
      },
      {
        id: 'ga_traffic_analysis',
        name: 'Análise de Tráfego GA',
        description: 'Análise detalhada do tráfego e comportamento dos usuários',
        category: 'Google Analytics',
        config: {
          reportType: 'ga',
          defaultDateRange: '30daysAgo',
          queryBuilderRule: null,
          segmentation: {
            gaDimensions: ['deviceCategory', 'source']
          },
          charts: ['traffic_sources', 'device_breakdown', 'user_behavior']
        }
      },
      {
        id: 'roi_analysis',
        name: 'Análise de ROI',
        description: 'Análise de retorno sobre investimento com correlação Meta Ads e GA',
        category: 'Análise',
        config: {
          reportType: 'combined',
          defaultDateRange: '30daysAgo',
          queryBuilderRule: {
            combinator: 'and',
            rules: [
              {
                field: 'meta_spend',
                operator: '>',
                value: '0'
              },
              {
                field: 'ga_sessions',
                operator: '>',
                value: '0'
              }
            ]
          },
          segmentation: {
            metaLevel: 'campaign',
            gaDimensions: ['source']
          },
          charts: ['roi_by_campaign', 'cost_per_session', 'conversion_funnel']
        }
      },
      {
        id: 'high_performance_campaigns',
        name: 'Campanhas de Alto Desempenho',
        description: 'Campanhas com CTR acima da média e baixo CPM',
        category: 'Meta Ads',
        config: {
          reportType: 'meta',
          defaultDateRange: '30daysAgo',
          queryBuilderRule: {
            combinator: 'and',
            rules: [
              {
                field: 'meta_ctr',
                operator: '>',
                value: '1.5'
              },
              {
                field: 'meta_cpm',
                operator: '<',
                value: '20'
              }
            ]
          },
          segmentation: {
            metaLevel: 'campaign'
          },
          charts: ['top_campaigns', 'efficiency_metrics']
        }
      },
      {
        id: 'mobile_traffic_report',
        name: 'Relatório de Tráfego Mobile',
        description: 'Análise específica do tráfego mobile e performance',
        category: 'Google Analytics',
        config: {
          reportType: 'ga',
          defaultDateRange: '30daysAgo',
          queryBuilderRule: {
            combinator: 'and',
            rules: [
              {
                field: 'ga_device_category',
                operator: '=',
                value: 'mobile'
              }
            ]
          },
          segmentation: {
            gaDimensions: ['deviceCategory', 'operatingSystem']
          },
          charts: ['mobile_sessions', 'mobile_behavior', 'mobile_conversion']
        }
      }
    ];

    res.json({
      status: 'success',
      data: { reports: predefinedReports }
    });

  } catch (error) {
    console.error('Get predefined reports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Obter opções de segmentação disponíveis
export const getSegmentationOptions = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);

    const segmentationOptions = {
      metaAds: {
        levels: [
          { value: 'account', label: 'Por Conta' },
          { value: 'campaign', label: 'Por Campanha' },
          { value: 'adset', label: 'Por Conjunto de Anúncios' },
          { value: 'ad', label: 'Por Anúncio' }
        ],
        breakdowns: [
          { value: 'age', label: 'Idade' },
          { value: 'gender', label: 'Gênero' },
          { value: 'placement', label: 'Posicionamento' },
          { value: 'device_platform', label: 'Plataforma' },
          { value: 'publisher_platform', label: 'Rede Publicitária' }
        ]
      },
      googleAnalytics: {
        dimensions: [
          { value: 'deviceCategory', label: 'Categoria do Dispositivo' },
          { value: 'operatingSystem', label: 'Sistema Operacional' },
          { value: 'browser', label: 'Navegador' },
          { value: 'country', label: 'País' },
          { value: 'region', label: 'Região' },
          { value: 'city', label: 'Cidade' },
          { value: 'source', label: 'Fonte' },
          { value: 'medium', label: 'Meio' },
          { value: 'campaign', label: 'Campanha' },
          { value: 'landingPage', label: 'Página de Entrada' },
          { value: 'exitPage', label: 'Página de Saída' }
        ]
      },
      dateRanges: [
        { value: 'today', label: 'Hoje' },
        { value: 'yesterday', label: 'Ontem' },
        { value: '7daysAgo', label: 'Últimos 7 dias' },
        { value: '30daysAgo', label: 'Últimos 30 dias' },
        { value: '90daysAgo', label: 'Últimos 90 dias' },
        { value: 'thisMonth', label: 'Este mês' },
        { value: 'lastMonth', label: 'Mês passado' },
        { value: 'custom', label: 'Personalizado' }
      ]
    };

    res.json({
      status: 'success',
      data: segmentationOptions
    });

  } catch (error) {
    console.error('Get segmentation options error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
}; 