import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, ArrowRight, Shield } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Sales',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/auth/register`, formData);
      login(res.data.user, res.data.token);
      toast.success('Workforce Account Activated!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Contact system administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-12 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <UserPlus size={40} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Join the Geonixa Enterprise Network</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Legal Name</label>
              <input 
                type="text" 
                required 
                className="input-field py-4 text-lg"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Corporate Email</label>
              <input 
                type="email" 
                required 
                className="input-field py-4 text-lg"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Profile Photo URL</label>
              <input 
                type="text" 
                className="input-field py-4 text-lg"
                value={formData.avatar}
                onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Operational Department</label>
              <select 
                className="input-field py-4 text-lg appearance-none"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option value="Sales">Sales</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Business Development">Business Development</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Security Key (Password)</label>
              <input 
                type="password" 
                required 
                className="input-field py-4 text-lg"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-5 mt-6 text-xl rounded-2xl font-black tracking-tight"
            >
              {loading ? 'Activating Account...' : (
                <div className="flex items-center justify-center gap-2">
                  <span>Register Account</span>
                  <ArrowRight size={24} />
                </div>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center text-slate-500 font-medium">
            Already registered?{' '}
            <Link to="/login" className="text-blue-600 font-black hover:underline underline-offset-4">
              Return to Login
            </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <Shield size={12} />
          <span>Encrypted Data Transmission Protocol Active</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
