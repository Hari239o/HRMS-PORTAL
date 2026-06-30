"use client";

import React from 'react';

const StudentSupport = () => {
 return (
 <div className="space-y-6">
 <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
 <h1 className="text-3xl font-black text-slate-900">Support Tickets</h1>
 <p className="mt-4 text-slate-600">Raise and track support requests for enrollment, payment, or document issues. Our support team is here to help you resolve queries quickly.</p>
 </div>
 <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
 <h2 className="text-xl font-bold text-slate-900">Ticket Status</h2>
 <p className="mt-3 text-slate-600">No open tickets found. Create a new support request to get help from the student services team.</p>
 </div>
 </div>
 );
};

export default StudentSupport;
