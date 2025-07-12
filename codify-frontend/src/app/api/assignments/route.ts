import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create assignments" },
        { status: 403 }
      );
    }

    const { 
      title, 
      description, 
      instructions,
      language,
      code,
      testCases,
      classroomId,
      dueDate,
      points 
    } = await request.json();

    if (!title || !description || !classroomId || !language) {
      return NextResponse.json(
        { error: "Title, description, classroom, and language are required" },
        { status: 400 }
      );
    }

    // Verify the classroom belongs to the teacher
    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        teacherId: session.user.id
      }
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found or you don't have permission to assign to it" },
        { status: 404 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        instructions: instructions || "",
        language,
        code: code || "",
        testCases: JSON.stringify(testCases || []),
        classroomId,
        teacherId: session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        points: points || 100,
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true,
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            submissions: true,
          }
        }
      }
    });

    // Create notifications for all students in the classroom
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classroomId: classroomId
      },
      select: {
        studentId: true
      }
    });

    if (enrollments.length > 0) {
      const notifications = enrollments.map(enrollment => ({
        userId: enrollment.studentId,
        type: "ASSIGNMENT_CREATED" as const,
        title: "New Assignment",
        message: `New assignment "${title}" has been created in ${classroom.name}`,
        data: JSON.stringify({
          assignmentId: assignment.id,
          classroomId: classroomId,
          dueDate: assignment.dueDate
        })
      }));

      await prisma.notification.createMany({
        data: notifications
      });
    }

    return NextResponse.json({
      success: true,
      assignment
    });

  } catch (error) {
    console.error("Create assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/assignments - Get assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get('classroomId');

    let assignments;

    if (session.user.role === "TEACHER") {
      // Get assignments created by teacher
      const whereClause = {
        teacherId: session.user.id,
        ...(classroomId && { classroomId })
      };

      assignments = await prisma.assignment.findMany({
        where: whereClause,
        include: {
          classroom: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              submissions: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      // Get assignments for student's enrolled classrooms
      const enrollments = await prisma.enrollment.findMany({
        where: {
          studentId: session.user.id
        },
        select: {
          classroomId: true
        }
      });

      const classroomIds = enrollments.map(e => e.classroomId);

      const whereClause = {
        classroomId: {
          in: classroomIds
        },
        ...(classroomId && { classroomId })
      };

      assignments = await prisma.assignment.findMany({
        where: whereClause,
        include: {
          classroom: {
            select: {
              id: true,
              name: true,
            }
          },
          submissions: {
            where: {
              studentId: session.user.id
            },
            select: {
              id: true,
              status: true,
              score: true,
              submittedAt: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return NextResponse.json({
      success: true,
      assignments
    });

  } catch (error) {
    console.error("Get assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
