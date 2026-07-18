"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, Fingerprint, Filter, Users, MapPin, AlertCircle, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';

const OFFICE_LOCATION = { latitude: 17.4392424, longitude: 78.3948356 };
const ATTENDANCE_WINDOW = { from: '11:00', to: '20:00' };

function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; 
  const p1 = lat1 * Math.PI / 180;
  const p2 = lat2 * Math.PI / 180;
  const dp = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function Attendance() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [allEmployees, setAllEmployees] = useState([]);
  

  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');

  const [pendingIssues, setPendingIssues] = useState([]);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState(null);
  const [requestCheckoutTime, setRequestCheckoutTime] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [requestMissedDate, setRequestMissedDate] = useState('');
  
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [remainingChances, setRemainingChances] = useState(4);

  let filteredHistory = history.filter(row => {
    let match = true;
    if (filterDay && row.date !== filterDay) match = false;
    if (filterMonth && !row.date.startsWith(filterMonth)) match = false;
    if (filterEmployee && row.employee?.name !== filterEmployee) match = false;
    return match;
  });

  if (filterDay && hasAdminAccess(user) && allEmployees.length > 0) {
    const presentIds = new Set(filteredHistory.map(r => r.employeeId));
    const absentEmployees = allEmployees.filter(emp => !presentIds.has(emp.id) && emp.role !== 'admin');
    
    const dummyRecords = absentEmployees.map(emp => ({
      id: `absent_${emp.id}_${filterDay}`,
      employeeId: emp.id,
      employee: { name: emp.name, department: emp.department, role: emp.role },
      date: filterDay,
      checkIn: null,
      checkOut: null,
      status: 'Absent',
      isDummy: true
    }));

    const finalDummyRecords = dummyRecords.filter(row => {
      let match = true;
      if (filterEmployee && row.employee?.name !== filterEmployee) match = false;
      return match;
    });

    filteredHistory = [...filteredHistory, ...finalDummyRecords];
  }

  const uniqueEmployees = [...new Set(history.map(row => row.employee?.name).filter(Boolean))];
  
  const calendarMonthStart = startOfMonth(currentCalendarDate);
  const calendarMonthEnd = endOfMonth(currentCalendarDate);
  
  const currentMonthHistory = filteredHistory.filter(r => {
    return r.date >= format(calendarMonthStart, 'yyyy-MM-dd') && r.date <= format(calendarMonthEnd, 'yyyy-MM-dd');
  });

  const presentCountForMonth = currentMonthHistory.filter(r => r.status === 'Present' || r.status === 'Weekly Off (Present)').length;
  const absentCountForMonth = currentMonthHistory.filter(r => r.status === 'Absent').length;
  const halfDayCountForMonth = currentMonthHistory.filter(r => r.status === 'Half Day').length;
  const membersPresent = [...new Set(filteredHistory.filter(r => r.status !== 'Absent' && r.status !== 'Weekly Off').map(row => row.employeeId))].length;

  useEffect(() => {
    if (user && hasAdminAccess(user)) {
      setFilterDay(new Date().toLocaleDateString('en-CA'));
    }
  }, [user]);

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

      if (user && hasAdminAccess(user)) {
        const issuesRes = await api.get(`/api/approvals?status=pending&type=missed_checkout`);
        setPendingIssues(issuesRes.data.requests || []);
        const empRes = await api.get(`/api/employees`);
        setAllEmployees(empRes.data);
      }

      const holsRes = await api.get(`/api/holidays`);
      setHolidays(holsRes.data || []);

      const chancesRes = await api.get(`/api/approvals/remaining-chances`);
      setRemainingChances(chancesRes.data.remaining);
    } catch (err) {
      toast.error('Failed to fetch attendance data');
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

  const resolveIssue = async (issueId, action) => {
    try {
      let reasonText = 'Resolved via dashboard';
      if (action === 'reject') {
        const input = window.prompt("Please enter the reason for rejection:");
        if (input === null) return; // User clicked Cancel
        if (!input.trim()) {
          toast.error("Rejection reason is required");
          return;
        }
        reasonText = input.trim();
      }
      
      await api.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/approvals/${issueId}/${action}`, { note: reasonText, reason: reasonText });
      toast.success(`Issue ${action} successfully`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} issue`);
    }};

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
    if (!requestMissedDate || !requestCheckoutTime || !requestReason) {
      toast.error("Please provide date, checkout time and a reason");
      return;
    }
    try {
      await api.post('/api/approvals', {
        type: 'missed_checkout',
        title: 'Missed Checkout / Attendance Correction',
        description: requestReason,
        relatedEntity: 'Attendance',
        relatedId: selectedAttendanceId,
        details: { checkoutTime: requestCheckoutTime, missedDate: requestMissedDate }
      });
      toast.success("Attendance issue request submitted successfully!");
      setRequestModalOpen(false);
      setRequestMissedDate('');
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

  // Reusing calendarMonthStart and calendarMonthEnd declared at the top of the component
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
          
          <div className="mt-6 flex justify-center w-full max-w-sm">
            <button 
              onClick={() => {
                setRequestMissedDate('');
                setRequestCheckoutTime('');
                setRequestReason('');
                setSelectedAttendanceId(null);
                setRequestModalOpen(true);
              }}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-[#eb4917] hover:from-rose-600 hover:to-[#d43f10] text-white font-black rounded-2xl transition-all duration-300 border border-transparent flex items-center justify-center gap-2 shadow-xl shadow-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/40 hover:-translate-y-1 tracking-wide uppercase text-sm"
            >
              <AlertCircle size={18} />
              Raise Attendance Issue
            </button>
          </div>

          <div className="mt-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between max-w-sm w-full shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-black">
                {remainingChances}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Missed Checkout Requests</p>
                <p className="text-[10px] font-medium text-slate-500">Remaining chances this month</p>
              </div>
            </div>
            <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Out of 4
            </div>
          </div>

          {/* Employee Attendance Stats (Circles) */}
          {(user.role !== 'admin' || filterEmployee) && (
            <div className="flex justify-center gap-8 mt-6 max-w-sm w-full mx-auto">
              {/* Present Circle */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg shadow-sm">
                  {presentCountForMonth}
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Present</span>
              </div>

              {/* Absent Circle */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 bg-rose-50 text-rose-600 flex items-center justify-center font-black text-lg shadow-sm">
                  {absentCountForMonth}
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Absent</span>
              </div>

              {/* Half Day Circle */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-yellow-500/20 bg-yellow-50 text-yellow-600 flex items-center justify-center font-black text-lg shadow-sm">
                  {halfDayCountForMonth}
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">Half Day</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ADMIN DASHBOARD - STATS */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle size={24} />
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Present</p>
              <p className="text-4xl font-black text-slate-800 tracking-tight">{filteredHistory.filter(r => r.status === 'Present' || r.status === 'Weekly Off (Present)').length}</p>
            </div>
          </div>
          
          <div className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <X size={24} strokeWidth={3} />
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Absent</p>
              <p className="text-4xl font-black text-slate-800 tracking-tight">{filteredHistory.filter(r => r.status === 'Absent').length}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Clock size={24} />
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Half Days</p>
              <p className="text-4xl font-black text-slate-800 tracking-tight">{filteredHistory.filter(r => r.status === 'Half Day').length}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Briefcase size={24} />
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Working Days</p>
              <p className="text-4xl font-black text-slate-800 tracking-tight">
                {filteredHistory.filter(r => r.status === 'Present').length + (filteredHistory.filter(r => r.status === 'Half Day').length * 0.5)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Pending Issues */}
      {hasAdminAccess(user) && pendingIssues.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            <AlertCircle className="text-rose-500" /> Pending Attendance Issues
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded-[2rem] border border-rose-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative flex flex-col p-6 hover:shadow-[0_8px_30px_rgb(225,29,72,0.1)] transition-all duration-500">
                
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center font-black text-2xl overflow-hidden shadow-sm shrink-0 ring-4 ring-rose-50/50">
                    {issue.requestedByAvatar ? (
                      <img src={issue.requestedByAvatar} alt={issue.requestedByName} className="w-full h-full object-cover" />
                    ) : (
                      (issue.requestedByName || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-800 text-lg truncate pr-2 tracking-tight">{issue.requestedByName}</h4>
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-rose-100 shrink-0 shadow-sm animate-pulse">Missed Checkout</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200 inline-block mt-1.5 shadow-sm">ID: {issue.requestedByEmpId || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-5">
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">{issue.description || 'No reason provided'}</p>
                  </div>

                  {/* Professional Requested Time Block */}
                  <div className="relative group overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-emerald-50 rounded-2xl border border-indigo-100 p-4 mb-6 shadow-inner">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-400/20 blur-2xl rounded-full group-hover:bg-blue-400/40 transition-colors duration-700"></div>
                    <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-emerald-400/20 blur-2xl rounded-full group-hover:bg-emerald-400/40 transition-colors duration-700"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-100 text-indigo-500 relative">
                          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                          <Clock size={16} className="animate-[spin_10s_linear_infinite]" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-900/60 uppercase tracking-widest">Requested Time</span>
                      </div>
                      <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white shadow-sm">
                        <span className="text-sm font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                          {issue.details?.checkoutTime || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full mt-auto">
                  <button onClick={() => resolveIssue(issue.id, 'approve')} className="flex-1 py-3.5 bg-emerald-500 text-white hover:bg-emerald-600 font-black rounded-xl transition-all duration-300 text-[11px] uppercase tracking-wider shadow-md shadow-emerald-500/20 transform hover:-translate-y-1 text-center flex items-center justify-center gap-2">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => resolveIssue(issue.id, 'reject')} className="flex-1 py-3.5 bg-white text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200 hover:border-rose-500 font-black rounded-xl transition-all duration-300 text-[11px] uppercase tracking-wider shadow-sm transform hover:-translate-y-1 text-center flex items-center justify-center gap-2 group/reject">
                    <X size={16} className="group-hover/reject:scale-125 transition-transform" /> Reject
                  </button>
                </div>
              </div>
            ))}
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
              <h3 className="text-lg font-black text-slate-800">Attendance Calendar {hasAdminAccess(user) && !filterEmployee && '(Company Aggregate)'}</h3>
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
                let cellStyle = {};

                if (isCurrentMonth) {
                  if (hasAdminAccess(user) && !filterEmployee) {
                    // Aggregate View
                    const dayRecords = filteredHistory.filter(r => r.date === dateStr);
                    const presentCount = dayRecords.filter(r => r.status === 'Present' || r.status === 'Weekly Off (Present)').length;
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
                      } else if (record.status === 'Weekly Off' || record.status === 'Weekly Off (Present)' || record.status === 'Holiday') {
                        bgColor = 'bg-slate-100 hover:bg-slate-200';
                        textColor = 'text-slate-600';
                        statusIcon = <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl opacity-80">🎉</div>;
                      }
                    }
                  }
                  
                  // Override with holiday marker if there is a declared holiday for this date
                  const holiday = holidays.find(h => {
                    const hDate = new Date(h.date);
                    return hDate.getFullYear() === day.getFullYear() && hDate.getMonth() === day.getMonth() && hDate.getDate() === day.getDate();
                  });

                  if (holiday) {
                    const rec = filteredHistory.find(r => r.date === dateStr);
                    if (rec && rec.status === 'Weekly Off (Present)') {
                      bgColor = 'border border-fuchsia-200';
                      cellStyle = { background: 'linear-gradient(135deg, #d1fae5 50%, #fae8ff 50%)' };
                      textColor = 'text-slate-800 font-bold';
                      statusIcon = (
                        <div className="absolute bottom-1 right-1 text-[9px] font-black text-fuchsia-600 bg-white/90 px-1 rounded shadow-sm border border-fuchsia-200" title={holiday.name}>
                          🎉
                        </div>
                      );
                    } else {
                      bgColor = 'bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200';
                      textColor = 'text-fuchsia-700 font-bold';
                      statusIcon = (
                        <div className="absolute bottom-1 right-1 text-[9px] font-black text-fuchsia-600 bg-white/90 px-1 rounded shadow-sm border border-fuchsia-200" title={holiday.name}>
                          🎉
                        </div>
                      );
                    }
                  }
                }
                
                return (
                  <div 
                    key={idx} 
                    style={cellStyle}
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
              {hasAdminAccess(user) && !filterEmployee ? (
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
        {hasAdminAccess(user) && (
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

            const isWeeklyOff = row.status === 'Weekly Off' || row.status === 'Weekly Off (Present)';
            const statusColor = isWeeklyOff ? 'text-[#6b4c9a]' : (row.status === 'Absent' ? 'text-rose-500' : 'text-black');
            
            const todayStr = new Date().toLocaleDateString('en-CA');
            const isMissingCheckout = row.status === 'Absent' && row.checkIn && !row.checkOut && row.date < todayStr;

            return (
              <div key={row.id} className="flex px-5 py-4 md:px-8 hover:bg-slate-50 transition-colors group">
                <div className="w-16 flex-shrink-0 flex flex-col items-start pt-1 font-serif">
                  <span className="text-[15px] text-slate-800 leading-tight">{dayNum}</span>
                  <span className="text-[13px] text-slate-800 leading-tight">{month}</span>
                  <span className="text-[13px] text-slate-800 leading-tight">{weekday}</span>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[16px] font-bold font-serif ${statusColor}`}>{row.status}</span>
                      {hasAdminAccess(user) && row.employee?.name && (
                        <span className="text-[13px] font-black text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 shadow-sm">
                          {row.employee.name}
                        </span>
                      )}
                    </div>
                    {hasAdminAccess(user) ? (
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
                    </div>
                  )}
                  {hasAdminAccess(user) && (row.checkInLatitude || row.checkOutLatitude) && (
                    <div className="text-[11px] text-slate-500 mt-1 flex gap-3">
                      {row.checkInLatitude && (
                        <span>In Radius: <span className="font-bold text-blue-600">{getDistance(row.checkInLatitude, row.checkInLongitude, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude)}m</span></span>
                      )}
                      {row.checkOutLatitude && (
                        <span>Out Radius: <span className="font-bold text-blue-600">{getDistance(row.checkOutLatitude, row.checkOutLongitude, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude)}m</span></span>
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

      {/* Missed Checkout Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800">Attendance Issue</h3>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Report a missing punch or issue
                </p>
              </div>
              <button onClick={() => setRequestModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-rose-500 shadow-sm transition-colors">
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Missed Date</label>
                <input 
                  type="date" 
                  value={requestMissedDate}
                  onChange={e => setRequestMissedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700 mb-4" 
                />
              </div>
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
