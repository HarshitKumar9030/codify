import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EXECUTION_SERVER_URL = process.env.EXECUTION_SERVER_URL || 'http://localhost:8080';

// POST /api/execute - Execute code via execution server
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { code, language, input, timeout } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "Code and language are required" },
        { status: 400 }
      );
    }

    if (!['python', 'javascript'].includes(language)) {
      return NextResponse.json(
        { error: "Unsupported language. Only Python and JavaScript are supported." },
        { status: 400 }
      );
    }

    // Forward request to execution server
    const executionResponse = await fetch(`${EXECUTION_SERVER_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language,
        input: input || '',
        timeout: timeout || 10,
      }),
    });

    if (!executionResponse.ok) {
      const errorData = await executionResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: "Execution server error",
          message: errorData.message || "Failed to execute code"
        },
        { status: executionResponse.status }
      );
    }

    const result = await executionResponse.json();
    
    return NextResponse.json({
      success: true,
      ...result,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      }
    });

  } catch (error) {
    console.error("Code execution proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/execute/:executionId - Get execution result
export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { executionId } = params;

    if (!executionId) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Forward request to execution server
    const executionResponse = await fetch(`${EXECUTION_SERVER_URL}/api/execute/${executionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!executionResponse.ok) {
      const errorData = await executionResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: "Execution server error",
          message: errorData.message || "Failed to get execution result"
        },
        { status: executionResponse.status }
      );
    }

    const result = await executionResponse.json();
    
    return NextResponse.json(result);

  } catch (error) {
    console.error("Get execution result proxy error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
