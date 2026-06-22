import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, ArrowUpRight, ArrowDownLeft, Camera, Filter, Users, MapPin } from 'lucide-react';

const OFFICE_LOCATION = { latitude: 17.43909266436075, longitude: 78.39484164924859 };
const ATTENDANCE_WINDOW = { from: '11:00', to: '20:00' };

const Attendance = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [scanning, setScanning] = useState(false);

  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  const filteredHistory = history.filter(row => {
    let match = true;
    if (filterDay && row.date !== filterDay) match = false;
    if (filterMonth && !row.date.startsWith(filterMonth)) match = false;
    if (filterEmployee && row.employee?.name !== filterEmployee) match = false;
    return match;
  });

  const uniqueEmployees = [...new Set(history.map(row => row.employee?.name).filter(Boolean))];
  const membersPresent = [...new Set(filteredHistory.map(row => row.employeeId))].length;

  const formatLocation = (location) => {
    if (!location || location.latitude == null || location.longitude == null) return 'Unknown';
    return `${parseFloat(location.latitude).toFixed(5)}, ${parseFloat(location.longitude).toFixed(5)}`;
  };

  const formatDistance = (distance) => distance == null ? 'N/A' : `${distance}m`;

  useEffect(() => {
    fetchData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => {
          setCurrentLocation(null);
          toast.error('Enable GPS permissions to use attendance.');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setCurrentLocation(null);
      toast.error('Geolocation is not supported by this browser.');
    }
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || ""}/api/attendance`);
      setHistory(res.data);
      const today = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD in local time
      const todayRec = res.data.find(r => r.date === today);
      setTodayRecord(todayRec);
    } catch (err) {
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (recordId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || ""}/api/attendance/${recordId}/status`, { status: newStatus });
      toast.success(`Status successfully updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };



  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }

    setScanning(true);

    const sendCheckIn = async ({ latitude, longitude }) => {
      setScanning(false);
      try {
        let deviceId = localStorage.getItem('geonixa_device_id');
        if (!deviceId) {
          deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
          localStorage.setItem('geonixa_device_id', deviceId);
        }

        const payload = {
          latitude,
          longitude,
          deviceId,
        };
        await axios.post(`${import.meta.env.VITE_API_URL || ""}/api/attendance/checkin`, payload);
        toast.success('Identity Verified. Check-in Approved!');
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Verification Failed');
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await sendCheckIn({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setScanning(false);
        toast.error('Failed to get location. Please enable GPS permissions.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleCheckOut = async () => {
    if (!todayRecord || todayRecord.checkOut) return;
    setScanning(true);

    const sendCheckOut = async ({ latitude, longitude }) => {
      setScanning(false);
      try {
        const payload = { latitude, longitude };
        await axios.post(`${import.meta.env.VITE_API_URL || ""}/api/attendance/checkout`, payload);
        toast.success('Checked out successfully!');
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Check-out failed');
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await sendCheckOut({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setScanning(false);
        toast.error('Failed to get location for checkout. Please enable GPS permissions.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8 fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Attendance <span className="text-blue-600">Terminal</span></h2>
          <p className="text-slate-500 font-medium">Biometric and Location verified logs</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-slate-800">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {user.role !== 'admin' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -mr-8 -mt-8 rounded-full"></div>
            <div className="relative z-10 flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[28px] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <ArrowUpRight size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 mb-1">Morning Arrival</h3>
                <p className="text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
                  <MapPin size={14} /> GPS Required
                </p>
              </div>
              <button 
                onClick={handleCheckIn}
                disabled={!!todayRecord}
                className={`w-full max-w-[240px] py-4 rounded-2xl font-black tracking-tight transition-all duration-300 shadow-lg ${
                  todayRecord 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50 hover:shadow-emerald-300/50 active:scale-95'
                }`}
              >
                {todayRecord ? 'COMPLETED' : 'SECURE CHECK-IN'}
              </button>
              {todayRecord && todayRecord.status !== 'Absent' && (
                <div className="mt-4 space-y-2">
                  <div className="px-4 py-2 bg-emerald-50 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-500">
                    <CheckCircle size={16} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Clocked in at {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 -mr-8 -mt-8 rounded-full"></div>
            <div className="relative z-10 flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[28px] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <ArrowDownLeft size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-black text-slate-800 mb-1">Evening Departure</h3>
                <p className="text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
                  <Camera size={14} /> GPS Required
                </p>
              </div>
              <button 
                onClick={handleCheckOut}
                disabled={!todayRecord || !!todayRecord.checkOut}
                className={`w-full max-w-[240px] py-4 rounded-2xl font-black tracking-tight transition-all duration-300 shadow-lg ${
                  (!todayRecord || !!todayRecord.checkOut)
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200/50 hover:shadow-rose-300/50 active:scale-95'
                }`}
              >
                {todayRecord?.checkOut ? 'COMPLETED' : 'SECURE CHECK-OUT'}
              </button>
              {todayRecord?.checkOut && (
                <div className="mt-4 space-y-2">
                  <div className="px-4 py-2 bg-rose-50 rounded-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-500">
                    <CheckCircle size={16} className="text-rose-600" />
                    <span className="text-xs font-bold text-rose-700">Clocked out at {new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 border border-white/40 bg-gradient-to-br from-blue-50/50 to-white/60 backdrop-blur-xl shadow-2xl shadow-blue-100/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
          <h3 className="text-2xl font-black text-slate-900 mb-6 relative z-10">HR Attendance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm hover:shadow-md transition-all">
              <p className="text-[11px] uppercase tracking-[0.25em] text-blue-400 font-bold mb-2">Company Office Location</p>
              <p className="font-black text-slate-800 text-lg">{OFFICE_LOCATION.latitude.toFixed(6)}, {OFFICE_LOCATION.longitude.toFixed(6)}</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Strict GPS-only geofence</p>
            </div>
            <div className="p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm hover:shadow-md transition-all">
              <p className="text-[11px] uppercase tracking-[0.25em] text-blue-400 font-bold mb-2">Office Window</p>
              <p className="font-black text-slate-800 text-lg">{ATTENDANCE_WINDOW.from} - {ATTENDANCE_WINDOW.to}</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Attendance valid only during this window</p>
            </div>
            <div className="p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm hover:shadow-md transition-all">
              <p className="text-[11px] uppercase tracking-[0.25em] text-blue-400 font-bold mb-2">Today's Attendance Place</p>
              <p className="font-black text-slate-800 text-lg">
                {todayRecord && todayRecord.checkInLocation
                  ? `${todayRecord.checkInLocation.latitude.toFixed(6)}, ${todayRecord.checkInLocation.longitude.toFixed(6)}`
                  : 'No attendance taken yet'}
              </p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Visible only in HR portal</p>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="card overflow-hidden p-0 border border-white/40 shadow-2xl shadow-blue-100/40 bg-white/60 backdrop-blur-2xl">
        {user.role === 'admin' && (
          <div className="px-4 md:px-8 py-6 border-b border-white/50 bg-white/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Filter size={12}/> Filter by Day</label>
              <input type="date" value={filterDay} onChange={(e) => { setFilterDay(e.target.value); setFilterMonth(''); }} className="w-full px-4 py-2 bg-white/50 border border-white rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm backdrop-blur-md" />
            </div>
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Filter size={12}/> Filter by Month</label>
              <input type="month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setFilterDay(''); }} className="w-full px-4 py-2 bg-white/50 border border-white rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm backdrop-blur-md" />
            </div>
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Users size={12}/> Filter by Employee</label>
              <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="w-full px-4 py-2 bg-white/50 border border-white rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm backdrop-blur-md">
                <option value="">All Employees</option>
                {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/80 backdrop-blur-md rounded-xl text-blue-700 font-bold text-sm border border-blue-100 w-full justify-center h-[38px] shadow-sm">
              <CheckCircle size={16} /> {membersPresent} Members Present
            </div>
          </div>
        )}
        <div className="px-8 py-6 border-b border-white/50 flex justify-between items-center bg-white/30">
          <div>
            <h3 className="text-xl font-black text-slate-800">Attendance History</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Trail • Last 30 Days</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-xl text-xs font-bold text-slate-600 border border-white shadow-sm">
            <Clock size={16} className="text-blue-600 animate-pulse" /> Real-time Sync
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/50">
                <th className="px-4 md:px-8 py-5">Timeline</th>
                {user.role === 'admin' && <th className="px-4 md:px-8 py-5">Employee</th>}
                <th className="px-4 md:px-8 py-5">Arrival</th>
                <th className="px-4 md:px-8 py-5">Departure</th>
                <th className="px-4 md:px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="group hover:bg-white/60 transition-all cursor-default border-b border-white/30 last:border-0">
                  <td className="px-4 md:px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800">{new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(row.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    </div>
                  </td>
                  {user.role === 'admin' && (
                    <td className="px-4 md:px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs uppercase shadow-sm border border-white">
                          {row.employee?.name?.[0] || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{row.employee?.name || 'Unknown'}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{row.employee?.department || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-4 md:px-8 py-6">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-700">{row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                      {user.role === 'admin' && row.checkIn && (
                        <>
                          <span className="text-[10px] text-slate-400 block">Loc: {formatLocation(row.checkInLocation ?? { latitude: row.latitude, longitude: row.longitude })}</span>
                          <span className="text-[10px] text-slate-400 block">Nearby: {formatDistance(row.checkInDistance)}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-6">
                    {row.checkOut 
                      ? (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-700">{row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                          {user.role === 'admin' && row.checkOut && (
                            <>
                              <span className="text-[10px] text-slate-400 block">Loc: {formatLocation(row.checkOutLocation ?? { latitude: row.checkOutLatitude, longitude: row.checkOutLongitude })}</span>
                              <span className="text-[10px] text-slate-400 block">Nearby: {formatDistance(row.checkOutDistance)}</span>
                            </>
                          )}
                        </div>
                      ) : <span className="text-slate-300 font-medium italic">Pending</span>
                    }
                  </td>
                  <td className="px-4 md:px-8 py-6 text-right">
                    {user.role === 'admin' ? (
                      <select 
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 outline-none cursor-pointer transition-all shadow-sm ${
                          row.status === 'Present' ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:border-emerald-300' :
                          row.status === 'Half Day' ? 'bg-orange-50/80 text-orange-700 border-orange-200 hover:border-orange-300' :
                          'bg-rose-50/80 text-rose-700 border-rose-200 hover:border-rose-300'
                        }`}
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half Day">Half Day</option>
                      </select>
                    ) : (
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-block shadow-sm ${
                        row.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        row.status === 'Half Day' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={user.role === 'admin' ? "5" : "4"} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                        <Clock size={32} />
                      </div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records available</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
