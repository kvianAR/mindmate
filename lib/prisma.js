import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis
const prisma = globalForPrisma.mindmatePrisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.mindmatePrisma = prisma

export default prisma
