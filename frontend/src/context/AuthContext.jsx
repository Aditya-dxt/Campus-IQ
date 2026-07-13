import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authAPI from '../api/auth';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = authAPI.getStoredAuth();
    if (stored) {
      setUser(stored.user);
      setToken(stored.token);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authAPI.login(email, password);
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const signup = useCallback(async (data) => {
    const result = await authAPI.signup(data);
    setUser(result.user);
    setToken(result.token);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    authAPI.logout();
    setUser(null);
    setToken(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const updatedUser = await authAPI.updateProfile(updates);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return await authAPI.changePassword(currentPassword, newPassword);
  }, []);

  const role = user?.role || null;
  const isAuthenticated = !!user && !!token;
  const isStudent = role === 'student';
  const isMentor = role === 'mentor';

  const value = {
    user,
    token,
    role,
    loading,
    isAuthenticated,
    isStudent,
    isMentor,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
