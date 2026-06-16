import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.brandingConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  await prisma.workflowConfig.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
