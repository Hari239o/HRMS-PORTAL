"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { User, LogOut, Settings, Briefcase, Key, ShieldCheck, Mail, Building2, MapPin, CheckCircle, CreditCard, MonitorSmartphone } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/employees/me');
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Header Profile Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-[#ff5a1f] opacity-10"></div>
        
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10 bg-slate-100 flex items-center justify-center text-slate-400">
          {profile.avatar ? (
            <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User size={48} />
          )}
        </div>
        
        <div className="text-center md:text-left flex-1 relative z-10">
          <h1 className="text-3xl font-black text-slate-900">{profile.name}</h1>
          <p className="text-blue-600 font-bold uppercase tracking-wider text-sm mt-1">{profile.designation || profile.role.replace('_', ' ')}</p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium"><Mail size={16} /> {profile.email}</span>
            {profile.empId && <span className="flex items-center gap-1.5 text-sm text-slate-500 font-medium"><Briefcase size={16} /> ID: {profile.empId}</span>}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto relative z-10">
          <Link href="/settings" className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
            <Settings size={18} /> Settings
          </Link>
          <button onClick={logout} className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Identity & Financials */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <CreditCard className="text-blue-500" size={24} /> Identity & Financials
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">PAN</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">{profile.pan || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">UAN</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">{profile.uan || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Name</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">{profile.bankName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Number</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">{profile.accountNumber || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Employment Logistics */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Building2 className="text-[#ff5a1f]" size={24} /> Employment Logistics
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">{profile.department || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Role</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100 capitalize">{profile.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Designated Weekly Off</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">{profile.weekOff || 'Sunday'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Issued Assets</p>
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100 flex items-center gap-2">
                <MonitorSmartphone size={16} className="text-slate-400" />
                {profile.assets || 'No assets issued'}
              </p>
            </div>
          </div>
        </div>

        {/* Organizational Hierarchy */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 md:col-span-2">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={24} /> Organizational Hierarchy
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Direct Manager</p>
              {profile.managerProfile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                    {profile.managerProfile.avatar ? <img src={profile.managerProfile.avatar} alt="Manager" className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{profile.managerProfile.name}</p>
                    <p className="text-xs text-slate-500">{profile.managerProfile.department || 'Manager'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-medium">None assigned</p>
              )}
            </div>

            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">HR Representative</p>
              {profile.hrProfile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                    {profile.hrProfile.avatar ? <img src={profile.hrProfile.avatar} alt="HR" className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{profile.hrProfile.name}</p>
                    <p className="text-xs text-slate-500">{profile.hrProfile.department || 'HR'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-medium">None assigned</p>
              )}
            </div>

            <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Team Leader</p>
              {profile.teamLeaderProfile ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                    {profile.teamLeaderProfile.avatar ? <img src={profile.teamLeaderProfile.avatar} alt="TL" className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{profile.teamLeaderProfile.name}</p>
                    <p className="text-xs text-slate-500">{profile.teamLeaderProfile.department || 'Team Leader'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 font-medium">None assigned</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
