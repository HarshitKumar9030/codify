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
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: classroomId } = await params;

    // Verify the user is a teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { teacherId: true }
    });

    if (!classroom || classroom.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Get all assignments for this classroom with submission statistics
    const assignments = await prisma.assignment.findMany({
      where: { classroomId },
      include: {
        submissions: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get enrolled students count once
    const enrolledStudents = await prisma.enrollment.count({
      where: { classroomId }
    });

    // Calculate analytics for each assignment
    const analytics = assignments.map(assignment => {
      const submissions = assignment.submissions;
      const totalSubmissions = submissions.length;
      
      const statusCounts = submissions.reduce((acc, submission) => {
        acc[submission.status] = (acc[submission.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const scores = submissions
        .filter(s => s.score !== null)
        .map(s => s.score!);
      
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      const lateSubmissions = submissions.filter(s => s.isLate).length;
      const onTimeSubmissions = totalSubmissions - lateSubmissions;

      // Score distribution
    //   const scoreDistribution = [
    //     { range: '0-20', count: scores.filter(s => s <= 20).length },
    //     { range: '21-40', count: scores.filter(s => s > 20 && s <= 40).length },
    //     { range: '41-60', count: scores.filter(s => s > 40 && s <= 60).length },
    //     { range: '61-80', count: scores.filter(s => s > 60 && s <= 80).length },
    //     { range: '81-100', count: scores.filter(s => s > 80).length }
    //   ];

      // Submission trend (last 7 days)
      const now = new Date();
      
      const submissionTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const count = submissions.filter(s => {
          const submissionDate = new Date(s.submittedAt).toISOString().split('T')[0];
          return submissionDate === dateStr;
        }).length;
        
        submissionTrend.push({
          date: dateStr,
          count
        });
      }

      // Score distribution
      const scoreDistribution = [
        { range: '90-100', count: submissions.filter(s => s.score && s.score >= 90).length },
        { range: '80-89', count: submissions.filter(s => s.score && s.score >= 80 && s.score < 90).length },
        { range: '70-79', count: submissions.filter(s => s.score && s.score >= 70 && s.score < 80).length },
        { range: '60-69', count: submissions.filter(s => s.score && s.score >= 60 && s.score < 70).length },
        { range: '0-59', count: submissions.filter(s => s.score && s.score < 60).length },
        { range: 'Ungraded', count: submissions.filter(s => !s.score).length }
      ];

      // Get top students for this assignment
      const topStudents = submissions
        .filter(s => s.score !== null && s.score !== undefined)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5)
        .map(s => ({
          studentId: s.student.id,
          studentName: s.student.name || s.student.email,
          score: s.score || 0,
          submittedAt: s.submittedAt.toISOString(),
          isLate: s.isLate || false,
          status: s.status
        }));

      // Calculate completion rate (students who submitted vs total enrolled)
      const uniqueSubmitters = new Set(submissions.map(s => s.studentId)).size;
      const completionRate = enrolledStudents > 0 ? (uniqueSubmitters / enrolledStudents) * 100 : 0;

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        totalSubmissions,
        pendingSubmissions: statusCounts.PENDING || 0,
        acceptedSubmissions: statusCounts.ACCEPTED || 0,
        rejectedSubmissions: statusCounts.REJECTED || 0,
        needsReviewSubmissions: statusCounts.NEEDS_REVIEW || 0,
        averageScore,
        lateSubmissions,
        onTimeSubmissions,
        submissionTrend,
        scoreDistribution,
        topStudents,
        completionRate
      };
    });

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
