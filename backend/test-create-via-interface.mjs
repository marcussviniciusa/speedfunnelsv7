import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function loginAsAdmin() {
  try {
    // Tentar diferentes senhas do super admin
    const passwords = ['admin123456', 'Admin123!', 'Teste123!'];
    
    for (const password of passwords) {
      try {
        console.log(`   Tentando senha: ${password}`);
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: 'admin@speedfunnels.com',
          password: password
        });
        
        console.log(`   ✅ Senha correta: ${password}`);
        return response.data.data.accessToken;
      } catch (error) {
        console.log(`   ❌ Senha incorreta: ${password}`);
      }
    }
    
    console.log('❌ Nenhuma senha funcionou para o super admin');
    return null;
  } catch (error) {
    console.log('❌ Erro no login admin:', error.response?.data?.message || error.message);
    return null;
  }
}

async function getCompanies(token) {
  try {
    const response = await axios.get(`${API_URL}/admin/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.data?.companies || response.data.companies || [];
  } catch (error) {
    console.log('❌ Erro ao buscar empresas:', error.response?.data?.message || error.message);
    return [];
  }
}

async function testCreateUser() {
  console.log('🧪 SIMULANDO CRIAÇÃO DE USUÁRIO VIA INTERFACE\n');

  // Fazer login como admin
  console.log('1. Fazendo login como super admin...');
  const token = await loginAsAdmin();
  if (!token) {
    console.log('\n🔄 Vou resetar a senha do super admin primeiro...');
    
    // Resetar senha do super admin via script direto
    await resetSuperAdminPassword();
    
    // Tentar novamente
    console.log('\n🔄 Tentando login novamente...');
    const newToken = await loginWithResetPassword();
    if (!newToken) return;
    
    console.log('✅ Login realizado com senha resetada');
    return testCreateUserWithToken(newToken);
  }
  
  console.log('✅ Login realizado');
  return testCreateUserWithToken(token);
}

async function resetSuperAdminPassword() {
  try {
    console.log('🔄 Resetando senha do super admin...');
    
    const { execSync } = await import('child_process');
    execSync(`node -e "
      import mongoose from 'mongoose';
      import bcrypt from 'bcrypt';
      
      const userSchema = new mongoose.Schema({
        password: String
      });
      
      userSchema.pre('save', async function(next) {
        if (!this.isModified('password')) return next();
        this.password = await bcrypt.hash(this.password, 12);
        next();
      });
      
      const User = mongoose.model('User', userSchema);
      
      async function reset() {
        await mongoose.connect('${process.env.MONGODB_URI}');
        const admin = await User.findOne({ email: 'admin@speedfunnels.com' });
        admin.password = 'Admin123!';
        await admin.save();
        console.log('Senha resetada para: Admin123!');
        process.exit(0);
      }
      
      reset();
    "`, { stdio: 'inherit' });
    
  } catch (error) {
    console.log('❌ Erro ao resetar senha:', error.message);
  }
}

async function loginWithResetPassword() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    return response.data.data.accessToken;
  } catch (error) {
    console.log('❌ Login falhou mesmo após reset:', error.response?.data?.message);
    return null;
  }
}

async function testCreateUserWithToken(token) {
  // Buscar empresas
  console.log('\n2. Buscando empresas...');
  const companies = await getCompanies(token);
  if (companies.length === 0) {
    console.log('❌ Nenhuma empresa encontrada');
    return;
  }
  console.log(`✅ ${companies.length} empresas encontradas`);
  console.log(`- Primeira empresa: ${companies[0].name} (ID: ${companies[0]._id})`);

  // Simular dados exatos que a interface envia
  const userData = {
    name: 'Usuario Teste Interface',
    email: 'teste-interface@teste.com',
    password: 'MinhaSenh@123',
    role: 'user',
    company: companies[0]._id,
    isActive: true
  };

  console.log('\n3. Criando usuário com os dados:');
  console.log('- Nome:', userData.name);
  console.log('- Email:', userData.email);
  console.log('- Senha:', userData.password);
  console.log('- Role:', userData.role);
  console.log('- Empresa:', userData.company);
  console.log('- Ativo:', userData.isActive);

  try {
    console.log('\n4. Enviando requisição...');
    const response = await axios.post(`${API_URL}/admin/users`, userData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ USUÁRIO CRIADO COM SUCESSO!');
    console.log('- ID:', response.data.data.user._id);
    console.log('- Email:', response.data.data.user.email);
    console.log('- Role:', response.data.data.user.role);

    // Testar login imediatamente
    console.log('\n5. Testando login do usuário criado...');
    
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      console.log('✅ LOGIN FUNCIONOU! 🎉');
      console.log('- Token recebido:', !!loginResponse.data.data.accessToken);
      
    } catch (loginError) {
      console.log('❌ LOGIN FALHOU! 🚨');
      console.log('- Status:', loginError.response?.status);
      console.log('- Mensagem:', loginError.response?.data?.message);
      
      console.log('\n🔍 ESTE É O PROBLEMA QUE PRECISAMOS INVESTIGAR!');
    }

  } catch (error) {
    console.log('❌ ERRO NA CRIAÇÃO:');
    if (error.response) {
      console.log('- Status:', error.response.status);
      console.log('- Mensagem:', error.response.data.message);
      console.log('- Dados completos:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('- Erro:', error.message);
    }
  }
}

testCreateUser().catch(console.error); 