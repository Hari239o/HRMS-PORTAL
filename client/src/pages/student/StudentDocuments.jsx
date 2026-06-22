import React from 'react';

const StudentDocuments = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Documents</h1>
        <p className="mt-4 text-slate-600">Access your enrollment documents, ID proofs, admission forms and any uploaded attachments. Download or view documents securely from this page.</p>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Document Center</h2>
        <p className="mt-3 text-slate-600">No documents are available yet. As your enrollment progresses, required files and receipts will be posted here.</p>
      </div>
    </div>
  );
};

export default StudentDocuments;
