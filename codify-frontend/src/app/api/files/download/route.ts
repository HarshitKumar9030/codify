import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EXECUTION_SERVER_URL = process.env.EXECUTION_SERVER_URL || 'http://localhost:8080';

// GET /api/files/download - Download a file
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
    const userId = searchParams.get('userId');
    const filePath = searchParams.get('path');
    const classroomId = searchParams.get('classroomId');
    const isTeacher = searchParams.get('isTeacher') === 'true';

    if (!userId || !filePath) {
      return NextResponse.json(
        { error: "User ID and file path are required" },
        { status: 400 }
      );
    }

    // Forward the request to the execution server
    const params = new URLSearchParams({
      userId,
      path: filePath,
      requestingUserId: session.user.id,
      isTeacher: isTeacher.toString(),
      ...(classroomId && { classroomId })
    });

    const response = await fetch(
      `${EXECUTION_SERVER_URL}/api/files/download?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CodiFY-Frontend/1.0',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: error || "Failed to download file" },
        { status: response.status }
      );
    }

    // Get the file content and metadata
    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';

    // Return the file as a download
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
