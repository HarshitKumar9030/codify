import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EXECUTION_SERVER_URL = process.env.EXECUTION_SERVER_URL || 'http://localhost:8080';

// GET /api/files/content - Get file content
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
    const path = url.searchParams.get('path');
    const userId = url.searchParams.get('userId');
    const requestingUserId = url.searchParams.get('requestingUserId');
    const classroomId = url.searchParams.get('classroomId');
    const isTeacher = url.searchParams.get('isTeacher');

    if (!path) {
      return NextResponse.json(
        { error: "Path parameter is required" },
        { status: 400 }
      );
    }

    // Use provided userId or session user ID
    const effectiveUserId = userId || session.user.id;

    const params = new URLSearchParams({
      userId: effectiveUserId,
      path: path,
      requestingUserId: requestingUserId || session.user.id,
      ...(classroomId && { classroomId }),
      ...(isTeacher && { isTeacher })
    });

    const response = await fetch(`${EXECUTION_SERVER_URL}/api/files/content?${params}`, {
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
          message: errorData.message || "Failed to get file content"
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error("Get file content error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
