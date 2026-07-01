"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { hasAdminAccess, hasApproverAccess } from '@/utils/rbac';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { Users, Target, User, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Image from 'next/image';

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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign work');
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading team...</div>;

  if (!teamData?.hasTeam) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center mt-20">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users size={32} className="text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">No Team Assigned</h2>
        <p className="text-slate-500 mt-2">You are currently not assigned to any team. Please contact HR or your Manager.</p>
      </div>
    );
  }

  const { team, isLeader } = teamData;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 pb-24">
      {/* Hero Header */}
      <div className="rounded-3xl shadow-xl relative overflow-hidden group" style={{ backgroundColor: team.color || '#4f46e5' }}>
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>
        
        <div className="relative z-10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              {team.image ? (
                <img src={team.image} alt={team.name} className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20 shadow-2xl" />
              ) : (
                <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md border-4 border-white/20 shadow-2xl">
                  <Users size={48} className="text-white" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                <CheckCircle size={12} className="text-white" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-md tracking-tight mb-1">{team.name}</h1>
              {isLeader && (
                <div className="flex flex-col mt-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase text-white/70 tracking-widest bg-black/20 px-3 py-1 rounded-full">Target Count</span>
                    <span className="font-bold text-white text-lg">{team.targetTeamCount || 0}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase text-white/70 tracking-widest bg-black/20 px-3 py-1 rounded-full">Achieved Count</span>
                    <span className="font-bold text-emerald-300 text-lg">{team.achievedTeamCount || 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {isLeader && (
            <div className="flex flex-col items-start md:items-end gap-3 mt-4 md:mt-0 p-4 bg-black/10 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="text-left md:text-right">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">You are the Team Leader</p>
                <p className="font-medium text-white">Lead your team to success!</p>
              </div>
              <button 
                onClick={() => setIsAssigning(!isAssigning)}
                className="w-full md:w-auto bg-white text-slate-800 px-6 py-2.5 rounded-xl font-black text-sm shadow-xl hover:bg-slate-50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isAssigning ? (
                  <><X size={16} /> Cancel Assignment</>
                ) : (
                  <><Target size={16} className="text-blue-500" /> Divide Work</>
                )}
              </button>
            </div>
          )}
        </div>
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
                placeholder="Details about what needs to be achieved..."
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 min-h-[120px] resize-y"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Monthly Target Count</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2 opacity-50">Target Revenue (Hidden)</label>
                <input 
                  type="number" 
                  min="0"
                  disabled
                  placeholder="Not applicable for Team Leader"
                  className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl outline-none font-medium text-slate-400 opacity-70 cursor-not-allowed"
                  value={0}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black p-4 rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 text-lg">
              <Save size={20} /> Finalize Assignment
            </button>
          </form>
        </div>
      )}

      {/* Roster Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Leader Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 sticky top-24">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Team Leader
            </h2>
            <div className="flex flex-col items-center text-center">
              <div className="w-28 h-28 bg-gradient-to-br from-indigo-100 to-blue-50 rounded-3xl p-1 mb-4 shadow-inner">
                <div className="w-full h-full rounded-2xl overflow-hidden relative bg-white">
                  {team.leader?.avatar ? (
                    <Image src={team.leader.avatar} alt="Avatar" layout="fill" objectFit="cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-300">
                      {team.leader?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <h3 className="font-black text-xl text-slate-800">{team.leader?.name}</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">{isLeader && "(You)"}</p>
              <p className="text-xs text-slate-500 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{team.leader?.email}</p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Active Roster
              </h2>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black">{team.members.length} Members</span>
            </div>
            
            {team.members.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Users size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No members have been assigned to this team yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {team.members.map(member => {
                  const hasTarget = !!member.target;
                  const target = member.target || { targetCount: 0, achievedCount: 0 };
                  const percentCount = target.targetCount > 0 ? Math.round((target.achievedCount / target.targetCount) * 100) : 0;

                  return (
                    <div key={member.id} className="group relative bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all duration-300 hover:border-blue-100 flex flex-col sm:flex-row gap-4 sm:items-center justify-between overflow-hidden">
                      {/* Left Side: Info */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden relative shadow-sm border border-slate-200/50">
                          {member.avatar ? (
                            <Image src={member.avatar} alt="Avatar" layout="fill" objectFit="cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-black text-slate-400">
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-800">{member.name}</p>
                            {user.id === member.id && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">YOU</span>}
                          </div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">{member.role.replace('_', ' ')} • {member.department}</p>
                        </div>
                      </div>

                      {/* Right Side: Progress */}
                      <div className="flex-1 max-w-[200px] w-full sm:w-auto">
                        {hasTarget ? (
                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Assigned</span>
                              <span className="text-xs font-black text-slate-700">{target.achievedCount} <span className="text-slate-400">/ {target.targetCount}</span></span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 relative transition-all duration-1000" style={{ width: `${percentCount}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end h-full">
                            <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-200 border-dashed">No Target Set</span>
                          </div>
                        )}
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
