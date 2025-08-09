import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assignmentId } = await params;
    const { submissionId, status, score, feedback } = await request.json();

    if (!submissionId || !status) {
      return NextResponse.json({ 
        error: 'submissionId and status are required' 
      }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.teacherId !== currentUser.id) {
      return NextResponse.json({ error: 'Access denied - teacher only' }, { status: 403 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId }
    });

    if (!submission || submission.assignmentId !== assignmentId) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED', 'NEEDS_REVIEW'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    let finalScore = score;
    let originalScore = score;
    
    if (score !== undefined && score !== null && submission.isLate && submission.latePenalty && submission.latePenalty > 0) {
      const penaltyDeduction = (score * submission.latePenalty) / 100;
      finalScore = Math.max(0, score - penaltyDeduction);
      originalScore = score; // Store original score before penalty
    }

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVIEW',
        score: finalScore !== undefined ? finalScore : null,
        originalScore: originalScore !== undefined ? originalScore : null,
        feedback: feedback || null,
        gradedAt: new Date()
      }
    });

    try {
      await prisma.notification.create({
        data: {
          userId: submission.studentId,
          type: 'ASSIGNMENT_GRADED',
          title: `Assignment "${assignment.title}" has been graded`,
          message: `Your submission has been ${status.toLowerCase()}. ${score !== undefined ? `Score: ${finalScore}${submission.isLate && submission.latePenalty && submission.latePenalty > 0 ? ` (${originalScore} - ${submission.latePenalty}% late penalty)` : ''}` : ''} ${feedback ? `Feedback: ${feedback}` : ''}`,
          data: JSON.stringify({
            assignmentId,
            submissionId,
            status,
            score,
            type: 'graded_submission'
          })
        }
      });

      await prisma.notification.create({
        data: {
          userId: currentUser.id,
          type: 'GENERAL',
          title: `Grading completed for "${assignment.title}"`,
          message: `You have successfully graded a submission by ${currentUser.name || 'a student'}. Status: ${status}, Score: ${finalScore || 'Not scored'}`,
          data: JSON.stringify({
            assignmentId,
            submissionId,
            studentId: submission.studentId,
            status,
            score,
            type: 'grading_completed'
          })
        }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
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
