import { NextResponse } from 'next/server';
import { prisma, withPrismaRetry } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const connectionTest = await withPrismaRetry(async () => {
      await prisma.$connect();
      return await prisma.$queryRaw`SELECT 1 as result`;
    }, 2, 500); // Quick retry for health check

    const dbInfo = {
      status: 'connected',
      timestamp: new Date().toISOString(),
      connectionTest: connectionTest,
      prismaVersion: '6.11.1' // Static version for now
    };

    return NextResponse.json(dbInfo);
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

// POST - Force reconnection
export async function POST() {
  try {
    console.log('Forcing database reconnection...');
    
    // Disconnect and reconnect
    await prisma.$disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    await prisma.$connect();
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1 as result`;
    
    return NextResponse.json({
      status: 'reconnected',
      timestamp: new Date().toISOString(),
      message: 'Database connection reset successfully'
    });
  } catch (error) {
    console.error('Database reconnection failed:', error);
    
    return NextResponse.json(
      {
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
