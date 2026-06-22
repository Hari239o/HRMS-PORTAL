import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const ProtectedRoute = ({ children, adminOnly = false, expectedPortal }) => {
  const { user, loading, portalMode } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  if (adminOnly && user.role !== 'admin') {
    const fallback = portalMode === 'student' ? '/student/dashboard' : '/dashboard';
    return <Navigate to={fallback} />;
  }

  // Enforce strict separation between portals
  if (expectedPortal && portalMode !== expectedPortal) {
    const fallback = portalMode === 'student' ? '/student/dashboard' : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

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
            {children}
          </div>
        </main>
      </div>
    </div>
  );
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
            
            <Route path="/dashboard" element={
              <ProtectedRoute expectedPortal="hr">
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/attendance" element={
              <ProtectedRoute expectedPortal="hr">
                <Attendance />
              </ProtectedRoute>
            } />
            
            <Route path="/leaves" element={
              <ProtectedRoute expectedPortal="hr">
                <Leaves />
              </ProtectedRoute>
            } />
            
            <Route path="/employees" element={
              <ProtectedRoute expectedPortal="hr">
                <Employees />
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute adminOnly={true} expectedPortal="hr">
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/salary" element={
              <ProtectedRoute expectedPortal="hr">
                <Salary />
              </ProtectedRoute>
            } />
            <Route path="/payroll" element={<Navigate to="/salary" replace />} />

            <Route path="/holidays" element={
              <ProtectedRoute expectedPortal="hr">
                <Holidays />
              </ProtectedRoute>
            } />

            <Route path="/performance" element={
              <ProtectedRoute expectedPortal="hr">
                <Performance />
              </ProtectedRoute>
            } />
            
            <Route path="/documents" element={
              <ProtectedRoute expectedPortal="hr">
                <Documents />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute adminOnly={true} expectedPortal="hr">
                <Settings />
              </ProtectedRoute>
            } />

            <Route path="/student/dashboard" element={
              <ProtectedRoute expectedPortal="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/payments" element={
              <ProtectedRoute expectedPortal="student">
                <StudentPayments />
              </ProtectedRoute>
            } />
            <Route path="/student/enrollment" element={
              <ProtectedRoute expectedPortal="student">
                <StudentEnrollment />
              </ProtectedRoute>
            } />
            <Route path="/student/documents" element={
              <ProtectedRoute expectedPortal="student">
                <StudentDocuments />
              </ProtectedRoute>
            } />
            <Route path="/student/certificates" element={
              <ProtectedRoute expectedPortal="student">
                <StudentCertificates />
              </ProtectedRoute>
            } />
            <Route path="/student/support" element={
              <ProtectedRoute expectedPortal="student">
                <StudentSupport />
              </ProtectedRoute>
            } />
            <Route path="/student/realtime" element={
              <ProtectedRoute expectedPortal="student">
                <StudentRealtime />
              </ProtectedRoute>
            } />
            
            <Route path="/resignations" element={
              <ProtectedRoute>
                <Resignations />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={<IndexRedirect />} />
            <Route path="*" element={<IndexRedirect />} />
          </Routes>
        </Router>
      </AxiosInterceptor>
    </AuthProvider>
  );
}
export default App;
