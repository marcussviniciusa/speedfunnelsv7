import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testDashboardFix() {
  console.log('🧪 TESTANDO CORREÇÃO DO DASHBOARD\n');

  try {
    // 1. Login como super admin
    console.log('1. Fazendo login como super admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login realizado com sucesso');

    // 2. Testar endpoint de configs
    console.log('\n2. Testando /api/dashboard/configs...');
    try {
      const configsResponse = await axios.get('http://localhost:5000/api/dashboard/configs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard configs funcionando!');
      console.log('- Status:', configsResponse.status);
      console.log('- Dados recebidos:', typeof configsResponse.data);
      
    } catch (configsError) {
      console.log('❌ Erro no dashboard/configs:');
      console.log('- Status:', configsError.response?.status);
      console.log('- Mensagem:', configsError.response?.data?.message);
    }

    // 3. Testar endpoint de data  
    console.log('\n3. Testando /api/dashboard/data...');
    try {
      const dataResponse = await axios.get('http://localhost:5000/api/dashboard/data?startDate=30daysAgo&endDate=today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Dashboard data funcionando!');
      console.log('- Status:', dataResponse.status);
      console.log('- Dados recebidos:', typeof dataResponse.data);
      
    } catch (dataError) {
      console.log('❌ Erro no dashboard/data:');
      console.log('- Status:', dataError.response?.status);
      console.log('- Mensagem:', dataError.response?.data?.message);
    }

    // 4. Testar com usuário normal
    console.log('\n4. Testando com usuário normal (teste2@teste.com)...');
    try {
      const userLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'teste2@teste.com',
        password: 'Teste123!'
      });
      
      const userToken = userLoginResponse.data.data.accessToken;
      console.log('✅ Login usuário normal realizado');

      // Testar dashboard com usuário normal
      const userConfigsResponse = await axios.get('http://localhost:5000/api/dashboard/configs', {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      console.log('✅ Dashboard configs para usuário normal funcionando!');
      console.log('- Status:', userConfigsResponse.status);
      
    } catch (userError) {
      console.log('❌ Erro com usuário normal:');
      console.log('- Status:', userError.response?.status);
      console.log('- Mensagem:', userError.response?.data?.message);
    }

    console.log('\n🎉 TESTE COMPLETO!');

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data?.message || error.message);
  }
}

testDashboardFix(); 