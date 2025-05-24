import { FacebookAdsApi, AdAccount, Campaign } from 'facebook-nodejs-business-sdk';
import Company from '../models/Company.js';
import crypto from 'crypto';

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
    throw new Error('Chave de criptografia foi alterada. Por favor, remova e adicione novamente suas contas do Meta Ads.');
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
    throw new Error('Chave de criptografia foi alterada. Por favor, remova e adicione novamente suas contas do Meta Ads.');
  }
};

// Adicionar conta Meta Ads
export const addMetaAccount = async (req, res) => {
  try {
    const { accountId, accountName, accessToken } = req.body;
    
    // Validações básicas
    if (!accountId || !accountName || !accessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'ID da conta, nome e token de acesso são obrigatórios'
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

    // Verificar se a conta já existe
    const existingAccount = company.metaAccounts.find(
      account => account.accountId === accountId
    );

    if (existingAccount) {
      return res.status(400).json({
        status: 'error',
        message: 'Esta conta Meta Ads já está vinculada à empresa'
      });
    }

    // Validar token de acesso testando conexão com a API
    try {
      FacebookAdsApi.init(accessToken);
      const account = new AdAccount(`act_${accountId}`);
      
      // Testar acesso básico
      const accountData = await account.read([AdAccount.Fields.name, AdAccount.Fields.account_status]);
      
      // Criptografar token de acesso
      const encryptedToken = encrypt(accessToken);
      
      // Adicionar conta à empresa
      company.metaAccounts.push({
        accountId,
        accountName: accountName.trim(),
        accessToken: JSON.stringify(encryptedToken),
        lastSync: new Date()
      });

      await company.save();

      res.status(201).json({
        status: 'success',
        message: 'Conta Meta Ads adicionada com sucesso',
        data: {
          accountId,
          accountName: accountName.trim(),
          accountStatus: accountData.account_status,
          actualName: accountData.name
        }
      });
      
    } catch (apiError) {
      console.error('Meta Ads API Error:', apiError);
      return res.status(400).json({
        status: 'error',
        message: 'Token de acesso inválido ou conta não encontrada',
        details: apiError.message
      });
    }

  } catch (error) {
    console.error('Add Meta account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Listar contas Meta Ads da empresa
export const getMetaAccounts = async (req, res) => {
  try {
    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId || req.params.companyId;
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

    const company = await Company.findById(companyId).select('name metaAccounts');
    
    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Remover tokens dos dados retornados
    const accounts = company.metaAccounts.map(account => ({
      _id: account._id,
      accountId: account.accountId,
      accountName: account.accountName,
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
    console.error('Get Meta accounts error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar campanhas de uma conta Meta Ads
export const getCampaigns = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { limit = 25, fields = 'basic' } = req.query;

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

    // Buscar conta Meta Ads
    const metaAccount = company.metaAccounts.find(
      account => account.accountId === accountId && account.isActive
    );

    if (!metaAccount) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Meta Ads não encontrada ou inativa'
      });
    }

    // Descriptografar token
    const encryptedData = JSON.parse(metaAccount.accessToken);
    const accessToken = decrypt(encryptedData);

    // Configurar API
    FacebookAdsApi.init(accessToken);
    const account = new AdAccount(`act_${accountId}`);

    // Definir campos baseado no parâmetro
    let campaignFields;
    switch (fields) {
      case 'detailed':
        campaignFields = [
          Campaign.Fields.id,
          Campaign.Fields.name,
          Campaign.Fields.status,
          Campaign.Fields.objective,
          Campaign.Fields.created_time,
          Campaign.Fields.updated_time,
          Campaign.Fields.start_time,
          Campaign.Fields.stop_time,
          Campaign.Fields.budget_rebalance_flag,
          Campaign.Fields.daily_budget,
          Campaign.Fields.lifetime_budget
        ];
        break;
      default:
        campaignFields = [
          Campaign.Fields.id,
          Campaign.Fields.name,
          Campaign.Fields.status,
          Campaign.Fields.objective
        ];
    }

    // Buscar campanhas
    const campaigns = await account.getCampaigns(campaignFields, {
      limit: parseInt(limit)
    });

    res.json({
      status: 'success',
      data: {
        accountId,
        accountName: metaAccount.accountName,
        campaigns: campaigns,
        totalCampaigns: campaigns.length
      }
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    
    if (error.message?.includes('Invalid OAuth access token')) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de acesso inválido ou expirado'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar campanhas',
      details: error.message
    });
  }
};

// Buscar insights de campanhas
export const getCampaignInsights = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { 
      dateRange = 'last_30_days',
      level = 'campaign',
      metrics = 'basic',
      campaignIds = null
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

    // Buscar conta Meta Ads
    const metaAccount = company.metaAccounts.find(
      account => account.accountId === accountId && account.isActive
    );

    if (!metaAccount) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Meta Ads não encontrada ou inativa'
      });
    }

    // Descriptografar token
    const encryptedData = JSON.parse(metaAccount.accessToken);
    const accessToken = decrypt(encryptedData);

    // Configurar API
    FacebookAdsApi.init(accessToken);
    const account = new AdAccount(`act_${accountId}`);

    // Definir métricas baseado no parâmetro
    let insightFields;
    switch (metrics) {
      case 'detailed':
        insightFields = [
          'campaign_id',
          'campaign_name',
          'impressions',
          'clicks',
          'spend',
          'ctr',
          'cpm',
          'cpp',
          'cost_per_result',
          'frequency',
          'reach',
          'actions',
          'conversions',
          'cost_per_conversion'
        ];
        break;
      default:
        insightFields = [
          'campaign_id',
          'campaign_name',
          'impressions',
          'clicks',
          'spend',
          'ctr',
          'cpm'
        ];
    }

    // Configurar parâmetros de insights
    const insightParams = {
      level: level,
      time_range: { date_preset: dateRange },
      fields: insightFields
    };

    // Se campaignIds foi fornecido, filtrar por campanhas específicas
    if (campaignIds) {
      const campaignIdsArray = campaignIds.split(',').map(id => id.trim());
      insightParams.filtering = [{
        field: 'campaign.id',
        operator: 'IN',
        value: campaignIdsArray
      }];
    }

    // Buscar insights
    const insights = await account.getInsights([], insightParams);

    res.json({
      status: 'success',
      data: {
        accountId,
        accountName: metaAccount.accountName,
        insights: insights,
        parameters: {
          dateRange,
          level,
          metrics,
          totalResults: insights.length
        }
      }
    });

  } catch (error) {
    console.error('Get campaign insights error:', error);
    
    if (error.message?.includes('Invalid OAuth access token')) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de acesso inválido ou expirado'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar insights das campanhas',
      details: error.message
    });
  }
};

