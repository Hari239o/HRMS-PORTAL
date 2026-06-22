import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Mail, Briefcase, User, ShieldCheck, Folder, CheckCircle, XCircle, File, AlertTriangle, Bell, Key, Activity, Users, Building2, MapPin, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [attendanceToday, setAttendanceToday] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(null); // stores the employee object
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: 'Sales',
    avatar: '',
    assets: '',
    weekOff: 'Sunday',
    manager: '',
    hrManager: '',
    teamLeader: ''
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchAttendanceData, 60000); // refresh attendance every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchEmployees(), fetchAttendanceData()]);
    setLoading(false);
  };

  const fetchAttendanceData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/attendance`);
      const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
      const todayRecords = res.data.filter(a => a.date === todayDate);
      setAttendanceToday(todayRecords);
    } catch (err) {
      console.error('Failed to fetch attendance for real-time status');
    }
  };

  const fetchEmployees = async () => {
    try {
      const endpoint = user.role === 'admin' ? '/api/employees' : '/api/employees/directory';
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}${endpoint}`);
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees');
      toast.error('Failed to load workforce. Check database connection.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${editingId}`, formData);
        toast.success('Employee updated');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || "http://localhost:5002"}`}/api/employees`, formData);
        toast.success('Employee added');
      }
      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '', // Don't show password
      role: emp.role,
      department: emp.department,
      avatar: emp.avatar || '',
      assets: emp.assets || '',
      weekOff: emp.weekOff || 'Sunday',
      manager: emp.manager || '',
      hrManager: emp.hrManager || '',
      teamLeader: emp.teamLeader || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Remove this employee permanently?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${id}`);
        fetchEmployees();
        toast.success('Employee deleted');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleResetDevice = async (id) => {
    if (window.confirm('Reset device lock? This will allow the employee to log in from a new device.')) {
      try {
        await axios.patch(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${id}/reset-device`);
        toast.success('Device lock reset successfully');
      } catch (err) {
        toast.error('Failed to reset device lock');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'employee', department: 'Sales', avatar: '', assets: '', weekOff: 'Sunday', manager: '', hrManager: '', teamLeader: '' });
    setEditingId(null);
  };

  if (loading) return <div>Loading...</div>;

  const sendNotice = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${id}/send-notice`);
      toast.success('Notice Period Reminder Sent');
    } catch (err) {
      toast.error('Failed to send notice');
    }
  };

  const sendWarning = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${id}/send-warning`);
      toast.success('Official Warning Sent');
    } catch (err) {
      toast.error('Failed to send warning');
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = window.prompt("Enter new password for this employee:");
    if (!newPassword) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5002"}/api/employees/${id}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const getEmployeeStatus = (empId) => {
    const record = attendanceToday.find(a => a.employeeId === empId);
    if (!record) return { status: 'Offline', color: 'bg-slate-300' };
    if (record.checkIn && !record.checkOut) return { status: 'Working Now', color: 'bg-emerald-500', isOnline: true };
    if (record.checkOut) return { status: 'Checked Out', color: 'bg-amber-500' };
    return { status: 'Offline', color: 'bg-slate-300' };
  };

  const activeEmployeesCount = employees.filter(emp => getEmployeeStatus(emp.id).isOnline).length;
  const uniqueDepartments = new Set(employees.map(emp => emp.department)).size;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Workforce Management</h2>
          <p className="text-slate-500 mt-1 font-medium">{user.role === 'admin' ? 'Enterprise staff directory and real-time operations overview' : 'View your profile'}</p>
        </div>
        {user.role === 'admin' && (
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus size={20} /> Onboard Employee
          </button>
        )}
      </div>

      {user.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Headcount</p>
              <h3 className="text-3xl font-black text-slate-900">{employees.length}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Right Now</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-black text-slate-900">{activeEmployeesCount}</h3>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Departments</p>
              <h3 className="text-3xl font-black text-slate-900">{uniqueDepartments}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => {
          const statusObj = getEmployeeStatus(emp.id);
          return (
            <div key={emp.id} className="bg-white rounded-[24px] p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden flex flex-col h-full">
              {/* Online Status Indicator */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-50/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-100 shadow-sm z-10">
                <span className={`w-2 h-2 rounded-full ${statusObj.color} ${statusObj.isOnline ? 'animate-pulse' : ''}`}></span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{statusObj.status}</span>
              </div>

              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start mt-6 mb-6">
                <div className="flex gap-4 items-center">
                  <div className="relative">
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white ring-1 ring-slate-100" />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-md border-2 border-white ring-1 ring-slate-100">
                        {emp.name.charAt(0)}
                      </div>
                    )}
                    {statusObj.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                      {emp.name}
                      {emp.starPerformer && emp.starPerformer !== 'none' && (
                        <span className="text-amber-500 bg-amber-50 rounded-full p-1 shadow-sm" title={`Golden ${emp.starPerformer} Badge`}>🏆</span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {emp.department}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                        emp.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        emp.role === 'intern' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        emp.role === 'notice_period' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {emp.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-100 z-20">
                <button onClick={() => setShowDocsModal(emp)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="View Documents">
                  <Folder size={16} />
                </button>
                <a href={`mailto:${emp.email}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Send Direct Email">
                  <Mail size={16} />
                </a>
                {user.role === 'admin' && (
                  <>
                    <button onClick={() => sendNotice(emp.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Send HR Notice">
                      <Bell size={16} />
                    </button>
                    <button onClick={() => sendWarning(emp.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Send Warning">
                      <AlertTriangle size={16} />
                    </button>
                    <div className="w-full h-px bg-slate-100 my-1"></div>
                    <button onClick={() => handleEdit(emp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Employee">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleResetDevice(emp.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Reset Device Lock">
                      <Smartphone size={16} />
                    </button>
                    <button onClick={() => handleResetPassword(emp.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Reset Password">
                      <Key size={16} />
                    </button>
                    <button onClick={() => handleDelete(emp.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-slate-100/80 mt-auto flex-1">
              <div className="grid grid-cols-1 gap-3">
                <a href={`mailto:${emp.email}`} className="text-sm font-semibold text-slate-600 flex items-center gap-3 hover:text-indigo-600 transition-colors w-fit p-2 rounded-lg hover:bg-indigo-50/50 w-full">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Mail size={14} /></div> 
                  <span className="truncate">{emp.email}</span>
                </a>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 p-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><Briefcase size={14} /></div>
                  <span>Off Day: <span className="text-slate-900">{emp.weekOff || 'Sunday'}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500"><ShieldCheck size={14} /></div>
                  <span className="truncate">Assets: <span className="text-slate-900">{emp.assets || 'None'}</span></span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100/80 gap-3">
                <button 
                  onClick={() => setShowDocsModal(emp)} 
                  className="flex-1 py-2 px-3 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-black transition-colors flex items-center justify-center gap-2 border border-slate-200 hover:border-indigo-200 shadow-sm"
                >
                  <Folder size={14} /> View KYC Docs
                </button>
                {user.role === 'admin' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(emp)} 
                      className="p-2 bg-white hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors border border-slate-200 hover:border-indigo-200 shadow-sm" 
                      title="Edit Profile"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)} 
                      className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors border border-slate-200 hover:border-rose-200 shadow-sm" 
                      title="Terminate Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )})}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-slate-900 p-4 md:p-6 flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl backdrop-blur-md flex items-center justify-center text-white">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{editingId ? 'Update Personnel Profile' : 'Onboard New Employee'}</h3>
                  <p className="text-sm text-slate-300 mt-1">Fill out the official employment details below.</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="relative z-10 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Section: Basic Info */}
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4 pb-2 border-b border-indigo-100">Personal Information</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Jane Smith"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Avatar URL</label>
                  <input 
                    type="text" 
                    value={formData.avatar}
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                    placeholder="https://..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Corporate Email *</label>
                  <input 
                    type="email" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="jane@company.com"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>
                {!editingId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Initial Password *</label>
                    <input 
                      type="password" 
                      required 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                  </div>
                )}

                {/* Section: Employment Details */}
                <div className="col-span-1 md:col-span-2 mt-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4 pb-2 border-b border-indigo-100">Employment Logistics</h4>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">System Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-800"
                  >
                    <option value="employee">Standard Employee</option>
                    <option value="admin">System Administrator</option>
                    <option value="intern">Intern / Trainee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR Professional</option>
                    <option value="operations_manager">Operations Manager</option>
                  </select>
                </div>
                 <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Department</label>
                  <select 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Digital Marketing">Digital Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Business Development">Business Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Designated Weekly Off</label>
                  <select 
                    value={formData.weekOff}
                    onChange={(e) => setFormData({...formData, weekOff: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Custom">Custom / Rotating</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Issued Corporate Assets</label>
                  <input 
                    type="text" 
                    value={formData.assets}
                    onChange={(e) => setFormData({...formData, assets: e.target.value})}
                    placeholder="e.g. MacBook Pro, Access Card #123"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  />
                </div>

                {/* Section: Hierarchy */}
                <div className="col-span-1 md:col-span-2 mt-4 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">Organizational Hierarchy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Direct Manager</label>
                      <select 
                        value={formData.manager}
                        onChange={(e) => setFormData({...formData, manager: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="">-- None --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">HR Representative</label>
                      <select 
                        value={formData.hrManager}
                        onChange={(e) => setFormData({...formData, hrManager: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="">-- None --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Team Leader</label>
                      <select 
                        value={formData.teamLeader}
                        onChange={(e) => setFormData({...formData, teamLeader: e.target.value})}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        <option value="">-- None --</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

              </div>
              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] px-6 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">{editingId ? 'Save Profile Changes' : 'Complete Onboarding'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDocsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Folder size={24} className="text-indigo-600" /> 
                {showDocsModal.name}'s Documents
              </h3>
              <button onClick={() => setShowDocsModal(null)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-xl shadow-sm">
                <Trash2 size={18} className="rotate-45" /> {/* Using Trash2 rotated as a close button or we can just use text */}
              </button>
            </div>
            <div className="p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'tenth', title: '10th Certificate' },
                  { id: 'inter', title: 'Intermediate Certificate' },
                  { id: 'btech', title: 'B.Tech Certificate' },
                  { id: 'offerLetter', title: 'Offer Letter' },
                  { id: 'photo', title: 'Passport Photo' },
                  { id: 'signaturedOffer', title: 'Signatured Offer Letter' },
                ].map(doc => {
                  const url = showDocsModal.documents?.[doc.id];
                  return (
                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        {url ? <CheckCircle size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-rose-400" />}
                        <span className="font-bold text-sm text-slate-700">{doc.title}</span>
                      </div>
                      {url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                          <File size={14} /> View
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">Missing</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
