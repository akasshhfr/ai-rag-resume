import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Target, AlertCircle, BookOpen, MessageSquare } from 'lucide-react';

const AnalysisView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startingInterview, setStartingInterview] = useState(false);

  useEffect(() => {
    if (id) {
      api.getAnalysis(id)
        .then(res => setAnalysis(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleStartInterview = async () => {
    if (!analysis) return;
    setStartingInterview(true);
    try {
      const res = await api.startInterview({
        resume_id: analysis.resume_id,
        analysis_session_id: analysis.id
      });
      navigate(`/interview/${res.data.session_id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to start interview');
      setStartingInterview(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading analysis...</div>;
  if (!analysis) return <div className="text-center py-10 text-red-400">Analysis not found.</div>;

  // Ensure JSON parsing if roadmap/skill_gaps are strings
  const skillGaps = typeof analysis.skill_gaps === 'string' ? JSON.parse(analysis.skill_gaps) : analysis.skill_gaps;
  const roadmap = typeof analysis.roadmap === 'string' ? JSON.parse(analysis.roadmap) : analysis.roadmap;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
          <p className="text-gray-400">Review your fit and start practicing.</p>
        </div>
        <button
          onClick={handleStartInterview}
          disabled={startingInterview}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg transition font-medium disabled:opacity-50"
        >
          <MessageSquare className="w-5 h-5" />
          {startingInterview ? 'Starting...' : 'Start Mock Interview'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ATS Score */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <Target className="w-10 h-10 text-indigo-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">ATS Match Score</h3>
          <div className={`text-5xl font-bold mb-2 ${
            analysis.ats_score >= 80 ? 'text-green-400' :
            analysis.ats_score >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {analysis.ats_score}%
          </div>
          <p className="text-sm text-gray-400">Based on job description match</p>
        </div>

        {/* Skill Gaps */}
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Identified Skill Gaps
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(skillGaps) && skillGaps.map((gap: any, idx: number) => (
              <span key={idx} className="bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                <span className="text-white">{typeof gap === 'string' ? gap : gap.skill}</span>
                {gap.importance && (
                  <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${
                    gap.importance === 'high' ? 'bg-red-900/50 text-red-300' :
                    gap.importance === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-blue-900/50 text-blue-300'
                  }`}>
                    {gap.importance}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-medium flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Recommended Learning Roadmap
        </h3>
        <div className="space-y-6">
          {Array.isArray(roadmap) && roadmap.map((step: any, idx: number) => (
            <div key={idx} className="relative pl-6 border-l-2 border-indigo-900/50 last:border-transparent">
              <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 ring-4 ring-gray-900" />
              <h4 className="text-white font-medium text-lg mb-1">{step.title || step.step || `Step ${idx + 1}`}</h4>
              <p className="text-gray-400 text-sm mb-2">{step.description}</p>
              {step.resources && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {step.resources.map((res: string, rIdx: number) => (
                    <span key={rIdx} className="text-xs bg-gray-800 text-indigo-300 px-2 py-1 rounded">
                      {res}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
