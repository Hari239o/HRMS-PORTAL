"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { hasAdminAccess } from '@/utils/rbac';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { Target, Plus, Users, Trash2, Edit3, X, Save, UploadCloud } from 'lucide-react';
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const toastId = toast.loading('Uploading image...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', 'team_avatar');
      const res = await api.post('/api/employees/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.fileUrl) {
        setForm({ ...form, image: res.data.fileUrl });
        toast.success('Image uploaded successfully!', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image', { id: toastId });
    }
  };



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
        {hasAdminAccess(user) && (
        <button 
          onClick={() => openModal()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Create Team
        </button>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex flex-col h-full">
              {/* Colored Banner Top */}
              <div className="h-32 w-full relative bg-cover bg-center" style={{ backgroundColor: team.color || '#4f46e5', backgroundImage: team.image ? `url(${team.image})` : 'none' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {hasAdminAccess(user) && <button onClick={() => openModal(team)} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors"><Edit3 size={16}/></button>}
                  {hasAdminAccess(user) && <button onClick={() => handleDelete(team.id)} className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"><Trash2 size={16}/></button>}
                </div>
                {/* Team Icon/Avatar Overlapping */}
                <div className="absolute -bottom-6 left-6">
                  {team.image ? (
                    <img src={team.image} alt={team.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border-4 border-white bg-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md border-4 border-white" style={{ backgroundColor: team.color || '#4f46e5' }}>
                      {team.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Content */}
              <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
                <h3 className="font-black text-slate-800 text-xl mb-6">{team.name}</h3>

                <div className="space-y-5 flex-1">
                  {/* Leader Section */}
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Team Leader</p>
                    <div className="flex items-center gap-3">
                      {team.leader?.avatar ? (
                        <img src={team.leader.avatar} alt={team.leader.name} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-200">
                          {team.leader?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-700">{team.leader?.name || 'Unassigned'}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Leader</p>
                      </div>
                    </div>
                  </div>

                  {/* Members Section */}
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex justify-between items-center">
                      Team Members
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{team.members?.length || 0}</span>
                    </p>
                    {team.members?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {team.members.map(m => (
                          <div key={m.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-xl">
                            {m.avatar ? (
                              <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                                {m.name.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs font-semibold text-slate-600">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No members assigned.</p>
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
            
            <div className="p-8 overflow-y-auto flex-1 bg-slate-50">
              <form id="team-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Team Info Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
                  <div className="group">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-blue-500">Team Name</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      placeholder="e.g. Alpha Squad"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-blue-500">Team Color</label>
                      <div className="relative">
                        <input 
                          type="color" 
                          className="w-full h-[52px] rounded-xl cursor-pointer bg-slate-50 border border-slate-200 p-1.5 focus:bg-white focus:border-blue-500 outline-none transition-all"
                          value={form.color}
                          onChange={(e) => setForm({...form, color: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-blue-500">Team Graphic / Avatar</label>
                      <div className="relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={handleImageUpload}
                        />
                        <div className={`w-full h-[52px] rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${form.image ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-slate-50 border-slate-300 text-slate-500 group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-500'}`}>
                          {form.image ? (
                            <>
                              <img src={form.image} alt="Uploaded" className="w-8 h-8 rounded-lg object-cover" />
                              <span className="font-bold text-sm">Image Uploaded</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={20} />
                              <span className="font-bold text-sm">Upload File</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="group pt-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-blue-500">Team Leader</label>
                    <select 
                      required 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none"
                      value={form.leaderId}
                      onChange={(e) => setForm({...form, leaderId: e.target.value})}
                    >
                      <option value="">Select a Team Leader...</option>
                      {employees.filter(emp => emp.role === 'employee').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Assign Members Section */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Assign Members (Interns & Employees)</label>
                  <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-2 max-h-72 overflow-y-auto space-y-1">
                    {employees.filter(e => e.role === 'employee' || e.role === 'intern').map(emp => {
                      const existingTeam = teams.find(t => t.members?.some(m => m.id === emp.id) && t.id !== form.id);
                      const isSelected = form.memberIds.includes(emp.id);
                      return (
                        <div 
                          key={emp.id} 
                          onClick={() => handleMemberToggle(emp.id)}
                          className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${isSelected ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isSelected ? 'bg-blue-600 border-blue-600 scale-110' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in" />}
                          </div>
                          
                          <div className="flex items-center gap-3 flex-1">
                            {emp.avatar ? (
                              <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-black text-slate-500 border-2 border-white shadow-sm">
                                {emp.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className={`text-sm font-black transition-colors ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>{emp.name}</p>
                                {existingTeam && (
                                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm" style={{ backgroundColor: `${existingTeam.color || '#4f46e5'}15`, color: existingTeam.color || '#4f46e5' }}>
                                    In Team: {existingTeam.name}
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] font-bold uppercase mt-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`}>{emp.role}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {employees.filter(e => e.role === 'employee' || e.role === 'intern').length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <Users size={32} className="mb-2 opacity-50" />
                        <p className="text-sm font-bold">No eligible members found.</p>
                      </div>
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
