import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EXECUTION_SERVER_URL = process.env.EXECUTION_SERVER_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const path = url.searchParams.get('path') || '/';
    const classroomId = url.searchParams.get('classroomId');
    const isTeacher = url.searchParams.get('isTeacher');
    const targetUserId = url.searchParams.get('userId');
    const requestingUserId = url.searchParams.get('requestingUserId'); 
 
    const effectiveUserId = targetUserId || session.user.id;
    const effectiveRequestingUserId = requestingUserId || session.user.id;


    const params = new URLSearchParams({
      userId: effectiveUserId, 
      path: path,
      requestingUserId: effectiveRequestingUserId,
      ...(classroomId && { classroomId }),
      ...(isTeacher && { isTeacher })
    });

    const response = await fetch(`${EXECUTION_SERVER_URL}/api/files?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CodiFY-Frontend/1.0',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: "File server error",
          message: errorData.message || "Failed to list files"
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("File listing error:", error);
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

    const { path, content, action, classroomId, isTeacher, targetUserId } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    if (!['create', 'update', 'delete', 'mkdir'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be: create, update, delete, or mkdir" },
        { status: 400 }
      );
    }

    const effectiveUserId = targetUserId || session.user.id;

    const requestBody = {
      userId: effectiveUserId,
      path,
      content: content || '',
      action,
      requestingUserId: session.user.id, 
      classroomId,
      isTeacher
    };

    const response = await fetch(`${EXECUTION_SERVER_URL}/api/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CodiFY-Frontend/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: "File server error",
          message: errorData.message || "Failed to perform file operation"
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("File operation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
