import mongoose from 'mongoose';

const widgetSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['chart', 'metric', 'table', 'kpi'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true }, // width
    h: { type: Number, required: true }  // height
  },
  dataSource: {
    type: String,
    enum: ['meta_ads', 'google_analytics', 'combined'],
    required: true
  },
  accountIds: [{
    type: String
  }],
  metrics: [{
    name: { type: String, required: true },
    label: { type: String, required: true },
    source: { type: String, required: true }
  }],
  filters: {
    dateRange: {
      start: { type: Date, default: null },
      end: { type: Date, default: null },
      preset: { 
        type: String, 
        enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'custom'],
        default: 'last_30_days'
      }
    },
    campaigns: [{ type: String }],
    adSets: [{ type: String }],
    dimensions: [{ type: String }]
  },
  chartConfig: {
    chartType: {
      type: String,
      enum: ['line', 'bar', 'pie', 'doughnut', 'area'],
      default: 'line'
    },
    colors: [{ type: String }],
    showLegend: { type: Boolean, default: true },
    showGrid: { type: Boolean, default: true }
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const dashboardConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do dashboard é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isShared: {
    type: Boolean,
    default: false
  },
  widgets: [widgetSchema],
  layout: {
    cols: { type: Number, default: 12 },
    rowHeight: { type: Number, default: 150 },
    margin: {
      x: { type: Number, default: 10 },
      y: { type: Number, default: 10 }
    }
  },
  globalFilters: {
    dateRange: {
      start: { type: Date, default: null },
      end: { type: Date, default: null },
      preset: { 
        type: String, 
        enum: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'this_month', 'last_month', 'custom'],
        default: 'last_30_days'
      }
    },
    accounts: {
      metaAds: [{ type: String }],
      googleAnalytics: [{ type: String }]
    }
  },
  exportSettings: {
    includeLogo: { type: Boolean, default: true },
    includeFilters: { type: Boolean, default: true },
    includeTimestamp: { type: Boolean, default: true },
    format: {
      type: String,
      enum: ['A4', 'A3', 'Letter'],
      default: 'A4'
    },
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait'
    }
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware para garantir apenas um dashboard padrão por empresa
dashboardConfigSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('DashboardConfig').updateMany(
      { 
        company: this.company, 
        user: this.user,
        _id: { $ne: this._id }
      },
      { isDefault: false }
    );
  }
  next();
});

// Índices para performance
dashboardConfigSchema.index({ company: 1, user: 1 });
dashboardConfigSchema.index({ company: 1, isShared: 1 });
dashboardConfigSchema.index({ isDefault: 1 });

const DashboardConfig = mongoose.model('DashboardConfig', dashboardConfigSchema);

export default DashboardConfig; 