// Schedule API — handles smart scheduler data
// Currently resolves mock data; swap internals for real API calls later.

import { mockSchedule, delay } from '../mocks/mockData';

let localSchedule = [...mockSchedule];

/**
 * Get the weekly schedule for the current student.
 */
export const getWeeklySchedule = async () => {
  await delay(500);
  return [...localSchedule];
};

/**
 * Update a schedule block.
 * @param {string} blockId
 * @param {object} changes — fields to update (startTime, endTime, subject, etc.)
 */
export const updateBlock = async (blockId, changes) => {
  await delay(400);

  const idx = localSchedule.findIndex((b) => b.id === blockId);
  if (idx === -1) throw new Error('Schedule block not found');

  localSchedule[idx] = { ...localSchedule[idx], ...changes };
  return localSchedule[idx];
};

/**
 * Get upcoming schedule items (next N items from today).
 * @param {number} count
 */
export const getUpcoming = async (count = 3) => {
  await delay(300);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const todayIdx = days.indexOf(today);

  // Sort schedule by day order starting from today
  const sorted = [...localSchedule].sort((a, b) => {
    const aIdx = (days.indexOf(a.day) - todayIdx + 7) % 7;
    const bIdx = (days.indexOf(b.day) - todayIdx + 7) % 7;
    if (aIdx !== bIdx) return aIdx - bIdx;
    return a.startTime.localeCompare(b.startTime);
  });

  return sorted.slice(0, count);
};
