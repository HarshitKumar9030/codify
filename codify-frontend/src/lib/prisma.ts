import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'minimal',
})

// Ensure connection is established
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error)
})

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  
  // Graceful shutdown handlers
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

// Helper function to safely execute database operations with retry logic
export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure connection is active
      await prisma.$connect()
      return await operation()
    } catch (error: unknown) {
      lastError = error as Error
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, (error as Error).message)
      
      // If it's a connection error, try to reconnect
      const prismaError = error as { code?: string; message: string }
      if (prismaError.code === 'P1001' || prismaError.message.includes('Engine is not yet connected')) {
        try {
          await prisma.$disconnect()
          await new Promise(resolve => setTimeout(resolve, delay))
          await prisma.$connect()
        } catch (reconnectError) {
          console.error('Failed to reconnect to database:', reconnectError)
        }
      }
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }
  
  throw lastError!
}
