import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testeFinalCompleto() {
  console.log('🎯 TESTE FINAL COMPLETO - VERIFICAÇÃO GERAL\n');

  let sucessos = 0;
  let falhas = 0;

  // 1. Super Admin
  console.log('1️⃣ TESTANDO SUPER ADMIN...');
  try {
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    console.log('   ✅ Login super admin: SUCESSO');
    sucessos++;
    
    const token = adminLogin.data.data.accessToken;
    
    // Testar dashboard
    const dashboardConfigs = await axios.get('http://localhost:5000/api/dashboard/configs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Dashboard configs: SUCESSO');
    sucessos++;
    
    const dashboardData = await axios.get('http://localhost:5000/api/dashboard/data?startDate=30daysAgo&endDate=today', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('   ✅ Dashboard data: SUCESSO');
    sucessos++;
    
  } catch (error) {
    console.log('   ❌ Super admin:', error.response?.data?.message || error.message);
    falhas++;
  }

  // 2. Usuário Original
  console.log('\n2️⃣ TESTANDO USUÁRIO ORIGINAL (teste2@teste.com)...');
  try {
    const userLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'teste2@teste.com',
      password: 'NovaSenh@123'
    });
    
    console.log('   ✅ Login usuário original: SUCESSO');
    sucessos++;
    
    const userToken = userLogin.data.data.accessToken;
    
    // Testar dashboard do usuário
    const userDashboard = await axios.get('http://localhost:5000/api/dashboard/configs', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    console.log('   ✅ Dashboard usuário: SUCESSO');
    sucessos++;
    
  } catch (error) {
    console.log('   ❌ Usuário original:', error.response?.data?.message || error.message);
    falhas++;
  }

  // 3. Criação de Novo Usuário
  console.log('\n3️⃣ TESTANDO CRIAÇÃO DE NOVO USUÁRIO...');
  try {
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    const token = adminLogin.data.data.accessToken;
    
    // Buscar empresas
    const companiesResponse = await axios.get('http://localhost:5000/api/admin/companies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const companies = companiesResponse.data.data?.companies || companiesResponse.data.companies || [];
    
    // Criar usuário
    const timestamp = Date.now();
    const novoUsuario = {
      name: 'Usuário Teste Final',
      email: `testef-${timestamp}@teste.com`,
      password: 'TesteFinal123!',
      role: 'user',
      company: companies[0]._id,
      isActive: true
    };
    
    const createResponse = await axios.post('http://localhost:5000/api/admin/users', novoUsuario, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   ✅ Criação usuário: SUCESSO');
    sucessos++;
    
    // Testar login imediato
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const novoLogin = await axios.post('http://localhost:5000/api/auth/login', {
      email: novoUsuario.email,
      password: novoUsuario.password
    });
    
    console.log('   ✅ Login imediato: SUCESSO');
    sucessos++;
    
  } catch (error) {
    console.log('   ❌ Criação/Login novo usuário:', error.response?.data?.message || error.message);
    falhas++;
  }

  // 4. Resumo Final
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADO FINAL:');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📈 Taxa de sucesso: ${((sucessos / (sucessos + falhas)) * 100).toFixed(1)}%`);
  
  if (falhas === 0) {
    console.log('\n🎉🎉 TODOS OS PROBLEMAS FORAM RESOLVIDOS! 🎉🎉');
    console.log('✅ Sistema completamente funcional!');
  } else {
    console.log('\n⚠️ Ainda há problemas pendentes');
  }
  
  console.log('\n📋 CREDENCIAIS FUNCIONAIS:');
  console.log('Super Admin: admin@speedfunnels.com / Admin123!');
  console.log('Usuário: teste2@teste.com / NovaSenh@123');
}

testeFinalCompleto(); 