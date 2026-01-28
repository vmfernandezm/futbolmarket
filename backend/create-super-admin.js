import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const email = 'admin@futbolmarket.com';
    const password = 'Admin123456';
    const displayName = 'Super Admin';

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ El usuario ya existe. Actualizando rol...');
      
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'super_admin' }
      });

      console.log('✅ Usuario actualizado a super_admin');
      console.log('📧 Email:', updated.email);
      console.log('👤 Nombre:', updated.displayName);
      console.log('🔑 Rol:', updated.role);
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

    console.log('✅ Super Admin creado exitosamente!');
    console.log('');
    console.log('📧 Email:', user.email);
    console.log('🔒 Contraseña:', password);
    console.log('👤 Nombre:', user.displayName);
    console.log('🔑 Rol:', user.role);
    console.log('');
    console.log('🌐 Ahora puedes iniciar sesión en: http://localhost:5173/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
