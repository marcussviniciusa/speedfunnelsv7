import mongoose from 'mongoose';
import crypto from 'crypto';

const sharedReportSchema = new mongoose.Schema({
  // Identificador único para URL pública
  shareId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Empresa dona do relatório
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  
  // Dados do relatório (salvos em formato JSON)
  reportData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Configuração do relatório
  reportConfig: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Configurações de compartilhamento
  shareSettings: {
    // Título público do relatório
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    
    // Descrição opcional
    description: {
      type: String,
      maxlength: 1000
    },
    
    // Se está ativo ou foi desabilitado
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Se permite comentários públicos
    allowComments: {
      type: Boolean,
      default: false
    },
    
    // Se mostra informações da empresa
    showCompanyInfo: {
      type: Boolean,
      default: true
    },
    
    // Senha para acesso (opcional)
    password: {
      type: String,
      default: null
    },
    
    // Data de expiração (opcional)
    expiresAt: {
      type: Date,
      default: null
    },
    
    // Domínios permitidos (opcional, para restringir acesso)
    allowedDomains: [{
      type: String,
      lowercase: true
    }],
    
    // Se permite download do PDF
    allowPdfDownload: {
      type: Boolean,
      default: true
    },
    
    // Tema visual
    theme: {
      type: String,
      enum: ['light', 'dark', 'corporate'],
      default: 'light'
    },
    
    // Logo personalizado (URL)
    customLogo: {
      type: String,
      default: null
    }
  },
  
  // Estatísticas de acesso
  accessStats: {
    totalViews: {
      type: Number,
      default: 0
    },
    
    uniqueViewers: {
      type: Number,
      default: 0
    },
    
    lastAccessed: {
      type: Date,
      default: null
    },
    
    // IPs que acessaram (para contar únicos)
    viewerIPs: [{
      ip: String,
      firstAccess: Date,
      lastAccess: Date,
      views: { type: Number, default: 1 }
    }],
    
    // Países de acesso
    viewerCountries: [{
      country: String,
      views: { type: Number, default: 1 }
    }]
  },
  
  // Metadados
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Índices para performance
sharedReportSchema.index({ shareId: 1 });
sharedReportSchema.index({ companyId: 1, createdAt: -1 });
sharedReportSchema.index({ 'shareSettings.isActive': 1 });
sharedReportSchema.index({ 'shareSettings.expiresAt': 1 });

// Middleware para auto-expirar relatórios
sharedReportSchema.index({ 'shareSettings.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Método para gerar share ID único
sharedReportSchema.statics.generateShareId = function() {
  return crypto.randomBytes(16).toString('hex');
};

// Método para verificar se está expirado
sharedReportSchema.methods.isExpired = function() {
  if (!this.shareSettings.expiresAt) return false;
  return new Date() > this.shareSettings.expiresAt;
};

// Método para incrementar visualizações
sharedReportSchema.methods.incrementView = function(ip, country = null) {
  // Incrementar total
  this.accessStats.totalViews += 1;
  this.accessStats.lastAccessed = new Date();
  
  // Verificar se é IP único
  const existingIP = this.accessStats.viewerIPs.find(v => v.ip === ip);
  if (existingIP) {
    existingIP.views += 1;
    existingIP.lastAccess = new Date();
  } else {
    this.accessStats.viewerIPs.push({
      ip,
      firstAccess: new Date(),
      lastAccess: new Date(),
      views: 1
    });
    this.accessStats.uniqueViewers += 1;
  }
  
  // Adicionar país se fornecido
  if (country) {
    const existingCountry = this.accessStats.viewerCountries.find(c => c.country === country);
    if (existingCountry) {
      existingCountry.views += 1;
    } else {
      this.accessStats.viewerCountries.push({
        country,
        views: 1
      });
    }
  }
  
  return this.save();
};

// Virtual para URL pública
sharedReportSchema.virtual('publicUrl').get(function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `${baseUrl}/public/report/${this.shareId}`;
});

export default mongoose.model('SharedReport', sharedReportSchema); 