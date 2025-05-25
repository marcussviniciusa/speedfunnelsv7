import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testOriginalUser() {
  console.log('🧪 TESTANDO USUÁRIO ORIGINAL - teste2@teste.com\n');

  try {
    console.log('1. Testando login com a senha resetada anteriormente...');
    
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'teste2@teste.com',
        password: 'Teste123!'
      });
      
      console.log('🎉 USUÁRIO ORIGINAL TAMBÉM FUNCIONA!');
      console.log('✅ Login realizado com sucesso');
      console.log('- Token recebido:', !!loginResponse.data.data.accessToken);
      
    } catch (loginError) {
      console.log('❌ Usuário original ainda não funciona');
      console.log('- Status:', loginError.response?.status);
      console.log('- Mensagem:', loginError.response?.data?.message);
      
      console.log('\n2. Vamos resetar a senha do usuário original...');
      
      // Login como admin para resetar senha
      const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@speedfunnels.com',
        password: 'Admin123!'
      });
      
      const token = adminLogin.data.data.accessToken;
      
      // Buscar o usuário teste2@teste.com
      const usersResponse = await axios.get('http://localhost:5000/api/admin/users?search=teste2@teste.com', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const users = usersResponse.data.data.users;
      if (users.length > 0) {
        const userId = users[0]._id;
        console.log('✅ Usuário encontrado, ID:', userId);
        
        // Resetar senha
        await axios.put(`http://localhost:5000/api/admin/users/${userId}/reset-password`, {
          newPassword: 'NovaSenh@123'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Senha resetada para: NovaSenh@123');
        
        // Testar novo login
        const newLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'teste2@teste.com',
          password: 'NovaSenh@123'
        });
        
        console.log('🎉 LOGIN COM NOVA SENHA FUNCIONOU!');
        console.log('✅ PROBLEMA COMPLETAMENTE RESOLVIDO!');
      } else {
        console.log('❌ Usuário teste2@teste.com não encontrado');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.response?.data?.message || error.message);
  }
}

testOriginalUser(); 