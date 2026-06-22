import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, ShieldCheck, User, ArrowRight, Lock, Smartphone, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee'); // Default role
  const [loading, setLoading] = useState(false);
  const [deviceLocked, setDeviceLocked] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    setLoading(true);
    setDeviceLocked(false);
    try {
      const deviceId = getDeviceId();
      const res = await axios.post(`${import.meta.env.VITE_API_URL || ""}/api/auth/login`, { email, password, deviceId });
      
      // Verification: Ensure user logged in through the correct portal tab
      if (role === 'admin' && res.data.user.role !== 'admin') {
        toast.error('Unauthorized: Please use the Administrator tab.');
        setLoading(false);
        return;
      } else if (role === 'employee' && ['admin', 'student'].includes(res.data.user.role)) {
        toast.error('Unauthorized: Please use the correct portal tab for your account type.');
        setLoading(false);
        return;
      } else if (role === 'student' && res.data.user.role !== 'student') {
        toast.error('Unauthorized: Please use the Student tab.');
        setLoading(false);
        return;
      }

      login(res.data.user, res.data.token);
      toast.success('Access Granted. Welcome back!');
      if (res.data.user.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (!err.response) {
        toast.error('Connection Refused: Please ensure the backend server is running on port 5002.');
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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-12 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex justify-center mb-10 w-full">
            <img src="/geonixa-logo.png" alt="Geonixa" className="w-64 max-w-full h-auto object-contain drop-shadow-sm" />
          </div>
          
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Enterprise Portal</h2>
            <p className="text-slate-500 font-medium">Secure access to Geonixa HR Systems</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex p-1.5 bg-slate-50 rounded-2xl mb-4 overflow-hidden">
            <button 
              type="button"
              onClick={() => setRole('employee')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                role === 'employee' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User size={18} /> Employee
            </button>
            <button 
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                role === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ShieldCheck size={18} /> Student
            </button>
            <button 
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                role === 'admin' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ShieldCheck size={18} /> Administrator
            </button>
          </div>
          {role === 'employee' && (
            <div className="mb-6 rounded-3xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <p className="font-semibold">Device Restriction Notice</p>
              <p className="mt-2 leading-6">Employee accounts are restricted to a single registered device. Admin and manager accounts can use multiple devices.</p>
            </div>
          )}
          {role === 'student' && (
            <div className="mb-6 rounded-3xl border border-sky-100 bg-sky-50 px-5 py-4 text-sm text-sky-900">
              <p className="font-semibold">Student Portal Access</p>
              <p className="mt-2 leading-6">Login here to access your Student Portal for payments, enrollment documents, certificates, tickets, and realtime updates.</p>
            </div>
          )}
          {role === 'admin' && (
            <div className="mb-6 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
              <p className="font-semibold">✓ Administrator Access</p>
              <p className="mt-2 leading-6">You have full administrative privileges including CRM management, employee records, and system configuration.</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Corporate Email</label>
              <input 
                type="email" 
                required 
                className="input-field py-4 text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Security Key</label>
              <input 
                type="password" 
                required 
                className="input-field py-4 text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-5 mt-6 text-xl rounded-2xl font-black tracking-tight"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Sign In</span>
                  <ArrowRight size={24} />
                </div>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-slate-500 font-medium">
              New to Geonixa?{' '}
              <Link to="/register" className="text-indigo-600 font-black hover:underline underline-offset-4">
                Register Workforce Account
              </Link>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
          © 2026 Geonixa Technologies • Secured by Enterprise Shield
        </p>

        {/* Brand Banner */}
        <div className="absolute top-0 left-0 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 text-white text-center py-2 text-xs font-bold tracking-[0.2em] shadow-md z-10 uppercase">
          Geonixa Enterprise Systems
        </div>
      </div>

      {/* Device Lock Modal */}
      {deviceLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 text-center">
              <div className="mx-auto w-24 h-24 bg-rose-50 rounded-[24px] flex flex-col items-center justify-center text-rose-500 mb-6 relative">
                <Smartphone size={32} strokeWidth={2} />
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-rose-100">
                  <Lock size={20} strokeWidth={2.5} className="text-rose-600 animate-bounce" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Device Lock Violation</h3>
              <p className="text-slate-500 mb-6 font-medium leading-relaxed">
                Security systems indicate this account is permanently bound to another device. For your protection and to prevent unauthorized access, login from this new device has been blocked.
              </p>
              
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3 text-left mb-8">
                <AlertTriangle size={24} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Action Required</p>
                  <p className="text-xs font-medium text-amber-700 mt-1">
                    You must contact your Administrator or HR Manager to unpair your previous device before you can log in here.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setDeviceLocked(false)}
                className="w-full py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all active:scale-[0.98]"
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
