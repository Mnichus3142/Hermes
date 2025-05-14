import prisma from '$lib/functions/prisma';

export const verifyConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('There was an error during connection verification', error);
    throw error;
  }
}