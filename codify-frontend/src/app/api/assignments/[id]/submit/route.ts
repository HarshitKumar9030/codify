import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Type for file structure from execution server
interface FileItem {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: string;
}

// POST - Submit assignment
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
    const { code } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify assignment exists and user has access
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        classroom: true
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if user is enrolled in the classroom
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: currentUser.id,
        classroomId: assignment.classroomId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if assignment is past due date and handle late submissions
    const now = new Date();
    const isLate = assignment.dueDate && now > assignment.dueDate;
    
    if (isLate && !assignment.allowLateSubmissions) {
      return NextResponse.json({ error: 'Assignment is past due date and late submissions are not allowed' }, { status: 400 });
    }
    
    // Calculate late penalty if applicable
    let latePenalty = 0;
    let hoursLate = 0;
    
    if (isLate && assignment.allowLateSubmissions && assignment.dueDate) {
      hoursLate = Math.floor((now.getTime() - assignment.dueDate.getTime()) / (1000 * 60 * 60));
      
      // Check if student has an approved excuse
      const approvedExcuse = await prisma.submissionExcuse.findFirst({
        where: {
          assignmentId,
          studentId: currentUser.id,
          status: 'APPROVED'
        }
      });
      
      if (!approvedExcuse) {
        // Calculate penalty: assignment.penaltyPercentage every 12 hours, max assignment.maxPenalty
        const penaltyPeriods = Math.floor(hoursLate / 12);
        latePenalty = Math.min(
          penaltyPeriods * (assignment.penaltyPercentage || 2),
          assignment.maxPenalty || 50
        );
        
        // Check if maximum penalty reached (disallow submission if >= maxPenalty)
        if (latePenalty >= (assignment.maxPenalty || 50)) {
          return NextResponse.json({ 
            error: `Assignment is too late to submit. Maximum penalty of ${assignment.maxPenalty || 50}% has been reached.`,
            latePenalty,
            hoursLate
          }, { status: 400 });
        }
      }
    }

    // Check existing submissions and count
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: currentUser.id
      }
    });

    // Count total submissions for this student/assignment
    const submissionCount = await prisma.submission.count({
      where: {
        assignmentId,
        studentId: currentUser.id
      }
    });

    // Check submission count limit (max 2 submissions)
    if (submissionCount >= 2) {
      return NextResponse.json({ 
        error: 'You have reached the maximum submission limit (2 submissions per assignment)' 
      }, { status: 400 });
    }

    // Get user's current files for attachment
    const userFilesResponse = await fetch(`${process.env.EXECUTION_SERVER_URL || 'http://localhost:8080'}/api/files/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        path: '/'
      })
    });

    let attachedFiles = [];
    if (userFilesResponse.ok) {
      const filesData = await userFilesResponse.json();
      if (filesData.success && filesData.files) {
        // Filter and include relevant files (exclude directories and hidden files)
        attachedFiles = filesData.files
          .filter((file: FileItem) => file.type === 'file' && !file.name.startsWith('.'))
          .map((file: FileItem) => ({
            name: file.name,
            path: file.path,
            size: file.size || 0,
            modified: file.modified || new Date().toISOString()
          }));
      }
    }

    let submission;
    if (existingSubmission) {
      // Update existing submission 
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          code,
          status: 'PENDING',
          submittedAt: new Date(),
          isLate: isLate || false,
          hoursLate: hoursLate,
          latePenalty: latePenalty,
          originalScore: null, // Will be set when graded
          // Reset grading fields
          score: null,
          feedback: null,
          gradedAt: null,
          executionLog: null
        }
      });
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          code,
          status: 'PENDING',
          studentId: currentUser.id,
          assignmentId,
          isLate: isLate || false,
          hoursLate: hoursLate,
          latePenalty: latePenalty,
          originalScore: null // Will be set when graded
        }
      });
    }

    return NextResponse.json({
      success: true,
      submission,
      submissionCount: submissionCount + 1,
      attachedFiles
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
