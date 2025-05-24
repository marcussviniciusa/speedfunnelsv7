import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleAuth } from 'google-auth-library';
import Company from '../models/Company.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Função para criptografar dados sensíveis
const encrypt = (text) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.CRYPTO_SECRET_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
};

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

// Adicionar conta Google Analytics
export const addGoogleAnalyticsAccount = async (req, res) => {
  try {
    const { propertyId, propertyName, serviceAccountEmail } = req.body || {};
    const credentialsFile = req.file;
    
    // Validações básicas
    if (!propertyId || !propertyName || !serviceAccountEmail || !credentialsFile) {
      return res.status(400).json({
        status: 'error',
        message: 'Property ID, nome, email do Service Account e arquivo de credenciais são obrigatórios'
      });
    }

    // Verificar se o usuário tem permissão para a empresa
    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.body.companyId || req.query.companyId;
      if (!companyId) {
        // Se super admin não especificou companyId, usar a primeira empresa ativa
        const firstCompany = await Company.findOne({ isActive: true }).select('_id');
        if (!firstCompany) {
          return res.status(400).json({
            status: 'error',
            message: 'Nenhuma empresa ativa encontrada. Crie uma empresa primeiro.'
          });
        }
        companyId = firstCompany._id;
      }
    } else {
      companyId = req.user.company._id;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Verificar se a propriedade já existe
    const existingAccount = company.googleAnalyticsAccounts.find(
      account => account.propertyId === propertyId
    );

    if (existingAccount) {
      return res.status(400).json({
        status: 'error',
        message: 'Esta propriedade Google Analytics já está vinculada à empresa'
      });
    }

    // Validar credenciais testando conexão com a API
    let tempCredentialsFile = null;
    try {
      // Parse das credenciais do arquivo enviado
      const credentialsBuffer = credentialsFile.buffer;
      const credentialsString = credentialsBuffer.toString('utf8');
      const credentials = JSON.parse(credentialsString);

      // Validar estrutura das credenciais
      if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Credenciais do Service Account inválidas. Verifique se o arquivo JSON está correto.'
        });
      }

      // Validar se o email do service account confere
      if (credentials.client_email !== serviceAccountEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'O email do Service Account no arquivo não confere com o informado no formulário.'
        });
      }

      // Salvar credenciais temporariamente para teste
      const tempFilename = `temp_${Date.now()}_${companyId}.json`;
      tempCredentialsFile = saveCredentialsFile(credentials, tempFilename);

      // Testar conexão com Google Analytics
      const analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: tempCredentialsFile
      });

      // Fazer uma consulta simples para testar
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'sessions' }],
        limit: 1
      });

      // Se chegou aqui, as credenciais são válidas
      // Criptografar credenciais
      const encryptedCredentials = encrypt(JSON.stringify(credentials));
      
      // Adicionar conta à empresa
      company.googleAnalyticsAccounts.push({
        propertyId,
        propertyName: propertyName.trim(),
        serviceAccountEmail: credentials.client_email,
        credentials: JSON.stringify(encryptedCredentials),
        lastSync: new Date()
      });

      await company.save();

      res.status(201).json({
        status: 'success',
        message: 'Conta Google Analytics adicionada com sucesso',
        data: {
          propertyId,
          propertyName: propertyName.trim(),
          serviceAccountEmail: credentials.client_email,
          testDataRows: response.rows?.length || 0
        }
      });
      
    } catch (apiError) {
      console.error('Google Analytics API Error:', apiError);
      
      let errorMessage = 'Erro ao conectar com Google Analytics';
      if (apiError.message?.includes('permission')) {
        errorMessage = 'Service Account não tem permissão para acessar esta propriedade';
      } else if (apiError.message?.includes('not found')) {
        errorMessage = 'Propriedade não encontrada';
      } else if (apiError.message?.includes('invalid')) {
        errorMessage = 'Credenciais inválidas';
      }
      
      return res.status(400).json({
        status: 'error',
        message: errorMessage,
        details: apiError.message
      });
    } finally {
      // Remover arquivo temporário
      if (tempCredentialsFile) {
        removeCredentialsFile(tempCredentialsFile);
      }
    }

  } catch (error) {
    console.error('Add Google Analytics account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Listar contas Google Analytics da empresa
export const getGoogleAnalyticsAccounts = async (req, res) => {
  try {
    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId || req.params.companyId;
      if (!companyId) {
        // Se não foi fornecido companyId, buscar a primeira empresa disponível
        const companies = await Company.find({}).limit(1);
        if (companies.length > 0) {
          companyId = companies[0]._id;
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'Nenhuma empresa encontrada no sistema'
          });
        }
      }
    } else {
      companyId = req.user.company._id;
    }

    const company = await Company.findById(companyId).select('name googleAnalyticsAccounts');
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Remover credenciais dos dados retornados
    const accounts = company.googleAnalyticsAccounts.map(account => ({
      _id: account._id,
      propertyId: account.propertyId,
      propertyName: account.propertyName,
      serviceAccountEmail: account.serviceAccountEmail,
      isActive: account.isActive,
      lastSync: account.lastSync,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    }));

    res.json({
      status: 'success',
      data: {
        company: {
          _id: company._id,
          name: company.name
        },
        accounts
      }
    });
  } catch (error) {
    console.error('Get Google Analytics accounts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar dados de uma propriedade Google Analytics
export const getAnalyticsData = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { 
      startDate = '30daysAgo',
      endDate = 'today',
      dimensions = 'date',
      metrics = 'sessions,users',
      limit = 100
    } = req.query;

    // Lista de métricas seguras do GA4 (evitar INVALID_ARGUMENT)
    const safeMetrics = [
      'sessions', 'activeUsers', 'screenPageViews', 'totalUsers',
      'newUsers', 'engagedSessions', 
      'userEngagementDuration', 'engagementRate'
    ];

    // Validar e filtrar métricas para evitar incompatibilidades
    const requestedMetrics = metrics.split(',').map(m => m.trim());
    const validMetrics = requestedMetrics.filter(metric => {
      if (safeMetrics.includes(metric)) {
        return true;
      } else {
        console.warn(`⚠️ Métrica não permitida removida: ${metric} (pode causar INVALID_ARGUMENT)`);
        return false;
      }
    });

    // Se nenhuma métrica válida, usar padrão seguro
    const metricNames = validMetrics.length > 0 ? validMetrics : ['sessions', 'users'];

    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId;
      if (!companyId) {
        // Se super admin não especificou companyId, usar a primeira empresa ativa
        const firstCompany = await Company.findOne({ isActive: true }).select('_id');
        if (!firstCompany) {
          return res.status(400).json({
            status: 'error',
            message: 'Nenhuma empresa ativa encontrada. Crie uma empresa primeiro.'
          });
        }
        companyId = firstCompany._id;
      }
    } else {
      companyId = req.user.company._id;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Buscar conta Google Analytics
    const gaAccount = company.googleAnalyticsAccounts.find(
      account => account.propertyId === propertyId && account.isActive
    );

    if (!gaAccount) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Google Analytics não encontrada ou inativa'
      });
    }

    // Descriptografar credenciais
    const encryptedData = JSON.parse(gaAccount.credentials);
    const credentials = JSON.parse(decrypt(encryptedData));

    // Salvar credenciais temporariamente
    const tempFilename = `temp_${Date.now()}_${companyId}_${propertyId}.json`;
    const tempCredentialsFile = saveCredentialsFile(credentials, tempFilename);

    try {
      // Configurar cliente Google Analytics
      const analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: tempCredentialsFile
      });

      // Converter strings de dimensões em arrays
      const dimensionNames = dimensions.split(',').map(d => d.trim());

      // Preparar parâmetros da consulta com métricas validadas
      const request = {
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensionNames.map(name => ({ name })),
        metrics: metricNames.map(name => ({ name })), // ✅ Usando apenas métricas seguras
        limit: parseInt(limit)
      };

      // Executar consulta
      const [response] = await analyticsDataClient.runReport(request);

      res.json({
        status: 'success',
        data: {
          propertyId,
          propertyName: gaAccount.propertyName,
          report: {
            dimensionHeaders: response.dimensionHeaders,
            metricHeaders: response.metricHeaders,
            rows: response.rows,
            rowCount: response.rowCount,
            totals: response.totals
          },
          parameters: {
            startDate,
            endDate,
            dimensions: dimensionNames,
            metrics: metricNames, // ✅ Retornar métricas realmente utilizadas
            limit: parseInt(limit)
          },
          validation: {
            requestedMetrics,
            validMetrics: metricNames,
            filteredCount: requestedMetrics.length - metricNames.length
          }
        }
      });

    } catch (error) {
      // 🔍 DIAGNÓSTICO ESPECIAL para propriedade 290353757
      if (propertyId === '290353757') {
        console.error(`🔍 DIAGNÓSTICO DETALHADO para propriedade ${propertyId}:`);
        console.error(`   📋 Nome da propriedade: ${gaAccount?.propertyName || 'N/A'}`);
        console.error(`   📧 Service Account: ${gaAccount?.serviceAccountEmail || 'N/A'}`);
        console.error(`   📅 Última sincronização: ${gaAccount?.lastSync || 'N/A'}`);
        console.error(`   🔑 Credenciais encontradas: ${gaAccount?.credentials ? 'SIM' : 'NÃO'}`);
        console.error(`   📊 Datas consultadas: ${startDate} até ${endDate}`);
        console.error(`   ⚙️ Métricas solicitadas: sessions, users, screenPageViews`);
        console.error(`   🚨 Tipo do erro: ${error.code || 'UNKNOWN'}`);
        console.error(`   📝 Mensagem completa: ${error.message}`);
        console.error(`   📚 Stack trace:`);
        console.error(error.stack);
        
        // Tentar descobrir mais detalhes sobre as credenciais
        try {
          const encryptedData = JSON.parse(gaAccount.credentials);
          const credentials = JSON.parse(decrypt(encryptedData));
          console.error(`   🔐 Project ID das credenciais: ${credentials.project_id || 'N/A'}`);
          console.error(`   👤 Client Email: ${credentials.client_email || 'N/A'}`);
          console.error(`   🆔 Client ID: ${credentials.client_id || 'N/A'}`);
          console.error(`   🔑 Tipo de conta: ${credentials.type || 'N/A'}`);
        } catch (credError) {
          console.error(`   ❌ Erro ao analisar credenciais: ${credError.message}`);
        }
      }
      
      console.error(`Error fetching Google Analytics data for property ${propertyId}:`, error);
      
      if (error.message?.includes('permission')) {
        return res.status(403).json({
          status: 'error',
          message: 'Service Account não tem permissão para acessar esta propriedade'
        });
      }
      
      if (error.message?.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Propriedade não encontrada'
        });
      }

      res.status(500).json({
        status: 'error',
        message: 'Erro ao buscar dados do Google Analytics',
        details: error.message
      });
    } finally {
      // Sempre remover arquivo temporário
      removeCredentialsFile(tempCredentialsFile);
    }

  } catch (error) {
    console.error('Get Analytics data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Remover conta Google Analytics
export const removeGoogleAnalyticsAccount = async (req, res) => {
  try {
    const { propertyId } = req.params;

    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.body.companyId || req.query.companyId;
      if (!companyId) {
        // Se super admin não especificou companyId, usar a primeira empresa ativa
        const firstCompany = await Company.findOne({ isActive: true }).select('_id');
        if (!firstCompany) {
          return res.status(400).json({
            status: 'error',
            message: 'Nenhuma empresa ativa encontrada. Crie uma empresa primeiro.'
          });
        }
        companyId = firstCompany._id;
      }
    } else {
      companyId = req.user.company._id;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Buscar e remover conta
    const accountIndex = company.googleAnalyticsAccounts.findIndex(
      account => account.propertyId === propertyId
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Google Analytics não encontrada'
      });
    }

    company.googleAnalyticsAccounts.splice(accountIndex, 1);
    await company.save();

    res.json({
      status: 'success',
      message: 'Conta Google Analytics removida com sucesso'
    });

  } catch (error) {
    console.error('Remove Google Analytics account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Testar conexão com conta Google Analytics
export const testGoogleAnalyticsConnection = async (req, res) => {
  try {
    const { propertyId } = req.params;

    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId;
      if (!companyId) {
        // Se super admin não especificou companyId, usar a primeira empresa ativa
        const firstCompany = await Company.findOne({ isActive: true }).select('_id');
        if (!firstCompany) {
          return res.status(400).json({
            status: 'error',
            message: 'Nenhuma empresa ativa encontrada. Crie uma empresa primeiro.'
          });
        }
        companyId = firstCompany._id;
      }
    } else {
      companyId = req.user.company._id;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Buscar conta Google Analytics
    const gaAccount = company.googleAnalyticsAccounts.find(
      account => account.propertyId === propertyId
    );

    if (!gaAccount) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Google Analytics não encontrada'
      });
    }

    // Descriptografar credenciais
    const encryptedData = JSON.parse(gaAccount.credentials);
    const credentials = JSON.parse(decrypt(encryptedData));

    // Salvar credenciais temporariamente
    const tempFilename = `test_${Date.now()}_${companyId}_${propertyId}.json`;
    const tempCredentialsFile = saveCredentialsFile(credentials, tempFilename);

    try {
      // Testar conexão
      const analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: tempCredentialsFile
      });

      // Fazer consulta simples para teste
      const [response] = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
        metrics: [{ name: 'sessions' }],
        limit: 1
      });

      // Atualizar lastSync
      gaAccount.lastSync = new Date();
      await company.save();

      res.json({
        status: 'success',
        message: 'Conexão estabelecida com sucesso',
        data: {
          propertyId,
          propertyName: gaAccount.propertyName,
          serviceAccountEmail: gaAccount.serviceAccountEmail,
          dataAvailable: response.rows?.length > 0,
          lastSync: gaAccount.lastSync
        }
      });

    } finally {
      // Sempre remover arquivo temporário
      removeCredentialsFile(tempCredentialsFile);
    }

  } catch (error) {
    console.error('Test Google Analytics connection error:', error);
    
    if (error.message?.includes('permission')) {
      return res.status(403).json({
        status: 'error',
        message: 'Service Account não tem permissão para acessar esta propriedade'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Erro ao testar conexão',
      details: error.message
    });
  }
};

