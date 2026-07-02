import re

file_path = 'client/src/app/(protected)/my-team/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    original_code = f.read()

new_page = """"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { hasAdminAccess, hasApproverAccess } from '@/utils/rbac';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { Users, Target, User, CheckCircle, Clock, TrendingUp, X, Save, Trophy, Edit3 } from 'lucide-react';
import Image from 'next/image';

// Avatar Component with Fallback
const Avatar = ({ src, name, size = "w-12 h-12", textClass = "text-xl" }) => {
  const [error, setError] = useState(false);
  
  if (!src || error) {
    return (
      <div className={`${size} bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black ${textClass} border border-blue-100 shadow-inner uppercase`}>
        {name ? name.charAt(0) : '?'}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={name} 
      onError={() => setError(true)}
      className={`${size} rounded-xl object-cover border border-slate-200 shadow-sm`} 
    />
  );
};

export default function MyTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);
  
  // Assign Work State
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [taskMonth, setTaskMonth] = useState(new Date().toISOString().slice(0, 7));
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [targetCount, setTargetCount] = useState(30);
  const [targetRevenue, setTargetRevenue] = useState(0);

  // Edit Target State
  const [editingTargetId, setEditingTargetId] = useState(null);
  const [editTargetCount, setEditTargetCount] = useState('');

  useEffect(() => {
    if (user && hasAdminAccess(user)) {
      router.push('/teams');
    } else if (user) {
      fetchMyTeam();
    }
  }, [user, router]);

  const fetchMyTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/teams/my-team');
      setTeamData(res.data);
    } catch (error) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWork = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      return toast.error('Please select a team member');
    }

    try {
      await api.post('/api/tasks/target', {
        employeeId: selectedMember,
        month: taskMonth,
        title: taskTitle,
        description: taskDescription,
        targetCount: parseInt(targetCount),
        targetRevenue: parseFloat(targetRevenue)
      });
      toast.success('Work assigned successfully!');
      setIsAssigning(false);
      setTaskTitle('');
      setTaskDescription('');
      setTargetCount(30);
      setTargetRevenue(0);
      setSelectedMember('');
      fetchMyTeam();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign work');
    }
  };

  const handleSaveTarget = async (memberId) => {
    try {
      await api.put(`/api/teams/update-member-target/${memberId}`, {
        targetCount: parseInt(editTargetCount),
        month: new Date().toISOString().slice(0, 7)
      });
      toast.success("Target updated successfully!");
      setEditingTargetId(null);
      fetchMyTeam();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update target');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!teamData || !teamData.hasTeam) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10 text-center">
        <div className="bg-white rounded-3xl p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
            <Users size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">No Team Assigned</h2>
          <p className="text-slate-500 text-lg max-w-md">You are not currently part of any team. Please contact your administrator if this is a mistake.</p>
        </div>
      </div>
    );
  }

  const { team, isLeader } = teamData;
  const isPostSales = team.name?.toLowerCase().includes('post sales');
  
  // Calculate leader's stats based on the backend computed values
  const leaderTargetCount = team.leaderIndividualTarget?.targetCount || 0;
  const leaderAchievedCount = team.leaderIndividualTarget?.achievedCount || 0;

  // Build Leaderboard (Members + Leader)
  let leaderboard = [...team.members];
  if (team.leader) {
    leaderboard.push({
      ...team.leader,
      isLeaderRow: true,
      target: team.leaderIndividualTarget || { targetCount: 0, achievedCount: 0 }
    });
  }
  leaderboard.sort((a, b) => {
    const aAchieved = (a.target?.achievedCount || 0);
    const bAchieved = (b.target?.achievedCount || 0);
    return bAchieved - aAchieved; // Sort descending
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header Banner - Professional Light Theme */}
      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] -z-10 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-50/50 rounded-full blur-[80px] -z-10 -ml-20 -mb-20"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 w-full md:w-auto text-center md:text-left">
          <div className="relative">
            {team.image ? (
              <img src={team.image} alt={team.name} className="w-28 h-28 md:w-32 md:h-32 rounded-3xl object-cover border-[6px] border-white shadow-xl" />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center border-[6px] border-white shadow-xl">
                <Users size={56} className="text-white" />
              </div>
            )}
            <div className="absolute -bottom-3 -right-3 bg-emerald-500 w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center shadow-lg">
              <CheckCircle size={16} className="text-white" />
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">{team.name}</h1>
            {isLeader && (
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                <div className="flex flex-col items-start bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Team Target Count</span>
                  <span className="font-black text-slate-700 text-xl">{team.targetTeamCount || 0}</span>
                </div>
                <div className="flex flex-col items-start bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-emerald-600/70 tracking-widest">Achieved Count</span>
                  <span className="font-black text-emerald-600 text-xl">{team.achievedTeamCount || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isLeader && (
          <div className="flex flex-col items-center md:items-end gap-4 relative z-10 w-full md:w-auto">
            <div className="text-center md:text-right">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-2 inline-block">Team Leader</p>
              <p className="font-bold text-slate-600 text-sm">Lead your team to success!</p>
            </div>
            <button 
              onClick={() => setIsAssigning(!isAssigning)}
              className="w-full md:w-auto bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl shadow-slate-200 hover:bg-slate-700 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isAssigning ? (
                <><X size={18} /> Cancel Assignment</>
              ) : (
                <><Target size={18} className="text-blue-400" /> Divide Work</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Assign Work Panel */}
      {isLeader && isAssigning && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 animate-in slide-in-from-top-4 fade-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <Target size={24} className="text-blue-500" />
            Assign Work to Member
          </h2>
          <form onSubmit={handleAssignWork} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Team Member</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  required
                >
                  <option value="">Select Member...</option>
                  {team.members.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Month</label>
                <input 
                  type="month" 
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  value={taskMonth}
                  onChange={(e) => setTaskMonth(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Task Title</label>
              <input 
                type="text" 
                placeholder="e.g. Sales Target - Q3"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Instructions / Description</label>
              <textarea 
                rows="3"
                placeholder="Details of the assignment..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Target Count</label>
                <input 
                  type="number"
                  min="0"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  required
                />
              </div>
              {isPostSales && (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Target Revenue (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                    value={targetRevenue}
                    onChange={(e) => setTargetRevenue(e.target.value)}
                  />
                </div>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300"
            >
              Assign Work to Member
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Team Leader Profile */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden sticky top-6 group">
            <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 relative">
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Team Leader
              </div>
            </div>
            <div className="px-6 pb-8 pt-0 flex flex-col items-center text-center -mt-16 relative z-10">
              <div className="w-28 h-28 bg-white rounded-3xl p-1.5 shadow-xl mb-4 group-hover:-translate-y-2 transition-transform duration-500">
                <Avatar src={team.leader?.avatar} name={team.leader?.name} size="w-full h-full" textClass="text-4xl" />
              </div>
              <h3 className="font-black text-2xl text-slate-800">{team.leader?.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{isLeader && "(You)"}</p>
              <p className="text-xs font-semibold text-slate-500 mt-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-full truncate">{team.leader?.email}</p>
              
              <div className="w-full mt-6 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Individual Target</p>
                  <p className="text-xl font-black text-slate-700">{leaderTargetCount}</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase text-emerald-600/70 tracking-widest mb-1">Individual Achieved</p>
                  <p className="text-xl font-black text-emerald-600">{leaderAchievedCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members & Leaderboard */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Leaderboard Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-sm">
                  <Trophy size={20} />
                </div>
                Performance Leaderboard
              </h2>
            </div>
            
            <div className="space-y-4">
              {leaderboard.map((member, index) => {
                const targetCount = member.target?.targetCount || 0;
                const achievedCount = member.target?.achievedCount || 0;
                const percent = targetCount > 0 ? Math.min(100, Math.round((achievedCount / targetCount) * 100)) : 0;
                
                return (
                  <div key={member.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${index === 0 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/50 shadow-sm' : index === 1 ? 'bg-slate-50 border-slate-200' : index === 2 ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${index === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : index === 1 ? 'bg-slate-400 text-white' : index === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        #{index + 1}
                      </div>
                      <Avatar src={member.avatar} name={member.name} size="w-10 h-10" textClass="text-sm" />
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {member.name}
                          {member.isLeaderRow && <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Leader</span>}
                        </h4>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{member.role || 'Member'}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div className={`h-full rounded-full ${index === 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{percent}% Reached</p>
                      </div>
                      <div>
                        <p className="font-black text-lg text-slate-800">{achievedCount} <span className="text-xs text-slate-400">/ {targetCount}</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Roster */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                Active Roster
              </h2>
              <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-[10px] border border-slate-200 font-black tracking-widest uppercase">{team.members.length} Members</span>
            </div>
            
            {team.members.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Users size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium text-sm">No members have been assigned to this team yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {team.members.map(member => {
                  const hasTarget = !!member.target;
                  const target = member.target || { targetCount: 0, achievedCount: 0 };
                  const percentCount = target.targetCount > 0 ? Math.round((target.achievedCount / target.targetCount) * 100) : 0;
                  const isEditing = editingTargetId === member.id;

                  return (
                    <div key={member.id} className="group relative bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-100 flex flex-col sm:flex-row gap-5 sm:items-center justify-between overflow-hidden">
                      {/* Left Side: Info */}
                      <div className="flex items-center gap-4">
                        <Avatar src={member.avatar} name={member.name} />
                        <div>
                          <h3 className="font-black text-slate-800 text-lg mb-0.5">{member.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role} • {member.department}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider border border-emerald-100">Assigned</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Stats & Edit */}
                      <div className="w-full sm:w-1/2 flex flex-col items-end">
                        <div className="flex items-center justify-between w-full mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                className="w-16 p-1 text-xs font-black border border-blue-300 rounded text-center outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
                                value={editTargetCount}
                                onChange={(e) => setEditTargetCount(e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => handleSaveTarget(member.id)} className="text-emerald-500 hover:text-emerald-600 bg-emerald-50 p-1 rounded transition-colors" title="Save"><CheckCircle size={14}/></button>
                              <button onClick={() => setEditingTargetId(null)} className="text-slate-400 hover:text-rose-500 bg-slate-50 p-1 rounded transition-colors" title="Cancel"><X size={14}/></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/edit">
                              <span className="text-sm font-black text-slate-800">
                                {target.achievedCount} <span className="text-slate-400 text-xs">/ {target.targetCount}</span>
                              </span>
                              {isLeader && (
                                <button 
                                  onClick={() => {
                                    setEditingTargetId(member.id);
                                    setEditTargetCount(target.targetCount);
                                  }}
                                  className="text-slate-300 hover:text-blue-500 transition-colors opacity-0 group-hover/edit:opacity-100"
                                  title="Edit Target"
                                >
                                  <Edit3 size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(100, percentCount)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_page)

print("Frontend page updated successfully.")
