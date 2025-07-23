import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: classroomId } = await params;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get classroom details
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    // Check if user has access (either teacher or enrolled student)
    const isTeacher = classroom.teacherId === currentUser.id;
    const isEnrolledStudent = classroom.enrollments.some(enrollment => 
      enrollment.studentId === currentUser.id
    );

    if (!isTeacher && !isEnrolledStudent) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Transform the data to match our interface
    const members = [
      // Add teacher as a member
      {
        id: classroom.teacher.id,
        role: 'TEACHER' as const,
        user: classroom.teacher
      },
      // Add all enrolled students
      ...classroom.enrollments.map(enrollment => ({
        id: enrollment.id,
        role: 'STUDENT' as const,
        user: enrollment.student
      }))
    ];

    const transformedClassroom = {
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      code: classroom.code,
      createdAt: classroom.createdAt,
      currentUserRole: isTeacher ? 'TEACHER' as const : 'STUDENT' as const,
      members
    };

    return NextResponse.json(transformedClassroom);
  } catch (error) {
    console.error('Error fetching classroom details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classroom details' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