// Diagnóstico avançado para propriedades GA4 problemáticas
export const diagnoseGAProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    console.log(`🔬 INICIANDO DIAGNÓSTICO COMPLETO PARA PROPRIEDADE ${propertyId}`);

    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId;
      if (!companyId) {
        const firstCompany = await Company.findOne({ isActive: true }).select('_id');
        if (!firstCompany) {
          return res.status(400).json({
            status: 'error',
            message: 'Nenhuma empresa ativa encontrada'
          });
        }
        companyId = firstCompany._id;
      }
    } else {
      companyId = req.user.company._id;
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    const gaAccount = company.googleAnalyticsAccounts.find(
      account => account.propertyId === propertyId
    );

    if (!gaAccount) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Google Analytics não encontrada'
      });
    }

    const diagnosticResults = {
      propertyId,
      propertyName: gaAccount.propertyName,
      serviceAccountEmail: gaAccount.serviceAccountEmail,
      isActive: gaAccount.isActive,
      lastSync: gaAccount.lastSync,
      tests: [],
      credentials: {},
      recommendations: []
    };

    console.log(`📋 Propriedade: ${gaAccount.propertyName}`);
    console.log(`📧 Service Account: ${gaAccount.serviceAccountEmail}`);
    console.log(`🔄 Ativa: ${gaAccount.isActive}`);

    // Teste 1: Validar estrutura das credenciais
    try {
      const encryptedData = JSON.parse(gaAccount.credentials);
      const credentials = JSON.parse(decrypt(encryptedData));
      
      diagnosticResults.credentials = {
        projectId: credentials.project_id,
        clientEmail: credentials.client_email,
        clientId: credentials.client_id,
        type: credentials.type,
        hasPrivateKey: !!credentials.private_key,
        privateKeyId: credentials.private_key_id
      };

      diagnosticResults.tests.push({
        name: 'Estrutura das Credenciais',
        status: 'success',
        message: 'Credenciais válidas encontradas'
      });

      console.log(`✅ Credenciais válidas: Project ID ${credentials.project_id}`);

      // Teste 2: Verificar Service Account específico
      if (credentials.client_email !== gaAccount.serviceAccountEmail) {
        diagnosticResults.tests.push({
          name: 'Consistência do Service Account',
          status: 'warning',
          message: `Email nas credenciais (${credentials.client_email}) difere do registrado (${gaAccount.serviceAccountEmail})`
        });
        diagnosticResults.recommendations.push('Verificar se o Service Account correto foi registrado');
      } else {
        diagnosticResults.tests.push({
          name: 'Consistência do Service Account',
          status: 'success',
          message: 'Service Account consistente'
        });
      }

      // Teste 3: Tentativas progressivas de consulta GA4
      const tempFilename = `diagnose_${Date.now()}_${propertyId}.json`;
      const tempCredentialsFile = saveCredentialsFile(credentials, tempFilename);

      try {
        const analyticsDataClient = new BetaAnalyticsDataClient({
          keyFilename: tempCredentialsFile
        });

        // Teste 3.1: Consulta mais simples possível
        console.log(`🧪 Teste 1: Consulta mínima (apenas sessions)`);
        try {
          const [response1] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
            metrics: [{ name: 'sessions' }],
            limit: 1
          });

          diagnosticResults.tests.push({
            name: 'Consulta Básica (sessions)',
            status: 'success',
            message: `Sucesso! ${response1.rows?.length || 0} linhas retornadas`,
            data: response1.rows?.[0]
          });
          console.log(`✅ Consulta básica funcionou!`);

        } catch (error1) {
          diagnosticResults.tests.push({
            name: 'Consulta Básica (sessions)',
            status: 'error',
            message: error1.message,
            errorCode: error1.code,
            details: error1.details
          });
          console.log(`❌ Consulta básica falhou: ${error1.message}`);
        }

        // Teste 3.2: Consulta com múltiplas métricas
        console.log(`🧪 Teste 2: Múltiplas métricas GA4`);
        try {
          const [response2] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
            metrics: [
              { name: 'sessions' },
              { name: 'users' },
              { name: 'screenPageViews' }
            ],
            limit: 5
          });

          diagnosticResults.tests.push({
            name: 'Múltiplas Métricas GA4',
            status: 'success',
            message: `Sucesso! ${response2.rows?.length || 0} linhas retornadas`,
            metrics: response2.metricHeaders?.map(h => h.name)
          });
          console.log(`✅ Múltiplas métricas funcionaram!`);

        } catch (error2) {
          diagnosticResults.tests.push({
            name: 'Múltiplas Métricas GA4',
            status: 'error',
            message: error2.message,
            errorCode: error2.code,
            details: error2.details
          });
          console.log(`❌ Múltiplas métricas falharam: ${error2.message}`);
        }

        // Teste 3.3: Consulta com dimensões
        console.log(`🧪 Teste 3: Consulta com dimensões`);
        try {
          const [response3] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'sessions' }],
            limit: 10
          });

          diagnosticResults.tests.push({
            name: 'Consulta com Dimensões',
            status: 'success',
            message: `Sucesso! ${response3.rows?.length || 0} linhas retornadas`,
            dimensions: response3.dimensionHeaders?.map(h => h.name)
          });
          console.log(`✅ Consulta com dimensões funcionou!`);

        } catch (error3) {
          diagnosticResults.tests.push({
            name: 'Consulta com Dimensões',
            status: 'error',
            message: error3.message,
            errorCode: error3.code,
            details: error3.details
          });
          console.log(`❌ Consulta com dimensões falhou: ${error3.message}`);
        }

        // Teste 3.4: Verificar se é propriedade GA4 ou Universal Analytics
        console.log(`🧪 Teste 4: Verificar tipo de propriedade`);
        try {
          // Tentar usar métrica específica do GA4
          const [response4] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '1daysAgo', endDate: 'today' }],
            metrics: [{ name: 'engagedSessions' }], // Métrica específica do GA4
            limit: 1
          });

          diagnosticResults.tests.push({
            name: 'Verificação GA4',
            status: 'success',
            message: 'Propriedade GA4 confirmada (métrica engagedSessions funcionou)'
          });
          console.log(`✅ Confirmado como propriedade GA4!`);

        } catch (error4) {
          if (error4.message?.includes('engagedSessions')) {
            diagnosticResults.tests.push({
              name: 'Verificação GA4',
              status: 'warning',
              message: 'Pode ser propriedade Universal Analytics ou GA4 com configuração diferente'
            });
            diagnosticResults.recommendations.push('Verificar se é realmente uma propriedade GA4 no Google Analytics');
          } else {
            diagnosticResults.tests.push({
              name: 'Verificação GA4',
              status: 'error',
              message: error4.message
            });
          }
        }

      } finally {
        removeCredentialsFile(tempCredentialsFile);
      }

    } catch (credError) {
      diagnosticResults.tests.push({
        name: 'Estrutura das Credenciais',
        status: 'error',
        message: credError.message
      });
      diagnosticResults.recommendations.push('Reenviar arquivo de credenciais válido do Service Account');
    }

    // Análise dos resultados e recomendações
    const errorTests = diagnosticResults.tests.filter(t => t.status === 'error');
    const successTests = diagnosticResults.tests.filter(t => t.status === 'success');
    
    if (errorTests.length === 0) {
      diagnosticResults.summary = {
        status: 'healthy',
        message: 'Todos os testes passaram com sucesso!'
      };
    } else if (successTests.length > 0) {
      diagnosticResults.summary = {
        status: 'partial',
        message: `${successTests.length} testes bem-sucedidos, ${errorTests.length} com problemas`
      };
    } else {
      diagnosticResults.summary = {
        status: 'critical',
        message: 'Todos os testes falharam - propriedade inacessível'
      };
    }

    // Recomendações específicas para problemas comuns
    if (errorTests.some(t => t.message?.includes('permission'))) {
      diagnosticResults.recommendations.push('Service Account não tem permissão - adicionar como usuário na propriedade GA4');
    }
    if (errorTests.some(t => t.message?.includes('INVALID_ARGUMENT'))) {
      diagnosticResults.recommendations.push('Verificar se a propriedade é GA4 (não Universal Analytics)');
      diagnosticResults.recommendations.push('Verificar se o ID da propriedade está correto');
    }
    if (errorTests.some(t => t.message?.includes('not found'))) {
      diagnosticResults.recommendations.push('Verificar se o ID da propriedade existe e está ativo');
    }

    console.log(`🏁 DIAGNÓSTICO CONCLUÍDO: ${diagnosticResults.summary.status}`);

    res.json({
      status: 'success',
      data: diagnosticResults
    });

  } catch (error) {
    console.error('Diagnose GA property error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao diagnosticar propriedade',
      details: error.message
    });
  }
}; 