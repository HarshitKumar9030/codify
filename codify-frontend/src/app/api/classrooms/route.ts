import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateClassroomCode(): string {
  // Generate 8-digit alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/classrooms - Create a new classroom
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Only teachers can create classrooms" },
        { status: 403 }
      );
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Generate unique classroom code
    let classroomCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      classroomCode = generateClassroomCode();
      const existing = await prisma.classroom.findUnique({
        where: { code: classroomCode }
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: "Failed to generate unique classroom code" },
        { status: 500 }
      );
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        description: description || "",
        code: classroomCode!,
        teacherId: session.user.id,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            enrollments: true,
            assignments: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      classroom
    });

  } catch (error) {
    console.error("Create classroom error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/classrooms - Get user's classrooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let classrooms;

    if (session.user.role === "TEACHER") {
      // Get classrooms created by teacher
      classrooms = await prisma.classroom.findMany({
        where: {
          teacherId: session.user.id
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Add isTeacher property for teacher's own classrooms
      classrooms = classrooms.map(classroom => ({
        ...classroom,
        isTeacher: true
      }));
    } else {
      // Get classrooms student is enrolled in
      classrooms = await prisma.classroom.findMany({
        where: {
          enrollments: {
            some: {
              studentId: session.user.id
            }
          }
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: {
              enrollments: true,
              assignments: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Add isTeacher property for student enrolled classrooms
      classrooms = classrooms.map(classroom => ({
        ...classroom,
        isTeacher: false
      }));
    }

    return NextResponse.json({
      success: true,
      classrooms
    });

  } catch (error) {
    console.error("Get classrooms error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
