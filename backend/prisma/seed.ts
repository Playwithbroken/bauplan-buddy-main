import { PrismaClient } from '@bauplan/database';
import { resetDatabase, seedBaseData } from './seedUtils';

const prisma = new PrismaClient();

const main = async () => {
  console.log('Seeding database…');
  await resetDatabase(prisma);
  await seedBaseData(prisma);
  console.log('Seed completed');
};

main()
  .catch(error => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
