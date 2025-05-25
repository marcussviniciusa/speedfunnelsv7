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
  
  console.log('🔐 [PRE-SAVE] Senha recebida:', this.password);
  console.log('🔐 [PRE-SAVE] Tipo:', typeof this.password);
  console.log('🔐 [PRE-SAVE] Length:', this.password.length);
  console.log('🔐 [PRE-SAVE] Primeira parte:', this.password.substring(0, 5));
  
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  console.log('🔐 [PRE-SAVE] Salt rounds:', saltRounds);
  
  this.password = await bcrypt.hash(this.password, saltRounds);
  
  console.log('🔐 [PRE-SAVE] Hash criada:', this.password.substring(0, 20) + '...');
  console.log('🔐 [PRE-SAVE] Hash length:', this.password.length);
  
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('🔍 [COMPARE] Senha candidata:', candidatePassword);
  console.log('🔍 [COMPARE] Hash salva:', this.password.substring(0, 20) + '...');
  
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('🔍 [COMPARE] Resultado:', result);
  
  return result;
};

const User = mongoose.model('User', userSchema);

async function debugPasswordFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Login como super admin
    console.log('\n1. Fazendo login como super admin...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    const token = response.data.data.accessToken;
    console.log('✅ Login realizado');

    // Buscar empresas
    const companiesResponse = await axios.get('http://localhost:5000/api/admin/companies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const companies = companiesResponse.data.data?.companies || companiesResponse.data.companies || [];
    console.log(`✅ ${companies.length} empresas encontradas`);

    // Criar usuário de debug
    const timestamp = Date.now();
    const testPassword = 'DebugFlow123!';
    
    const userData = {
      name: 'Debug Flow User',
      email: `debug-flow-${timestamp}@teste.com`,
      password: testPassword,
      role: 'user',
      company: companies[0]._id,
      isActive: true
    };

    console.log(`\n2. Criando usuário com senha: "${testPassword}"`);
    console.log('📝 Email:', userData.email);

    // Criar usuário via API
    try {
      const createResponse = await axios.post('http://localhost:5000/api/admin/users', userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Usuário criado com sucesso!');
      const userId = createResponse.data.data.user._id;
      
      // Aguardar um pouco para garantir que salvou
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('\n3. Verificando usuário no banco...');
      const userInDB = await User.findById(userId);
      
      if (userInDB) {
        console.log('✅ Usuário encontrado no banco');
        console.log('- Hash:', userInDB.password.substring(0, 20) + '...');
        
        console.log('\n4. Testando senha diretamente no banco...');
        const dbTest = await userInDB.comparePassword(testPassword);
        console.log('- Resultado direto no DB:', dbTest ? '✅ PASSOU' : '❌ FALHOU');
        
        if (dbTest) {
          console.log('\n5. Testando login via API...');
          try {
            const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
              email: userData.email,
              password: testPassword
            });
            
            console.log('🎉 LOGIN VIA API FUNCIONOU!');
            console.log('✅ PROBLEMA RESOLVIDO!');
            
          } catch (loginError) {
            console.log('❌ Login via API falhou:', loginError.response?.data?.message);
            console.log('🤔 Problema pode estar no controller de login');
          }
        } else {
          console.log('❌ Senha não confere no banco - problema no hash');
        }
      }
      
    } catch (createError) {
      console.log('❌ Erro na criação:', createError.response?.data?.message || createError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

debugPasswordFlow(); 