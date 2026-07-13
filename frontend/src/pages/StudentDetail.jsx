import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentRisk } from '../api/predict';
import { getResumeHistory } from '../api/resume';
import { getInterventions, logIntervention, getInterventionActions } from '../api/intervention';
import InterventionLog from '../components/InterventionLog';
import { mockUsers } from '../mocks/mockData';
import { User, AlertTriangle, Target, Activity, FileText, Plus, ChevronLeft, Loader2, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [resumeHistory, setResumeHistory] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formAction, setFormAction] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formDate, setFormDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Find basic info from mock
        const basicInfo = mockUsers.find(u => u.id === id);
        setStudent(basicInfo || { name: 'Unknown Student', email: 'unknown', id });

        const [risk, resume, inters, actionList] = await Promise.all([
          getStudentRisk(id).catch(() => null),
          getResumeHistory(id).catch(() => []),
          getInterventions(id).catch(() => []),
          getInterventionActions(),
        ]);
        
        setRiskData(risk);
        setResumeHistory(resume);
        setInterventions(inters);
        setActions(actionList);
        
        // Set default review date to 2 weeks from now
        const date = new Date();
        date.setDate(date.getDate() + 14);
        setFormDate(date.toISOString().split('T')[0]);
        if (actionList.length > 0) setFormAction(actionList[0]);

      } catch (err) {
        console.error('Failed to load student details:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSubmitIntervention = async (e) => {
    e.preventDefault();
    if (!formAction || !formNote || !formDate) return;
    
    setSubmitting(true);
    try {
      const newInt = await logIntervention({
        studentId: id,
        action: formAction,
        note: formNote,
        reviewDate: formDate,
      });
      setInterventions(prev => [newInt, ...prev]);
      setShowForm(false);
      setFormNote('');
    } catch (err) {
      console.error('Failed to log intervention:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  const riskBadgeClass = 
    riskData?.risk === 'high' ? 'bg-danger-50 text-danger-700 border-danger-200' :
    riskData?.risk === 'medium' ? 'bg-warning-50 text-warning-700 border-warning-200' :
    'bg-success-50 text-success-700 border-success-200';

  return (
    <div className="page-enter max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-surface-100 text-surface-600 rounded-full hover:bg-surface-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-3">
            {student?.name}
            {riskData && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskBadgeClass}`}>
                {riskData.risk.toUpperCase()} RISK
              </span>
            )}
          </h1>
          <p className="text-surface-500 text-sm">
            {student?.branch} • Batch {student?.batch} • {student?.email}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Resume */}
        <div className="space-y-6">
          {/* Risk Card */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-primary-500" />
              Risk Assessment
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-surface-500 uppercase font-semibold tracking-wider mb-1">Top Contributing Factor</p>
                <p className="text-sm font-medium text-surface-900 bg-surface-50 p-2.5 rounded-lg border border-surface-100">
                  {riskData?.topFactor || 'No critical factors identified'}
                </p>
              </div>
              {riskData?.factors?.length > 1 && (
                <div>
                  <p className="text-xs text-surface-500 uppercase font-semibold tracking-wider mb-1">Other Factors</p>
                  <ul className="text-sm text-surface-600 list-disc list-inside space-y-1">
                    {riskData.factors.slice(1).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
              <div className="pt-4 border-t border-surface-100">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-xs text-surface-500 uppercase font-semibold tracking-wider">Placement Readiness</p>
                  <span className="text-lg font-bold text-surface-900">{riskData?.readiness || 0}%</span>
                </div>
                <div className="w-full bg-surface-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-accent-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${riskData?.readiness || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Resume Chart Card */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-primary-500" />
              Resume Score History
            </h3>
            {resumeHistory.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resumeHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-surface-500 text-center py-10 bg-surface-50 rounded-xl border border-surface-100 border-dashed">
                No resume scores available
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Interventions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-surface-900">Mentor Interventions</h3>
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm"
              >
                <Plus size={16} />
                Log Action
              </button>
            )}
          </div>

          {/* New Intervention Form */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-card animate-slide-down">
              <h4 className="font-semibold text-primary-900 mb-4">Log New Intervention</h4>
              <form onSubmit={handleSubmitIntervention} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Action Taken</label>
                    <select 
                      value={formAction}
                      onChange={(e) => setFormAction(e.target.value)}
                      className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 shadow-sm text-sm"
                      required
                    >
                      {actions.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1">Follow-up Review Date</label>
                    <input 
                      type="date" 
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 shadow-sm text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Notes / Details</label>
                  <textarea 
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Describe what was discussed or actioned..."
                    className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 shadow-sm text-sm min-h-[100px] resize-y"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-surface-600 hover:bg-surface-100 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary-500 to-accent-500 hover:opacity-90 text-white rounded-xl text-sm font-medium transition-all shadow-md disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Log
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline Component */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm min-h-[400px]">
            <InterventionLog interventions={interventions} loading={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;
