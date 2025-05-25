import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testFinalDebug() {
  console.log('🔍 TESTE FINAL DE DEBUG DETALHADO\n');

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

    // Dados de teste com timestamp único
    const timestamp = Date.now();
    const plainPassword = 'FinalTest123!';
    
    const userData = {
      name: 'Final Debug User',
      email: `finaldebug-${timestamp}@test.com`,
      password: plainPassword,
      role: 'user',
      company: companies[0]._id,
      isActive: true
    };

    console.log('\n2. Enviando dados via API...');
    console.log('- Email:', userData.email);
    console.log('- Senha que estamos enviando:', JSON.stringify(plainPassword));
    console.log('- Charset da senha:', [...plainPassword].map(c => `${c}(${c.charCodeAt(0)})`).join(' '));

    console.log('\n3. Fazendo requisição... (verifique logs do backend)');
    
    try {
      const createResponse = await axios.post('http://localhost:5000/api/admin/users', userData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Usuário criado! ID:', createResponse.data.data.user._id);
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('\n4. Testando login...');
      
      try {
        const loginTestResponse = await axios.post('http://localhost:5000/api/auth/login', {
          email: userData.email,
          password: plainPassword
        });
        
        console.log('🎉 LOGIN FUNCIONOU! PROBLEMA RESOLVIDO!');
        
      } catch (loginError) {
        console.log('❌ Login falhou - vamos investigar no banco...');
        
        // Verificar diretamente no banco
        console.log('\n5. Verificando hash no banco...');
        await checkPasswordInDB(userData.email, plainPassword);
      }
      
    } catch (createError) {
      console.log('❌ Erro na criação:', createError.response?.data?.message || createError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function checkPasswordInDB(email, originalPassword) {
  const checkScript = `
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './src/models/User.js';

await mongoose.connect('${process.env.MONGODB_URI}');

const user = await User.findOne({ email: '${email}' });
if (user) {
  console.log('\\n👤 Usuário encontrado no banco:');
  console.log('- Hash completa:', user.password);
  console.log('- Hash length:', user.password.length);
  console.log('- Começa com $2b$:', user.password.startsWith('$2b$'));
  
  console.log('\\n🧪 Testando senhas diferentes:');
  
  const testPasswords = [
    '${originalPassword}',                    // Original
    '${originalPassword}'.trim(),           // Trimmed
    '${originalPassword}'.normalize(),      // Normalized
    Buffer.from('${originalPassword}', 'utf8').toString('utf8'), // Buffer round trip
    decodeURIComponent('${originalPassword}'), // URL decoded
    JSON.parse('"${originalPassword}"'),    // JSON parsed
    '${originalPassword}'.replace(/\\r\\n/g, '').replace(/\\n/g, '').replace(/\\r/g, '') // Remove line breaks
  ];
  
  for (const testPass of testPasswords) {
    try {
      const result = await user.comparePassword(testPass);
      console.log(\`- "\${testPass}": \${result ? '✅ VÁLIDA' : '❌ Inválida'}\`);
      if (result) {
        console.log('  🎯 SENHA CORRETA ENCONTRADA!');
        break;
      }
    } catch (err) {
      console.log(\`- "\${testPass}": ❌ ERRO - \${err.message}\`);
    }
  }
  
  // Teste manual de hash/compare
  console.log('\\n🔬 Teste manual de bcrypt:');
  const manualHash = await bcrypt.hash('${originalPassword}', 12);
  const manualTest = await bcrypt.compare('${originalPassword}', manualHash);
  console.log('- Hash manual funciona:', manualTest ? '✅ SIM' : '❌ NÃO');
  
  const compareWithSavedHash = await bcrypt.compare('${originalPassword}', user.password);
  console.log('- Compare com hash salva:', compareWithSavedHash ? '✅ SIM' : '❌ NÃO');
  
} else {
  console.log('❌ Usuário não encontrado no banco');
}

await mongoose.connection.close();
  `;
  
  const fs = await import('fs');
  await fs.promises.writeFile('check-password-final.mjs', checkScript);
  
  const { execSync } = await import('child_process');
  execSync('node check-password-final.mjs', { stdio: 'inherit' });
}

testFinalDebug(); 