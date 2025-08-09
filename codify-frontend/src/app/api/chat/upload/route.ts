import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const classroomId = formData.get('classroomId') as string;

    if (!file || !classroomId) {
      return NextResponse.json(
        { error: "File and classroom ID are required" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large (max 10MB)" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'text/x-python',
      'application/javascript',
      'text/javascript',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const filename = `chat_${session.user.id}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const serverFormData = new FormData();
    serverFormData.append('file', file);
    serverFormData.append('userId', session.user.id);
    serverFormData.append('requestingUserId', session.user.id);
    serverFormData.append('path', `/chat/${classroomId}/${filename}`);
    
    const executionServerUrl = process.env.EXECUTION_SERVER_URL || 'http://localhost:8080';
    const uploadResponse = await fetch(`${executionServerUrl}/api/files/upload`, {
      method: 'POST',
      body: serverFormData
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to execution server');
    }

    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Upload failed');
    }

    const fileUrl = `${executionServerUrl}/api/files/download?userId=${session.user.id}&path=/chat/${classroomId}/${filename}`;
    
    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      serverPath: `/chat/${classroomId}/${filename}`
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
