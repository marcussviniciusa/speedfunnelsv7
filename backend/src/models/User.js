import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'user'],
    default: 'user'
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: function() {
      return this.role !== 'super_admin';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Telefone não pode ter mais de 20 caracteres']
  },
  avatar: {
    type: String,
    trim: true
  },
  preferences: {
    notifications: {
      emailReports: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      alertsThreshold: { type: Boolean, default: true }
    },
    general: {
      language: { type: String, default: 'pt-BR' },
      timezone: { type: String, default: 'America/Sao_Paulo' },
      darkMode: { type: Boolean, default: false },
      autoRefresh: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true
});

// Hash da senha antes de salvar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para obter dados do usuário sem a senha
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  return userObject;
};

// Índices para performance
userSchema.index({ email: 1 });
userSchema.index({ company: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export default User; 