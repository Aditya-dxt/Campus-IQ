import { useState, useEffect } from 'react';
import { getCohortRisks, getRiskDistribution } from '../api/predict';
import { getInterventionStats } from '../api/intervention';
import RiskTable from '../components/RiskTable';
import { Users, AlertTriangle, Activity, CheckCircle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MentorDashboard = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [distribution, setDistribution] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [risksData, distData, statsData] = await Promise.all([
          getCohortRisks(),
          getRiskDistribution(),
          getInterventionStats(),
        ]);
        setStudents(risksData);
        setDistribution(distData);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load mentor dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="page-enter max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl text-white">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Cohort Overview</h1>
          <p className="text-surface-500 text-sm">Monitor student academic risks and placement readiness</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-up">
            <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-surface-100 text-surface-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-surface-500 font-medium">Total Students</p>
                <p className="text-2xl font-bold text-surface-900">{students.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-danger-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-danger-50 text-danger-500 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-surface-500 font-medium">High Risk</p>
                <p className="text-2xl font-bold text-danger-600">
                  {students.filter(s => s.risk === 'high').length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-warning-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-warning-50 text-warning-500 rounded-xl">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm text-surface-500 font-medium">Active Interventions</p>
                <p className="text-2xl font-bold text-warning-600">{stats?.pending || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-success-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-success-50 text-success-500 rounded-xl">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-surface-500 font-medium">Improved This Month</p>
                <p className="text-2xl font-bold text-success-600">{stats?.improved || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up delay-100">
            {/* Chart */}
            <div className="bg-white rounded-2xl p-6 border border-surface-200 shadow-card lg:col-span-1 flex flex-col">
              <h3 className="font-bold text-surface-900 mb-6">Risk Distribution</h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="level" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-surface-200 shadow-card lg:col-span-2 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-surface-100">
                <h3 className="font-bold text-surface-900">Student Roster</h3>
              </div>
              <div className="flex-1 p-0">
                <RiskTable students={students} loading={loading} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MentorDashboard;
