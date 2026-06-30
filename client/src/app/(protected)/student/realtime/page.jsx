"use client";

import React from 'react';

const StudentRealtime = () => {
 return (
 <div className="space-y-6">
 <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
 <h1 className="text-3xl font-black text-slate-900">Realtime Updates</h1>
 <p className="mt-4 text-slate-600">View live updates for enrollment progress, payment confirmations, document approvals, and support ticket responses.</p>
 </div>
 <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
 <h2 className="text-xl font-bold text-slate-900">Live Feed</h2>
 <p className="mt-3 text-slate-600">Updates will appear here as events occur. Refresh to see the latest status or wait for automatic realtime sync.</p>
 </div>
 </div>
 );
};

export default StudentRealtime;
