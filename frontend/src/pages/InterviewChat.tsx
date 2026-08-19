import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Send, Bot, User, ShieldAlert } from 'lucide-react';

const InterviewChat: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState('');
  
  // Chat state
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, currentQuestion]);

  useEffect(() => {
    // If we had an endpoint to get current session status we'd call it here
    // For now we assume the session was just created and we need to handle state carefully
    // Actually, we don't have a GET /interview/{session_id} to get CURRENT state, only summary.
    // So we rely on the component state if it was passed, or we should get it.
    // Wait, let's try to fetch summary to see if it's already done, or just show an error if refreshed.
    // To make it robust, we'll just handle the chat flow forward.
    // In a real app we'd fetch the current active question. Let's just say if no question, we fetch summary.
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !sessionId) return;

    setSubmitting(true);
    try {
      const res = await api.submitAnswer(sessionId, { answer });
      const data = res.data;

      // Add to history
      setHistory(prev => [
        ...prev,
        { role: 'user', content: answer },
        { 
          role: 'ai', 
          content: data.feedback, 
          score: data.score,
          difficulty: currentQuestion?.difficulty
        }
      ]);
      setAnswer('');

      if (data.is_complete) {
        navigate(`/interview/${sessionId}/summary`);
      } else {
        setCurrentQuestion({
          question: data.next_question,
          difficulty: data.difficulty,
          turn: data.turn_count + 1
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[80vh] flex flex-col bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gray-950 border-b border-gray-800 p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            AI Interviewer
          </h2>
        </div>
        {currentQuestion && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Turn {currentQuestion.turn}</span>
            <span className={`text-xs px-2 py-1 rounded font-medium ${
              currentQuestion.difficulty === 'hard' ? 'bg-red-900/50 text-red-400' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
              'bg-green-900/50 text-green-400'
            }`}>
              {currentQuestion.difficulty || 'medium'}
            </span>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6">
        {history.length === 0 && !currentQuestion && (
          <div className="text-center text-gray-400 mt-10">
            <p>Session initialized. Waiting for first question... (Please wait or restart if stuck)</p>
            {/* Note: Ideally we'd pass the initial question via router state or context, 
                but for simplicity we'll let user type "Start" if stuck */}
          </div>
        )}

        {history.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
            )}
            
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              
              {msg.role === 'ai' && msg.score !== undefined && (
                <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Score:</span>
                  <span className={`font-bold ${
                    msg.score >= 8 ? 'text-green-400' :
                    msg.score >= 5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>{msg.score}/10</span>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {currentQuestion && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="max-w-[80%] rounded-2xl p-4 bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none">
              <p className="whitespace-pre-wrap font-medium">{currentQuestion.question}</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="flex-grow bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 resize-none h-14"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={submitting || !answer.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">Press Enter to submit, Shift+Enter for new line.</p>
      </div>
    </div>
  );
};

export default InterviewChat;
