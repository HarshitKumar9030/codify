import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Grade a submission (teacher only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignmentId = params.id;
    const { submissionId, status, score, feedback } = await request.json();

    if (!submissionId || !status) {
      return NextResponse.json({ 
        error: 'submissionId and status are required' 
      }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify assignment exists and user is the teacher
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.teacherId !== currentUser.id) {
      return NextResponse.json({ error: 'Access denied - teacher only' }, { status: 403 });
    }

    // Verify submission exists and belongs to this assignment
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission || submission.assignmentId !== assignmentId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Validate status
    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'NEEDS_REVIEW'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update submission with grade
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW',
        score: score !== undefined ? score : null,
        feedback: feedback || null,
        gradedAt: new Date()
      }
    });

    // Create a notification for the student
    try {
      await prisma.notification.create({
        data: {
          userId: submission.studentId,
          type: 'ASSIGNMENT_GRADED',
          title: `Assignment "${assignment.title}" has been graded`,
          message: `Your submission has been ${status.toLowerCase()}. ${feedback ? `Feedback: ${feedback}` : ''}`,
          data: JSON.stringify({
            assignmentId,
            submissionId,
            status,
            score
          })
        }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    );
  }
}
