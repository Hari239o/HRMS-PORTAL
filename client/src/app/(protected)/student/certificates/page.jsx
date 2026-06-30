"use client";

import React from 'react';

const StudentCertificates = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Certificates</h1>
        <p className="mt-4 text-slate-600">View your completed course certificates, training acknowledgments, and completion badges issued by the institute.</p>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Certificate Library</h2>
        <p className="mt-3 text-slate-600">No certificates have been issued yet. Certificates will appear in this library after course completion and validation.</p>
      </div>
    </div>
  );
};

export default StudentCertificates;
