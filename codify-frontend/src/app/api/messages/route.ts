import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipientId, message, classroomId, subject } = await request.json();

    if (!recipientId || !message) {
      return NextResponse.json({ 
        error: 'recipientId and message are required' 
      }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, role: true }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    if (classroomId) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
        include: {
          enrollments: {
            where: { studentId: currentUser.id }
          }
        }
      });

      if (!classroom) {
        return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
      }

      const hasAccess = 
        classroom.teacherId === currentUser.id || // User is the teacher
        classroom.enrollments.length > 0 || // User is enrolled as student
        classroom.teacherId === recipientId; // Recipient is the teacher

      if (!hasAccess) {
        return NextResponse.json({ 
          error: 'Access denied to this classroom' 
        }, { status: 403 });
      }
    }

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'GENERAL',
        title: subject || `New message from ${currentUser.name || 'a user'}`,
        message: message.length > 100 ? `${message.substring(0, 100)}...` : message,
        data: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          classroomId: classroomId || null,
          fullMessage: message,
          type: 'direct_message'
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const messages = await prisma.notification.findMany({
      where: {
        userId: currentUser.id,
        data: {
          contains: '"type":"direct_message"'
        },
        ...(recipientId && {
          data: {
            contains: `"senderId":"${recipientId}"`
          }
        })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    const formattedMessages = messages.map(notification => {
      let parsedData: MessageData = {};
      try {
        parsedData = JSON.parse(notification.data || '{}') as MessageData;
      } catch (e) {
        console.error('Error parsing notification data:', e);
      }

      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        fullMessage: parsedData.fullMessage || notification.message,
        senderId: parsedData.senderId,
        senderName: parsedData.senderName,
        classroomId: parsedData.classroomId,
        read: notification.read,
        createdAt: notification.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}
