import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['error', 'warn'],
    });

if (process.env.NODE_ENV !== 'production') {
    console.log("Prisma Client Initialized:", !!prisma);
}
globalForPrisma.prisma = prisma;
