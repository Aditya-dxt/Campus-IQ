// Intervention API — handles mentor intervention logs
// Currently resolves mock data; swap internals for real API calls later.

import { mockInterventions, mockInterventionActions, mockRiskData, delay } from '../mocks/mockData';

/**
 * Get all interventions for a specific student.
 * @param {string} studentId
 */
export const getInterventions = async (studentId) => {
  await delay(500);
  return mockInterventions[studentId] || [];
};

/**
 * Log a new intervention for a student.
 * @param {{ studentId, action, note, reviewDate }} data
 */
export const logIntervention = async ({ studentId, action, note, reviewDate }) => {
  await delay(700);

  const currentRisk = mockRiskData[studentId]?.score || 0.5;

  const newIntervention = {
    id: `int-${Date.now()}`,
    action,
    note,
    date: new Date().toISOString().split('T')[0],
    risk_before: currentRisk,
    risk_after: currentRisk, // will update on next review
    outcome: 'pending',
    reviewDate,
    mentor: 'Dr. Rajesh Kumar',
  };

  if (!mockInterventions[studentId]) {
    mockInterventions[studentId] = [];
  }
  mockInterventions[studentId].unshift(newIntervention);

  return newIntervention;
};

/**
 * Get the list of common intervention actions.
 */
export const getInterventionActions = async () => {
  await delay(200);
  return [...mockInterventionActions];
};

/**
 * Get intervention statistics for the mentor dashboard.
 */
export const getInterventionStats = async () => {
  await delay(400);

  const allInterventions = Object.values(mockInterventions).flat();
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  return {
    total: allInterventions.length,
    thisMonth: allInterventions.filter((i) => i.date.startsWith(thisMonth)).length,
    improved: allInterventions.filter((i) => i.outcome === 'improved').length,
    pending: allInterventions.filter((i) => i.outcome === 'pending').length,
  };
};
