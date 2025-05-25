import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testBcryptFix() {
  console.log('🧪 TESTANDO APÓS CORREÇÃO DO BCRYPT\n');

  try {
    // Login
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Token obtido');

    // Buscar empresas
    const companiesResponse = await axios.get('http://localhost:5000/api/admin/companies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const companies = companiesResponse.data.data?.companies || companiesResponse.data.companies || [];
    console.log(`✅ ${companies.length} empresas encontradas`);

    // Email único com timestamp
    const timestamp = Date.now();
    const userData = {
      name: 'Bcrypt Fix Test',
      email: `bcryptfix-${timestamp}@test.com`,
      password: 'FixTest123!',
      role: 'user',
      company: companies[0]._id,
      isActive: true
    };

    console.log('\n2. Criando usuário com nova versão do bcrypt...');
    console.log('- Email:', userData.email);
    console.log('- Senha:', userData.password);

    try {
      const createResponse = await axios.post('http://localhost:5000/api/admin/users', userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Usuário criado!');
      console.log('- ID:', createResponse.data.data.user._id);
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\n3. Testando login imediatamente...');
      
      try {
        const loginTestResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: userData.email,
          password: userData.password
        });
        
        console.log('🎉🎉 LOGIN FUNCIONOU! PROBLEMA RESOLVIDO! 🎉🎉');
        console.log('✅ A correção da versão do bcrypt funcionou!');
        
        return true;
        
      } catch (loginError) {
        console.log('❌ Login ainda falha...');
        console.log('- Status:', loginError.response?.status);
        console.log('- Message:', loginError.response?.data?.message);
        
        console.log('\n🔍 Investigando mais...');
        return false;
      }
      
    } catch (createError) {
      console.log('❌ Erro na criação:', createError.response?.data?.message || createError.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return false;
  }
}

// Executar teste
testBcryptFix().then(success => {
  if (success) {
    console.log('\n🎯 SOLUÇÃO ENCONTRADA: Versão do bcrypt era incompatível!');
  } else {
    console.log('\n🔍 Problema ainda persiste - investigação necessária...');
  }
}); 