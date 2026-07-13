import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, Search, Filter, Users, AlertTriangle } from 'lucide-react';

const RISK_ORDER = { high: 0, medium: 1, low: 2 };

const COLUMNS = [
  { key: 'name', label: 'Student Name' },
  { key: 'branch', label: 'Branch' },
  { key: 'riskLevel', label: 'Risk Level' },
  { key: 'placementReadiness', label: 'Placement Readiness' },
  { key: 'topFactor', label: 'Top Factor' },
  { key: 'lastAction', label: 'Last Action' },
];

function getRiskBadge(level) {
  const config = {
    high: { className: 'risk-high', label: 'High Risk' },
    medium: { className: 'risk-medium', label: 'Medium Risk' },
    low: { className: 'risk-low', label: 'On Track' },
  };
  const c = config[level] || config.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.className}`}>
      {level === 'high' && <AlertTriangle className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

function getReadinessColor(value) {
  if (value >= 75) return 'bg-emerald-500';
  if (value >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function PlacementBar({ value }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-24 bg-surface-200 rounded-full h-2 overflow-hidden flex-shrink-0">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getReadinessColor(value)}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-xs font-medium text-surface-600 tabular-nums">{value}%</span>
    </div>
  );
}

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) {
    return (
      <span className="inline-flex flex-col ml-1 opacity-0 group-hover:opacity-40 transition-opacity">
        <ChevronUp className="w-3 h-3 -mb-1" />
        <ChevronDown className="w-3 h-3" />
      </span>
    );
  }
  return sortDir === 'asc' ? (
    <ChevronUp className="w-3.5 h-3.5 ml-1 inline-block" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 ml-1 inline-block" />
  );
}

function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr key={i} className="border-b border-surface-100">
      {COLUMNS.map((col) => (
        <td key={col.key} className="px-4 py-3.5">
          <div className="skeleton h-4 rounded-md w-3/4" />
        </td>
      ))}
    </tr>
  ));
}

export default function RiskTable({ students = [], loading = false }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('riskLevel');
  const [sortDir, setSortDir] = useState('asc'); // asc for risk means high-first
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = [...students];

    // Risk filter
    if (riskFilter !== 'all') {
      result = result.filter((s) => s.riskLevel === riskFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.name?.toLowerCase().includes(q));
    }

    return result;
  }, [students, riskFilter, searchQuery]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      if (sortKey === 'riskLevel') {
        return ((RISK_ORDER[a.riskLevel] ?? 3) - (RISK_ORDER[b.riskLevel] ?? 3)) * dir;
      }
      if (sortKey === 'placementReadiness') {
        return ((a.placementReadiness ?? 0) - (b.placementReadiness ?? 0)) * dir;
      }
      const aVal = (a[sortKey] ?? '').toString().toLowerCase();
      const bVal = (b[sortKey] ?? '').toString().toLowerCase();
      return aVal.localeCompare(bVal) * dir;
    });

    return list;
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-surface-100 bg-surface-50/50">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
          />
        </div>

        {/* Risk Level Filter */}
        <div className="relative flex-shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="pl-9 pr-8 py-2 text-sm rounded-lg border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Risk Levels</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">On Track</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="group px-4 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wider cursor-pointer select-none hover:text-surface-700 transition-colors whitespace-nowrap"
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows />
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-surface-400">
                    <Users className="w-10 h-10 stroke-[1.5]" />
                    <div>
                      <p className="font-medium text-surface-600">No students found</p>
                      <p className="text-sm mt-0.5">Try adjusting your filters or search query.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((student) => (
                <tr
                  key={student.id ?? student.name}
                  onClick={() => navigate(`/mentor/student/${student.id}`)}
                  className="border-b border-surface-100 last:border-b-0 hover:bg-surface-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5 font-medium text-surface-900 whitespace-nowrap">
                    {student.name}
                  </td>
                  <td className="px-4 py-3.5 text-surface-600 whitespace-nowrap">
                    {student.branch}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {getRiskBadge(student.riskLevel)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PlacementBar value={student.placementReadiness ?? 0} />
                  </td>
                  <td className="px-4 py-3.5 text-surface-600 whitespace-nowrap max-w-[180px] truncate">
                    {student.topFactor}
                  </td>
                  <td className="px-4 py-3.5 text-surface-500 whitespace-nowrap text-xs">
                    {student.lastAction}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!loading && sorted.length > 0 && (
        <div className="px-4 py-2.5 border-t border-surface-100 bg-surface-50/50 text-xs text-surface-500">
          Showing {sorted.length} of {students.length} student{students.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
