import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/classrooms/join - Join a classroom with 8-digit code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role === "TEACHER") {
      return NextResponse.json(
        { error: "Teachers cannot join classrooms. You can create classrooms instead." },
        { status: 403 }
      );
    }

    const { code } = await request.json();

    if (!code || code.length !== 8) {
      return NextResponse.json(
        { error: "Valid 8-digit classroom code is required" },
        { status: 400 }
      );
    }

    // Find classroom by code
    const classroom = await prisma.classroom.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        enrollments: {
          where: {
            studentId: session.user.id
          }
        }
      }
    });

    if (!classroom) {
      return NextResponse.json(
        { error: "Classroom not found. Please check the code and try again." },
        { status: 404 }
      );
    }

    // Check if student is already enrolled
    if (classroom.enrollments.length > 0) {
      return NextResponse.json(
        { 
          error: "You are already enrolled in this classroom",
          message: `You're already a member of "${classroom.name}"`,
          classroom: {
            id: classroom.id,
            name: classroom.name,
            description: classroom.description,
            teacher: classroom.teacher
          }
        },
        { status: 409 }
      );
    }

    // Add student to classroom via Enrollment
    await prisma.enrollment.create({
      data: {
        studentId: session.user.id,
        classroomId: classroom.id,
      }
    });

    // Get updated classroom with counts
    const updatedClassroom = await prisma.classroom.findUnique({
      where: { id: classroom.id },
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
      message: `Successfully joined ${classroom.name}`,
      classroom: updatedClassroom
    });

  } catch (error) {
    console.error("Join classroom error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
