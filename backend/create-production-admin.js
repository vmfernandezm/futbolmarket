import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Usa la URL de la base de datos de producción
const DATABASE_URL = 'postgresql://futbolmarket_db_user:Uh8exUQNQXqKJy0F8GsrDbV6r5gsj2lt@dpg-d5tqm4qqcgvc73aesikg-a.virginia-postgres.render.com/futbolmarket_db';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

async function createProductionAdmin() {
  try {
    const email = 'admin@futbolmarket.com';
    const password = 'Admin123456';
    const displayName = 'Super Admin';

    console.log('🔗 Conectando a la base de datos de producción...');

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ El usuario ya existe en producción.');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Nombre:', existingUser.displayName);
      console.log('🔑 Rol:', existingUser.role);
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        role: 'super_admin'
      }
    });

    console.log('✅ Super Admin creado exitosamente en PRODUCCIÓN!');
    console.log('');
    console.log('📧 Email:', user.email);
    console.log('🔒 Contraseña:', password);
    console.log('👤 Nombre:', user.displayName);
    console.log('🔑 Rol:', user.role);
    console.log('');
    console.log('🌐 Ahora puedes iniciar sesión en: https://futbolmarket-1.onrender.com/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createProductionAdmin();
