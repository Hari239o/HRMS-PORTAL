import React from 'react';
import { X, Users } from 'lucide-react';

const OrgNode = ({ profile, title, isMain = false }) => {
  if (!profile) return null;
  return (
    <div className="flex flex-col items-center">
      <div className={`w-14 h-14 rounded-full overflow-hidden border-2 shadow-sm ${isMain ? 'border-blue-500 w-20 h-20 shadow-md ring-4 ring-blue-50' : 'border-slate-200 bg-slate-100'}`}>
        <img 
          src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=ff5a1f&color=fff`} 
          alt={profile.name} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="mt-2 text-center max-w-[120px]">
        <p className={`font-bold truncate ${isMain ? 'text-slate-800 text-base' : 'text-slate-700 text-sm'}`}>{profile.name}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{title || profile.role?.replace('_', ' ')}</p>
        {profile.department && (
          <p className="text-[9px] text-slate-400 uppercase truncate">{profile.department}</p>
        )}
      </div>
    </div>
  );
};

export default function OrgStructureModal({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md p-6 border-b border-slate-100 flex items-center justify-between z-20 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Employee Org Structure</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content - Org Chart Hierarchy */}
        <div className="p-8 flex flex-col items-center">
          
          {/* Manager */}
          {user.managerProfile && (
            <div className="flex flex-col items-center mb-8 relative">
              <OrgNode profile={user.managerProfile} title="Manager" />
              <div className="w-px h-8 bg-slate-300 mt-2 absolute -bottom-10 left-1/2 transform -translate-x-1/2"></div>
            </div>
          )}

          {/* Team Leader */}
          {user.teamLeaderProfile && (
            <div className="flex flex-col items-center mb-8 relative">
              <OrgNode profile={user.teamLeaderProfile} title="Team Leader" />
              <div className="w-px h-8 bg-slate-300 mt-2 absolute -bottom-10 left-1/2 transform -translate-x-1/2"></div>
            </div>
          )}

          {/* Current User */}
          <div className="bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] p-6 rounded-2xl shadow-xl shadow-blue-500/20 w-full max-w-sm flex flex-col items-center relative z-10 mb-8 border border-white/20">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/50 shadow-md mb-3 bg-white">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=ff5a1f&color=fff`} 
                alt={user.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="text-center">
              <p className="font-black text-white text-lg tracking-wide">{user.name}</p>
              <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest">{user.designation || user.role?.replace('_', ' ')}</p>
              <p className="text-[10px] text-blue-50/80 uppercase mt-1">{user.department}</p>
            </div>
            
            {user.teamMembers?.length > 0 && (
              <div className="w-px h-8 bg-slate-300 absolute -bottom-8 left-1/2 transform -translate-x-1/2 z-0"></div>
            )}
          </div>

          {/* Direct Reports */}
          {user.teamMembers?.length > 0 && (
            <div className="w-full relative mt-4 pb-4">
              {/* Horizontal Line connector if multiple reports */}
              {user.teamMembers.length > 1 && (
                <div className="absolute top-0 left-[15%] right-[15%] h-px bg-slate-300"></div>
              )}
              
              <div className="flex justify-center gap-6 sm:gap-12 flex-wrap pt-6 relative">
                {user.teamMembers.map((member, idx) => (
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
