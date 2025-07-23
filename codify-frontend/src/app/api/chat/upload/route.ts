import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";

// POST /api/chat/upload - Upload file for chat
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

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Check file type
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

    // Create unique filename
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `${session.user.id}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat', classroomId);
    const filePath = path.join(uploadDir, filename);

    // Create directory structure
    await import('fs').then(fs => 
      fs.promises.mkdir(uploadDir, { recursive: true })
    );

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return file information
    const fileUrl = `/uploads/chat/${classroomId}/${filename}`;
    
    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
