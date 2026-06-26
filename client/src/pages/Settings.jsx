import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Clock, Save } from 'lucide-react';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timings, setTimings] = useState({
    officeStartTime: '11:00',
    officeEndTime: '20:00',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get(`${import.meta.env.VITE_API_URL || ``}/api/settings`);
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
      await api.post(`${import.meta.env.VITE_API_URL || ``}/api/settings`, timings);
      toast.success('Settings updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
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
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <SettingsIcon className="text-blue-600" size={32} />
            System <span className="text-blue-600">Settings</span>
          </h2>
          <p className="text-slate-500 font-medium">Configure global application parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
              />
              <p className="text-xs text-slate-500 mt-2">Employees checking in after this time will be marked as Late.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Office End Time</label>
              <input 
                type="time" 
                value={timings.officeEndTime}
                onChange={(e) => setTimings({...timings, officeEndTime: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
              />
              <p className="text-xs text-slate-500 mt-2">Standard end of day for the office.</p>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-black tracking-wide hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
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
      </div>
    </div>
  );
};

export default Settings;
