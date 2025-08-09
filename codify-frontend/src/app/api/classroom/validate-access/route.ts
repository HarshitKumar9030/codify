import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { teacherId, studentId, classroomId } = await request.json()

    if (!teacherId || !studentId || !classroomId) {
      return NextResponse.json(
        { error: 'Missing required fields: teacherId, studentId, classroomId' },
        { status: 400 }
      )
    }

    const classroom = await prisma.classroom.findFirst({
      where: {
        id: classroomId,
        teacherId: teacherId
      }
    })

    if (!classroom) {
      return NextResponse.json(
        { 
          hasAccess: false, 
          error: 'Classroom not found or does not belong to teacher' 
        },
        { status: 403 }
      )
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: studentId,
        classroomId: classroomId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { 
          hasAccess: false, 
          error: 'Student is not enrolled in this classroom' 
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      hasAccess: true,
      classroomName: classroom.name
    })

  } catch (error) {
    console.error('Error validating classroom access:', error)
    return NextResponse.json(
      { 
        hasAccess: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
