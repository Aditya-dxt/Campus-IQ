import { useState } from 'react';
import { Clock, Tag, Edit3, BookOpen } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_FULL = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const DAY_BG = [
  'bg-white',
  'bg-surface-50/60',
  'bg-white',
  'bg-surface-50/60',
  'bg-white',
  'bg-surface-50/60',
  'bg-white',
];

/**
 * Parse a time string like "09:00" or "14:30" into total minutes from midnight.
 */
function timeToMinutes(t) {
  if (typeof t === 'number') return t;
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Format minutes-from-midnight into a readable time string.
 */
function formatTime(t) {
  const mins = typeof t === 'number' ? t : timeToMinutes(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${suffix}`;
}

/* ──────────────────────── Schedule Block Card ──────────────────────── */
function BlockCard({ block, editable, onEdit }) {
  const [hovered, setHovered] = useState(false);
  const borderColor = block.color ?? '#6366f1';

  return (
    <div
      className="group relative rounded-xl bg-white p-3 shadow-sm transition hover:shadow-md"
      style={{ borderLeft: `4px solid ${borderColor}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Edit icon */}
      {editable && hovered && (
        <button
          type="button"
          onClick={() => onEdit?.(block)}
          className="absolute right-2 top-2 rounded-lg p-1 text-surface-400 transition hover:bg-surface-100 hover:text-primary-500"
          aria-label={`Edit ${block.subject}`}
        >
          <Edit3 size={14} />
        </button>
      )}

      <p className="font-semibold text-surface-800 text-sm leading-snug pr-6">
        {block.subject}
      </p>

      <div className="mt-1.5 flex items-center gap-1 text-xs text-surface-500">
        <Clock size={12} />
        <span>
          {formatTime(block.startTime)} – {formatTime(block.endTime)}
        </span>
      </div>

      {block.reason && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
          <Tag size={10} />
          {block.reason}
        </span>
      )}
    </div>
  );
}

/* ──────────────────────── Desktop Grid ──────────────────────── */
function DesktopGrid({ grouped, editable, onUpdateBlock }) {
  return (
    <div className="hidden md:grid md:grid-cols-7 md:gap-0 rounded-2xl border border-surface-200 overflow-hidden">
      {DAYS.map((day, idx) => {
        const blocks = grouped[day] ?? [];
        return (
          <div key={day} className={`flex flex-col ${DAY_BG[idx]}`}>
            {/* Day header */}
            <div className="border-b border-surface-100 px-3 py-3 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                {day}
              </span>
            </div>

            {/* Blocks */}
            <div className="flex-1 space-y-2 p-2 min-h-[120px]">
              {blocks
                .sort(
                  (a, b) =>
                    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                )
                .map((block) => (
                  <BlockCard
                    key={block.id ?? `${day}-${block.startTime}`}
                    block={block}
                    editable={editable}
                    onEdit={onUpdateBlock}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────── Mobile List ──────────────────────── */
function MobileList({ grouped, editable, onUpdateBlock }) {
  return (
    <div className="space-y-6 md:hidden">
      {DAYS.map((day, idx) => {
        const blocks = grouped[day] ?? [];
        if (blocks.length === 0) return null;
        return (
          <div key={day}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-surface-500">
              {DAY_FULL[day]}
            </h3>
            <div className={`space-y-2 rounded-xl p-3 ${DAY_BG[idx]}`}>
              {blocks
                .sort(
                  (a, b) =>
                    timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
                )
                .map((block) => (
                  <BlockCard
                    key={block.id ?? `${day}-${block.startTime}`}
                    block={block}
                    editable={editable}
                    onEdit={onUpdateBlock}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────── Empty State ──────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-200 py-20 text-center">
      <BookOpen size={40} strokeWidth={1.5} className="mb-3 text-surface-300" />
      <p className="text-surface-500">No schedule items yet</p>
      <p className="mt-1 text-sm text-surface-400">
        Add blocks to build your weekly schedule.
      </p>
    </div>
  );
}

/* ──────────────────────── Main Component ──────────────────────── */
export default function ScheduleView({
  schedule = [],
  onUpdateBlock,
  editable = false,
}) {
  // Group blocks by day
  const grouped = {};
  for (const day of DAYS) grouped[day] = [];
  for (const block of schedule) {
    const day = block.day;
    if (grouped[day]) {
      grouped[day].push(block);
    }
  }

  const hasBlocks = schedule.length > 0;

  return (
    <div className="w-full">
      {hasBlocks ? (
        <>
          <DesktopGrid
            grouped={grouped}
            editable={editable}
            onUpdateBlock={onUpdateBlock}
          />
          <MobileList
            grouped={grouped}
            editable={editable}
            onUpdateBlock={onUpdateBlock}
          />
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
