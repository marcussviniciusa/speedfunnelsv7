import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: Boolean
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function resetAdminAndTest() {
  try {
    console.log('🔄 Resetando senha do super admin...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admin = await User.findOne({ email: 'admin@speedfunnels.com' });
    if (!admin) {
      console.log('❌ Super admin não encontrado');
      return;
    }
    
    admin.password = 'Admin123!';
    await admin.save();
    
    console.log('✅ Senha do super admin resetada para: Admin123!');
    
    // Testar login
    console.log('\n🔐 Testando login do super admin...');
    const testLogin = await admin.comparePassword('Admin123!');
    console.log('- Teste direto no DB:', testLogin ? '✅ PASSOU' : '❌ FALHOU');
    
    await mongoose.connection.close();
    
    // Testar via API
    console.log('\n🌐 Testando login via API...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@speedfunnels.com',
        password: 'Admin123!'
      });
      
      console.log('✅ Login via API funcionou!');
      const token = response.data.data.accessToken;
      
      // Agora testar criação de usuário
      await testCreateUser(token);
      
    } catch (error) {
      console.log('❌ Login via API falhou:', error.response?.data?.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function testCreateUser(token) {
  console.log('\n👥 Testando criação de usuário...');
  
  try {
    // Buscar empresas primeiro
    const companiesResponse = await axios.get('http://localhost:5000/api/admin/companies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const companies = companiesResponse.data.data?.companies || companiesResponse.data.companies || [];
    if (companies.length === 0) {
      console.log('❌ Nenhuma empresa encontrada');
      return;
    }
    
    console.log(`✅ ${companies.length} empresas encontradas`);
    
    // Dados do usuário a ser criado
    const timestamp = Date.now();
    const userData = {
      name: 'Usuario Debug Test',
      email: `debug-test-${timestamp}@teste.com`,
      password: 'DebugTest123!',
      role: 'user',
      company: companies[0]._id,
      isActive: true
    };
    
    console.log('📝 Criando usuário:', userData.email);
    console.log('🔑 Senha:', userData.password);
    
    // Criar usuário
    const createResponse = await axios.post('http://localhost:5000/api/admin/users', userData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('- ID:', createResponse.data.data.user._id);
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Testar login imediatamente
    console.log('\n🧪 Testando login do usuário criado...');
    
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: userData.email,
        password: userData.password
      });
      
      console.log('🎉 LOGIN FUNCIONOU! Problema RESOLVIDO!');
      
    } catch (loginError) {
      console.log('🚨 LOGIN FALHOU! Este é o problema!');
      console.log('- Status:', loginError.response?.status);
      console.log('- Mensagem:', loginError.response?.data?.message);
      
      console.log('\n📊 Verificando logs do backend...');
      console.log('(Verifique os logs do backend em tempo real)');
    }
    
  } catch (error) {
    console.log('❌ Erro na criação:', error.response?.data?.message || error.message);
  }
}

resetAdminAndTest(); 