import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetTeste2() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const user = await User.findOne({ email: 'teste2@teste.com' });
    if (!user) {
      console.log('❌ Usuário teste2@teste.com não encontrado');
      return;
    }

    console.log('👤 Usuário encontrado:', user.name);
    console.log('📧 Email:', user.email);
    
    // Resetar senha com versão corrigida do bcrypt
    const newPassword = 'NovaSenh@123';
    user.password = newPassword;
    await user.save();
    
    console.log('✅ Senha resetada para:', newPassword);
    
    // Testar imediatamente
    const testResult = await user.comparePassword(newPassword);
    console.log('🧪 Teste da senha:', testResult ? '✅ FUNCIONOU' : '❌ FALHOU');
    
    if (testResult) {
      console.log('🎉 USUÁRIO teste2@teste.com CORRIGIDO!');
      console.log('📝 Nova senha:', newPassword);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.connection.close();
  }
}

resetTeste2(); 