import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        log: ['query', 'error', 'warn'],
    });

console.log("Prisma Client Initialized:", !!prisma);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
