
import mongoose from 'mongoose';
import User from './src/models/User.js';

await mongoose.connect('mongodb://admin:Marcus1911Marcus@206.183.131.10:27017/speedfunnelsv7?authSource=admin');
const user = await User.findOne({ email: 'simple@test.com' });

if (user) {
  console.log('👤 Usuário encontrado');
  console.log('🔐 Hash salva:', user.password.substring(0, 30) + '...');
  
  // Testar a senha original
  const test1 = await user.comparePassword('Test123!');
  console.log('🧪 Teste senha original:', test1 ? '✅ VÁLIDA' : '❌ Inválida');
  
  // Testar variações comuns de encoding
  const variations = [
    'Test123!',
    decodeURIComponent('Test123!'),
    'Test123!'.trim(),
    JSON.parse('"Test123!"'),
    Buffer.from('Test123!', 'utf8').toString('utf8')
  ];
  
  console.log('🔬 Testando variações:');
  for (const variation of variations) {
    try {
      const result = await user.comparePassword(variation);
      console.log(`- "${variation}": ${result ? '✅' : '❌'}`);
    } catch (err) {
      console.log(`- "${variation}": ❌ ERRO`);
    }
  }
} else {
  console.log('❌ Usuário não encontrado');
}

await mongoose.connection.close();
  