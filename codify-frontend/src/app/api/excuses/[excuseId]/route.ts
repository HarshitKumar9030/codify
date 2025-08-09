import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { excuseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const excuseId = params.excuseId;
    const { status, teacherNote } = await request.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const excuse = await prisma.submissionExcuse.findUnique({
      where: { id: excuseId },
      include: {
        assignment: {
          include: {
            classroom: true
          }
        }
      }
    });

    if (!excuse) {
      return NextResponse.json(
        { error: 'Excuse not found' },
        { status: 404 }
      );
    }

    if (excuse.assignment.classroom.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    const updatedExcuse = await prisma.submissionExcuse.update({
      where: { id: excuseId },
      data: {
        status: status as 'APPROVED' | 'REJECTED',
        teacherNote: teacherNote || null,
        reviewedAt: new Date(),
        reviewedBy: session.user.id
      },
      include: {
        student: {
          select: { name: true, email: true }
        },
        assignment: {
          select: { title: true }
        }
      }
    });

    if (status === 'APPROVED') {
      await prisma.notification.create({
        data: {
          userId: excuse.studentId,
          type: 'GENERAL',
          title: 'Late Submission Excuse Approved',
          message: `Your excuse for "${excuse.assignment.title}" has been approved. You may now submit without penalty.`,
          data: JSON.stringify({ assignmentId: excuse.assignmentId, excuseId: excuse.id })
        }
      });
    }

    return NextResponse.json({
      success: true,
      excuse: updatedExcuse
    });

  } catch (error) {
    console.error('Excuse review error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { excuseId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const excuseId = params.excuseId;

    const excuse = await prisma.submissionExcuse.findUnique({
      where: { id: excuseId },
      include: {
        student: {
          select: { name: true, email: true }
        },
        assignment: {
          select: { title: true, dueDate: true }
        },
        reviewer: {
          select: { name: true }
        }
      }
    });

    if (!excuse) {
      return NextResponse.json(
        { error: 'Excuse not found' },
        { status: 404 }
      );
    }

    if (excuse.studentId !== session.user.id) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: excuse.assignmentId },
        include: { classroom: true }
      });

      if (!assignment || assignment.classroom.teacherId !== session.user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      excuse
    });

  } catch (error) {
    console.error('Excuse fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
