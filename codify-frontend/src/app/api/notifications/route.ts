import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const unreadOnly = searchParams.get('unread') === 'true';

    const whereClause = {
      userId: session.user.id,
      ...(unreadOnly && { read: false })
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to latest 50 notifications
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false
      }
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    });

  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { notificationIds, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false
        },
        data: {
          read: true
        }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id
        },
        data: {
          read: true
        }
      });
    } else {
      return NextResponse.json(
        { error: "Either notificationIds array or markAllAsRead flag is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read"
    });

  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipientId, message, classroomId } = body;

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'recipientId and message are required' },
        { status: 400 }
      );
    }

    const sender = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    if (classroomId) {
      const classroom = await prisma.classroom.findFirst({
        where: {
          id: classroomId,
          teacherId: sender.id
        }
      });

      if (!classroom) {
        return NextResponse.json(
          { error: 'You do not have permission to send notifications in this classroom' },
          { status: 403 }
        );
      }

      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: recipientId,
          classroomId
        }
      });

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Recipient is not enrolled in this classroom' },
          { status: 400 }
        );
      }
    }

    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'CLASSROOM_ANNOUNCEMENT',
        title: `Message from ${sender.name}`,
        message,
        data: JSON.stringify({
          senderId: sender.id,
          senderName: sender.name,
          classroomId: classroomId || null
        })
      }
    });

    return NextResponse.json({
      success: true,
      notification
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
