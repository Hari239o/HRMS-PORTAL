import React from 'react';

const StudentEnrollment = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Enrollment</h1>
        <p className="mt-4 text-slate-600">Track your enrollment status, program details, and submitted documents. Stay informed about the next steps to complete your student onboarding.</p>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Enrollment Timeline</h2>
        <p className="mt-3 text-slate-600">Your current enrollment is active. Completed steps and pending requirements will appear here as they are updated.</p>
      </div>
    </div>
  );
};

export default StudentEnrollment;
