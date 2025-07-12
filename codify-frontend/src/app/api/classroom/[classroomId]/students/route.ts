import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

export async function GET(
  request: NextRequest,
  { params }: { params: { classroomId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { classroomId } = params;

    // For now, return mock data based on classroomId. In a real app, you'd fetch from your database
    const mockStudents = [
      { id: 'student1', name: 'Alice Johnson', email: 'alice@example.com' },
      { id: 'student2', name: 'Bob Smith', email: 'bob@example.com' },
      { id: 'student3', name: 'Charlie Brown', email: 'charlie@example.com' },
      { id: 'student4', name: 'Diana Prince', email: 'diana@example.com' },
    ].filter(student => 
      // Mock filtering based on classroomId
      classroomId === 'classroom1' ? student.id !== 'student4' : true
    );

    return NextResponse.json({
      success: true,
      students: mockStudents
    });

  } catch (error) {
    console.error('Error fetching classroom students:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
