import React from 'react';

const StudentDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Student Portal Dashboard</h1>
        <p className="mt-4 text-slate-600 max-w-2xl">Welcome to your student portal. Access your latest payments, enrollment status, documents, certificates, support tickets and realtime updates from one place.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <p className="mt-3 text-slate-600">View your latest enrollment progress, payment confirmations, and ticket updates right from the portal.</p>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Alerts</h2>
          <p className="mt-3 text-slate-600">Get notified when new documents are available, certificates are issued, or support requests receive responses.</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
