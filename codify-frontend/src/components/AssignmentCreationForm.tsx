'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Editor } from '@monaco-editor/react';
import { useTheme } from 'next-themes';
import { 
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  Save,
  Code
} from 'lucide-react';

interface Classroom {
  id: string;
  name: string;
  description: string;
  code: string;
  createdAt: string;
  _count: {
    enrollments: number;
  };
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isVisible: boolean;
}

interface AssignmentCreationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classrooms: Classroom[];
  onAssignmentCreated: () => void;
}

const DEFAULT_CODE_TEMPLATES = {
  python: `# Write your solution here
def solve():
    # Your code goes here
    pass

# Call your function
solve()`,
  javascript: `// Write your solution here
function solve() {
    // Your code goes here
}

// Call your function
solve();`
};

export default function AssignmentCreationForm({ 
  open, 
  onOpenChange, 
  classrooms, 
  onAssignmentCreated 
}: AssignmentCreationFormProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    classroomId: '',
    language: 'python',
    code: DEFAULT_CODE_TEMPLATES.python,
    dueDate: '',
    dueTime: '',
    points: 100,
    allowLateSubmissions: false,
    penaltyPercentage: 2,
    maxPenalty: 50,
  });

  // Test cases state
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: '1', input: '', expectedOutput: '', isVisible: true }
  ]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.classroomId) newErrors.classroomId = 'Classroom is required';
        break;
      case 2:
        if (!formData.language) newErrors.language = 'Language is required';
        if (!formData.code.trim()) newErrors.code = 'Starter code is required';
        break;
      case 3:
        const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
        if (validTestCases.length === 0) {
          newErrors.testCases = 'At least one test case is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleLanguageChange = (language: string) => {
    setFormData(prev => ({
      ...prev,
      language,
      code: DEFAULT_CODE_TEMPLATES[language as keyof typeof DEFAULT_CODE_TEMPLATES] || ''
    }));
  };

  const addTestCase = () => {
    const newId = (testCases.length + 1).toString();
    setTestCases(prev => [...prev, { 
      id: newId, 
      input: '', 
      expectedOutput: '', 
      isVisible: true 
    }]);
  };

  const removeTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(prev => prev.filter(tc => tc.id !== id));
    }
  };

  const updateTestCase = (id: string, field: keyof TestCase, value: string | boolean) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === id ? { ...tc, [field]: value } : tc
    ));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    setErrors({});

    try {
      const dueDateTime = formData.dueDate && formData.dueTime 
        ? new Date(`${formData.dueDate}T${formData.dueTime}`).toISOString()
        : null;

      const validTestCases = testCases.filter(tc => 
        tc.input.trim() || tc.expectedOutput.trim()
      );

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.trim(),
        classroomId: formData.classroomId,
        language: formData.language,
        code: formData.code,
        testCases: validTestCases,
        dueDate: dueDateTime,
        points: formData.points,
        allowLateSubmissions: formData.allowLateSubmissions,
        penaltyPercentage: formData.penaltyPercentage,
        maxPenalty: formData.maxPenalty,
      };

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        onAssignmentCreated();
        onOpenChange(false);
        resetForm();
      } else {
        setErrors({ submit: data.error || 'Failed to create assignment' });
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      classroomId: '',
      language: 'python',
      code: DEFAULT_CODE_TEMPLATES.python,
      dueDate: '',
      dueTime: '',
      points: 100,
      allowLateSubmissions: false,
      penaltyPercentage: 2,
      maxPenalty: 50,
    });
    setTestCases([{ id: '1', input: '', expectedOutput: '', isVisible: true }]);
    setCurrentStep(1);
    setErrors({});
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <Label htmlFor="title" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Assignment Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Python Basics - Variables and Functions"
                  className={`mt-2 h-12 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 ${
                    errors.title ? 'border-red-400 ring-red-100 dark:ring-red-900/30' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="lg:col-span-2">
                <Label htmlFor="description" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of what students need to accomplish..."
                  rows={4}
                  className={`mt-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 resize-none ${
                    errors.description ? 'border-red-400 ring-red-100 dark:ring-red-900/30' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="lg:col-span-2">
                <Label htmlFor="instructions" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Detailed Instructions
                  <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-2">(Optional)</span>
                </Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Detailed instructions, requirements, examples..."
                  rows={6}
                  className="mt-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 resize-none"
                />
              </div>

              <div className="lg:col-span-2">
                <Label htmlFor="classroom" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Classroom *
                </Label>
                <Select 
                  value={formData.classroomId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, classroomId: value }))}
                >
                  <SelectTrigger className={`mt-2 h-12 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 ${
                    errors.classroomId ? 'border-red-400 ring-red-100 dark:ring-red-900/30' : 'border-zinc-200 dark:border-zinc-700'
                  }`}>
                    <SelectValue placeholder="Select a classroom" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
                    {classrooms.map((classroom) => (
                      <SelectItem key={classroom.id} value={classroom.id} className="focus:bg-purple-50 dark:focus:bg-purple-900/20">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{classroom.name}</span>
                          <span className="text-xs text-zinc-500 ml-2">
                            {classroom._count.enrollments} student{classroom._count.enrollments !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classroomId && (
                  <p className="text-sm text-red-500 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-4 h-4" />
                    {errors.classroomId}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Label htmlFor="language" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Programming Language *
                </Label>
                <Select value={formData.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="mt-2 h-12 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
                    <SelectItem value="python" className="focus:bg-purple-50 dark:focus:bg-purple-900/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Python
                      </div>
                    </SelectItem>
                    <SelectItem value="javascript" className="focus:bg-purple-50 dark:focus:bg-purple-900/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        JavaScript
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-purple-50 to-zinc-50 dark:from-purple-900/20 dark:to-zinc-800/20 p-4 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                  <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">Language Features</h4>
                  <div className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                    {formData.language === 'python' ? (
                      <>
                        <p>• Standard library modules available</p>
                        <p>• Math, random, datetime, json supported</p>
                        <p>• Input/output handling enabled</p>
                      </>
                    ) : (
                      <>
                        <p>• Node.js runtime environment</p>
                        <p>• Built-in modules: fs, path, util, crypto</p>
                        <p>• Console input/output support</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="code" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Starter Code *
                </Label>
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Code className="w-3 h-3" />
                  <span>{formData.language === 'python' ? 'Python' : 'JavaScript'} Editor</span>
                </div>
              </div>
              <div className="border-2 border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-all duration-200 focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 dark:focus-within:ring-purple-900/30 shadow-lg">
                <Editor
                  height="400px"
                  language={formData.language}
                  value={formData.code}
                  onChange={(value) => setFormData(prev => ({ ...prev, code: value || '' }))}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Consolas, monospace",
                    wordWrap: 'on',
                    automaticLayout: true,
                    lineNumbers: 'on',
                    folding: true,
                    autoIndent: 'full',
                    formatOnType: true,
                    formatOnPaste: true,
                    roundedSelection: false,
                    scrollbar: {
                      vertical: 'visible',
                      horizontal: 'visible',
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8,
                    },
                    overviewRulerBorder: false,
                  }}
                />
              </div>
              {errors.code && (
                <p className="text-sm text-red-500 mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4" />
                  {errors.code}
                </p>
              )}
              <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                <p><strong>Tips:</strong> Provide a good starting template that helps students understand the problem structure. Include helpful comments and function signatures where appropriate.</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-purple-50 to-zinc-50 dark:from-purple-900/20 dark:to-zinc-800/20 p-4 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
              <div>
                <Label className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Test Cases
                </Label>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Define input/output pairs to validate student solutions
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTestCase}
                className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Test Case
              </Button>
            </div>

            {errors.testCases && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {errors.testCases}
                </p>
              </div>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {testCases.map((testCase, index) => (
                <div key={testCase.id} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg flex items-center justify-center text-sm font-semibold shadow-lg">
                        {index + 1}
                      </div>
                      <div>
                        <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                          Test Case {index + 1}
                        </Label>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Define the expected input and output
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <input
                          type="checkbox"
                          id={`visible-${testCase.id}`}
                          checked={testCase.isVisible}
                          onChange={(e) => updateTestCase(testCase.id, 'isVisible', e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-zinc-300 rounded focus:ring-purple-500"
                        />
                        <Label htmlFor={`visible-${testCase.id}`} className="text-xs font-medium cursor-pointer">
                          Visible to students
                        </Label>
                      </div>
                      {testCases.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestCase(testCase.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`input-${testCase.id}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Input
                      </Label>
                      <Textarea
                        id={`input-${testCase.id}`}
                        value={testCase.input}
                        onChange={(e) => updateTestCase(testCase.id, 'input', e.target.value)}
                        placeholder="Input for this test case..."
                        rows={4}
                        className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 resize-none font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`output-${testCase.id}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Expected Output
                      </Label>
                      <Textarea
                        id={`output-${testCase.id}`}
                        value={testCase.expectedOutput}
                        onChange={(e) => updateTestCase(testCase.id, 'expectedOutput', e.target.value)}
                        placeholder="Expected output..."
                        rows={4}
                        className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 resize-none font-mono text-sm"
                      />
                    </div>
                  </div>

                  {!testCase.isVisible && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        This test case will be hidden from students and used for grading only
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Test Case Guidelines</h4>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>• Include both simple and complex test cases</p>
                <p>• Test edge cases (empty input, large numbers, special characters)</p>
                <p>• Make some test cases visible to help students understand the problem</p>
                <p>• Keep hidden test cases for comprehensive evaluation</p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Due Date Section */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Due Date & Time</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Set when students need to submit their work</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-2 h-11 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  />
                </div>
                <div>
                  <Label htmlFor="dueTime" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Time</Label>
                  <Input
                    id="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="mt-2 h-11 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                  />
                </div>
              </div>
              {!formData.dueDate && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    No due date set - students can submit anytime
                  </p>
                </div>
              )}
            </div>

            {/* Grading Section */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Grading Configuration</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Set points and evaluation criteria</p>
                </div>
              </div>

              <div>
                <Label htmlFor="points" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Total Points
                </Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 100 }))}
                  className="mt-2 h-11 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Points awarded for completing this assignment successfully
                </p>
              </div>
            </div>

            {/* Late Submission Section */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-2 border-zinc-200 dark:border-zinc-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Late Submission Policy</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Configure penalties for late submissions</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <input
                    type="checkbox"
                    id="allowLateSubmissions"
                    checked={formData.allowLateSubmissions}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowLateSubmissions: e.target.checked }))}
                    className="w-5 h-5 text-amber-600 border-zinc-300 rounded focus:ring-amber-500"
                  />
                  <div>
                    <Label htmlFor="allowLateSubmissions" className="text-sm font-medium cursor-pointer text-zinc-700 dark:text-zinc-300">
                      Allow late submissions
                    </Label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Students can submit after the due date with penalties
                    </p>
                  </div>
                </div>

                {formData.allowLateSubmissions && (
                  <div className="ml-6 space-y-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="penaltyPercentage" className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Penalty per 12-hour period (%)
                        </Label>
                        <Input
                          id="penaltyPercentage"
                          type="number"
                          min="0"
                          max="50"
                          step="0.5"
                          value={formData.penaltyPercentage}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            penaltyPercentage: parseFloat(e.target.value) || 0 
                          }))}
                          className="mt-2 h-11 bg-white/80 dark:bg-amber-900/20 backdrop-blur-sm border-2 border-amber-200 dark:border-amber-700 transition-all duration-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxPenalty" className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Maximum penalty (%)
                        </Label>
                        <Input
                          id="maxPenalty"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.maxPenalty}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            maxPenalty: parseFloat(e.target.value) || 0 
                          }))}
                          className="mt-2 h-11 bg-white/80 dark:bg-amber-900/20 backdrop-blur-sm border-2 border-amber-200 dark:border-amber-700 transition-all duration-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30"
                        />
                      </div>
                    </div>
                    <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        <strong>Example:</strong> With {formData.penaltyPercentage}% penalty per 12-hour period, a submission 1 day late would lose {formData.penaltyPercentage * 2}% of points.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <strong>Error:</strong> {errors.submit}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Basic Information';
      case 2: return 'Code Setup';
      case 3: return 'Test Cases';
      case 4: return 'Configuration';
      default: return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return 'Set up the basic details and requirements for your assignment';
      case 2: return 'Choose the programming language and provide starter code';
      case 3: return 'Define test cases to validate student submissions';
      case 4: return 'Configure grading, deadlines, and submission settings';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white via-purple-50/30 to-zinc-50 dark:from-zinc-950 dark:via-purple-950/20 dark:to-zinc-900 border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm shadow-2xl">
        <DialogHeader className="space-y-4 pb-6 border-b border-zinc-200/50 dark:border-zinc-700/50">
          <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-purple-600 to-zinc-600 bg-clip-text text-transparent">
                Create Assignment
              </span>
              <p className="text-sm font-normal text-zinc-500 dark:text-zinc-400 mt-1">
                Design a coding challenge for your students
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Enhanced Step indicator */}
        <div className="py-6">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-lg ${
                      step <= currentStep
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white scale-110 ring-4 ring-purple-100 dark:ring-purple-900/30'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium transition-colors duration-300 ${
                    step <= currentStep ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {['Info', 'Code', 'Tests', 'Config'][step - 1]}
                  </span>
                </div>
                {step < 4 && (
                  <div className="flex-1 mx-4">
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${
                        step < currentStep
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700'
                          : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modern Step title with description */}
        <div className="mb-6">
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm rounded-xl p-4 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              {getStepTitle()}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {getStepDescription()}
            </p>
          </div>
        </div>

        {/* Enhanced Step content */}
        <div className="min-h-[400px] px-1">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm">
            {renderStepContent()}
          </div>
        </div>

        {/* Enhanced Navigation buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-zinc-200/50 dark:border-zinc-700/50 gap-4 sm:gap-0">
          <div className="order-2 sm:order-1">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="w-full sm:w-auto bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border-zinc-300 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
              >
                <span className="mr-2">←</span>
                Back
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 order-1 sm:order-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full sm:w-auto bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border-zinc-300 dark:border-zinc-600 hover:bg-white dark:hover:bg-zinc-800 shadow-sm"
            >
              Cancel
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Next
                <span className="ml-2">→</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Assignment...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Create Assignment
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
