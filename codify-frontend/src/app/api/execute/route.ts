import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const EXECUTION_SERVER_URL = process.env.EXECUTION_SERVER_URL || 'http://localhost:8080';

interface ExecutionResult {
  success: boolean;
  output?: string;
  result?: string;
  error?: string;
  executionTime?: number;
  status?: string;
}

// Clean output by removing input prompts and echoed input values
function cleanExecutionOutput(output: string, input: string): string {
  if (!output || !input) return output;
  
  const inputLines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const outputLines = output.split('\n');
  
  const cleanLines = outputLines.filter((line: string) => {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) return false;
    
    // Remove lines that are just the input values
    if (inputLines.some((inputLine: string) => inputLine === trimmed)) {
      return false;
    }
    
    // Remove common input prompt patterns
    if (trimmed.endsWith(':') && trimmed.length < 50) {
      // Likely an input prompt like "Name:" or "Enter something:"
      return false;
    }
    
    return true;
  });
  
  return cleanLines.join('\n').trim();
}

// Poll for execution result
async function pollForResult(executionId: string, maxAttempts = 30): Promise<ExecutionResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${EXECUTION_SERVER_URL}/api/execute/${executionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'CodiFY-Frontend/1.0',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'completed' || result.status === 'failed') {
          return result;
        }
      }
      
      // Wait 1 second before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Polling attempt ${attempt + 1} failed:`, error);
    }
  }
  
  return { success: false, error: 'Execution timeout' };
}

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
    const requestBody: {
      code: string;
      language: string;
      timeout: number;
      userId: string;
      input?: string;
    } = {
      code,
      language,
      timeout: timeout || 10,
      userId: session.user.id, // ✅ Include userId from session
    };

    // Only include input if it has content
    if (input && input.trim()) {
      requestBody.input = input;
    }

    const executionResponse = await fetch(`${EXECUTION_SERVER_URL}/api/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CodiFY-Frontend/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    if (!executionResponse.ok) {
      const errorData = await executionResponse.json().catch(() => ({}));
      console.error('Execution server error:', {
        status: executionResponse.status,
        statusText: executionResponse.statusText,
        errorData,
        requestBody: { 
          code: code.substring(0, 100) + '...', 
          language, 
          input: input ? input.substring(0, 50) + '...' : undefined, 
          timeout 
        }
      });
      
      return NextResponse.json(
        { 
          error: "Execution server error",
          message: errorData.message || errorData.error || "Failed to execute code",
          details: errorData.details || null
        },
        { status: executionResponse.status }
      );
    }

    const result = await executionResponse.json();
    
    // Filter out input prompts from output
    let cleanOutput = result.output || result.result || "";
    if (cleanOutput && input) {
      cleanOutput = cleanExecutionOutput(cleanOutput, input);
    }
    
    // Handle async execution response
    if (result.executionId && result.status === 'pending') {
      // For async execution, poll for result
      const pollResult = await pollForResult(result.executionId);
      return NextResponse.json({
        success: pollResult.success || false,
        output: cleanOutput || pollResult.output || pollResult.result || "",
        error: pollResult.error || null,
        executionTime: pollResult.executionTime || 0,
        user: {
          id: session.user.id,
          name: session.user.name,
          role: session.user.role,
        }
      });
    }
    
    // Handle synchronous execution response
    return NextResponse.json({
      success: result.success || false,
      output: cleanOutput,
      error: result.error || null,
      executionTime: result.executionTime || 0,
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
        'User-Agent': 'CodiFY-Frontend/1.0',
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
