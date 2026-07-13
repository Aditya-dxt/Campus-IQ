// Resume API — handles resume scoring
// Currently resolves mock data; swap internals for real API calls later.

import { mockResumeScores, delay } from '../mocks/mockData';

/**
 * Score a resume against a job description.
 * @param {File} file - The uploaded resume file (PDF/DOCX)
 * @param {string} jobDescription - The pasted job description text
 * @returns {Promise<{ score, missing_keywords, suggestions, strengths }>}
 */
export const scoreResume = async (file, jobDescription) => {
  await delay(2000); // longer delay to simulate AI processing

  // In production, this would upload the file to FastAPI
  // For now, return mock data for the current user
  const stored = localStorage.getItem('campusiq_user');
  const user = stored ? JSON.parse(stored) : null;
  const userId = user?.id || 'stu-001';

  const data = mockResumeScores[userId] || mockResumeScores['stu-001'];

  // Slightly randomize score for demo realism
  const variance = Math.floor(Math.random() * 6) - 3;
  return {
    ...data.current,
    score: Math.max(0, Math.min(100, data.current.score + variance)),
  };
};

/**
 * Get resume score history for a student.
 * @param {string} studentId
 * @returns {Promise<Array<{ date, score }>>}
 */
export const getResumeHistory = async (studentId) => {
  await delay(500);

  const data = mockResumeScores[studentId];
  return data ? data.history : [];
};

/**
 * Get the latest resume score for a student.
 * @param {string} studentId
 * @returns {Promise<{ score, missing_keywords, suggestions, strengths }>}
 */
export const getLatestScore = async (studentId) => {
  await delay(400);

  const data = mockResumeScores[studentId];
  return data ? data.current : null;
};
