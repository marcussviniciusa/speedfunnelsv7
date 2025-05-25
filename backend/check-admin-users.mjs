import mongoose from 'mongoose';
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

const User = mongoose.model('User', userSchema);

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    const admins = await User.find({ 
      role: { $in: ['super_admin', 'admin'] }
    }).select('name email role isActive createdAt');
    
    console.log('\n📋 USUÁRIOS ADMINISTRATIVOS ENCONTRADOS:\n');
    
    if (admins.length === 0) {
      console.log('❌ Nenhum usuário admin encontrado');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   👑 Role: ${admin.role}`);
        console.log(`   🟢 Ativo: ${admin.isActive ? 'Sim' : 'Não'}`);
        console.log(`   📅 Criado: ${admin.createdAt.toLocaleDateString('pt-BR')}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkAdmins(); 