"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { hasAdminAccess } from '@/utils/rbac';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { Users, Target, User, CheckCircle, Clock } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 pb-24">
      {/* Header */}
      <div className="rounded-3xl p-6 text-white shadow-lg relative overflow-hidden" style={{ backgroundColor: team.color || '#4f46e5' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative flex items-center gap-4 mb-4">
          {team.image ? (
            <img src={team.image} alt={team.name} className="w-16 h-16 rounded-2xl object-cover border border-white/20 shadow-md" />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <Users size={32} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-black drop-shadow-sm">{team.name}</h1>
            {isLeader && (
              <p className="text-indigo-100 flex items-center gap-2 mt-1">
                <Target size={16} /> Team Target: ₹{team.targetRevenue?.toLocaleString() || 0}
              </p>
            )}
          </div>
        </div>
        
        {isLeader && (
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-100">You are the Team Leader</p>
              <p className="font-bold">Lead your team to success!</p>
            </div>
            <button 
              onClick={() => setIsAssigning(!isAssigning)}
              className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-colors"
            >
              {isAssigning ? 'Cancel' : 'Divide Work'}
            </button>
          </div>
        )}
      </div>

      {/* Assign Work Panel (For Leaders Only) */}
      {isLeader && isAssigning && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 animate-in slide-in-from-top-4">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Target size={20} className="text-blue-500" />
            Assign Work to Member
          </h2>
          <form onSubmit={handleAssignWork} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Team Member</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month</label>
                <input 
                  type="month" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={taskMonth}
                  onChange={(e) => setTaskMonth(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Task Title</label>
              <input 
                type="text" 
                placeholder="e.g. Sales Target - Q3"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instructions / Description</label>
              <textarea 
                placeholder="Details about what needs to be achieved..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Monthly Target Count</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={targetCount}
                  onChange={(e) => setTargetCount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Revenue (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl hover:bg-blue-700 transition-colors">
              Assign Task
            </button>
          </form>
        </div>
      )}

      {/* Team Leader Details */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Team Leader</h2>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden relative">
            {team.leader?.avatar ? (
              <Image src={team.leader.avatar} alt="Avatar" layout="fill" objectFit="cover" />
            ) : (
              team.leader?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-bold text-slate-800">{team.leader?.name} {isLeader && "(You)"}</p>
            <p className="text-sm text-slate-500">{team.leader?.email}</p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Team Members</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{team.members.length}</span>
        </h2>
        
        {team.members.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No members in this team yet.</p>
        ) : (
          <div className="space-y-4">
            {team.members.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden relative">
                  {member.avatar ? (
                    <Image src={member.avatar} alt="Avatar" layout="fill" objectFit="cover" />
                  ) : (
                    member.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{member.name} {user.id === member.id && "(You)"}</p>
                  <p className="text-xs text-slate-500 capitalize">{member.role.replace('_', ' ')} • {member.department}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
