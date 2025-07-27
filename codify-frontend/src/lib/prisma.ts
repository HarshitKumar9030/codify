import { PrismaClient } from '@prisma/client'

// Create a type for the global prisma instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Function to create a new Prisma client instance
function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
    // Add connection configuration for better stability
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

// Create or reuse the prisma instance
export const prisma = globalThis.__prisma ?? createPrismaClient()

// Ensure we don't create multiple instances in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

let isConnecting = false
let connectionPromise: Promise<void> | null = null

async function ensureConnection(): Promise<void> {
  if (isConnecting && connectionPromise) {
    return connectionPromise
  }

  isConnecting = true
  connectionPromise = (async () => {
    try {
      await prisma.$connect()
      console.log('Database connected successfully')
    } catch (error) {
      console.error('Database connection failed:', error)
      await prisma.$disconnect()
      throw error
    } finally {
      isConnecting = false
      connectionPromise = null
    }
  })()

  return connectionPromise
}

export async function withPrismaRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await ensureConnection()
      
      const result = await operation()
      return result
    } catch (error: unknown) {
      lastError = error as Error
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message)

      const prismaError = error as { code?: string; message: string }
      
      if (attempt === maxRetries) {
        break
      }

      if (
        prismaError.code === 'P1001' || 
        prismaError.message.includes('Engine is not yet connected') ||
        prismaError.message.includes('Connection timeout') ||
        prismaError.message.includes('Connection refused')
      ) {
        console.log(`🔄 Attempting to reset connection (attempt ${attempt})...`)
        
        try {
          await prisma.$disconnect()
          await new Promise(resolve => setTimeout(resolve, baseDelay * attempt))
          
          await ensureConnection()
        } catch (reconnectError) {
          console.error('Failed to reconnect:', reconnectError)
        }
      }

      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)))
    }
  }

  throw lastError || new Error('Unknown database error')
}

if (process.env.NODE_ENV !== 'production') {
  const gracefulShutdown = async () => {
    try {
      await prisma.$disconnect()
      console.log('Database connection closed gracefully')
    } catch (error) {
      console.error('Error during graceful shutdown:', error)
    }
  }

  process.on('beforeExit', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
}

export async function withFreshPrismaClient<T>(
  operation: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const freshClient = createPrismaClient()
  
  try {
    await freshClient.$connect()
    const result = await operation(freshClient)
    return result
  } finally {
    await freshClient.$disconnect()
  }
}
