import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { FileText, Activity, Plus } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resResumes, resAnalyses] = await Promise.all([
          api.listResumes(),
          api.listAnalyses()
        ]);
        setResumes(resResumes.data);
        setAnalyses(resAnalyses.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          to="/upload"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          New Analysis
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Recent Analyses
          </h2>
          {analyses.length === 0 ? (
            <p className="text-gray-400 text-sm">No analyses yet.</p>
          ) : (
            <div className="space-y-3">
              {analyses.map(a => (
                <Link key={a.id} to={`/analysis/${a.id}`} className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition border border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">Score: {a.ats_score}%</p>
                      <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      a.ats_score >= 80 ? 'bg-green-900/50 text-green-400' :
                      a.ats_score >= 60 ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {a.ats_score >= 80 ? 'Excellent' : a.ats_score >= 60 ? 'Good' : 'Needs Work'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            My Resumes
          </h2>
          {resumes.length === 0 ? (
            <p className="text-gray-400 text-sm">No resumes uploaded.</p>
          ) : (
            <div className="space-y-3">
              {resumes.map(r => (
                <div key={r.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="font-medium text-white truncate">{r.filename}</p>
                  <p className="text-xs text-gray-400">{new Date(r.uploaded_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
