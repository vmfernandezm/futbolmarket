import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function uploadRoutes(fastify, options) {
  // Crear directorio de uploads si no existe
  const uploadsDir = path.join(__dirname, '../../uploads');
  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  // Upload de imagen
  fastify.post('/image', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({ error: 'No se proporcionó ningún archivo' });
      }

      // Validar tipo de archivo
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.code(400).send({ 
          error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WEBP, GIF)' 
        });
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = data.mimetype.split('/')[1];
      const filename = `court-${timestamp}-${randomString}.${extension}`;
      const filepath = path.join(uploadsDir, filename);

      // Guardar archivo
      await pipeline(data.file, createWriteStream(filepath));

      // Retornar URL de la imagen
      const imageUrl = `/uploads/${filename}`;
      
      return { 
        success: true,
        imageUrl,
        filename 
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al subir la imagen',
        details: error.message 
      });
    }
  });

  // Eliminar imagen
  fastify.delete('/image/:filename', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { filename } = request.params;
      const filepath = path.join(uploadsDir, filename);

      // Validar que el archivo existe y eliminarlo
      const { unlink } = await import('fs/promises');
      await unlink(filepath);

      return { 
        success: true,
        message: 'Imagen eliminada exitosamente' 
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return reply.code(404).send({ error: 'Imagen no encontrada' });
      }
      fastify.log.error(error);
      return reply.code(500).send({ 
        error: 'Error al eliminar la imagen',
        details: error.message 
      });
    }
  });
}
