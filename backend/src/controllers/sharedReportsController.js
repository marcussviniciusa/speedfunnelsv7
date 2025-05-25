import SharedReport from '../models/SharedReport.js';
import Company from '../models/Company.js';
import { resolveCompanyId } from '../utils/companyResolver.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Criar novo compartilhamento de relatório
export const createSharedReport = async (req, res) => {
  try {
    const {
      reportData,
      reportConfig,
      shareSettings
    } = req.body;

    console.log('🔗 [createSharedReport] Criando relatório compartilhado');

    // Validações básicas
    if (!reportData || !reportConfig) {
      return res.status(400).json({
        status: 'error',
        message: 'Dados do relatório e configuração são obrigatórios'
      });
    }

    if (!shareSettings || !shareSettings.title) {
      return res.status(400).json({
        status: 'error',
        message: 'Título do compartilhamento é obrigatório'
      });
    }

    const companyId = await resolveCompanyId(req);
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({
        status: 'error',
        message: 'Empresa não encontrada'
      });
    }

    // Gerar ID único para compartilhamento
    let shareId;
    let existingShare;
    
    do {
      shareId = SharedReport.generateShareId();
      existingShare = await SharedReport.findOne({ shareId });
    } while (existingShare);

    // Criptografar senha se fornecida
    let hashedPassword = null;
    if (shareSettings.password) {
      hashedPassword = await bcrypt.hash(shareSettings.password, 10);
    }

    // Preparar configurações de compartilhamento
    const processedShareSettings = {
      ...shareSettings,
      password: hashedPassword,
      // Converter data de expiração se fornecida
      expiresAt: shareSettings.expiresAt ? new Date(shareSettings.expiresAt) : null
    };

    // Criar registro de compartilhamento
    const sharedReport = new SharedReport({
      shareId,
      companyId,
      reportData,
      reportConfig,
      shareSettings: processedShareSettings,
      createdBy: req.user.id,
      accessStats: {
        totalViews: 0,
        uniqueViewers: 0,
        lastAccessed: null,
        viewerIPs: [],
        viewerCountries: []
      }
    });

    await sharedReport.save();

    console.log('✅ [createSharedReport] Relatório compartilhado criado:', shareId);

    res.json({
      status: 'success',
      data: {
        shareId,
        publicUrl: sharedReport.publicUrl,
        shareSettings: processedShareSettings,
        createdAt: sharedReport.createdAt
      }
    });

  } catch (error) {
    console.error('❌ [createSharedReport] Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// Obter relatório público (sem autenticação)
export const getPublicReport = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { password } = req.body; // Para relatórios protegidos por senha
    
    console.log('👁️ [getPublicReport] Acessando relatório público:', shareId);

    const sharedReport = await SharedReport.findOne({ 
      shareId,
      'shareSettings.isActive': true 
    }).populate('companyId', 'name');

    if (!sharedReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Relatório não encontrado ou foi desativado'
      });
    }

    // Verificar se expirou
    if (sharedReport.isExpired()) {
      return res.status(410).json({
        status: 'error',
        message: 'Este relatório expirou'
      });
    }

    // Verificar senha se necessária
    if (sharedReport.shareSettings.password) {
      if (!password) {
        return res.status(401).json({
          status: 'error',
          message: 'Senha necessária',
          requiresPassword: true
        });
      }

      const validPassword = await bcrypt.compare(password, sharedReport.shareSettings.password);
      if (!validPassword) {
        return res.status(401).json({
          status: 'error',
          message: 'Senha incorreta'
        });
      }
    }

    // Verificar domínios permitidos
    if (sharedReport.shareSettings.allowedDomains && sharedReport.shareSettings.allowedDomains.length > 0) {
      const origin = req.get('Origin') || req.get('Referer');
      if (origin) {
        const domain = new URL(origin).hostname;
        const isAllowed = sharedReport.shareSettings.allowedDomains.some(allowed => 
          domain.includes(allowed) || allowed.includes(domain)
        );
        
        if (!isAllowed) {
          return res.status(403).json({
            status: 'error',
            message: 'Acesso não permitido deste domínio'
          });
        }
      }
    }

    // Registrar visualização (async para não impactar performance)
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    setImmediate(() => {
      sharedReport.incrementView(clientIP).catch(err => {
        console.error('Erro ao registrar visualização:', err);
      });
    });

    // Preparar dados para retorno
    const responseData = {
      shareId,
      title: sharedReport.shareSettings.title,
      description: sharedReport.shareSettings.description,
      reportData: sharedReport.reportData,
      reportConfig: sharedReport.reportConfig,
      shareSettings: {
        showCompanyInfo: sharedReport.shareSettings.showCompanyInfo,
        allowComments: sharedReport.shareSettings.allowComments,
        allowPdfDownload: sharedReport.shareSettings.allowPdfDownload,
        theme: sharedReport.shareSettings.theme,
        customLogo: sharedReport.shareSettings.customLogo
      },
      company: sharedReport.shareSettings.showCompanyInfo ? {
        name: sharedReport.companyId?.name
      } : null,
      createdAt: sharedReport.createdAt,
      accessStats: {
        totalViews: sharedReport.accessStats.totalViews,
        lastAccessed: sharedReport.accessStats.lastAccessed
      }
    };

    res.json({
      status: 'success',
      data: responseData
    });

  } catch (error) {
    console.error('❌ [getPublicReport] Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Listar relatórios compartilhados da empresa
export const listSharedReports = async (req, res) => {
  try {
    const companyId = await resolveCompanyId(req);
    const { page = 1, limit = 10, status = 'all' } = req.query;

    console.log('📋 [listSharedReports] Listando relatórios compartilhados:', companyId);

    // Filtros
    const filters = { companyId };
    
    if (status === 'active') {
      filters['shareSettings.isActive'] = true;
    } else if (status === 'inactive') {
      filters['shareSettings.isActive'] = false;
    }

    // Buscar com paginação
    const skip = (page - 1) * limit;
    const sharedReports = await SharedReport
      .find(filters)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SharedReport.countDocuments(filters);

    // Preparar dados de resposta
    const reportsData = sharedReports.map(report => ({
      id: report._id,
      shareId: report.shareId,
      publicUrl: report.publicUrl,
      title: report.shareSettings.title,
      description: report.shareSettings.description,
      isActive: report.shareSettings.isActive,
      isExpired: report.isExpired(),
      hasPassword: !!report.shareSettings.password,
      expiresAt: report.shareSettings.expiresAt,
      theme: report.shareSettings.theme,
      accessStats: report.accessStats,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }));

    res.json({
      status: 'success',
      data: {
        reports: reportsData,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          count: reportsData.length,
          totalRecords: total
        }
      }
    });

  } catch (error) {
    console.error('❌ [listSharedReports] Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar configurações de compartilhamento
export const updateSharedReport = async (req, res) => {
  try {
    const { shareId } = req.params;
    const { shareSettings } = req.body;

    console.log('✏️ [updateSharedReport] Atualizando relatório compartilhado:', shareId);

    const companyId = await resolveCompanyId(req);

    const sharedReport = await SharedReport.findOne({ 
      shareId,
      companyId
    });

    if (!sharedReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Relatório compartilhado não encontrado'
      });
    }

    // Criptografar nova senha se fornecida
    if (shareSettings.password && shareSettings.password !== '***') {
      shareSettings.password = await bcrypt.hash(shareSettings.password, 10);
    } else if (shareSettings.password === null) {
      shareSettings.password = null;
    } else {
      // Manter senha atual se não foi alterada
      delete shareSettings.password;
    }

    // Converter data de expiração
    if (shareSettings.expiresAt) {
      shareSettings.expiresAt = new Date(shareSettings.expiresAt);
    }

    // Atualizar configurações
    Object.assign(sharedReport.shareSettings, shareSettings);
    sharedReport.updatedBy = req.user.id;

    await sharedReport.save();

    res.json({
      status: 'success',
      data: {
        shareId,
        shareSettings: sharedReport.shareSettings,
        updatedAt: sharedReport.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ [updateSharedReport] Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar relatório compartilhado
export const deleteSharedReport = async (req, res) => {
  try {
    const { shareId } = req.params;
    const companyId = await resolveCompanyId(req);

    console.log('🗑️ [deleteSharedReport] Removendo relatório compartilhado:', shareId);

    const result = await SharedReport.findOneAndDelete({ 
      shareId,
      companyId
    });

    if (!result) {
      return res.status(404).json({
        status: 'error',
        message: 'Relatório compartilhado não encontrado'
      });
    }

    res.json({
      status: 'success',
      message: 'Relatório compartilhado removido com sucesso'
    });

  } catch (error) {
    console.error('❌ [deleteSharedReport] Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Obter estatísticas detalhadas de um relatório
export const getReportStats = async (req, res) => {
  try {
    const { shareId } = req.params;
    const companyId = await resolveCompanyId(req);

    const sharedReport = await SharedReport.findOne({ 
      shareId,
      companyId
    });

    if (!sharedReport) {
      return res.status(404).json({
        status: 'error',
        message: 'Relatório compartilhado não encontrado'
      });
    }

    // Preparar estatísticas detalhadas
    const stats = {
      basic: {
        totalViews: sharedReport.accessStats.totalViews,
        uniqueViewers: sharedReport.accessStats.uniqueViewers,
        lastAccessed: sharedReport.accessStats.lastAccessed,
        createdAt: sharedReport.createdAt
      },
      viewsByCountry: sharedReport.accessStats.viewerCountries,
      topViewers: sharedReport.accessStats.viewerIPs
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)
        .map(viewer => ({
          ip: viewer.ip,
          views: viewer.views,
          firstAccess: viewer.firstAccess,
          lastAccess: viewer.lastAccess
        })),
      dailyViews: await getDailyViewStats(shareId, 30) // Últimos 30 dias
    };

    res.json({
      status: 'success',
      data: stats
    });

  } catch (error) {
    console.error('❌ [getReportStats] Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro interno do servidor'
    });
  }
};

// Função auxiliar para estatísticas diárias
const getDailyViewStats = async (shareId, days) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aqui você pode implementar uma agregação mais sofisticada
    // Por simplicidade, vamos retornar dados básicos
    return [];
  } catch (error) {
    console.error('Erro ao obter estatísticas diárias:', error);
    return [];
  }
}; 