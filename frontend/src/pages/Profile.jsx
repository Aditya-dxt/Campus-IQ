import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLatestScore } from '../api/resume';
import { getStudentRisk } from '../api/predict';
import { User, Mail, Shield, BookOpen, Clock, Users, Activity, Check, Loader2, FileText, Lock, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

// Simple helper to fetch mock data safely within the component (for student scores)
// In a real app we might use SWR or React Query here.
import { mockUsers, mockResumeScores, mockRiskData, mockInterventions } from '../mocks/mockData';

const Profile = () => {
  const { user, role, isStudent, isMentor, updateProfile, changePassword, logout } = useAuth();
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    branch: user?.branch || '',
    year: user?.year || '',
    department: user?.department || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password change state
  const [pwdData, setPwdData] = useState({ current: '', new: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' });

  // Settings state (mock local)
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: user?.notifications?.weeklySchedule ?? true,
    riskFlags: user?.notifications?.riskAlerts ?? true,
  });

  // Derived mock stats for display
  const studentScore = mockResumeScores[user?.id]?.current?.score || 0;
  const studentRisk = mockRiskData[user?.id]?.risk || 'low';
  
  const mentorTotal = mockUsers.filter(u => u.role === 'student').length;
  const mentorAtRisk = Object.values(mockRiskData).filter(r => r.risk === 'high').length;
  const mentorInterventions = Object.values(mockInterventions).flat().length;

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });
    
    try {
      await updateProfile(formData);
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } catch (err) {
      setProfileMsg({ text: err.message || 'Failed to update', type: 'error' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) {
      setPwdMsg({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    
    setSavingPwd(true);
    setPwdMsg({ text: '', type: '' });
    
    try {
      await changePassword(pwdData.current, pwdData.new);
      setPwdMsg({ text: 'Password changed successfully!', type: 'success' });
      setPwdData({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPwdMsg({ text: err.message || 'Failed to change password', type: 'error' });
    } finally {
      setSavingPwd(false);
      setTimeout(() => setPwdMsg({ text: '', type: '' }), 3000);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="page-enter max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-8 border border-surface-200 shadow-sm relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-100 to-transparent rounded-full opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-white flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          
          <div className="text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-surface-900">{user?.name}</h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full w-fit mx-auto md:mx-0 ${
                isStudent ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 text-surface-500 text-sm mt-3">
              <span className="flex items-center justify-center md:justify-start gap-1.5"><Mail size={16} /> {user?.email}</span>
              <span className="hidden md:block text-surface-300">•</span>
              <span className="flex items-center justify-center md:justify-start gap-1.5"><Clock size={16} /> Member since {user?.memberSince}</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3 min-w-[140px]">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl text-sm font-medium transition-colors"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button 
              onClick={logout}
              className="px-4 py-2 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded-xl text-sm font-medium transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Role Info */}
        <div className="space-y-6">
          {isStudent ? (
            <>
              {/* Student Stats Summary */}
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-primary-500" />
                  Your Academic Status
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-surface-50 rounded-xl">
                    <span className="text-sm text-surface-600">Resume Score</span>
                    <span className="font-bold text-surface-900">{studentScore} / 100</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-surface-50 rounded-xl">
                    <span className="text-sm text-surface-600">Risk Level</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      studentRisk === 'high' ? 'bg-danger-100 text-danger-700' :
                      studentRisk === 'medium' ? 'bg-warning-100 text-warning-700' :
                      'bg-success-100 text-success-700'
                    }`}>
                      {studentRisk.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <Link to="/resume" className="w-full flex items-center justify-between p-3 text-sm text-primary-700 hover:bg-primary-50 rounded-xl transition-colors">
                    <span className="flex items-center gap-2"><FileText size={16} /> Go to Resume Scanner</span>
                  </Link>
                  <Link to="/dashboard" className="w-full flex items-center justify-between p-3 text-sm text-primary-700 hover:bg-primary-50 rounded-xl transition-colors">
                    <span className="flex items-center gap-2"><LayoutDashboard size={16} /> Go to Dashboard</span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Mentor Stats Summary */}
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
                <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-primary-500" />
                  Cohort Overview
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-surface-600">Total Students</span>
                    <span className="font-bold text-surface-900">{mentorTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-surface-600">At-Risk Flags</span>
                    <span className="font-bold text-danger-600">{mentorAtRisk}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-surface-600">Interventions Logged</span>
                    <span className="font-bold text-surface-900">{mentorInterventions}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link to="/mentor" className="w-full flex items-center justify-center p-3 text-sm bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl transition-colors font-medium">
                    View Mentor Dashboard
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Preferences */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-primary-500" />
              Notifications
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-surface-700">Email Alerts</span>
                <input 
                  type="checkbox" 
                  checked={notifications.emailAlerts}
                  onChange={(e) => setNotifications({...notifications, emailAlerts: e.target.checked})}
                  className="rounded text-primary-500 focus:ring-primary-500" 
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-surface-700">{isStudent ? 'Weekly Schedule Digest' : 'Weekly Cohort Report'}</span>
                <input 
                  type="checkbox" 
                  checked={notifications.weeklyDigest}
                  onChange={(e) => setNotifications({...notifications, weeklyDigest: e.target.checked})}
                  className="rounded text-primary-500 focus:ring-primary-500" 
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-surface-700">{isStudent ? 'Risk Status Alerts' : 'New High-Risk Flags'}</span>
                <input 
                  type="checkbox" 
                  checked={notifications.riskFlags}
                  onChange={(e) => setNotifications({...notifications, riskFlags: e.target.checked})}
                  className="rounded text-primary-500 focus:ring-primary-500" 
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <User size={18} className="text-primary-500" />
              Account Details
            </h3>
            
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    disabled={!isEditing}
                    className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-50 disabled:text-surface-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-50 disabled:text-surface-500 text-sm"
                  />
                </div>
                
                {isStudent ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">Branch / Course</label>
                      <input 
                        type="text" 
                        value={formData.branch}
                        onChange={e => setFormData({...formData, branch: e.target.value})}
                        disabled={!isEditing}
                        className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-50 disabled:text-surface-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-1">Year</label>
                      <select 
                        value={formData.year}
                        onChange={e => setFormData({...formData, year: e.target.value})}
                        disabled={!isEditing}
                        className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-50 disabled:text-surface-500 text-sm"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-surface-700 mb-1">Assigned Department / Cohort</label>
                    <input 
                      type="text" 
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      disabled={!isEditing}
                      placeholder="e.g. CSE Batch 2024-2028"
                      className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 disabled:bg-surface-50 disabled:text-surface-500 text-sm"
                    />
                  </div>
                )}
              </div>
              
              {isEditing && (
                <div className="pt-4 flex items-center justify-between">
                  {profileMsg.text ? (
                    <span className={`text-sm flex items-center gap-1 ${profileMsg.type === 'success' ? 'text-success-600' : 'text-danger-600'}`}>
                      {profileMsg.type === 'success' ? <Check size={16} /> : <Shield size={16} />}
                      {profileMsg.text}
                    </span>
                  ) : <span></span>}
                  
                  <button 
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                  >
                    {savingProfile && <Loader2 size={16} className="animate-spin" />}
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Password Change Form */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm">
            <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
              <Lock size={18} className="text-primary-500" />
              Change Password
            </h3>
            
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Current Password</label>
                <input 
                  type="password" 
                  value={pwdData.current}
                  onChange={e => setPwdData({...pwdData, current: e.target.value})}
                  required
                  className="w-full max-w-md rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={pwdData.new}
                    onChange={e => setPwdData({...pwdData, new: e.target.value})}
                    required
                    minLength={6}
                    className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={pwdData.confirm}
                    onChange={e => setPwdData({...pwdData, confirm: e.target.value})}
                    required
                    minLength={6}
                    className="w-full rounded-xl border-surface-300 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
              </div>
              
              <div className="pt-2 flex items-center justify-between max-w-xl">
                {pwdMsg.text ? (
                  <span className={`text-sm flex items-center gap-1 ${pwdMsg.type === 'success' ? 'text-success-600' : 'text-danger-600'}`}>
                    {pwdMsg.type === 'success' ? <Check size={16} /> : <Shield size={16} />}
                    {pwdMsg.text}
                  </span>
                ) : <span></span>}
                
                <button 
                  type="submit"
                  disabled={savingPwd || !pwdData.current || !pwdData.new || !pwdData.confirm}
                  className="flex items-center gap-2 px-5 py-2 bg-surface-800 hover:bg-surface-900 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-surface-800"
                >
                  {savingPwd && <Loader2 size={16} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
