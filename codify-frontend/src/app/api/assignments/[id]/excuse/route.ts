import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Submit excuse for late submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: assignmentId } = await params;
    const { reason } = await request.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a detailed reason (at least 10 characters)' },
        { status: 400 }
      );
    }

    // Check if assignment exists and is past due
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { dueDate: true, allowLateSubmissions: true }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (!assignment.dueDate || new Date() <= new Date(assignment.dueDate)) {
      return NextResponse.json(
        { error: 'Assignment is not past due yet' },
        { status: 400 }
      );
    }

    if (!assignment.allowLateSubmissions) {
      return NextResponse.json(
        { error: 'Late submissions are not allowed for this assignment' },
        { status: 400 }
      );
    }

    // Check if excuse already exists
    const existingExcuse = await prisma.submissionExcuse.findUnique({
      where: {
        studentId_assignmentId: {
          studentId: session.user.id,
          assignmentId: assignmentId
        }
      }
    });

    if (existingExcuse) {
      return NextResponse.json(
        { error: 'Excuse already submitted for this assignment' },
        { status: 400 }
      );
    }

    // Create excuse
    const excuse = await prisma.submissionExcuse.create({
      data: {
        studentId: session.user.id,
        assignmentId: assignmentId,
        reason: reason.trim(),
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      excuse
    });

  } catch (error) {
    console.error('Excuse submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get excuse status for assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: assignmentId } = await params;

    const excuse = await prisma.submissionExcuse.findUnique({
      where: {
        studentId_assignmentId: {
          studentId: session.user.id,
          assignmentId: assignmentId
        }
      },
      include: {
        reviewer: {
          select: { name: true }
        }
      }
    });

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
