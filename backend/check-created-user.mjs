import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isActive: Boolean
}, { timestamps: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Buscar o último usuário criado
    const lastUser = await User.findOne({ 
      email: { $regex: /^debug-test-.*@teste\.com$/ }
    }).sort({ createdAt: -1 });
    
    if (!lastUser) {
      console.log('❌ Usuário de teste não encontrado');
      return;
    }

    console.log('\n👤 USUÁRIO ENCONTRADO:');
    console.log('- ID:', lastUser._id);
    console.log('- Nome:', lastUser.name);
    console.log('- Email:', lastUser.email);
    console.log('- Criado em:', lastUser.createdAt);
    console.log('- Password Hash:', lastUser.password);
    console.log('- Hash Length:', lastUser.password.length);
    console.log('- Hash starts with $2b$:', lastUser.password.startsWith('$2b$'));

    // Testar algumas senhas
    const testPasswords = [
      'DebugTest123!',
      'debugtest123!',
      'DEBUGTEST123!',
      'DebugTest123',
      'Test123!'
    ];

    console.log('\n🔍 TESTANDO SENHAS:');
    for (const password of testPasswords) {
      try {
        const isValid = await lastUser.comparePassword(password);
        console.log(`- "${password}": ${isValid ? '✅ VÁLIDA' : '❌ Inválida'}`);
        
        if (isValid) {
          console.log(`\n🎉 SENHA CORRETA ENCONTRADA: "${password}"`);
          break;
        }
      } catch (error) {
        console.log(`- "${password}": ❌ Erro - ${error.message}`);
      }
    }

    // Verificar se a hash parece válida
    console.log('\n🔬 ANÁLISE DA HASH:');
    const hashParts = lastUser.password.split('$');
    console.log('- Algoritmo:', hashParts[1] || 'N/A');
    console.log('- Salt rounds:', hashParts[2] || 'N/A');
    console.log('- Salt + Hash length:', hashParts[3]?.length || 'N/A');

    // Testar hash manual
    console.log('\n🧪 TESTE MANUAL DE HASH:');
    try {
      const manualHash = await bcrypt.hash('DebugTest123!', 12);
      console.log('- Hash manual criada');
      const manualTest = await bcrypt.compare('DebugTest123!', manualHash);
      console.log('- Teste manual:', manualTest ? '✅ PASSOU' : '❌ FALHOU');
      
      console.log('- Hash salva no DB:', lastUser.password.substring(0, 20) + '...');
      console.log('- Hash manual criada:', manualHash.substring(0, 20) + '...');
    } catch (error) {
      console.log('- Erro no teste manual:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkUser(); 