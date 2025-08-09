import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        teacher: true,
        enrollments: {
          where: { studentId: currentUser.id }
        }
      }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const isTeacher = classroom.teacherId === currentUser.id;
    const isEnrolled = classroom.enrollments.length > 0;

    if (!isTeacher && !isEnrolled) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { classroomId },
      include: {
        submissions: {
          where: { status: 'ACCEPTED' },
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

    const studentStats = new Map();
    
    assignments.forEach(assignment => {
      assignment.submissions.forEach(submission => {
        const studentId = submission.student.id;
        const studentName = submission.student.name;
        
        if (!studentStats.has(studentId)) {
          studentStats.set(studentId, {
            userId: studentId,
            userName: studentName,
            totalPoints: 0,
            completedAssignments: 0,
            totalScores: []
          });
        }
        
        const stats = studentStats.get(studentId);
        stats.totalPoints += submission.score || 0;
        stats.completedAssignments += 1;
        stats.totalScores.push(submission.score || 0);
      });
    });

    const leaderboard = Array.from(studentStats.values()).map(stats => ({
      ...stats,
      averageScore: stats.totalScores.length > 0 
        ? Math.round(stats.totalScores.reduce((a: number, b: number) => a + b, 0) / stats.totalScores.length)
        : 0
  })).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.completedAssignments - a.completedAssignments;
    });

    return NextResponse.json({
      success: true,
      leaderboard,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        totalAssignments: assignments.length
      }
    });

  } catch (error) {
    console.error('Error fetching classroom leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
