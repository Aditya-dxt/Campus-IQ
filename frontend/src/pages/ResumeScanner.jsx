import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ResumeUploader from '../components/ResumeUploader';
import { scoreResume } from '../api/resume';
import { CheckCircle, AlertCircle, Sparkles, Target, TrendingUp, Award } from 'lucide-react';

const ResumeScanner = () => {
  const { user } = useAuth();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (file, jobDescription) => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const data = await scoreResume(file, jobDescription);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  // Progress ring SVG helper
  const ProgressRing = ({ score, size = 140, strokeWidth = 10 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{ animation: 'progress-fill 1.5s ease-out forwards' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-surface-800">{score}</span>
          <span className="text-xs text-surface-500 font-medium">out of 100</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-enter max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl text-white">
            <Target size={24} />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Resume Scanner</h1>
        </div>
        <p className="text-surface-500 ml-14">
          Upload your resume and paste a job description to get AI-powered feedback
        </p>
      </div>

      {/* Upload Section */}
      {!results && (
        <div className="animate-fade-in">
          <ResumeUploader onSubmit={handleSubmit} loading={loading} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center gap-3 animate-slide-down">
          <AlertCircle size={20} className="text-danger-500 flex-shrink-0" />
          <p className="text-danger-700 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-fade-in">
          {/* Score + Strengths Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Ring */}
            <div className="bg-white rounded-2xl border border-surface-200 p-8 flex flex-col items-center justify-center shadow-card">
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">Match Score</h3>
              <ProgressRing score={results.score} />
              <p className="mt-4 text-sm text-surface-600">
                {results.score >= 75 ? '🎉 Strong match!' : results.score >= 50 ? '💪 Getting there!' : '📋 Needs improvement'}
              </p>
            </div>

            {/* Missing Keywords */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-warning-500" />
                <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Missing Keywords</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.missing_keywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-warning-50 text-warning-700 rounded-full text-sm font-medium border border-warning-200 animate-scale-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs text-surface-400">
                Add these to your resume to improve your match score
              </p>
            </div>

            {/* Strengths */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} className="text-success-500" />
                <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Strengths</h3>
              </div>
              <ul className="space-y-2.5">
                {results.strengths?.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-surface-700 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                    <CheckCircle size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-primary-500" />
              <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Suggested Improvements</h3>
            </div>
            <div className="space-y-3">
              {results.suggestions.map((suggestion, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-primary-50/50 rounded-xl border border-primary-100 animate-fade-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-surface-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scan Again Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setResults(null)}
              className="px-6 py-3 bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200 transition-all flex items-center gap-2"
            >
              <TrendingUp size={18} />
              Scan Another Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeScanner;
