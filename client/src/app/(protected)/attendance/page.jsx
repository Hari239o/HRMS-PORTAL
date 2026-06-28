"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, Fingerprint, Filter, Users, MapPin, AlertCircle } from 'lucide-react';

const OFFICE_LOCATION = { latitude: 17.4392259, longitude: 78.3948023 };
const ATTENDANCE_WINDOW = { from: '11:00', to: '20:30' };

export default function Attendance() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      const today = new Date().toLocaleDateString('en-CA');
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

        const payload = { latitude, longitude, deviceId };
        await api.post(`/api/attendance/checkin`, payload);
        toast.success('Identity Verified. Checked In Successfully!');
        fetchData();
      } catch (err) {
        toast.error(err.response?.data?.error || 'Verification Failed');
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => await sendCheckIn({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
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
      async (position) => await sendCheckOut({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => {
        setScanning(false);
        toast.error('Failed to get location for checkout. Please enable GPS permissions.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const getFillPercentage = () => {
    if (!todayRecord || !todayRecord.checkIn) return 0;
    const checkInTime = new Date(todayRecord.checkIn).getTime();
    const now = currentTime.getTime();
    const elapsedHours = (now - checkInTime) / (1000 * 60 * 60);
    return Math.min((elapsedHours / 8) * 100, 100);
  };

  const fillPercentage = getFillPercentage();
  const topOffset = 100 - fillPercentage;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
      <div className="w-12 h-12 border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Terminal...</p>
    </div>
  );

  return (
    <div className="space-y-8 fade-in relative">
      <style>{`
        @keyframes spin-wave {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
      
      {/* Top Header Section */}
      <div className="flex justify-between items-start md:items-end">
        <div>
          <h2 className="text-[28px] md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Attendance <span className="text-[#ff5a1f]">Terminal</span>
          </h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1">Biometric and Location verified logs</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[28px] md:text-4xl font-black text-slate-800 tracking-tighter tabular-nums leading-none">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1">
            {currentTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', weekday: 'long' })}
          </p>
        </div>
      </div>

      {user.role !== 'admin' ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 relative">
          
          {/* Animated Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[#ff5a1f]/5 rounded-full blur-3xl -z-10"></div>
          
          {!todayRecord ? (
            /* PUNCH IN STATE */
            <div 
              onClick={handleCheckIn}
              className={`relative w-72 h-72 rounded-full overflow-hidden border-8 border-white bg-white shadow-[0_20px_60px_-15px_rgba(255,90,31,0.15)] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-[0_20px_60px_-10px_rgba(255,90,31,0.25)] hover:scale-105 active:scale-95 ${scanning ? 'opacity-70 pointer-events-none scale-95' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#ff5a1f]/5 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-[#ff5a1f]/10 p-5 rounded-full mb-4">
                  <Fingerprint size={64} className="text-[#ff5a1f] animate-pulse" strokeWidth={1.5} />
                </div>
                <span className="text-3xl font-black text-slate-800 tracking-tight">PUNCH IN</span>
                <span className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
                  <MapPin size={12} /> GPS Required
                </span>
              </div>
            </div>
          ) : (
            /* PUNCH OUT / WATER FILL STATE */
            <div 
              onClick={handleCheckOut}
              className={`relative w-72 h-72 rounded-full overflow-hidden border-8 border-white bg-slate-50 shadow-[0_20px_60px_-15px_rgba(255,90,31,0.15)] flex flex-col items-center justify-center transition-all duration-300 ${!todayRecord.checkOut ? 'cursor-pointer hover:scale-105 active:scale-95 hover:shadow-[0_20px_60px_-10px_rgba(255,90,31,0.25)]' : 'opacity-80'}`}
            >
              {/* Back layer wave */}
              <div 
                className="absolute w-[250%] h-[250%] left-1/2 rounded-[43%] bg-[#ff5a1f]/30 animate-[spin-wave_8s_linear_infinite]" 
                style={{ top: `${topOffset + 3}%` }}
              />
              {/* Front layer wave */}
              <div 
                className="absolute w-[250%] h-[250%] left-1/2 rounded-[40%] bg-gradient-to-t from-[#ff5a1f] to-[#ff8b5e] animate-[spin-wave_5s_linear_infinite]" 
                style={{ top: `${topOffset}%` }}
              />

              <div className="relative z-10 flex flex-col items-center mt-6">
                <div className={`p-4 rounded-full mb-2 ${fillPercentage > 50 ? 'bg-white/20 text-white' : 'bg-[#ff5a1f]/10 text-[#ff5a1f]'}`}>
                  <Fingerprint size={48} strokeWidth={1.5} />
                </div>
                <span className={`text-2xl font-black tracking-tight ${fillPercentage > 50 ? 'text-white' : 'text-slate-800'}`}>
                  {todayRecord.checkOut ? 'COMPLETED' : 'PUNCH OUT'}
                </span>
                
                {!todayRecord.checkOut && (
                  <div className={`flex flex-col items-center mt-2 ${fillPercentage > 50 ? 'text-white' : 'text-slate-500'}`}>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-80">
                      {Math.floor(fillPercentage)}% of 8hr shift
                    </span>
                    <span className="text-[10px] font-semibold mt-1 opacity-70">
                      In: {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {todayRecord.checkOut && (
                  <div className={`flex flex-col items-center mt-2 ${fillPercentage > 50 ? 'text-white' : 'text-slate-500'}`}>
                    <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                      <CheckCircle size={12}/> Checked Out
                    </span>
                    <span className="text-[10px] font-semibold mt-1 opacity-80">
                      Out: {new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-10 bg-[#ff5a1f]/5 border border-[#ff5a1f]/10 rounded-2xl p-4 flex items-start gap-3 max-w-sm w-full shadow-sm">
            <AlertCircle size={20} className="text-[#ff5a1f] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 font-medium leading-relaxed">
              Office hours are <span className="font-bold text-slate-800">11:00 AM to 8:30 PM</span>. Punching in after 11:05 AM is marked as a Half Day. Missing a punch out marks you Absent.
            </div>
          </div>
        </div>
      ) : (
        /* ADMIN DASHBOARD - Retained original logic with updated theme */
        <div className="card p-8 border border-slate-100 bg-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff5a1f]/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
          <h3 className="text-2xl font-black text-slate-900 mb-6 relative z-10">HR Attendance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#ff5a1f] font-bold mb-2">Company Office Location</p>
              <p className="font-black text-slate-800 text-lg">{OFFICE_LOCATION.latitude.toFixed(6)}, {OFFICE_LOCATION.longitude.toFixed(6)}</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Strict GPS-only geofence</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#ff5a1f] font-bold mb-2">Office Window</p>
              <p className="font-black text-slate-800 text-lg">{ATTENDANCE_WINDOW.from} - {ATTENDANCE_WINDOW.to}</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Attendance valid only during this window</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#ff5a1f] font-bold mb-2">Today's Attendance Place</p>
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
      <div className="card overflow-hidden p-0 border border-slate-100 shadow-xl bg-white">
        {user.role === 'admin' && (
          <div className="px-4 md:px-8 py-6 border-b border-slate-100 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Filter size={12}/> Filter by Day</label>
              <input type="date" value={filterDay} onChange={(e) => { setFilterDay(e.target.value); setFilterMonth(''); }} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20 transition-all shadow-sm" />
            </div>
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Filter size={12}/> Filter by Month</label>
              <input type="month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setFilterDay(''); }} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20 transition-all shadow-sm" />
            </div>
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Users size={12}/> Filter by Employee</label>
              <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#ff5a1f] focus:ring-2 focus:ring-[#ff5a1f]/20 transition-all shadow-sm">
                <option value="">All Employees</option>
                {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#ff5a1f]/10 rounded-xl text-[#ff5a1f] font-bold text-sm border border-[#ff5a1f]/20 w-full justify-center h-[38px] shadow-sm">
              <CheckCircle size={16} /> {membersPresent} Members Present
            </div>
          </div>
        )}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-black text-slate-800">Attendance History</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Trail • Last 30 Days</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 border border-slate-100 shadow-sm">
            <Clock size={16} className="text-[#ff5a1f] animate-pulse" /> Real-time Sync
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
                <div className="w-16 flex-shrink-0 flex flex-col items-start pt-1 font-serif">
                  <span className="text-[15px] text-slate-800 leading-tight">{dayNum}</span>
                  <span className="text-[13px] text-slate-800 leading-tight">{month}</span>
                  <span className="text-[13px] text-slate-800 leading-tight">{weekday}</span>
                </div>
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
                     Geonixa General (11:00:00 to 20:30:00) (Office)
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
}
