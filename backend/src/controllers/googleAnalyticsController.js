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
    const { propertyId, propertyName, serviceAccountCredentials } = req.body;
    
    // Validações básicas
    if (!propertyId || !propertyName || !serviceAccountCredentials) {
      return res.status(400).json({
        status: 'error',
        message: 'Property ID, nome e credenciais do Service Account são obrigatórios'
      });
    }

    // Verificar se o usuário tem permissão para a empresa
    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.body.companyId;
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
      // Parse das credenciais
      const credentials = typeof serviceAccountCredentials === 'string' 
        ? JSON.parse(serviceAccountCredentials) 
        : serviceAccountCredentials;

      // Validar estrutura das credenciais
      if (!credentials.client_email || !credentials.private_key || !credentials.project_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Credenciais do Service Account inválidas'
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

    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId;
      if (!companyId) {
        return res.status(400).json({
          status: 'error',
          message: 'ID da empresa é obrigatório para super admin'
        });
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

      // Converter strings de dimensões e métricas em arrays
      const dimensionNames = dimensions.split(',').map(d => d.trim());
      const metricNames = metrics.split(',').map(m => m.trim());

      // Preparar parâmetros da consulta
      const request = {
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: dimensionNames.map(name => ({ name })),
        metrics: metricNames.map(name => ({ name })),
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
            metrics: metricNames,
            limit: parseInt(limit)
          }
        }
      });

    } finally {
      // Sempre remover arquivo temporário
      removeCredentialsFile(tempCredentialsFile);
    }

  } catch (error) {
    console.error('Get Analytics data error:', error);
    
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
        return res.status(400).json({
          status: 'error',
          message: 'ID da empresa é obrigatório para super admin'
        });
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
        return res.status(400).json({
          status: 'error',
          message: 'ID da empresa é obrigatório para super admin'
        });
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