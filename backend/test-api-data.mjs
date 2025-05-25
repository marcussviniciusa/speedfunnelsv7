import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testAPIData() {
  try {
    console.log('🧪 TESTANDO DADOS VIA API\n');

    // Login como super admin
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado');

    // Buscar empresas
    const companiesResponse = await axios.get('http://localhost:5000/api/admin/companies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const companies = companiesResponse.data.data?.companies || companiesResponse.data.companies || [];
    console.log(`✅ ${companies.length} empresas encontradas`);

    // Dados exatos que vamos testar
    const testPassword = 'APITest123!';
    const userData = {
      name: 'API Test User',
      email: 'api-test@teste.com',
      password: testPassword,
      role: 'user',
      company: companies[0]._id,
      isActive: true
    };

    console.log('\n2. Dados que serão enviados via API:');
    console.log('- Password original:', JSON.stringify(testPassword));
    console.log('- Password length:', testPassword.length);
    console.log('- Password bytes:', [...testPassword].map(c => c.charCodeAt(0)).join(','));

    console.log('\n3. Criando usuário via API...');
    
    try {
      const createResponse = await axios.post('http://localhost:5000/api/admin/users', userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Usuário criado via API!');
      console.log('- ID:', createResponse.data.data.user._id);
      
      // Aguardar para garantir que foi salvo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n4. Testando login imediatamente...');
      
      try {
        const loginTestResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: userData.email,
          password: testPassword
        });
        
        console.log('🎉 LOGIN VIA API FUNCIONOU!');
        console.log('✅ PROBLEMA RESOLVIDO!');
        
      } catch (loginError) {
        console.log('❌ Login via API falhou');
        console.log('- Status:', loginError.response?.status);
        console.log('- Message:', loginError.response?.data?.message);
        
        console.log('\n5. Vamos verificar no banco de dados...');
        
        // Agora verificar diretamente no banco
        const verifyScript = `
import mongoose from 'mongoose';
import User from './src/models/User.js';

await mongoose.connect('${process.env.MONGODB_URI}');
const user = await User.findOne({ email: '${userData.email}' });
if (user) {
  console.log('👤 Usuário encontrado no DB');
  console.log('🔐 Hash:', user.password.substring(0, 30) + '...');
  
  const testResults = [];
  const passwords = [
    '${testPassword}',
    '${testPassword}'.trim(),
    decodeURIComponent('${testPassword}'),
    JSON.parse('"${testPassword}"')
  ];
  
  for (const pass of passwords) {
    const result = await user.comparePassword(pass);
    testResults.push(\`"\${pass}": \${result ? 'VÁLIDA' : 'Inválida'}\`);
  }
  
  console.log('🧪 Resultados dos testes:');
  testResults.forEach(r => console.log('- ' + r));
} else {
  console.log('❌ Usuário não encontrado no DB');
}
await mongoose.connection.close();
        `;
        
        // Salvar e executar script de verificação
        const fs = await import('fs');
        await fs.promises.writeFile('verify-api-user.mjs', verifyScript);
        
        const { execSync } = await import('child_process');
        execSync('node verify-api-user.mjs', { stdio: 'inherit' });
      }
      
    } catch (createError) {
      console.log('❌ Erro na criação via API:', createError.response?.data?.message || createError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAPIData(); 