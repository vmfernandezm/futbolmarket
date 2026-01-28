import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createStoreOwner() {
  try {
    const email = 'dueno@futbolmarket.com';
    const password = 'Dueno123456';
    const displayName = 'Juan Pérez - Dueño';

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ El usuario ya existe. Actualizando rol...');
      
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'store_owner' }
      });

      console.log('✅ Usuario actualizado a store_owner');
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
        role: 'store_owner'
      }
    });

    console.log('✅ Store Owner (Dueño) creado exitosamente!');
    console.log('');
    console.log('📧 Email:', user.email);
    console.log('🔒 Contraseña:', password);
    console.log('👤 Nombre:', user.displayName);
    console.log('🔑 Rol:', user.role);
    console.log('🆔 ID:', user.id);
    console.log('');
    console.log('💡 Este usuario puede ser asignado como dueño de un complejo');
    console.log('🌐 Puede iniciar sesión en: http://localhost:5173/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createStoreOwner();
