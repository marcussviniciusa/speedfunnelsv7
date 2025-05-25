
import mongoose from 'mongoose';
import User from './src/models/User.js';

await mongoose.connect('mongodb://admin:Marcus1911Marcus@206.183.131.10:27017/speedfunnelsv7?authSource=admin');
const user = await User.findOne({ email: 'api-test@teste.com' });
if (user) {
  console.log('👤 Usuário encontrado no DB');
  console.log('🔐 Hash:', user.password.substring(0, 30) + '...');
  
  const testResults = [];
  const passwords = [
    'APITest123!',
    'APITest123!'.trim(),
    decodeURIComponent('APITest123!'),
    JSON.parse('"APITest123!"')
  ];
  
  for (const pass of passwords) {
    const result = await user.comparePassword(pass);
    testResults.push(`"${pass}": ${result ? 'VÁLIDA' : 'Inválida'}`);
  }
  
  console.log('🧪 Resultados dos testes:');
  testResults.forEach(r => console.log('- ' + r));
} else {
  console.log('❌ Usuário não encontrado no DB');
}
await mongoose.connection.close();
        