"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasAdminAccess } from '@/utils/rbac';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { Target, Plus, Users, Trash2, Edit3, X, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TeamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [form, setForm] = useState({
    id: null,
    name: '',
    targetRevenue: '',
    leaderId: '',
    memberIds: [],
    color: '#4f46e5',
    image: ''
  });

  useEffect(() => {
    if (!hasAdminAccess(user)) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, empRes] = await Promise.all([
        api.get('/api/teams'),
        api.get('/api/employees')
      ]);
      setTeams(teamsRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      toast.error('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.leaderId) {
      return toast.error('Name and Leader are required');
    }

    try {
      if (form.id) {
        await api.put(`/api/teams/${form.id}`, form);
        toast.success('Team updated successfully');
        setIsModalOpen(false);
        fetchData();
      } else {
        await api.post('/api/teams', form);
        toast.success('Team created successfully');
        setIsModalOpen(false);
        router.push('/taskbox');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await api.delete(`/api/teams/${id}`);
      toast.success('Team deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  const openModal = (team = null) => {
    if (team) {
      setForm({
        id: team.id,
        name: team.name,
        targetRevenue: team.targetRevenue,
        leaderId: team.leader?.id || '',
        memberIds: team.members?.map(m => m.id) || [],
        color: team.color || '#4f46e5',
        image: team.image || ''
      });
    } else {
      setForm({
        id: null,
        name: '',
        targetRevenue: '',
        leaderId: '',
        memberIds: [],
        color: '#4f46e5',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleMemberToggle = (empId) => {
    if (form.memberIds.includes(empId)) {
      setForm({ ...form, memberIds: form.memberIds.filter(id => id !== empId) });
    } else {
      setForm({ ...form, memberIds: [...form.memberIds, empId] });
    }
  };

  if (!hasAdminAccess(user)) {
    return <div className="p-8 text-center text-slate-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
              <Target size={24} />
            </div>
            Teams & Targets
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage workforce groups and revenue goals</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
              <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(team)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit3 size={16}/></button>
                <button onClick={() => handleDelete(team.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {team.image ? (
                  <img src={team.image} alt={team.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" style={{ borderColor: team.color || '#4f46e5', borderWidth: '2px' }} />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl text-white shadow-sm" style={{ backgroundColor: team.color || '#4f46e5' }}>
                    {team.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-slate-800 text-lg">{team.name}</h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Team Leader</p>
                  <p className="text-sm font-bold text-slate-700">{team.leader?.name || 'Unassigned'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center justify-between">
                    Members 
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{team.members?.length || 0}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {team.members?.slice(0, 3).map(m => (
                      <span key={m.id} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md">{m.name}</span>
                    ))}
                    {team.members?.length > 3 && (
                      <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-md">+{team.members.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {teams.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              <Target size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="font-bold text-lg">No teams found</p>
              <p className="text-sm">Create a team to assign targets and organize your workforce.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-800">
                {form.id ? 'Edit Team' : 'Create New Team'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="team-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Team Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      placeholder="e.g. Alpha Squad"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Team Color</label>
                      <input 
                        type="color" 
                        className="w-full h-[46px] rounded-xl cursor-pointer bg-slate-50 border border-slate-200 p-1 focus:bg-white focus:border-blue-500 outline-none transition-all"
                        value={form.color}
                        onChange={(e) => setForm({...form, color: e.target.value})}
                      />
                    </div>
                    <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Image URL (Optional)</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        value={form.image}
                        onChange={(e) => setForm({...form, image: e.target.value})}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 transition-colors group-focus-within:text-blue-500">Team Leader</label>
                  <select 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    value={form.leaderId}
                    onChange={(e) => setForm({...form, leaderId: e.target.value})}
                  >
                    <option value="">Select a Team Leader</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assign Members (Interns & Employees)</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
                    {employees.filter(e => e.role === 'employee' || e.role === 'intern').map(emp => (
                      <label key={emp.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 shadow-sm hover:shadow">
                        <input 
                          type="checkbox" 
                          checked={form.memberIds.includes(emp.id)}
                          onChange={() => handleMemberToggle(emp.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-700">{emp.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">{emp.role}</p>
                        </div>
                      </label>
                    ))}
                    {employees.filter(e => e.role === 'employee' || e.role === 'intern').length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4 font-medium">No eligible members found.</p>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                form="team-form"
                type="submit"
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
              >
                <Save size={16} />
                {form.id ? 'Save Changes' : 'Create Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
