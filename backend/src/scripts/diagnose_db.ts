import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Iniciando diagnóstico do Banco de Dados...');

  try {
    const userCount = await prisma.user.count();
    const contactCount = await prisma.contact.count();
    const messageCount = await prisma.message.count();
    const ticketCount = await prisma.ticket.count();

    console.log('--- ESTATÍSTICAS ---');
    console.log(`👤 Usuários: ${userCount}`);
    console.log(`📱 Contatos: ${contactCount}`);
    console.log(`💬 Mensagens: ${messageCount}`);
    console.log(`🎫 Tickets: ${ticketCount}`);
    console.log('--------------------');

    const admin = await prisma.user.findUnique({ where: { email: 'admin@omnidesk.com' } });
    if (admin) {
        console.log(`✅ Admin encontrado (ID: ${admin.id})`);
    } else {
        console.error('❌ Admin NÃO encontrado!');
    }

    // Listar últimos 5 contatos para ver se tem algo
    if (contactCount > 0) {
        const lastContacts = await prisma.contact.findMany({ take: 5 });
        console.log('Últimos contatos:', lastContacts);
    }

  } catch (error) {
    console.error('❌ Erro ao conectar no banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
