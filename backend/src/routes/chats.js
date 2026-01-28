export default async function chatRoutes(fastify, options) {
  fastify.get('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const chats = await fastify.prisma.chat.findMany({
      where: { userId: request.user.id },
      include: { store: true, messages: { take: 1, orderBy: { createdAt: 'desc' } } }
    });
    return { chats };
  });

  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { storeId } = request.body;
    const chat = await fastify.prisma.chat.create({
      data: { storeId, userId: request.user.id }
    });
    return { chat };
  });
}
