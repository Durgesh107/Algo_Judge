import Editor from '@monaco-editor/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { io } from 'socket.io-client';

// 1. Queries and Mutations
const GET_PROBLEM = gql`
  query GetProblem($id: String!) {
    problem(id: $id) {
      id
      title
      description
      difficulty
      testCases {
        id
        input
        expectedOutput
      }
    }
  }
`;

const GET_SUBMISSIONS = gql`
  query GetSubmissions {
    submissions {
      id
      status
      language
      createdAt
      problemId
      userId
    }
  }
`;

const CREATE_SUBMISSION = gql`
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
      id
      status
    }
  }
`;

// 2. TypeScript Interfaces
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface ProblemData {
  problem: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    testCases: TestCase[];
  };
}

interface ProblemVars {
  id: string;
}

interface SubmissionItem {
  id: string;
  status: string;
  language: string;
  createdAt: string;
  problemId: string;
  userId: string;
}

interface SubmissionsData {
  submissions: SubmissionItem[];
}

interface CreateSubmissionData {
  createSubmission: {
    id: string;
    status: string;
  };
}

interface CreateSubmissionVars {
  input: {
    problemId: string;
    code: string;
    language: string;
    userId: string;
  };
}

const MOCK_USER_ID = "f704fe91-877f-4885-95d6-10748c3c745d";

// Language Boilerplates
const BOILERPLATES: Record<string, string> = {
  javascript: `/**\n * @param {number[]} nums\n * @return {boolean}\n */\nfunction containsDuplicate(nums) {\n    // Write your solution here\n    \n};\n`,
  cpp: `#include <iostream>\n#include <vector>\n#include <unordered_set>\n\nusing namespace std;\n\nbool containsDuplicate(vector<int>& nums) {\n    // Write your solution here\n    \n    return false;\n}\n\nint main() {\n    // Test your logic\n    return 0;\n}`,
  java: `import java.util.*;\n\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your solution here\n        \n        return false;\n    }\n}`
};

