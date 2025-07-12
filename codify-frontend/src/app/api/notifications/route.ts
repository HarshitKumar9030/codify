import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications - Get user's notifications
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

// PATCH /api/notifications - Mark notifications as read
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
      // Mark all notifications as read for the user
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
      // Mark specific notifications as read
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
