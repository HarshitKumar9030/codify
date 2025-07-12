import { prisma } from '@/lib/prisma';

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