export default function Workspace() {
  const { id } = useParams();
  
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(BOILERPLATES['javascript']);
  const [activeTab, setActiveTab] = useState<'description' | 'testcases' | 'submissions'>('description');
  const [latestSubmission, setLatestSubmission] = useState<{ id: string; status: string } | null>(null);

  // Update boilerplate when language changes (if default/empty)
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (!code.trim() || Object.values(BOILERPLATES).includes(code)) {
      setCode(BOILERPLATES[newLang] || '');
    }
  };

  // Fetch problem details & test cases
  const { data: problemData, loading: problemLoading, error: problemError } = useQuery<
    ProblemData,
    ProblemVars
  >(GET_PROBLEM, {
    variables: { id: id || '' },
    skip: !id,
  });

  // Fetch all submissions
  const { data: subHistoryData, refetch: refetchSubmissions } = useQuery<
    SubmissionsData
  >(GET_SUBMISSIONS, {
    pollInterval: 10000,
  });

  const filteredSubmissions = subHistoryData?.submissions.filter(
    (sub) => sub.problemId === id && sub.userId === MOCK_USER_ID
  ) || [];

  // Setup Socket.io listener for real-time verdict updates
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('submission-update', (data: { submissionId: string; status: string }) => {
      refetchSubmissions();
      if (latestSubmission && data.submissionId === latestSubmission.id) {
        setLatestSubmission((prev) => prev ? { ...prev, status: data.status } : null);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [refetchSubmissions, latestSubmission]);

  // Submission mutation hook
  const [submitCode, { loading: subLoading }] = useMutation<
    CreateSubmissionData,
    CreateSubmissionVars
  >(CREATE_SUBMISSION, {
    onCompleted: (data) => {
      refetchSubmissions();
      if (data?.createSubmission) {
        setLatestSubmission({
          id: data.createSubmission.id,
          status: data.createSubmission.status,
        });

        // Join socket room for this specific submission
        const socket = io('http://localhost:5000');
        socket.emit('join-submission', data.createSubmission.id);
        socket.on('submission-update', (update) => {
          setLatestSubmission(update);
          refetchSubmissions();
          socket.disconnect();
        });
      }
    }
  });

  const handleSubmit = useCallback(async () => {
    if (!id || subLoading) return;
    
    try {
      await submitCode({
        variables: {
          input: {
            problemId: id,
            code: code,
            language: language,
            userId: MOCK_USER_ID,
          }
        }
      });
    } catch (err) {
      console.error("Submission failed:", err);
    }
  }, [id, code, language, subLoading, submitCode]);

  // Keyboard shortcut: Ctrl + Enter to Submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'HARD':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-neutral-400 bg-neutral-800 border-neutral-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'PENDING':
      case 'RUNNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse';
      case 'WRONG_ANSWER':
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  return (
    <div className="flex flex-row h-[calc(100vh-3.5rem)] bg-neutral-950 text-neutral-100 overflow-hidden"> 
      
      {/* Left Panel: Tabs (Description, Test Cases, Submissions) */}
      <div className="w-1/2 flex flex-col border-r border-neutral-800 bg-neutral-900/30">
        
        {/* Tab Header */}
        <div className="flex border-b border-neutral-800 bg-neutral-900 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'description' 
                ? 'border-blue-500 text-white' 
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('testcases')}
            className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'testcases' 
                ? 'border-blue-500 text-white' 
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Test Cases ({problemData?.problem?.testCases?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'submissions' 
                ? 'border-blue-500 text-white' 
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Submissions
            {filteredSubmissions.length > 0 && (
              <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded-full border border-neutral-700">
                {filteredSubmissions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-grow p-6 overflow-y-auto">
          {activeTab === 'description' && (
            <div>
              {problemLoading && (
                <div className="flex items-center gap-3 text-neutral-400 py-8">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading problem details...</span>
                </div>
              )}
              {problemError && <p className="text-rose-500">Error loading problem details.</p>}
              
              {problemData?.problem && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
                      {problemData.problem.title}
                    </h1>
                    <span className={`inline-block font-semibold px-3 py-1 rounded-full text-xs border ${getDifficultyBadge(problemData.problem.difficulty)}`}>
                      {problemData.problem.difficulty}
                    </span>
                  </div>
                  
                  <div className="text-neutral-300 space-y-4 leading-relaxed bg-neutral-900/50 p-5 rounded-xl border border-neutral-800/80">
                    <p className="whitespace-pre-line">{problemData.problem.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'testcases' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white tracking-tight">Sample Test Cases</h2>
              {problemData?.problem?.testCases?.length === 0 ? (
                <p className="text-neutral-400 text-sm">No sample test cases available.</p>
              ) : (
                problemData?.problem?.testCases?.map((tc, idx) => (
                  <div key={tc.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Test Case {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Input:</div>
                      <div className="bg-neutral-950 p-3 rounded-lg font-mono text-xs text-neutral-200 border border-neutral-800">
                        {tc.input}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500 mb-1">Expected Output:</div>
                      <div className="bg-neutral-950 p-3 rounded-lg font-mono text-xs text-emerald-400 border border-neutral-800">
                        {tc.expectedOutput}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Submission History</h2>
              {filteredSubmissions.length === 0 ? (
                <div className="text-center py-16 bg-neutral-900/30 rounded-xl border border-neutral-800/60">
                  <p className="text-neutral-400 text-sm">No submissions recorded for this problem yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex justify-between items-center shadow-sm"
                    >
                      <div className="space-y-1">
                        <span className={`inline-block font-semibold px-2.5 py-0.5 rounded-md text-xs border uppercase tracking-wider ${getStatusBadge(sub.status)}`}>
                          {sub.status}
                        </span>
                        <div className="text-xs text-neutral-400">
                          Language: <strong className="text-neutral-200 capitalize">{sub.language}</strong>
                        </div>
                      </div>
                      <div className="text-right text-xs text-neutral-500 font-mono">
                        {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Code Editor & Live Console */}
      <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800 bg-neutral-900">
          <select 
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-neutral-800 text-neutral-200 text-xs font-medium rounded-lg px-3 py-2 outline-none border border-neutral-700 focus:border-blue-500 cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 hidden sm:inline">Ctrl + Enter to Submit</span>
            <button 
              onClick={handleSubmit}
              disabled={subLoading}
              className={`${
                subLoading ? 'bg-neutral-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
              } text-white px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 flex items-center gap-2`}
            >
              {subLoading && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {subLoading ? 'Evaluating...' : 'Submit Code'}
            </button>
          </div>
        </div>
        
        {/* Editor */}
        <div className="flex-grow">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            theme="vs-dark"
            value={code}
            onChange={(val) => val !== undefined && setCode(val)}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Live Execution Console Drawer */}
        {latestSubmission && (
          <div className="border-t border-neutral-800 bg-neutral-900 p-4 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-400">Latest Verdict:</span>
              <span className={`px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider ${getStatusBadge(latestSubmission.status)}`}>
                {latestSubmission.status}
              </span>
            </div>
            <button 
              onClick={() => { setActiveTab('submissions'); setLatestSubmission(null); }}
              className="text-xs text-blue-400 hover:underline"
            >
              View in Submissions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}