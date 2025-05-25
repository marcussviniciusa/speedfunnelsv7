import axios from 'axios';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Função para testar se o middleware condicional está funcionando
async function testMiddlewareIssue() {
  console.log('🧪 TESTANDO MIDDLEWARE ISSUE\n');

  try {
    // 1. Login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@speedfunnels.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Token obtido');

    // 2. Buscar empresas
    const companiesResponse = await axios.get('http://localhost:5000/api/admin/companies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const companies = companiesResponse.data.data?.companies || companiesResponse.data.companies || [];
    console.log(`✅ ${companies.length} empresas encontradas`);

    // 3. Testar com dados muito simples
    const simplestData = {
      name: 'Test Simple',
      email: 'simple@test.com',
      password: 'Test123!',
      role: 'user',
      company: companies[0]._id,
      isActive: true
    };

    console.log('\n2. Testando com dados mais simples...');
    console.log('- Senha original:', JSON.stringify(simplestData.password));
    console.log('- Bytes:', [...simplestData.password].map(c => c.charCodeAt(0)));
    console.log('- Encoding test:', encodeURIComponent(simplestData.password));

    // Teste 1: Dados exatamente como JSON
    console.log('\n3. Teste 1: POST com application/json...');
    try {
      const response1 = await axios.post('http://localhost:5000/api/admin/users', simplestData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Usuário criado!');
      
      // Testar login
      console.log('🧪 Testando login...');
      const loginTest = await axios.post('http://localhost:5000/api/auth/login', {
        email: simplestData.email,
        password: simplestData.password
      });
      
      console.log('🎉 LOGIN FUNCIONOU!');
      
    } catch (loginError) {
      console.log('❌ Login falhou:', loginError.response?.data?.message);
      
      // Vamos verificar o que foi salvo no banco
      console.log('\n🔍 Verificando dados no banco...');
      await verifyPasswordInDB(simplestData.email, simplestData.password);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Erro na requisição:', error.response.data);
    } else {
      console.log('❌ Erro geral:', error.message);
    }
  }
}

async function verifyPasswordInDB(email, originalPassword) {
  const verifyScript = `
import mongoose from 'mongoose';
import User from './src/models/User.js';

await mongoose.connect('${process.env.MONGODB_URI}');
const user = await User.findOne({ email: '${email}' });

if (user) {
  console.log('👤 Usuário encontrado');
  console.log('🔐 Hash salva:', user.password.substring(0, 30) + '...');
  
  // Testar a senha original
  const test1 = await user.comparePassword('${originalPassword}');
  console.log('🧪 Teste senha original:', test1 ? '✅ VÁLIDA' : '❌ Inválida');
  
  // Testar variações comuns de encoding
  const variations = [
    '${originalPassword}',
    decodeURIComponent('${originalPassword}'),
    '${originalPassword}'.trim(),
    JSON.parse('"${originalPassword}"'),
    Buffer.from('${originalPassword}', 'utf8').toString('utf8')
  ];
  
  console.log('🔬 Testando variações:');
  for (const variation of variations) {
    try {
      const result = await user.comparePassword(variation);
      console.log(\`- "\${variation}": \${result ? '✅' : '❌'}\`);
    } catch (err) {
      console.log(\`- "\${variation}": ❌ ERRO\`);
    }
  }
} else {
  console.log('❌ Usuário não encontrado');
}

await mongoose.connection.close();
  `;
  
  const fs = await import('fs');
  await fs.promises.writeFile('verify-middleware-password.mjs', verifyScript);
  
  const { execSync } = await import('child_process');
  execSync('node verify-middleware-password.mjs', { stdio: 'inherit' });
}

testMiddlewareIssue(); 