import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Carregar variáveis de ambiente
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');

    // Verificar se já existe um super admin
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('Super admin já existe:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Dados do super admin
    const superAdminData = {
      name: 'Super Administrador',
      email: 'admin@speedfunnels.com',
      password: 'admin123456', // Senha temporária - deve ser alterada após primeiro login
      role: 'super_admin'
    };

    // Criar super admin
    const superAdmin = new User(superAdminData);
    await superAdmin.save();

    console.log('✅ Super admin criado com sucesso!');
    console.log('Email:', superAdminData.email);
    console.log('Senha temporária:', superAdminData.password);
    console.log('⚠️ IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar super admin:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSuperAdmin();
}

export default createSuperAdmin; 