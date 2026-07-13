// Predict API — handles academic risk prediction data
// Currently resolves mock data; swap internals for real API calls later.

import { mockRiskData, mockRiskDistribution, mockUsers, delay } from '../mocks/mockData';

/**
 * Get risk prediction for a single student.
 * @param {string} studentId
 * @returns {Promise<{ risk, score, readiness, topFactor, factors }>}
 */
export const getStudentRisk = async (studentId) => {
  await delay(500);

  const data = mockRiskData[studentId];
  if (!data) {
    throw new Error('Student risk data not found');
  }

  return { ...data };
};

/**
 * Get risk data for all students in the cohort (mentor view).
 * Returns array of students with their risk info.
 */
export const getCohortRisks = async () => {
  await delay(700);

  const students = mockUsers.filter((u) => u.role === 'student');

  return students.map((student) => {
    const risk = mockRiskData[student.id] || {
      risk: 'low',
      score: 0.1,
      readiness: 70,
      topFactor: 'No data available',
      factors: [],
    };

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      branch: student.branch,
      year: student.year,
      batch: student.batch,
      ...risk,
    };
  });
};

/**
 * Get cohort risk distribution for charts.
 */
export const getRiskDistribution = async () => {
  await delay(400);
  return [...mockRiskDistribution];
};
