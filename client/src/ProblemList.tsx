import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Problem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export default function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/problems')
      .then((res) => res.json())
      .then((data) => {
        setProblems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching problems:', err);
        setLoading(false);
      });
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
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

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-neutral-950 text-neutral-400">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading problems...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Problem Dashboard</h1>
        <p className="text-neutral-400 text-sm mt-1">Select a challenge, write your code, and run test cases in real-time.</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
          <span>Problem Title</span>
          <span>Difficulty</span>
        </div>
        <div className="divide-y divide-neutral-800/60">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              to={`/problem/${problem.id}`}
              className="px-6 py-4 flex items-center justify-between hover:bg-neutral-800/40 transition-colors group"
            >
              <span className="font-medium text-neutral-200 group-hover:text-blue-400 transition-colors">
                {problem.title}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
            </Link>
          ))}
          {problems.length === 0 && (
            <div className="px-6 py-12 text-center text-neutral-500">
              No problems found in the database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}