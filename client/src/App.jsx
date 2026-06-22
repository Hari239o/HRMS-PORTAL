import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Menu } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Salary from './pages/Salary';
import Holidays from './pages/Holidays';
import Performance from './pages/Performance';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import AxiosInterceptor from './components/AxiosInterceptor';

import ReportsCenter from './pages/ReportsCenter';
import Resignations from './pages/Resignations';

import StudentDashboard from './pages/student/StudentDashboard';
import StudentPayments from './pages/student/StudentPayments';
import StudentEnrollment from './pages/student/StudentEnrollment';
import StudentDocuments from './pages/student/StudentDocuments';
import StudentCertificates from './pages/student/StudentCertificates';
import StudentSupport from './pages/student/StudentSupport';
import StudentRealtime from './pages/student/StudentRealtime';

const IndexRedirect = () => {
  const { portalMode } = useAuth();
  if (portalMode === 'student') return <Navigate to="/student/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppLayout = () => {
  const { user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-100 flex items-center justify-between p-4 z-40">
          <div className="flex items-center gap-2">
            <img src="/geonixa-logo.png" alt="Geonixa" className="w-32 h-auto object-contain drop-shadow-sm" />
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-500 hover:text-blue-600 focus:outline-none"
          >
            <Menu size={24} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="w-full max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const AuthGuard = ({ children, adminOnly = false, expectedPortal }) => {
  const { user, portalMode } = useAuth();

  if (adminOnly && user?.role !== 'admin') {
    const fallback = portalMode === 'student' ? '/student/dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  if (expectedPortal && portalMode !== expectedPortal) {
    const fallback = portalMode === 'student' ? '/student/dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <AxiosInterceptor>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<AuthGuard expectedPortal="hr"><Dashboard /></AuthGuard>} />
              <Route path="/attendance" element={<AuthGuard expectedPortal="hr"><Attendance /></AuthGuard>} />
              <Route path="/leaves" element={<AuthGuard expectedPortal="hr"><Leaves /></AuthGuard>} />
              <Route path="/employees" element={<AuthGuard expectedPortal="hr"><Employees /></AuthGuard>} />
              <Route path="/reports" element={<AuthGuard expectedPortal="hr" adminOnly={true}><Reports /></AuthGuard>} />
              <Route path="/salary" element={<AuthGuard expectedPortal="hr"><Salary /></AuthGuard>} />
              <Route path="/holidays" element={<AuthGuard expectedPortal="hr"><Holidays /></AuthGuard>} />
              <Route path="/performance" element={<AuthGuard expectedPortal="hr"><Performance /></AuthGuard>} />
              <Route path="/documents" element={<AuthGuard expectedPortal="hr"><Documents /></AuthGuard>} />
              <Route path="/settings" element={<AuthGuard expectedPortal="hr" adminOnly={true}><Settings /></AuthGuard>} />
              <Route path="/resignations" element={<AuthGuard><Resignations /></AuthGuard>} />
              
              <Route path="/student/dashboard" element={<AuthGuard expectedPortal="student"><StudentDashboard /></AuthGuard>} />
              <Route path="/student/payments" element={<AuthGuard expectedPortal="student"><StudentPayments /></AuthGuard>} />
              <Route path="/student/enrollment" element={<AuthGuard expectedPortal="student"><StudentEnrollment /></AuthGuard>} />
              <Route path="/student/documents" element={<AuthGuard expectedPortal="student"><StudentDocuments /></AuthGuard>} />
              <Route path="/student/certificates" element={<AuthGuard expectedPortal="student"><StudentCertificates /></AuthGuard>} />
              <Route path="/student/support" element={<AuthGuard expectedPortal="student"><StudentSupport /></AuthGuard>} />
              <Route path="/student/realtime" element={<AuthGuard expectedPortal="student"><StudentRealtime /></AuthGuard>} />
            </Route>

            <Route path="/payroll" element={<Navigate to="/salary" replace />} />
            <Route path="/" element={<IndexRedirect />} />
            <Route path="*" element={<IndexRedirect />} />
          </Routes>
        </Router>
      </AxiosInterceptor>
    </AuthProvider>
  );
}
export default App;
