import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const email = 'user@futbolmarket.com';
    const password = 'user123456';
    const displayName = 'Usuario de Prueba';

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ El usuario ya existe.');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Nombre:', existingUser.displayName);
      console.log('🔑 Rol:', existingUser.role);
      console.log('🔒 Contraseña:', password);
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
        role: 'user'
      }
    });

    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log('');
    console.log('📧 Email:', user.email);
    console.log('🔒 Contraseña:', password);
    console.log('👤 Nombre:', user.displayName);
    console.log('🔑 Rol:', user.role);
    console.log('');
    console.log('🌐 Ahora puedes iniciar sesión en: http://localhost:5174/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
