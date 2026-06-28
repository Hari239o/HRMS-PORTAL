"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, ArrowUpRight, ArrowDownLeft, Camera, Filter, Users, MapPin } from 'lucide-react';

const OFFICE_LOCATION = { latitude: 17.4392259, longitude: 78.3948023 };
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
      const res = await api.get(`/api/attendance`);
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
      await api.put(`/api/attendance/${recordId}/status`, { status: newStatus });
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
        await api.post(`/api/attendance/checkin`, payload);
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
        await api.post(`/api/attendance/checkout`, payload);
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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
      <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Attendance...</p>
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
                <h3 className="text-2xl font-black text-slate-800 mb-1">Check In</h3>
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
                <h3 className="text-2xl font-black text-slate-800 mb-1">Check Out</h3>
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
        <div className="divide-y divide-slate-100 bg-white">
          {filteredHistory.map((row) => {
            const dateObj = new Date(row.date);
            const dayNum = dateObj.getDate();
            const month = dateObj.toLocaleString('en-US', { month: 'short' });
            const weekday = dateObj.toLocaleString('en-US', { weekday: 'short' });

            const checkInStr = row.checkIn ? new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';
            const checkOutStr = row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';
            const timeString = row.checkIn ? `${checkInStr} ➔ ${checkOutStr || '...'}` : 'No punch data';

            const isWeeklyOff = row.status === 'Weekly Off';
            const statusColor = isWeeklyOff ? 'text-[#6b4c9a]' : 'text-black';

            return (
              <div key={row.id} className="flex px-5 py-4 md:px-8 hover:bg-slate-50 transition-colors group">
                {/* Left Column - Date */}
                <div className="w-16 flex-shrink-0 flex flex-col items-start pt-1 font-serif">
                  <span className="text-[15px] text-slate-800 leading-tight">{dayNum}</span>
                  <span className="text-[13px] text-slate-800 leading-tight">{month}</span>
                  <span className="text-[13px] text-slate-800 leading-tight">{weekday}</span>
                </div>
                
                {/* Right Column - Details */}
                <div className="flex-grow flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <span className={`text-[16px] font-bold font-serif ${statusColor}`}>{row.status}</span>
                    {user.role === 'admin' && (
                      <select 
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.id, e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Half Day">Half Day</option>
                        <option value="Weekly Off">Weekly Off</option>
                      </select>
                    )}
                  </div>
                  
                  {row.status !== 'Weekly Off' && (
                    <div className="text-[13px] text-slate-500 mt-1 font-medium flex items-center gap-2 tracking-wide">
                      {timeString}
                      {user.role === 'admin' && (
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 border border-slate-200">
                          {row.employee?.name}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-[13px] text-slate-400 mt-0.5 tracking-wide">
                     Geonixa General (11:00:00 to 20:00:00) (Office)
                  </div>
                </div>
              </div>
            );
          })}
          {filteredHistory.length === 0 && (
            <div className="px-8 py-20 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <Clock size={32} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
