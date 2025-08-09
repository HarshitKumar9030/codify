import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: 'Only teachers can revoke assignments' },
        { status: 403 }
      );
    }

    const { id: assignmentId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classroom: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only revoke your own assignments' },
        { status: 403 }
      );
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        revokedAt: new Date()
      }
    });

    const enrollments = await prisma.enrollment.findMany({
      where: {
        classroomId: assignment.classroomId
      },
      select: {
        studentId: true
      }
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map(enrollment => ({
          userId: enrollment.studentId,
          type: "ASSIGNMENT_REVOKED",
          title: "Assignment Revoked",
          message: `The assignment "${assignment.title}" has been revoked by your teacher.`,
          data: JSON.stringify({ assignmentId: assignmentId })
        }))
      });
    }

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: `Assignment "${assignment.title}" has been revoked successfully.`
    });

  } catch (error) {
    console.error('Assignment revocation error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke assignment' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: 'Only teachers can reactivate assignments' },
        { status: 403 }
      );
    }

    const { id: assignmentId } = await params;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classroom: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only reactivate your own assignments' },
        { status: 403 }
      );
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        isActive: true,
        revokedAt: null
      }
    });

    const enrollments = await prisma.enrollment.findMany({
      where: {
        classroomId: assignment.classroomId
      },
      select: {
        studentId: true
      }
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map(enrollment => ({
          userId: enrollment.studentId,
          type: "ASSIGNMENT_REACTIVATED",
          title: "Assignment Reactivated",
          message: `The assignment "${assignment.title}" has been reactivated by your teacher.`,
          data: JSON.stringify({ assignmentId: assignmentId })
        }))
      });
    }

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: `Assignment "${assignment.title}" has been reactivated successfully.`
    });

  } catch (error) {
    console.error('Assignment reactivation error:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate assignment' },
      { status: 500 }
    );
  }
}
