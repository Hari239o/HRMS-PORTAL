"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, Fingerprint, Filter, Users, MapPin, AlertCircle, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';

const OFFICE_LOCATION = { latitude: 17.4392259, longitude: 78.3948023 };
const ATTENDANCE_WINDOW = { from: '11:00', to: '20:00' };

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

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);
  const [requestCheckoutTime, setRequestCheckoutTime] = useState('');
  const [requestReason, setRequestReason] = useState('');
  
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

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

  const submitMissedCheckoutRequest = async () => {
    if (!requestCheckoutTime || !requestReason) {
      toast.error("Please provide both checkout time and a reason");
      return;
    }
    try {
      await api.post('/api/approvals', {
        type: 'missed_checkout',
        title: 'Missed Checkout Correction',
        description: requestReason,
        relatedEntity: 'Attendance',
        relatedId: selectedAttendanceId,
        details: { checkoutTime: requestCheckoutTime }
      });
      toast.success("Missed checkout request submitted successfully!");
      setRequestModalOpen(false);
      setRequestCheckoutTime('');
      setRequestReason('');
      setSelectedAttendanceId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit request");
    }
  };

  const getFillPercentage = () => {
    if (!todayRecord || !todayRecord.checkIn) return 0;
    const checkInTime = new Date(todayRecord.checkIn).getTime();
    const now = currentTime.getTime();
    const elapsedHours = (now - checkInTime) / (1000 * 60 * 60);
    return Math.min((elapsedHours / 8) * 100, 100);
  };

  const getElapsedTimeString = () => {
    if (!todayRecord || !todayRecord.checkIn) return "00:00:00";
    const checkInTime = new Date(todayRecord.checkIn).getTime();
    const now = todayRecord.checkOut ? new Date(todayRecord.checkOut).getTime() : currentTime.getTime();
    const diff = now - checkInTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fillPercentage = getFillPercentage();
  const topOffset = 100 - fillPercentage;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
      <div className="w-12 h-12 border-4 border-[#ff5a1f]/20 border-t-[#ff5a1f] rounded-full animate-spin"></div>
      <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Loading Terminal...</p>
    </div>
  );

  const calendarMonthStart = startOfMonth(currentCalendarDate);
  const calendarMonthEnd = endOfMonth(calendarMonthStart);
  const calendarStartDate = startOfWeek(calendarMonthStart);
  const calendarEndDate = endOfWeek(calendarMonthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStartDate,
    end: calendarEndDate
  });

  return (
    <div className="space-y-8 fade-in relative">
      <style>{`
        @keyframes spin-wave {
          from { transform: translateX(-50%) rotate(0deg); }
          to { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
      
      {/* Top Header Section */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-[26px] md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">
            Attendance <br/><span className="text-[#ff5a1f]">Terminal</span>
          </h2>
          <p className="text-slate-500 font-medium text-[10px] md:text-sm mt-2">Biometric and Location verified logs</p>
        </div>
        <div className="text-right flex flex-col justify-center">
          <p className="text-[28px] md:text-4xl font-black text-slate-800 tracking-tighter tabular-nums leading-none">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-2">
            {currentTime.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', weekday: 'long' })}
          </p>
        </div>
      </div>

      {user.role !== 'admin' ? (
        <div className="flex flex-col items-center justify-center py-6 md:py-12 relative">
          
          {/* Animated Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
          
          {!todayRecord ? (
            /* PUNCH IN STATE */
            <div 
              onClick={handleCheckIn}
              className={`relative w-72 h-72 rounded-full overflow-hidden border-8 border-white bg-white shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-[0_20px_60px_-10px_rgba(59,130,246,0.25)] hover:scale-105 active:scale-95 ${scanning ? 'opacity-70 pointer-events-none scale-95' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-blue-50 p-5 rounded-full mb-4">
                  <Clock size={64} className="text-blue-500 animate-pulse" strokeWidth={1.5} />
                </div>
                <span className="text-3xl font-black text-slate-800 tracking-tight">PUNCH IN</span>
                <span className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
                  <MapPin size={12} /> GPS Required
                </span>
              </div>
            </div>
          ) : (
            /* PUNCH OUT / WATER FILL STATE */
            <div className="flex flex-col items-center gap-8">
              <div className={`relative w-72 h-72 rounded-full overflow-hidden border-8 border-white bg-slate-50 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.2)] flex flex-col items-center justify-center transition-all duration-500 ${todayRecord.checkOut ? 'opacity-80 grayscale scale-95' : 'scale-100'}`}>
                
                {/* Back layer wave - BLUE WATER */}
                <div 
                  className="absolute w-[250%] h-[250%] left-1/2 rounded-[43%] bg-blue-400/40 animate-[spin-wave_8s_linear_infinite]" 
                  style={{ top: `${topOffset + 3}%` }}
                />
                {/* Front layer wave - BLUE WATER */}
                <div 
                  className="absolute w-[250%] h-[250%] left-1/2 rounded-[40%] bg-gradient-to-t from-blue-600 to-blue-400 opacity-90 animate-[spin-wave_5s_linear_infinite]" 
                  style={{ top: `${topOffset}%` }}
                />

                <div className="relative z-10 flex flex-col items-center mt-2">
                  <div className={`p-4 rounded-full mb-2 transition-colors duration-500 ${fillPercentage > 40 ? 'bg-white/20 text-white shadow-sm' : 'bg-blue-50 text-blue-500'}`}>
                    <Clock size={42} strokeWidth={1.5} />
                  </div>
                  
                  <span className={`text-4xl font-black tabular-nums tracking-tighter drop-shadow-sm transition-colors duration-500 ${fillPercentage > 50 ? 'text-white' : 'text-slate-800'}`}>
                    {getElapsedTimeString()}
                  </span>
                  
                  <div className={`flex flex-col items-center mt-2 transition-colors duration-500 ${fillPercentage > 60 ? 'text-white' : 'text-slate-500'}`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">
                      Elapsed Time
                    </span>
                    <span className="text-[10px] font-semibold mt-1 opacity-80">
                      In: {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* SEPARATE PUNCH OUT BUTTON */}
              {!todayRecord.checkOut ? (
                <button 
                  onClick={handleCheckOut}
                  disabled={scanning}
                  className={`w-64 py-4 rounded-2xl font-black tracking-widest uppercase transition-all duration-300 shadow-xl shadow-blue-500/20 bg-gradient-to-r from-blue-500 to-blue-400 text-white hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95 flex items-center justify-center gap-3 ${scanning ? 'opacity-70 pointer-events-none scale-95' : ''}`}
                >
                  <Fingerprint size={22} />
                  Secure Punch Out
                </button>
              ) : (
                <div className="w-64 py-4 rounded-2xl font-black tracking-widest uppercase bg-slate-100 text-slate-400 flex items-center justify-center gap-2 border border-slate-200">
                  <CheckCircle size={20} />
                  Shift Completed
                </div>
              )}
            </div>
          )}
          
          <div className="mt-10 bg-[#ff5a1f]/5 border border-[#ff5a1f]/10 rounded-2xl p-4 flex items-start gap-3 max-w-sm w-full shadow-sm">
            <AlertCircle size={20} className="text-[#ff5a1f] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 font-medium leading-relaxed">
              Office hours are <span className="font-bold text-slate-800">11:00 AM to 8:00 PM</span>. Punching in after 11:05 AM is marked as a Half Day. Missing a punch out marks you Absent. Max 4 missed checkout requests allowed per month.
            </div>
          </div>
        </div>
      ) : (
        /* ADMIN DASHBOARD */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Present</p>
            <p className="text-3xl font-black text-emerald-700">{filteredHistory.filter(r => r.status === 'Present').length}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 shadow-sm">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Absent</p>
            <p className="text-3xl font-black text-rose-700">{filteredHistory.filter(r => r.status === 'Absent').length}</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100 shadow-sm">
            <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Total Half Days</p>
            <p className="text-3xl font-black text-yellow-700">{filteredHistory.filter(r => r.status === 'Half Day').length}</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 shadow-sm">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Working Days</p>
            <p className="text-3xl font-black text-blue-700">
              {filteredHistory.filter(r => r.status === 'Present').length + (filteredHistory.filter(r => r.status === 'Half Day').length * 0.5)}
            </p>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {(user.role !== 'admin' || filterEmployee) && (
        <div className="card overflow-hidden p-0 border border-slate-100 shadow-xl bg-white mb-8 mt-8">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <CalendarIcon size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Attendance Calendar {user.role === 'admin' && !filterEmployee && '(Company Aggregate)'}</h3>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                <ChevronLeft size={20} />
              </button>
              <span className="font-bold text-slate-700 min-w-[120px] text-center">
                {format(currentCalendarDate, 'MMMM yyyy')}
              </span>
              <button onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, calendarMonthStart);
                const isTodayDate = isToday(day);
                
                let bgColor = 'bg-slate-50 hover:bg-slate-100';
                let textColor = 'text-slate-600';
                let statusIcon = null;

                if (isCurrentMonth) {
                  if (user.role === 'admin' && !filterEmployee) {
                    // Aggregate View
                    const dayRecords = filteredHistory.filter(r => r.date === dateStr);
                    const presentCount = dayRecords.filter(r => r.status === 'Present').length;
                    const halfDayCount = dayRecords.filter(r => r.status === 'Half Day').length;
                    const totalPunched = presentCount + halfDayCount;

                    if (totalPunched > 0) {
                      bgColor = 'bg-blue-50 hover:bg-blue-100';
                      textColor = 'text-blue-700';
                      statusIcon = (
                        <div className="absolute bottom-1 right-1 text-[9px] font-black text-blue-600 bg-white/80 px-1 rounded shadow-sm border border-blue-200">
                          {totalPunched} In
                        </div>
                      );
                    }
                  } else {
                    // Individual View
                    const record = filteredHistory.find(r => r.date === dateStr);
                    
                    if (record) {
                      if (record.status === 'Present') {
                        bgColor = 'bg-emerald-100 hover:bg-emerald-200';
                        textColor = 'text-emerald-700';
                        statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute bottom-2 right-2"></div>;
                      } else if (record.status === 'Absent') {
                        bgColor = 'bg-rose-100 hover:bg-rose-200';
                        textColor = 'text-rose-700';
                        statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute bottom-2 right-2"></div>;
                      } else if (record.status === 'Half Day') {
                        bgColor = 'bg-yellow-100 hover:bg-yellow-200';
                        textColor = 'text-yellow-700';
                        statusIcon = <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 absolute bottom-2 right-2"></div>;
                      } else if (record.status === 'Weekly Off' || record.status === 'Holiday') {
                        bgColor = 'bg-slate-100 hover:bg-slate-200';
                        textColor = 'text-slate-600';
                        statusIcon = <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-80">🎉</div>;
                      }
                    }
                  }
                }
                
                return (
                  <div 
                    key={idx} 
                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl min-h-[70px] md:min-h-[90px] transition-colors border border-transparent cursor-default
                      ${isCurrentMonth ? bgColor : 'opacity-30 bg-slate-50'}
                      ${isTodayDate ? 'ring-2 ring-blue-500 ring-offset-2 font-black' : 'font-semibold'}
                    `}
                  >
                    <span className={`text-sm ${textColor} ${statusIcon && user.role !== 'admin' ? 'relative z-10 drop-shadow-md' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {statusIcon}
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-100">
              {user.role === 'admin' && !filterEmployee ? (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div> Total Daily Punches</div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Present</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Absent</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Half Day</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="text-lg leading-none">🎉</span> Week Off / Holiday</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="card overflow-hidden p-0 border border-slate-100 shadow-xl bg-white relative">
        {user.role === 'admin' && (
          <div className="px-4 md:px-8 py-6 border-b border-slate-100 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Filter size={12}/> Filter by Day</label>
              <input type="date" value={filterDay} onChange={(e) => { setFilterDay(e.target.value); setFilterMonth(''); }} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
            </div>
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Filter size={12}/> Filter by Month</label>
              <input type="month" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setFilterDay(''); }} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" />
            </div>
            <div className="w-full">
              <label className="flex text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 items-center gap-1"><Users size={12}/> Filter by Employee</label>
              <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm">
                <option value="">All Employees</option>
                {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl text-blue-500 font-bold text-sm border border-blue-500/20 w-full justify-center h-[38px] shadow-sm">
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
            <Clock size={16} className="text-blue-500 animate-pulse" /> Real-time Sync
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
            const statusColor = isWeeklyOff ? 'text-[#6b4c9a]' : (row.status === 'Absent' ? 'text-rose-500' : 'text-black');
            
            const isMissingCheckout = row.status === 'Absent' && row.checkIn && !row.checkOut;

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
                    {user.role === 'admin' ? (
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
                    ) : (
                      isMissingCheckout && (
                        <button 
                          onClick={() => { setSelectedAttendanceId(row.id); setRequestModalOpen(true); }}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-colors border border-rose-200"
                        >
                          Request Checkout
                        </button>
                      )
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

      {/* Missed Checkout Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">Missed Checkout</h3>
              <button onClick={() => setRequestModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-colors">
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Actual Checkout Time</label>
                <input 
                  type="time" 
                  value={requestCheckoutTime}
                  onChange={e => setRequestCheckoutTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Reason</label>
                <textarea 
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                  placeholder="I forgot to punch out because..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[100px] resize-none font-medium text-slate-700" 
                />
              </div>
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => setRequestModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={submitMissedCheckoutRequest} className="flex-1 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">Submit Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
