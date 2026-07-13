import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLatestScore } from '../api/resume';
import { getStudentRisk } from '../api/predict';
import { getUpcoming } from '../api/schedule';
import { LayoutDashboard, FileText, Calendar, MessageSquare, ArrowRight, Loader2, Target, CheckCircle2 } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [resumeScore, setResumeScore] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [score, risk, upcoming] = await Promise.all([
          getLatestScore(user?.id),
          getStudentRisk(user?.id),
          getUpcoming(3),
        ]);
        setResumeScore(score);
        setRiskData(risk);
        setUpcomingClasses(upcoming);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) loadDashboardData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  // Supportive framing for risk
  const getRiskSupportMessage = (riskLevel) => {
    switch(riskLevel) {
      case 'low': return { title: 'On Track! 🎉', text: 'Keep up the great work.', color: 'text-success-600', bg: 'bg-success-50' };
      case 'medium': return { title: 'Minor Attention Needed', text: 'Focus on your upcoming deadlines.', color: 'text-warning-600', bg: 'bg-warning-50' };
      case 'high': return { title: 'Let\'s Get Back on Track', text: 'Check your study plan to improve scores.', color: 'text-primary-600', bg: 'bg-primary-50' };
      default: return { title: 'Looking Good', text: 'Keep maintaining your streak.', color: 'text-primary-600', bg: 'bg-primary-50' };
    }
  };

  const riskMessage = getRiskSupportMessage(riskData?.risk);

  return (
    <div className="page-enter max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl"></div>
        <div className="relative z-10 flex items-center gap-4 mb-2">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
            <LayoutDashboard size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
            <p className="text-primary-100 mt-1">Here's your academic and career overview for today.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placement Readiness */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card animate-slide-up hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-accent-50 text-accent-600 rounded-xl">
              <Target size={24} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">Readiness</span>
          </div>
          <h3 className="text-3xl font-bold text-surface-900 mb-2">
            {riskData?.readiness || 0}%
          </h3>
          <p className="text-sm text-surface-500 mb-4">Placement Readiness Score</p>
          <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-accent-500 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${riskData?.readiness || 0}%` }}
            />
          </div>
        </div>

        {/* Resume Score */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card animate-slide-up delay-100 hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
              <FileText size={24} />
            </div>
            <Link to="/resume" className="text-primary-600 hover:text-primary-700 p-1">
              <ArrowRight size={20} />
            </Link>
          </div>
          <h3 className="text-3xl font-bold text-surface-900 mb-2">
            {resumeScore?.score || 'N/A'}
          </h3>
          <p className="text-sm text-surface-500 mb-4">Latest Resume Score</p>
          {resumeScore?.suggestions?.[0] && (
            <p className="text-xs text-surface-600 bg-surface-50 p-2 rounded-lg border border-surface-100 line-clamp-2">
              <span className="font-medium">Tip:</span> {resumeScore.suggestions[0]}
            </p>
          )}
        </div>

        {/* Academic Status (Supportive) */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card animate-slide-up delay-200 hover:shadow-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${riskMessage.bg} ${riskMessage.color}`}>
              <CheckCircle2 size={24} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">Status</span>
          </div>
          <h3 className={`text-xl font-bold mb-1 ${riskMessage.color}`}>
            {riskMessage.title}
          </h3>
          <p className="text-sm text-surface-500 mb-4">{riskMessage.text}</p>
          {riskData?.topFactor && (
            <div className="text-xs text-surface-600 bg-surface-50 p-2.5 rounded-lg border border-surface-100">
              <span className="font-semibold block mb-1">Focus Area:</span>
              {riskData.topFactor}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Classes */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card animate-slide-up delay-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-surface-900 flex items-center gap-2">
              <Calendar size={20} className="text-primary-500" />
              Up Next
            </h3>
            <Link to="/schedule" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View Schedule</Link>
          </div>
          <div className="space-y-4">
            {upcomingClasses.length > 0 ? upcomingClasses.map(block => (
              <div key={block.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 transition-colors border border-transparent hover:border-surface-100 group">
                <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: block.color }}></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-surface-900 group-hover:text-primary-700 transition-colors">{block.subject}</h4>
                  <p className="text-sm text-surface-500">{block.day} • {block.startTime} - {block.endTime}</p>
                </div>
                <div className="text-xs font-medium px-2.5 py-1 bg-surface-100 text-surface-600 rounded-md">
                  {block.reason}
                </div>
              </div>
            )) : (
              <p className="text-surface-500 text-sm text-center py-4">No upcoming classes scheduled.</p>
            )}
          </div>
        </div>

        {/* Study Assistant Quick Access */}
        <div className="bg-gradient-to-br from-surface-900 to-primary-950 rounded-2xl p-8 shadow-card animate-slide-up delay-400 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 opacity-20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="p-3 bg-white/10 text-white w-fit rounded-xl mb-6 backdrop-blur-md">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Got a question?</h3>
          <p className="text-primary-200 mb-8 max-w-sm">
            Chat with your AI study assistant about your uploaded notes or get help preparing for placements.
          </p>
          
          <Link 
            to="/study" 
            className="mt-auto inline-flex items-center justify-center gap-2 w-full py-3.5 bg-white text-surface-900 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
          >
            Open Study Assistant
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
