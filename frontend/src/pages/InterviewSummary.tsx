import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Trophy, Home, MessageSquare, TrendingUp } from 'lucide-react';

const InterviewSummary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionId) {
      api.getInterviewSummary(sessionId)
        .then(res => setSummary(res.data))
        .catch(err => {
          console.error(err);
          setError('Failed to load summary');
        })
        .finally(() => setLoading(false));
    }
  }, [sessionId]);

  if (loading) return <div className="text-center py-10">Loading summary...</div>;
  if (error || !summary) return <div className="text-center py-10 text-red-400">{error || 'Summary not found'}</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-900/50 rounded-full mb-4">
          <Trophy className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Interview Complete</h1>
        <p className="text-gray-400">Here's your performance breakdown.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-1">Average Score</p>
          <p className={`text-4xl font-bold ${
            summary.average_score >= 8 ? 'text-green-400' :
            summary.average_score >= 5 ? 'text-yellow-400' : 'text-red-400'
          }`}>{summary.average_score.toFixed(1)}<span className="text-lg text-gray-500">/10</span></p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-1">Total Turns</p>
          <p className="text-4xl font-bold text-white">{summary.total_turns}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-1">Difficulty Progression</p>
          <div className="flex justify-center gap-1 mt-3">
            {summary.difficulty_progression.map((diff: string, i: number) => (
              <span key={i} className={`w-3 h-8 rounded-sm ${
                diff === 'hard' ? 'bg-red-500' :
                diff === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} title={`Turn ${i+1}: ${diff}`} />
            ))}
          </div>
        </div>
      </div>

      {summary.overall_feedback && (
        <div className="bg-indigo-900/20 border border-indigo-900/50 rounded-xl p-6">
          <h3 className="text-lg font-medium text-indigo-300 flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5" />
            Overall Feedback
          </h3>
          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{summary.overall_feedback}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-bold border-b border-gray-800 pb-2">Turn by Turn Analysis</h3>
        {summary.turns.map((turn: any, idx: number) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Turn {turn.turn_number}</span>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  turn.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' :
                  turn.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-green-900/50 text-green-400'
                }`}>{turn.difficulty}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${
                  turn.score >= 8 ? 'bg-green-900/50 text-green-400' :
                  turn.score >= 5 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'
                }`}>Score: {turn.score}/10</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-indigo-400 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> Question
                </p>
                <p className="text-gray-200 font-medium">{turn.question}</p>
              </div>
              
              <div className="pl-4 border-l-2 border-gray-700">
                <p className="text-sm text-gray-500 mb-1">Your Answer</p>
                <p className="text-gray-300">{turn.answer}</p>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Feedback</p>
                <p className="text-gray-200 text-sm whitespace-pre-wrap">{turn.feedback}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link to="/" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition font-medium border border-gray-700">
          <Home className="w-5 h-5" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default InterviewSummary;
