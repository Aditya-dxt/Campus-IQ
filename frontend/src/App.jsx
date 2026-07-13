import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/StudentDashboard';
import ResumeScanner from './pages/ResumeScanner';
import StudyAssistant from './pages/StudyAssistant';
import MySchedule from './pages/MySchedule';
import MentorDashboard from './pages/MentorDashboard';
import StudentDetail from './pages/StudentDetail';
import Profile from './pages/Profile';

// App Layout wrapper with Sidebar & Navbar
const AppLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full h-full lg:ml-16">
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-50 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Default redirect based on auth happens inside ProtectedRoute */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Routes with Layout */}
          <Route element={<AppLayout />}>
            
            {/* Common Protected */}
            <Route element={<ProtectedRoute allowedRoles={['student', 'mentor']} />}>
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Student Only */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/resume" element={<ResumeScanner />} />
              <Route path="/study" element={<StudyAssistant />} />
              <Route path="/schedule" element={<MySchedule />} />
            </Route>

            {/* Mentor Only */}
            <Route element={<ProtectedRoute allowedRoles={['mentor']} />}>
              <Route path="/mentor" element={<MentorDashboard />} />
              <Route path="/mentor/student/:id" element={<StudentDetail />} />
            </Route>
            
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
