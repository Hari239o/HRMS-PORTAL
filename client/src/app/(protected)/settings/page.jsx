"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Clock, Save, Lock, Key } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Settings = () => {
 const { user } = useAuth();
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [savingPassword, setSavingPassword] = useState(false);
 const [timings, setTimings] = useState({
 officeStartTime: '11:00',
 officeEndTime: '20:00',
 });
 const [passwordForm, setPasswordForm] = useState({
 currentPassword: '',
 newPassword: '',
 confirmPassword: ''
 });

 useEffect(() => {
 fetchSettings();
 }, []);

 const fetchSettings = async () => {
 try {
 const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/settings`);
 if (res.data) {
 setTimings({
 officeStartTime: res.data.officeStartTime || '11:00',
 officeEndTime: res.data.officeEndTime || '20:00',
 });
 }
 } catch (err) {
 toast.error('Failed to load settings');
 } finally {
 setLoading(false);
 }
 };

 const handleSave = async () => {
 setSaving(true);
 try {
 await api.post(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/settings`, timings);
 toast.success('Settings updated successfully!');
 } catch (err) {
 toast.error(err.response?.data?.error || 'Failed to update settings');
 } finally {
 setSaving(false);
 }
 };

 const handlePasswordChange = async (e) => {
 e.preventDefault();
 if (passwordForm.newPassword !== passwordForm.confirmPassword) {
 toast.error('New passwords do not match');
 return;
 }
 
 setSavingPassword(true);
 try {
 await api.put(`/api/auth/change-password`, {
 currentPassword: passwordForm.currentPassword,
 newPassword: passwordForm.newPassword
 });
 toast.success('Password updated successfully!');
 setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
 } catch (err) {
 toast.error(err.response?.data?.error || 'Failed to change password');
 } finally {
 setSavingPassword(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
 </div>
 );
 }

 return (
 <div className="space-y-8 ">
 <div className="flex justify-between items-end">
 <div>
 <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
 <SettingsIcon className="text-blue-600" size={32} />
 {user?.role === 'admin' ? 'System ' : 'Account '}<span className="text-blue-600">Settings</span>
 </h2>
 <p className="text-slate-500 font-medium">Manage your preferences and security</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 
 {/* Change Password Section */}
 <div className="card shadow-xl shadow-slate-100 border-none p-8">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
 <Lock size={20} />
 </div>
 <div>
 <h3 className="text-xl font-black text-slate-800">Security</h3>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Change Password</p>
 </div>
 </div>

 <form onSubmit={handlePasswordChange} className="space-y-6">
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
 <input 
 type="password" 
 value={passwordForm.currentPassword}
 onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
 required
 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700"
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
 <input 
 type="password" 
 value={passwordForm.newPassword}
 onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
 required
 minLength={6}
 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700"
 />
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
 <input 
 type="password" 
 value={passwordForm.confirmPassword}
 onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
 required
 minLength={6}
 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700"
 />
 </div>

 <button 
 type="submit"
 disabled={savingPassword}
 className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black tracking-wide hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
 >
 {savingPassword ? (
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 ) : (
 <>
 <Key size={18} /> Update Password
 </>
 )}
 </button>
 </form>
 </div>

 {/* System Settings (Admin Only) */}
 {user?.role === 'admin' && (
 <div className="card shadow-xl shadow-slate-100 border-none p-8">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
 <Clock size={20} />
 </div>
 <div>
 <h3 className="text-xl font-black text-slate-800">Office Timings</h3>
 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Defaults</p>
 </div>
 </div>

 <div className="space-y-6">
 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Office Start Time</label>
 <input 
 type="time" 
 value={timings.officeStartTime}
 onChange={(e) => setTimings({...timings, officeStartTime: e.target.value})}
 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-700"
 />
 <p className="text-xs text-slate-500 mt-2">Employees checking in after this time will be marked as Late.</p>
 </div>

 <div>
 <label className="block text-sm font-bold text-slate-700 mb-2">Office End Time</label>
 <input 
 type="time" 
 value={timings.officeEndTime}
 onChange={(e) => setTimings({...timings, officeEndTime: e.target.value})}
 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium text-slate-700"
 />
 <p className="text-xs text-slate-500 mt-2">Standard end of day for the office.</p>
 </div>

 <button 
 onClick={handleSave}
 disabled={saving}
 className="w-full py-4 bg-blue-600 text-white rounded-xl font-black tracking-wide hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
 >
 {saving ? (
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
 ) : (
 <>
 <Save size={18} /> Save Settings
 </>
 )}
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};

export default Settings;
