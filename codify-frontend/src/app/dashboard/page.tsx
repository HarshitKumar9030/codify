"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Plus, 
  Users, 
  BookOpen, 
  Code, 
  LogOut,
  Copy,
  UserPlus,
  GraduationCap,
  Loader2
} from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ThemeToggle } from "@/components/theme-toggle";

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  createdAt: string;
  _count: {
    enrollments: number;
  };
  isTeacher?: boolean;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  executionId?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  language: string;
  code: string;
  dueDate?: string;
  points: number;
  createdAt: string;
  classroom: {
    id: string;
    name: string;
  };
  _count?: {
    submissions: number;
  };
  submissions?: Array<{
    id: string;
    status: string;
    score?: number;
    submittedAt: string;
  }>;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("classrooms");
  
  // Classroom creation state
  const [createClassroomOpen, setCreateClassroomOpen] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    description: ""
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Join classroom state
  const [joinClassroomOpen, setJoinClassroomOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);

  // Code execution state
  const [code, setCode] = useState(`// Welcome to CodiFY!
// Write your JavaScript code here and click Run to execute

function greet(name) {
  return \`Hello, \${name}! Welcome to CodiFY.\`;
}

console.log(greet("Developer"));
console.log("Ready to start coding!");`);
  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [executionLoading, setExecutionLoading] = useState(false);

  // Assignment state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [createAssignmentOpen, setCreateAssignmentOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    instructions: "",
    language: "javascript",
    code: "",
    classroomId: "",
    dueDate: "",
    points: 100
  });
  const [assignmentLoading, setAssignmentLoading] = useState(false);

  // Update code template when language changes
  useEffect(() => {
    if (language === "python" && code.includes("// Welcome to CodiFY!")) {
      setCode(`# Welcome to CodiFY!
# Write your Python code here and click Run to execute

def greet(name):
    return f"Hello, {name}! Welcome to CodiFY."

print(greet("Developer"))
print("Ready to start coding!")

# For input, use: input("Enter something: ")
# Multiple inputs can be provided in the Input section below`);
    } else if (language === "javascript" && code.includes("# Welcome to CodiFY!")) {
      setCode(`// Welcome to CodiFY!
// Write your JavaScript code here and click Run to execute

function greet(name) {
  return \`Hello, \${name}! Welcome to CodiFY.\`;
}

console.log(greet("Developer"));
console.log("Ready to start coding!");`);
    }
  }, [language, code]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchClassrooms();
    fetchAssignments();
  }, [session, status, router]);

  const fetchClassrooms = async () => {
    try {
      const response = await fetch("/api/classrooms");
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data.classrooms || []);
      }
    } catch (error) {
      console.error("Failed to fetch classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  };

  const createClassroom = async () => {
    if (!newClassroom.name.trim()) return;
    
    setCreateLoading(true);
    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClassroom),
      });

      if (response.ok) {
        setNewClassroom({ name: "", description: "" });
        setCreateClassroomOpen(false);
        fetchClassrooms();
      }
    } catch (error) {
      console.error("Failed to create classroom:", error);
    } finally {
      setCreateLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!newAssignment.title.trim() || !newAssignment.classroomId) return;
    
    setAssignmentLoading(true);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });

      if (response.ok) {
        setNewAssignment({
          title: "",
          description: "",
          instructions: "",
          language: "javascript",
          code: "",
          classroomId: "",
          dueDate: "",
          points: 100
        });
        setCreateAssignmentOpen(false);
        fetchAssignments();
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Failed to create assignment"}`);
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
      alert("Network error: Failed to create assignment");
    } finally {
      setAssignmentLoading(false);
    }
  };

  const joinClassroom = async () => {
    if (!joinCode.trim()) return;
    
    setJoinLoading(true);
    try {
      const response = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setJoinCode("");
        setJoinClassroomOpen(false);
        fetchClassrooms();
      } else {
        // Handle different error cases
        if (response.status === 409) {
          // Already enrolled
          alert(`Already enrolled: ${data.message || data.error}`);
        } else if (response.status === 403) {
          // Permission error (e.g., teacher trying to join)
          alert(`Permission denied: ${data.error}`);
        } else if (response.status === 404) {
          // Classroom not found
          alert(`Classroom not found: ${data.error}`);
        } else {
          alert(`Error: ${data.error || "Failed to join classroom"}`);
        }
      }
    } catch (error) {
      console.error("Failed to join classroom:", error);
      alert("Network error: Failed to join classroom");
    } finally {
      setJoinLoading(false);
    }
  };

  const executeCode = async () => {
    if (!code.trim()) return;
    
    setExecutionLoading(true);
    setOutput("");
    
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          input,
          timeout: 10,
        }),
      });

      const result: ExecutionResult = await response.json();
      
      if (result.success) {
        setOutput(result.output || "");
      } else {
        setOutput(`Error: ${result.error || "Unknown error occurred"}`);
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : "Network error"}`);
    } finally {
      setExecutionLoading(false);
    }
  };

  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950 flex items-center justify-center">
        <div className="flex items-center space-x-3 bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-purple-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-zinc-600 rounded-lg flex items-center justify-center">
                  <Code className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-zinc-600 bg-clip-text text-transparent">
                  CodiFY
                </span>
              </div>
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {session?.user?.role === "TEACHER" ? "Teacher" : "Student"}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                Welcome, {session?.user?.name || "User"}
              </span>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/api/auth/signout")}
                className="flex items-center space-x-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit lg:grid-cols-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <TabsTrigger value="classrooms" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <Users className="h-4 w-4" />
              <span>Classrooms</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <Code className="h-4 w-4" />
              <span>Code Editor</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center space-x-2 data-[state=active]:bg-purple-100 dark:data-[state=active]:bg-purple-900/30 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300">
              <BookOpen className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
          </TabsList>

          {/* Classrooms Tab */}
          <TabsContent value="classrooms" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Classrooms</h1>
              <div className="flex space-x-3">
                {session?.user?.role === "TEACHER" && (
                  <Dialog open={createClassroomOpen} onOpenChange={setCreateClassroomOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Classroom
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create New Classroom</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Classroom Name</Label>
                          <Input
                            id="name"
                            value={newClassroom.name}
                            onChange={(e) => setNewClassroom(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter classroom name"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description (Optional)</Label>
                          <Textarea
                            id="description"
                            value={newClassroom.description}
                            onChange={(e) => setNewClassroom(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter classroom description"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[80px] focus:ring-purple-500 dark:focus:ring-purple-400"
                          />
                        </div>
                        <Button 
                          onClick={createClassroom} 
                          className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                          disabled={createLoading || !newClassroom.name.trim()}
                        >
                          {createLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Classroom"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                <Dialog open={joinClassroomOpen} onOpenChange={setJoinClassroomOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-lg">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Classroom
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Join Classroom</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Classroom Code</Label>
                        <Input
                          id="code"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                          placeholder="Enter 8-digit classroom code"
                          maxLength={8}
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 text-center font-mono text-lg tracking-wider focus:ring-purple-500 dark:focus:ring-purple-400"
                        />
                      </div>
                      <Button 
                        onClick={joinClassroom} 
                        className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                        disabled={joinLoading || joinCode.length !== 8}
                      >
                        {joinLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          "Join Classroom"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <Card key={classroom.id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-600">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{classroom.name}</CardTitle>
                      {classroom.isTeacher && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          Teacher
                        </Badge>
                      )}
                    </div>
                    {classroom.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">{classroom.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Class Code:</span>
                        <div className="flex items-center space-x-2">
                          <code className="bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md text-sm font-mono font-semibold text-purple-600 dark:text-purple-400 border border-zinc-200 dark:border-zinc-700">
                            {classroom.code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyClassroomCode(classroom.code)}
                            className="h-8 w-8 p-0 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-zinc-600 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Students:</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{classroom._count?.enrollments || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Created:</span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {new Date(classroom.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Code Editor Tab */}
          <TabsContent value="code" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Code Editor</h1>
              <div className="flex items-center space-x-3">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-36 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <SelectItem value="javascript" className="text-zinc-900 dark:text-zinc-100 focus:bg-purple-100 dark:focus:bg-purple-900/30">JavaScript</SelectItem>
                    <SelectItem value="python" className="text-zinc-900 dark:text-zinc-100 focus:bg-purple-100 dark:focus:bg-purple-900/30">Python</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={executeCode} 
                  disabled={executionLoading}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg"
                >
                  {executionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Code
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Code Input */}
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="min-h-[350px] font-mono text-sm bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 resize-none focus:ring-purple-500 dark:focus:ring-purple-400"
                    placeholder={`Write your ${language} code here...`}
                  />
                  {language === "python" && (
                    <div className="space-y-2">
                      <Label htmlFor="input" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Program Input (Optional)
                      </Label>
                      <Textarea
                        id="input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="h-20 font-mono text-sm bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-purple-500 dark:focus:ring-purple-400"
                        placeholder="Enter input for your program (each line will be passed as input)..."
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Each line will be provided as input when your program calls input()
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Output */}
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Output
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[350px] bg-zinc-950 dark:bg-zinc-950 rounded-lg p-4 overflow-auto border border-zinc-800 dark:border-zinc-700">
                    <SyntaxHighlighter
                      language="text"
                      style={oneDark}
                      customStyle={{
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}
                    >
                      {output || "// Output will appear here after running your code"}
                    </SyntaxHighlighter>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Assignments</h1>
              {session?.user?.role === "TEACHER" && (
                <Dialog open={createAssignmentOpen} onOpenChange={setCreateAssignmentOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create New Assignment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Assignment Title</Label>
                          <Input
                            id="title"
                            value={newAssignment.title}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter assignment title"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="classroom" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Classroom</Label>
                          <Select value={newAssignment.classroomId} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, classroomId: value }))}>
                            <SelectTrigger className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                              <SelectValue placeholder="Select classroom" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                              {classrooms.filter(c => c.isTeacher).map((classroom) => (
                                <SelectItem key={classroom.id} value={classroom.id} className="text-zinc-900 dark:text-zinc-100">
                                  {classroom.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</Label>
                        <Textarea
                          id="description"
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter assignment description"
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instructions" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={newAssignment.instructions}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="Enter detailed instructions for students"
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[100px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="language" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Programming Language</Label>
                          <Select value={newAssignment.language} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, language: value }))}>
                            <SelectTrigger className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                              <SelectItem value="javascript" className="text-zinc-900 dark:text-zinc-100">JavaScript</SelectItem>
                              <SelectItem value="python" className="text-zinc-900 dark:text-zinc-100">Python</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="points" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Points</Label>
                          <Input
                            id="points"
                            type="number"
                            value={newAssignment.points}
                            onChange={(e) => setNewAssignment(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                            placeholder="100"
                            className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Starter Code (Optional)</Label>
                        <Textarea
                          id="code"
                          value={newAssignment.code}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="Enter starter code for students"
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 min-h-[120px] font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Date (Optional)</Label>
                        <Input
                          id="dueDate"
                          type="datetime-local"
                          value={newAssignment.dueDate}
                          onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <Button 
                        onClick={createAssignment} 
                        className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                        disabled={assignmentLoading || !newAssignment.title.trim() || !newAssignment.classroomId}
                      >
                        {assignmentLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Assignment"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {assignments.length === 0 ? (
              <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <CardContent className="py-16">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">No assignments yet</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                      {session?.user?.role === "TEACHER" 
                        ? "Create your first assignment to get started with coding challenges for your students."
                        : "Your teacher hasn't created any assignments yet. Check back soon for coding challenges!"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-purple-300 dark:hover:border-purple-600">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{assignment.title}</CardTitle>
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {assignment.points} pts
                        </Badge>
                      </div>
                      {assignment.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">{assignment.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-700/50">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Language:</span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {assignment.language}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Classroom:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{assignment.classroom.name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Created:</span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {new Date(assignment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {assignment.dueDate && (
                          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800/50">
                            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Due:</span>
                            <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <Button 
                          className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                          onClick={() => router.push(`/assignments/${assignment.id}`)}
                        >
                          {session?.user?.role === "TEACHER" ? "View Assignment" : "Start Assignment"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

