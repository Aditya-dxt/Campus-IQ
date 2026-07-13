import { useState, useEffect } from 'react';
import ScheduleView from '../components/ScheduleView';
import { getWeeklySchedule, updateBlock } from '../api/schedule';
import { Calendar, Loader2, Edit3, Eye } from 'lucide-react';

const MySchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getWeeklySchedule();
        setSchedule(data);
      } catch (err) {
        console.error('Failed to load schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpdateBlock = async (blockId, changes) => {
    try {
      const updated = await updateBlock(blockId, changes);
      setSchedule((prev) =>
        prev.map((b) => (b.id === blockId ? updated : b))
      );
    } catch (err) {
      console.error('Failed to update block:', err);
    }
  };

  return (
    <div className="page-enter max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl text-white">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">My Schedule</h1>
            <p className="text-surface-500 text-sm">Your AI-optimized weekly study plan</p>
          </div>
        </div>
        <button
          onClick={() => setEditable(!editable)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            editable
              ? 'bg-primary-500 text-white shadow-glow'
              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
          }`}
        >
          {editable ? <Eye size={16} /> : <Edit3 size={16} />}
          {editable ? 'View Mode' : 'Edit Mode'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { color: '#fbbf24', label: 'Weak Subject' },
          { color: '#60a5fa', label: 'Revision Due' },
          { color: '#34d399', label: 'Strong / Maintain' },
          { color: '#a78bfa', label: 'Placement Prep' },
          { color: '#f87171', label: 'Urgent Deadline' },
          { color: '#94a3b8', label: 'Self Study' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-surface-600">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Schedule */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : (
        <ScheduleView
          schedule={schedule}
          onUpdateBlock={handleUpdateBlock}
          editable={editable}
        />
      )}
    </div>
  );
};

export default MySchedule;
