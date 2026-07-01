"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, Calendar, Users, Target, Save } from 'lucide-react';
import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';

export default function TaskBoxPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Admin state
  const [teams, setTeams] = useState([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState('');
  const [taskMonth, setTaskMonth] = useState(new Date().toISOString().slice(0, 7));
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [targetCount, setTargetCount] = useState(30);
  const [targetRevenue, setTargetRevenue] = useState(0);

  // Employee state
  const [myTask, setMyTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (hasAdminAccess(user)) {
        const teamRes = await api.get('/api/teams');
        setTeams(teamRes.data);
      } else {
        const res = await api.get(`/api/tasks/performance?month=${new Date().toISOString().slice(0, 7)}`);
        setMyTask(res.data.target);
      }
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks/target', {
        employeeId: selectedTeamLeader,
        month: taskMonth,
        title: taskTitle,
        description: taskDescription,
        targetCount: parseInt(targetCount),
        targetRevenue: parseFloat(targetRevenue)
      });
      toast.success('Task assigned successfully');
      setTaskTitle('');
      setTaskDescription('');
      setTargetCount(30);
      setTargetRevenue(0);
    } catch (err) {
      toast.error('Failed to assign task');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (hasAdminAccess(user)) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Task Box Management</h1>
            <p className="text-sm text-slate-500">Assign monthly targets and work to teams</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Assign New Task</h2>
          <form onSubmit={handleAssignTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Team</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={selectedTeamLeader}
                  onChange={(e) => setSelectedTeamLeader(e.target.value)}
                  required
                >
                  <option value="">Select Team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.leaderId}>{team.name} (Leader: {team.leader?.name})</option>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Name / Title</label>
                <input 
                  type="text"
                  placeholder="e.g., Q3 Sales Target"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Metric (Count)</label>
                <input 
                  type="number"
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Detailed Monthly Work Description</label>
              <textarea 
                rows="4"
                placeholder="Describe the tasks and goals for this month..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              ></textarea>
            </div>

            <button type="submit" className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all">
              <Save size={18} /> Assign Task
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Employee View
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-orange-100 text-[#ff5a1f] rounded-xl flex items-center justify-center">
          <Target size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">My Task Box</h1>
          <p className="text-sm text-slate-500">Your monthly targets and work</p>
        </div>
      </div>

      {myTask ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{myTask.title || 'Monthly Target'}</h2>
              <p className="text-sm text-slate-500">{new Date(myTask.month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${myTask.achievedCount >= myTask.targetCount ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {myTask.achievedCount >= myTask.targetCount ? 'Achieved' : 'In Progress'}
            </span>
          </div>
          
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Work Description</h3>
            <p className="text-slate-700 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              {myTask.description || 'No detailed description provided.'}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Progress Metric</h3>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-slate-800">{myTask.achievedCount}</span>
              <span className="text-slate-500 font-medium mb-1">/ {myTask.targetCount} completed</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-[#ff5a1f] h-full rounded-full" 
                style={{ width: `${Math.min(100, (myTask.achievedCount / myTask.targetCount) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <CheckCircle size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">No Active Tasks</h3>
          <p className="text-slate-500 text-sm mt-1">You don't have any specific targets assigned for this month yet.</p>
        </div>
      )}
    </div>
  );
}
