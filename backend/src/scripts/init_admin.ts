import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@omnidesk.com';

  console.log(`Verificando usuário admin (${email})...`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('Usuário admin não encontrado. Criando...');
    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: email,
        password: 'admin', // Em produção, usar hash!
        role: 'ADMIN',
      },
    });
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('Login: admin@omnidesk.com');
    console.log('Senha: admin');
  } else {
    console.log('ℹ️ Usuário admin já existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
