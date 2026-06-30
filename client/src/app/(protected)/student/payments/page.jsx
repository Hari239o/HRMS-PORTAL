"use client";

import React from 'react';

const StudentPayments = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Payments</h1>
        <p className="mt-4 text-slate-600">Review your fee statements, payment history, and active payment links. Manage invoices and upcoming due dates from here.</p>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Active Payment Items</h2>
        <p className="mt-3 text-slate-600">No active due payments at the moment. Check back soon for enrollment fee updates and receipts.</p>
      </div>
    </div>
  );
};

export default StudentPayments;
