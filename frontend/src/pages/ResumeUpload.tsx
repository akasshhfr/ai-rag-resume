import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Upload, FileText } from 'lucide-react';

const ResumeUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jdTitle, setJdTitle] = useState('');
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jdTitle || !jdText) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Upload Resume
      const resumeRes = await api.uploadResume(file);
      const resumeId = resumeRes.data.id;

      // 2. Create Job Description
      const jdRes = await api.createJobDescription({ title: jdTitle, raw_text: jdText });
      const jdId = jdRes.data.id;

      // 3. Run Analysis
      const analysisRes = await api.runAnalysis({ resume_id: resumeId, job_description_id: jdId });
      
      // Navigate to results
      navigate(`/analysis/${analysisRes.data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during processing');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">New Analysis</h1>
      
      {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 text-red-200 rounded-lg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-900 p-6 rounded-xl border border-gray-800">
        
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Resume (PDF)</label>
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-indigo-500 transition">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-10 h-10 text-gray-500 mb-3" />
              {file ? (
                <span className="text-indigo-400 font-medium">{file.name}</span>
              ) : (
                <span className="text-gray-400">Click to upload your resume (PDF)</span>
              )}
            </label>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2 border-b border-gray-800 pb-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Job Description
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Job Title</label>
            <input
              type="text"
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-lg transition disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            'Run Analysis'
          )}
        </button>
      </form>
    </div>
  );
};

export default ResumeUpload;
