import { NextResponse } from 'next/server';
import { withFreshPrismaClient, withPrismaRetry } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection with fresh client
    const result = await withFreshPrismaClient(async (client) => {
      // Simple connection test
      const userCount = await client.user.count();
      const classroomCount = await client.classroom.count();
      
      return {
        userCount,
        classroomCount,
        connectionStatus: 'active'
      };
    });

    return NextResponse.json({
      status: 'connected',
      timestamp: new Date().toISOString(),
      data: result,
      message: 'Database connection is healthy'
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Database connection failed'
      },
      { status: 503 }
    );
  }
}

// POST - Test retry logic
export async function POST() {
  try {
    console.log('Testing database with retry logic...');
    
    const result = await withPrismaRetry(async () => {
      // Use a fresh client for this test
      return await withFreshPrismaClient(async (client) => {
        const userCount = await client.user.count();
        return { userCount, status: 'retry_test_passed' };
      });
    });
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      result,
      message: 'Retry logic test completed successfully'
    });
  } catch (error) {
    console.error('Retry logic test failed:', error);
    
    return NextResponse.json(
      {
        status: 'failed',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Retry logic test failed'
      },
      { status: 503 }
    );
  }
}
