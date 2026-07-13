// Auth API — handles login, signup, profile management
// Currently resolves mock data; swap internals for real API calls later.

import { mockUsers, delay } from '../mocks/mockData';

const STORAGE_TOKEN_KEY = 'campusiq_token';
const STORAGE_USER_KEY = 'campusiq_user';

/**
 * Login with email and password.
 * Returns { user, token } on success.
 */
export const login = async (email, password) => {
  await delay(800);

  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const token = `mock_jwt_${user.id}_${Date.now()}`;
  const { password: _, ...safeUser } = user;

  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser));

  return { user: safeUser, token };
};

/**
 * Signup a new user.
 * Returns { user, token } on success.
 */
export const signup = async ({ name, email, password, role }) => {
  await delay(800);

  const exists = mockUsers.find((u) => u.email === email);
  if (exists) {
    throw new Error('An account with this email already exists');
  }

  const newUser = {
    id: `${role === 'mentor' ? 'men' : 'stu'}-${Date.now()}`,
    name,
    email,
    role,
    avatar: null,
    memberSince: new Date().toISOString().split('T')[0],
    ...(role === 'student'
      ? { branch: '', year: 1, batch: '', notifications: { weeklySchedule: true, riskAlerts: false, suggestedQuestions: true } }
      : { department: '', notifications: { riskFlagAlerts: true, weeklyReports: true, interventionReminders: true } }),
  };

  const token = `mock_jwt_${newUser.id}_${Date.now()}`;
  localStorage.setItem(STORAGE_TOKEN_KEY, token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));

  return { user: newUser, token };
};

/**
 * Get the current user profile.
 */
export const getProfile = async () => {
  await delay(400);

  const stored = localStorage.getItem(STORAGE_USER_KEY);
  if (!stored) throw new Error('Not authenticated');

  return JSON.parse(stored);
};

/**
 * Update profile fields (name, email, branch, year, etc.)
 */
export const updateProfile = async (updates) => {
  await delay(600);

  const stored = localStorage.getItem(STORAGE_USER_KEY);
  if (!stored) throw new Error('Not authenticated');

  const user = { ...JSON.parse(stored), ...updates };
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));

  return user;
};

/**
 * Change password.
 */
export const changePassword = async (currentPassword, newPassword) => {
  await delay(600);

  // Mock validation
  if (currentPassword === newPassword) {
    throw new Error('New password must be different from current password');
  }
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  return { success: true, message: 'Password updated successfully' };
};

/**
 * Logout — clear stored credentials.
 */
export const logout = () => {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
};

/**
 * Check if user is authenticated (for session restore on refresh).
 */
export const getStoredAuth = () => {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  const userStr = localStorage.getItem(STORAGE_USER_KEY);

  if (token && userStr) {
    try {
      return { user: JSON.parse(userStr), token };
    } catch {
      return null;
    }
  }
  return null;
};
