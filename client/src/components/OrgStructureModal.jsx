import React, { useState, useEffect } from 'react';
import { X, Users, Search } from 'lucide-react';
import api from '@/utils/api';

const OrgNode = ({ profile, title, isMain = false, themeColor = "slate" }) => {
  if (!profile) return null;
  
  const borderColors = {
    slate: 'border-slate-200 bg-slate-100',
    fuchsia: 'border-fuchsia-300 bg-fuchsia-50 ring-2 ring-fuchsia-100',
    emerald: 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100',
    blue: 'border-blue-500 shadow-md ring-4 ring-blue-50'
  };

  const textColors = {
    slate: 'text-slate-700',
    fuchsia: 'text-fuchsia-800',
    emerald: 'text-emerald-800',
    blue: 'text-slate-800'
  };

  const titleColors = {
    slate: 'text-slate-400',
    fuchsia: 'text-fuchsia-500',
    emerald: 'text-emerald-500',
    blue: 'text-slate-400'
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 shadow-sm ${isMain ? borderColors.blue + ' w-20 h-20' : borderColors[themeColor]}`}>
        <img 
          src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=${themeColor === 'fuchsia' ? 'd946ef' : themeColor === 'emerald' ? '10b981' : 'ff5a1f'}&color=fff`} 
          alt={profile.name} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="mt-2 text-center max-w-[120px]">
        <p className={`font-bold truncate ${isMain ? 'text-base text-slate-800' : 'text-sm ' + textColors[themeColor]}`}>{profile.name}</p>
        <p className={`text-[10px] font-bold uppercase tracking-wide truncate ${isMain ? 'text-slate-400' : titleColors[themeColor]}`}>{title || profile.role?.replace('_', ' ')}</p>
        {profile.department && (
          <p className="text-[9px] text-slate-400 uppercase truncate">{profile.department}</p>
        )}
      </div>
    </div>
  );
};

export default function OrgStructureModal({ isOpen, onClose, user }) {
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [currentView, setCurrentView] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      const fetchEmployees = async () => {
        try {
          const res = await api.get('/api/employees');
          setAllEmployees(res.data);
        } catch (err) {
          console.error('Failed to load employees for org structure', err);
        }
      };
      fetchEmployees();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;

    if (!selectedEmpId || selectedEmpId === user?.id) {
      setCurrentView(user);
    } else {
      const fetchOrgStructure = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/api/employees/${selectedEmpId}/org-structure`);
          setCurrentView(res.data);
        } catch (err) {
          console.error('Failed to load org structure for selected employee', err);
          setCurrentView(user);
        } finally {
          setLoading(false);
        }
      };
      fetchOrgStructure();
    }
  }, [selectedEmpId, isOpen, user]);

  if (!isOpen || !user) return null;

  const viewData = currentView || user;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 animate-in fade-in duration-200">
      <div className="bg-white w-full h-full overflow-y-auto relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Employee Org Structure</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        </div>

        {/* Admin Dropdown */}
        {user?.role === 'admin' && (
          <div className="px-4 sm:px-12 pt-6 pb-2 max-w-md mx-auto w-full z-10 relative">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block text-center">View Structure For</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700 shadow-sm"
              >
                <option value="">-- My Structure --</option>
                {allEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content - Org Chart Hierarchy */}
        <div className={`p-4 sm:p-12 flex flex-col items-center min-h-[calc(100vh-80px)] justify-center transition-opacity duration-200 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          
          {/* Top Level: Manager and HR */}
          <div className="flex flex-col items-center mb-12 relative w-full">
            <div className="flex justify-center gap-8 sm:gap-24 relative w-full max-w-md">
              {/* Manager */}
              <div className="flex flex-col items-center relative flex-1">
                <OrgNode 
                  profile={viewData.managerProfile || { name: 'Not Assigned', role: 'manager' }} 
                  title="Manager" 
                  themeColor="fuchsia"
                />
                <div className="w-px h-8 bg-slate-300 absolute -bottom-8 left-1/2 transform -translate-x-1/2"></div>
              </div>
              
              {/* HR Partner */}
              <div className="flex flex-col items-center relative flex-1">
                <OrgNode 
                  profile={viewData.hrProfile || { name: 'Not Assigned', role: 'hr' }} 
                  title="HR Partner" 
                  themeColor="blue"
                />
                <div className="w-px h-8 bg-slate-300 absolute -bottom-8 left-1/2 transform -translate-x-1/2"></div>
              </div>

              {/* Horizontal Line */}
              <div className="absolute -bottom-8 left-1/4 right-1/4 h-px bg-slate-300"></div>
            </div>
            
            {/* Vertical line going down to Team Leader */}
            <div className="w-px h-8 bg-slate-300 absolute -bottom-16 left-1/2 transform -translate-x-1/2"></div>
          </div>

          {/* Team Leader */}
          <div className="flex flex-col items-center mb-8 relative">
            <OrgNode 
              profile={viewData.teamLeaderProfile || { name: 'Not Assigned', role: 'team_leader' }} 
              title="Team Leader" 
              themeColor="emerald"
            />
            <div className="w-px h-8 bg-slate-300 mt-2 absolute -bottom-10 left-1/2 transform -translate-x-1/2"></div>
          </div>

          {/* Current User */}
          <div className="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] p-6 rounded-2xl shadow-xl shadow-blue-500/20 w-full max-w-sm flex flex-col items-center relative z-10 mb-8 border border-white/20">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/50 shadow-md mb-3 bg-white">
              <img 
                src={viewData.avatar || `https://ui-avatars.com/api/?name=${viewData.name}&background=ff5a1f&color=fff`} 
                alt={viewData.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="text-center">
              <p className="font-black text-white text-lg tracking-wide">{viewData.name}</p>
              <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest">{viewData.designation || viewData.role?.replace('_', ' ')}</p>
              <p className="text-[10px] text-blue-50/80 uppercase mt-1">{viewData.department}</p>
            </div>
            
            {viewData.teamMembers?.length > 0 && (
              <div className="w-px h-8 bg-slate-300 absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-0"></div>
            )}
          </div>

          {/* Direct Reports */}
          {viewData.teamMembers?.length > 0 && (
            <div className="w-full relative mt-4 pb-4">
              {/* Horizontal Line connector if multiple reports */}
              {viewData.teamMembers.length > 1 && (
                <div className="absolute top-0 left-[15%] right-[15%] h-px bg-slate-300"></div>
              )}
              
              <div className="flex justify-center gap-6 sm:gap-12 flex-wrap pt-6 relative">
                {viewData.teamMembers.map((member, idx) => (
                  <div key={member.id} className="relative flex flex-col items-center">
                    {/* Vertical line from horizontal line to node */}
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-px h-6 bg-slate-300"></div>
                    <OrgNode profile={member} title={member.designation || member.role?.replace('_', ' ')} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