// Remover conta Meta Ads
export const removeMetaAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.body.companyId || req.query.companyId;
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

    // Buscar e remover conta
    const accountIndex = company.metaAccounts.findIndex(
      account => account.accountId === accountId
    );

    if (accountIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Meta Ads não encontrada'
      });
    }

    company.metaAccounts.splice(accountIndex, 1);
    await company.save();

    res.json({
      status: 'success',
      message: 'Conta Meta Ads removida com sucesso'
    });

  } catch (error) {
    console.error('Remove Meta account error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Testar conexão com conta Meta Ads
export const testMetaConnection = async (req, res) => {
  try {
    const { accountId } = req.params;

    let companyId;
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId;
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

    // Buscar conta Meta Ads
    const metaAccount = company.metaAccounts.find(
      account => account.accountId === accountId
    );

    if (!metaAccount) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta Meta Ads não encontrada'
      });
    }

    // Descriptografar token
    const encryptedData = JSON.parse(metaAccount.accessToken);
    const accessToken = decrypt(encryptedData);

    // Testar conexão
    FacebookAdsApi.init(accessToken);
    const account = new AdAccount(`act_${accountId}`);
    
    const accountData = await account.read([
      AdAccount.Fields.name,
      AdAccount.Fields.account_status,
      AdAccount.Fields.balance,
      AdAccount.Fields.currency,
      AdAccount.Fields.timezone_name
    ]);

    // Atualizar lastSync
    metaAccount.lastSync = new Date();
    await company.save();

    res.json({
      status: 'success',
      message: 'Conexão estabelecida com sucesso',
      data: {
        accountId,
        accountName: accountData.name,
        accountStatus: accountData.account_status,
        balance: accountData.balance,
        currency: accountData.currency,
        timezone: accountData.timezone_name,
        lastSync: metaAccount.lastSync
      }
    });

  } catch (error) {
    console.error('Test Meta connection error:', error);
    
    if (error.message?.includes('Invalid OAuth access token')) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de acesso inválido ou expirado'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Erro ao testar conexão',
      details: error.message
    });
  }
}; 