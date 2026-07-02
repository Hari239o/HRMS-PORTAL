"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { CalendarDays, Trash2, Plus, Calendar, Bell, Palmtree, Clock, Info, UploadCloud, Heart, Image as ImageIcon, Sparkles } from 'lucide-react';
import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';

export default function Holidays() {
  const { user } = useAuth();
  const isAdmin = hasAdminAccess(user);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', date: '', type: 'Custom', image: '' });
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/holidays`);
      setHolidays(res.data || []);
    } catch (err) {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Limit to 2MB
        toast.error("Image must be smaller than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/holidays`, formData);
      toast.success('Holiday scheduled successfully!');
      setFormData({ name: '', date: '', type: 'Custom', image: '' });
      setShowModal(false);
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await api.delete(`/api/holidays/${id}`);
      toast.success('Holiday deleted successfully');
      fetchHolidays();
    } catch (err) {
      toast.error('Delete action failed');
    }
  };

  const handleSendWishes = () => {
    toast.success('🎉 Wishes broadcasted to the team!', { icon: '🎉' });
  };

  // Logic to separate Upcoming and Past holidays
  const { upcomingHolidays, pastHolidays, nextHoliday } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sorted = [...holidays].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const upcoming = sorted.filter(h => new Date(h.date) >= today);
    const past = sorted.filter(h => new Date(h.date) < today);
    const next = upcoming.length > 0 ? upcoming[0] : null;

    return { upcomingHolidays: upcoming, pastHolidays: past, nextHoliday: next };
  }, [holidays]);

  // Helper to calculate days until a date
  const getDaysUntil = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      
      {/* Enterprise Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-8 shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <CalendarDays className="text-blue-400" size={32} />
              Company Holidays
            </h2>
            <p className="text-slate-400 mt-2 text-sm font-medium max-w-xl">
              {isAdmin 
                ? 'Manage the official company holiday calendar. Add non-operational days which automatically notify employees.' 
                : 'View the official company holiday calendar. Plan your leaves around these non-operational days.'}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 transition shadow-lg shadow-blue-500/20 whitespace-nowrap"
            >
              <Plus size={18} /> Schedule Holiday
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium">Loading holiday calendar...</p>
        </div>
      ) : (
        <>
          {/* Next Holiday Notification Banner */}
          {nextHoliday ? (
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-fuchsia-50 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500 group">
              <div className="absolute right-0 top-0 w-64 h-full bg-blue-200/20 skew-x-12 transform -translate-x-10 pointer-events-none transition-transform group-hover:translate-x-0"></div>
              
              <div className="flex items-center gap-6 z-10 w-full md:w-auto">
                <div className="relative">
                  {nextHoliday.image ? (
                    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden shrink-0">
                      <img src={nextHoliday.image} alt={nextHoliday.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-fuchsia-500 flex items-center justify-center text-white shrink-0 shadow-lg border-4 border-white">
                      <Sparkles size={32} className="animate-pulse" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-500">
                    <Bell size={16} className="animate-bounce" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1 flex items-center gap-1">
                    Upcoming Celebration
                  </p>
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{nextHoliday.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 text-sm font-semibold text-slate-500">
                    <Calendar size={14} className="text-blue-400" />
                    {new Date(nextHoliday.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div className="z-10 flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <button 
                  onClick={handleSendWishes}
                  className="bg-white/80 hover:bg-blue-600 hover:text-white text-blue-600 backdrop-blur-md border border-blue-100 px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
                >
                  <Heart size={16} /> Broadcast Wishes
                </button>
                <div className="bg-white/80 backdrop-blur-md rounded-xl px-6 py-3 border border-blue-100 shadow-sm text-center min-w-[140px]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Happening in</p>
                  <p className="text-3xl font-black text-blue-700">
                    {getDaysUntil(nextHoliday.date)} <span className="text-xs font-bold text-blue-600/60 uppercase">Days</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm flex items-center gap-4 text-slate-500">
              <Info size={24} className="text-slate-400" />
              <div>
                <p className="font-semibold text-slate-700">No Upcoming Holidays</p>
                <p className="text-sm">There are no future holidays currently scheduled in the calendar.</p>
              </div>
            </div>
          )}

          {/* Holiday Lists Grid */}
          <div className="grid gap-8 lg:grid-cols-2 animate-in slide-in-from-bottom-4 duration-500 delay-75">
            
            {/* Upcoming Holidays Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
                <Palmtree size={16} /> Scheduled Holidays
              </h3>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-4">Holiday Details</th>
                      <th className="px-5 py-4">Date</th>
                      {isAdmin && <th className="px-5 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {upcomingHolidays.length > 0 ? upcomingHolidays.map((hol) => (
                      <tr key={hol.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {hol.image ? (
                              <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden shrink-0">
                                <img src={hol.image} alt={hol.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center shrink-0">
                                <Palmtree size={16} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                {hol.name}
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${hol.type === 'National' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                  {hol.type}
                                </span>
                              </div>
                              <div className="text-[11px] font-semibold text-blue-500 mt-1 flex items-center gap-1">
                                <Clock size={10} /> In {getDaysUntil(hol.date)} days
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-600">
                          {new Date(hol.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4 text-right">
                            <button 
                              onClick={() => handleDelete(hol.id)} 
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete Holiday"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={isAdmin ? "3" : "2"} className="px-5 py-16 text-center">
                          <p className="text-sm font-medium text-slate-400">No scheduled holidays.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Past Holidays Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <CalendarDays size={16} /> Past Holidays
              </h3>
              
              <div className="bg-slate-50/50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100/50 border-b border-slate-200/60 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-4">Holiday Details</th>
                      <th className="px-5 py-4">Date</th>
                      {isAdmin && <th className="px-5 py-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastHolidays.length > 0 ? pastHolidays.map((hol) => (
                      <tr key={hol.id} className="hover:bg-slate-100/50 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {hol.image ? (
                              <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden shrink-0 grayscale opacity-60">
                                <img src={hol.image} alt={hol.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-400 border border-slate-300 flex items-center justify-center shrink-0">
                                <CalendarDays size={14} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-600 flex items-center gap-2">
                                {hol.name}
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-slate-200 text-slate-500`}>
                                  {hol.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-500">
                          {new Date(hol.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        {isAdmin && (
                          <td className="px-5 py-4 text-right">
                            <button 
                              onClick={() => handleDelete(hol.id)} 
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={isAdmin ? "3" : "2"} className="px-5 py-12 text-center">
                          <p className="text-sm font-medium text-slate-400">No past holidays recorded.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </>
      )}

      {/* Schedule Holiday Modal */}
      {showModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#0f172a] px-8 py-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full pointer-events-none -mr-10 -mt-10"></div>
              <h3 className="text-xl font-bold text-white relative z-10">Schedule New Holiday</h3>
              <p className="text-sm font-medium text-slate-400 relative z-10">Add a non-operational day and an optional celebration graphic.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Image Upload Area */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Holiday Graphic / Poster (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                    formData.image ? 'border-blue-500 bg-blue-50 overflow-hidden p-1 relative' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  {formData.image ? (
                    <>
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                        <p className="text-white font-bold text-sm flex items-center gap-2"><UploadCloud size={16} /> Change Graphic</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-blue-500 mx-auto mb-2 border border-slate-100">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Click to upload image</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1">PNG, JPG, GIF up to 2MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Holiday Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Diwali, Christmas, Company Retreat"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Holiday Type</label>
                  <select 
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Custom">Custom Break</option>
                    <option value="National">National Holiday</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-[2] rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><CalendarDays size={18} /> Schedule Holiday</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
