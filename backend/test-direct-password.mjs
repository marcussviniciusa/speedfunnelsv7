import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Importar o modelo User real do projeto
import User from './src/models/User.js';

async function testDirectPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Testar criação direta de usuário
    const testPassword = 'DirectTest123!';
    
    console.log(`📝 Criando usuário diretamente com senha: "${testPassword}"`);
    
    const userData = {
      name: 'Direct Test User',
      email: 'direct-test@teste.com',
      password: testPassword,
      role: 'super_admin', // Para não precisar de empresa
      isActive: true
    };

    console.log('📤 Dados sendo enviados para o modelo:', {
      ...userData,
      password: `"${userData.password}" (${userData.password.length} chars)`
    });

    // Remover usuário se já existir
    await User.deleteOne({ email: userData.email });

    const user = new User(userData);
    
    console.log('\n🔄 Salvando usuário...');
    await user.save();
    
    console.log('✅ Usuário salvo com ID:', user._id);
    console.log('🔐 Hash final no DB:', user.password.substring(0, 30) + '...');

    // Testar senha imediatamente
    console.log('\n🧪 Testando senha após criação...');
    console.log(`🔑 Testando: "${testPassword}"`);
    
    const result = await user.comparePassword(testPassword);
    console.log('📊 Resultado:', result ? '✅ SUCESSO' : '❌ FALHA');

    if (result) {
      console.log('\n🎉 SENHA FUNCIONOU! O problema está na interface/API');
      
      // Testar algumas variações da senha
      const variations = [
        testPassword,
        testPassword.trim(),
        testPassword.replace(/\s+/g, ''),
        decodeURIComponent(testPassword),
        JSON.stringify(testPassword).slice(1, -1) // Remove aspas do JSON
      ];
      
      console.log('\n🔍 Testando variações da senha:');
      for (const variation of variations) {
        if (variation !== testPassword) {
          const varResult = await user.comparePassword(variation);
          console.log(`- "${variation}": ${varResult ? '✅ SUCESSO' : '❌ FALHA'}`);
        }
      }
      
    } else {
      console.log('\n🚨 PROBLEMA AINDA EXISTE NO MODELO!');
      
      // Debug mais profundo
      console.log('\n🔬 ANÁLISE PROFUNDA:');
      console.log('- Senha original:', JSON.stringify(testPassword));
      console.log('- Bytes da senha:', [...testPassword].map(c => c.charCodeAt(0)));
      console.log('- Length:', testPassword.length);
      console.log('- Type:', typeof testPassword);
      
      // Teste manual de hash
      console.log('\n🧪 TESTE MANUAL:');
      const manualHash = await bcrypt.hash(testPassword, 12);
      const manualTest = await bcrypt.compare(testPassword, manualHash);
      console.log('- Hash manual funciona:', manualTest ? '✅ SIM' : '❌ NÃO');
      
      // Comparar hashes
      console.log('- Hash do user:', user.password);
      console.log('- Hash manual: ', manualHash);
      console.log('- São iguais?:', user.password === manualHash ? '✅ SIM' : '❌ NÃO');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testDirectPassword(); 