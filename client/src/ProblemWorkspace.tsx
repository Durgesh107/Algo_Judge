import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { io } from "socket.io-client";

// GraphQL query to fetch problem details and test cases
const GET_PROBLEM_DETAIL = gql`
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

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface Problem {
  id: string;
  title: string;
  description?: string;
  difficulty?: string;
  testCases?: TestCase[];
}

export default function ProblemWorkspace() {
  const { id } = useParams<{ id: string }>();

  // Fetch problem details via GraphQL from port 4000
  const { data, loading, error } = useQuery<{ problem: Problem }>(GET_PROBLEM_DETAIL, {
    variables: { id: id || "" },
    skip: !id,
  });

  const [code, setCode] = useState<string>("// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    if (cin >> a >> b) {\n        cout << a + b << endl;\n    }\n    return 0;\n}");
  const [language, setLanguage] = useState("cpp");
  const [status, setStatus] = useState<string>("IDLE");
  const [submitting, setSubmitting] = useState(false);

  // Handle code submission via REST endpoint to port 5000
  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    setStatus("PENDING");

    try {
      const response = await fetch("http://localhost:5000/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: id,
          code,
          language,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.submissionId) {
        setupWebSocket(resData.submissionId);
      } else {
        setStatus("ERROR");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setStatus("ERROR");
      setSubmitting(false);
    }
  };

  // Connect to Socket.io on port 5000 to listen for live evaluation results
  const setupWebSocket = (submissionId: string) => {
    const socket = io("http://localhost:5000");

    socket.emit("join-submission", submissionId);

    socket.on("submission-update", (updateData) => {
      if (updateData.submissionId === submissionId) {
        setStatus(updateData.status);
        setSubmitting(false);
        socket.disconnect(); // Close connection once verdict is received
      }
    });
  };

  if (loading) {
    return <div className="p-6 text-neutral-400 bg-neutral-950 min-h-screen">Loading problem workspace...</div>;
  }

  if (error || !data?.problem) {
    return <div className="p-6 text-red-500 bg-neutral-950 min-h-screen">Failed to load problem details.</div>;
  }

  const problem = data.problem;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-neutral-950 text-white overflow-hidden">
      {/* Left Pane: Problem Description */}
      <div className="w-1/2 p-6 border-r border-neutral-800 overflow-y-auto">
        <Link to="/" className="text-sm text-blue-400 hover:underline mb-4 inline-block">
          ← Back to Problem Set
        </Link>
        <h1 className="text-2xl font-bold mb-2">{problem.title}</h1>
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
          problem.difficulty === 'Easy' ? 'text-green-500 bg-green-500/10' :
          problem.difficulty === 'Medium' ? 'text-yellow-500 bg-yellow-500/10' :
          'text-red-500 bg-red-500/10'
        }`}>
          {problem.difficulty || "MEDIUM"}
        </span>

        <div className="mt-6 text-neutral-300 whitespace-pre-wrap leading-relaxed text-sm">
          {problem.description || "Write a program that takes two integers and prints their sum."}
        </div>

        {problem.testCases && problem.testCases.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-neutral-200 mb-3 text-sm">Sample Test Cases:</h3>
            {problem.testCases.map((tc) => (
              <div key={tc.id} className="bg-neutral-900 p-3 rounded-lg mb-3 border border-neutral-800 text-xs font-mono">
                <div className="text-neutral-400">Input: <span className="text-white">{tc.input}</span></div>
                <div className="text-neutral-400 mt-1">Expected Output: <span className="text-green-400">{tc.expectedOutput}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Pane: Code Editor & Submission Controls */}
      <div className="w-1/2 flex flex-col p-6 bg-neutral-900">
        <div className="flex justify-between items-center mb-4">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-neutral-800 text-white px-3 py-1.5 rounded-lg border border-neutral-700 text-sm outline-none"
          >
            <option value="cpp">C++ (GCC)</option>
          </select>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white font-medium text-sm rounded-lg transition"
          >
            {submitting ? "Evaluating..." : "Submit Solution"}
          </button>
        </div>

        {/* Code Input Area */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 w-full bg-neutral-950 font-mono text-sm p-4 rounded-lg border border-neutral-800 text-neutral-100 resize-none outline-none focus:border-neutral-700"
          spellCheck={false}
        />

        {/* Verdict / Status Footer */}
        <div className="mt-4 p-4 bg-neutral-950 rounded-lg border border-neutral-800 flex justify-between items-center">
          <span className="text-neutral-400 text-sm">Status Verdict:</span>
          <span className={`font-bold px-3 py-1 rounded text-xs tracking-wider ${
            status === "ACCEPTED" ? "bg-green-950 text-green-300 border border-green-800" :
            status === "PENDING" ? "bg-yellow-950 text-yellow-300 border border-yellow-800 animate-pulse" :
            status === "IDLE" ? "bg-neutral-800 text-neutral-400" :
            "bg-red-950 text-red-300 border border-red-800"
          }`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}