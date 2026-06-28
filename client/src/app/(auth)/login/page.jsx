"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Smartphone, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceLocked, setDeviceLocked] = useState(false);
  const { login } = useAuth();
  const navigate = useRouter();

  const getDeviceId = () => {
    let deviceId = localStorage.getItem('geonixa_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('geonixa_device_id', deviceId);
    }
    return deviceId;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Client-side validation for Employee login
    if (!isAdminView) {
      const isValidEmail = trimmedEmail.endsWith('@geonixa.com');
      const isValidEmpId = trimmedEmail.toUpperCase().startsWith('GN');
      
      if (!isValidEmail && !isValidEmpId) {
        toast.error('Invalid Format: Please use your @geonixa.com email or your GN employee ID.');
        return;
      }
    }

    setLoading(true);
    setDeviceLocked(false);
    try {
      const deviceId = getDeviceId();
      const res = await api.post(`/api/auth/login`, { 
        email: trimmedEmail, 
        password: trimmedPassword, 
        deviceId 
      });
      
      // Auto-route based on actual backend role
      login(res.data.user, res.data.token);
      toast.success('Access Granted. Welcome back!');
      
      if (res.data.user.role === 'student') {
        navigate.push('/student/dashboard');
      } else {
        navigate.push('/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        toast.error('Connection Refused: Please ensure the backend server is running.');
      } else if (err.response?.status === 403 && typeof err.response?.data?.error === 'string' && err.response.data.error.includes('device')) {
        setDeviceLocked(true);
      } else {
        let errMsg = 'Authentication failed. Check your credentials.';
        const serverError = err.response?.data?.error;
        if (serverError) {
           errMsg = typeof serverError === 'string' ? serverError : (serverError.message || errMsg);
        }
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-white p-6 overflow-hidden">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="py-10 px-2">
          <div className="flex justify-center mb-12 w-full">
            <Image 
              src="/geonixa-logo.png" 
              alt="Geonixa" 
              width={400}
              height={120}
              className="w-80 h-auto object-contain drop-shadow-sm" 
            />
          </div>
          
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
              {isAdminView ? "Administrator Access" : "Employee Portal"}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Secure access to Geonixa HR Systems</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {isAdminView ? "Admin Email" : "Employee ID / Email"}
              </label>
              <input 
                type="text" 
                required 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a1f] focus:border-[#ff5a1f] transition-all text-slate-900 text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdminView ? "admin@geonixa.com" : "e.g. GN001 or name@geonixa.com"}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                required 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff5a1f] focus:border-[#ff5a1f] transition-all text-slate-900 text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#ff5a1f] hover:bg-[#e64a10] text-white py-3.5 mt-2 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight size={20} />
                </div>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <span 
              className="text-slate-400 text-xs cursor-pointer hover:text-slate-600 transition-colors"
              onClick={() => setIsAdminView(!isAdminView)}
              title="Secret Admin Toggle"
            >
              New to Geonixa?
            </span>
          </div>
        </div>
      </div>

      {/* Device Lock Modal */}
      {deviceLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex flex-col items-center justify-center text-red-500 mb-6 relative">
                <Smartphone size={28} strokeWidth={2} />
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center border border-red-100">
                  <Lock size={16} strokeWidth={2.5} className="text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Device Lock Violation</h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Security systems indicate this account is permanently bound to another device. For your protection and to prevent unauthorized access, login from this new device has been blocked.
              </p>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex gap-3 text-left mb-8">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Action Required</p>
                  <p className="text-xs text-amber-800 mt-1">
                    You must contact your Administrator or HR Manager to unpair your previous device before you can log in here.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setDeviceLocked(false)}
                className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
              >
                Acknowledge & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
