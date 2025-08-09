/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withFreshPrismaClient } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await withFreshPrismaClient(async (client) => {
      return await client.user.findUnique({
        where: { email: session.user.email }
      });
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (currentUser.role === 'STUDENT') {
      const enrollments = await withFreshPrismaClient(async (client) => {
        return await client.enrollment.findMany({
          where: { studentId: currentUser.id },
          include: {
            classroom: {
              include: {
                assignments: {
                  include: {
                    submissions: {
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
                }
              }
            }
          }
        });
      });

      const leaderboardData = enrollments.map((enrollment: any) => {
        const classroom = enrollment.classroom;
        
        const studentStats = new Map();
        
        classroom.assignments.forEach((assignment: any) => {
          assignment.submissions
            .filter((sub: any) => sub.status === 'ACCEPTED')
            .forEach((submission: any) => {
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
          // Sort by total points, then by average score
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return b.averageScore - a.averageScore;
        });

        return {
          classroomId: classroom.id,
          classroomName: classroom.name,
          leaderboard
        };
      });

      return NextResponse.json({
        success: true,
        leaderboard: leaderboardData
      });
    }

    if (currentUser.role === 'TEACHER') {
      const classrooms = await withFreshPrismaClient(async (client) => {
        return await client.classroom.findMany({
          where: { teacherId: currentUser.id },
          include: {
            assignments: {
              include: {
                submissions: {
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
            }
          }
        });
      });

      const leaderboardData = classrooms.map((classroom: any) => {
        const studentStats = new Map();
        
        classroom.assignments.forEach((assignment: any) => {
          assignment.submissions
            .filter((sub: any) => sub.status === 'ACCEPTED')
            .forEach((submission: any) => {
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
          // Sort by total points, then by average score
          if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
          }
          return b.averageScore - a.averageScore;
        });

        return {
          classroomId: classroom.id,
          classroomName: classroom.name,
          leaderboard
        };
      });

      return NextResponse.json({
        success: true,
        leaderboard: leaderboardData
      });
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
