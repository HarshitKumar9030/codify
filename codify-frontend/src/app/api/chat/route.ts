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
    const classroomId = searchParams.get('classroomId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!classroomId) {
      return NextResponse.json(
        { error: "Classroom ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        enrollments: {
          where: { classroomId }
        },
        classrooms: {
          where: { id: classroomId }
        }
      }
    });

    if (!user || (user.enrollments.length === 0 && user.classrooms.length === 0)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { classroomId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        readBy: {
          where: { userId: session.user.id }
        },
        _count: {
          select: {
            replies: true,
            readBy: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const unreadMessageIds = messages
      .filter((msg) => msg.readBy.length === 0 && msg.senderId !== session.user.id)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      const existingReads = await prisma.messageRead.findMany({
        where: {
          userId: session.user.id,
          messageId: { in: unreadMessageIds }
        },
        select: { messageId: true }
      });

      const existingMessageIds = existingReads.map(read => read.messageId);
      const newMessageIds = unreadMessageIds.filter(id => !existingMessageIds.includes(id));

      if (newMessageIds.length > 0) {
        await prisma.messageRead.createMany({
          data: newMessageIds.map(messageId => ({
            messageId,
            userId: session.user.id
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit
    });

  } catch (error) {
    console.error("Get messages error:", error);
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

    const { content, classroomId, messageType = 'TEXT', fileUrl, fileName, fileSize, replyToId } = await request.json();

    if (!classroomId) {
      return NextResponse.json(
        { error: "Classroom ID is required" },
        { status: 400 }
      );
    }

    if (!content && !fileUrl) {
      return NextResponse.json(
        { error: "Content or file is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        enrollments: {
          where: { classroomId }
        },
        classrooms: {
          where: { id: classroomId }
        }
      }
    });

    if (!user || (user.enrollments.length === 0 && user.classrooms.length === 0)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        messageType,
        fileUrl,
        fileName,
        fileSize,
        senderId: session.user.id,
        classroomId,
        replyToId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        replyTo: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            replies: true,
            readBy: true
          }
        }
      }
    });

    await prisma.messageRead.create({
      data: {
        messageId: message.id,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        classroom: {
          select: {
            teacherId: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.senderId !== session.user.id && message.classroom.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
