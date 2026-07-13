import { TrendingDown, Minus, Clock, ClipboardList, ArrowRight } from 'lucide-react';

const OUTCOME_CONFIG = {
  improved: {
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: TrendingDown,
    label: 'Improved',
  },
  'no change': {
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 text-amber-700 ring-amber-200',
    icon: Minus,
    label: 'No Change',
  },
  pending: {
    dotColor: 'bg-surface-400',
    badgeBg: 'bg-surface-100 text-surface-600 ring-surface-200',
    icon: Clock,
    label: 'Pending Review',
  },
};

function OutcomeBadge({ outcome }) {
  const config = OUTCOME_CONFIG[outcome] || OUTCOME_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${config.badgeBg}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function RiskDelta({ riskBefore, riskAfter }) {
  if (riskBefore == null && riskAfter == null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-surface-600">
      <span className="font-medium">Risk:</span>
      <span className="tabular-nums font-semibold text-surface-800">
        {riskBefore?.toFixed(2) ?? '—'}
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
      <span className="tabular-nums font-semibold text-surface-800">
        {riskAfter?.toFixed(2) ?? '—'}
      </span>
    </span>
  );
}

function SkeletonCards() {
  return Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="relative pl-10">
      {/* Skeleton dot */}
      <div className="absolute left-0 top-5 w-4 h-4 rounded-full skeleton" />
      {/* Skeleton card */}
      <div className="bg-white rounded-xl border border-surface-200 p-5 space-y-3">
        <div className="skeleton h-4 rounded-md w-2/5" />
        <div className="skeleton h-3 rounded-md w-1/4" />
        <div className="skeleton h-3 rounded-md w-3/4" />
        <div className="flex items-center gap-3">
          <div className="skeleton h-4 rounded-md w-28" />
          <div className="skeleton h-6 rounded-full w-20" />
        </div>
      </div>
    </div>
  ));
}

export default function InterventionLog({ interventions = [], loading = false }) {
  if (loading) {
    return (
      <div className="relative space-y-6">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-surface-200 rounded-full" />
        <SkeletonCards />
      </div>
    );
  }

  if (interventions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-surface-400">
        <ClipboardList className="w-10 h-10 stroke-[1.5] mb-3" />
        <p className="font-medium text-surface-600">No interventions logged yet</p>
        <p className="text-sm mt-0.5">Interventions will appear here once recorded.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Timeline vertical line */}
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-surface-200 rounded-full" />

      {interventions.map((item, index) => {
        const config = OUTCOME_CONFIG[item.outcome] || OUTCOME_CONFIG.pending;

        return (
          <div
            key={item.id ?? index}
            className="relative pl-10 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-5 w-4 h-4 rounded-full border-[3px] border-white shadow-sm ring-2 ring-surface-100 ${config.dotColor}`}
            />

            {/* Card */}
            <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              {/* Action type */}
              <h4 className="font-semibold text-surface-900 leading-snug">
                {item.actionType}
              </h4>

              {/* Date */}
              <p className="text-sm text-surface-500 mt-1">
                {item.date}
              </p>

              {/* Note */}
              {item.note && (
                <p className="text-sm text-surface-600 mt-3 leading-relaxed">
                  {item.note}
                </p>
              )}

              {/* Risk delta + outcome badge */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-surface-100">
                <RiskDelta riskBefore={item.riskBefore} riskAfter={item.riskAfter} />
                <OutcomeBadge outcome={item.outcome} />
              </div>

              {/* Review date */}
              {item.reviewDate && (
                <p className="text-xs text-surface-400 mt-3 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Next review: {item.reviewDate}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
