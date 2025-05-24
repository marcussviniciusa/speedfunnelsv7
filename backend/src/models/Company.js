import mongoose from 'mongoose';

const metaAccountSchema = new mongoose.Schema({
  accountId: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const googleAnalyticsAccountSchema = new mongoose.Schema({
  propertyId: {
    type: String,
    required: true
  },
  propertyName: {
    type: String,
    required: true
  },
  viewId: {
    type: String, // Para GA3 (opcional)
    default: null
  },
  serviceAccountEmail: {
    type: String,
    required: true
  },
  credentials: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da empresa é obrigatório'],
    trim: true,
    maxlength: [200, 'Nome da empresa não pode ter mais de 200 caracteres']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  cnpj: {
    type: String,
    trim: true,
    default: null
  },
  email: {
    type: String,
    required: [true, 'Email da empresa é obrigatório'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  address: {
    street: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    zipCode: { type: String, default: null },
    country: { type: String, default: 'Brasil' }
  },
  metaAccounts: [metaAccountSchema],
  googleAnalyticsAccounts: [googleAnalyticsAccountSchema],
  settings: {
    timezone: {
      type: String,
      default: 'America/Sao_Paulo'
    },
    currency: {
      type: String,
      default: 'BRL'
    },
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Middleware para criar slug automaticamente
companySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    if (!this.slug || this.isModified('name')) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }
  next();
});

// Índices para performance
companySchema.index({ slug: 1 });
companySchema.index({ email: 1 });
companySchema.index({ 'metaAccounts.accountId': 1 });
companySchema.index({ 'googleAnalyticsAccounts.propertyId': 1 });
companySchema.index({ createdBy: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company; 