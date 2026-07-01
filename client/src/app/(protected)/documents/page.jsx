"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, UploadCloud, File, AlertCircle, Image as ImageIcon, Briefcase, PenTool, DownloadCloud, Search } from 'lucide-react';
import { hasAdminAccess, isSuperAdmin } from '@/utils/rbac';

const REQUIRED_DOCS = [
  { id: 'tenth', title: '10th Certificate', icon: FileText },
  { id: 'inter', title: 'Intermediate Certificate', icon: FileText },
  { id: 'btech', title: 'B.Tech Certificate', icon: FileText },
  { id: 'offerLetter', title: 'Offer Letter', icon: Briefcase },
  { id: 'photo', title: 'Passport Photo', icon: ImageIcon },
  { id: 'signaturedOffer', title: 'Signatured Offer Letter', icon: PenTool },
];

export default function Documents() {
  const { user, updateUser } = useAuth();
  const [documents, setDocuments] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedDocType, setSelectedDocType] = useState(null);

  // Admin states
  const [allEmployees, setAllEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchMyDocuments();
    if (hasAdminAccess(user)) {
      fetchAllEmployees();
    }
  }, [user]);

  const fetchAllEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      setAllEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees', err);
    }
  };

  const fetchMyDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/employees/me`);
      setDocuments(res.data.documents || {});
      setSelectedEmpId('');
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDocuments = async (empId) => {
    if (!empId) {
      fetchMyDocuments();
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/employees/${empId}/documents`);
      setDocuments(res.data || {});
      setSelectedEmpId(empId);
    } catch (err) {
      toast.error('Failed to load employee documents');
      setDocuments({});
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (docId) => {
    setSelectedDocType(docId);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedDocType) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', selectedDocType);
    if (hasAdminAccess(user) && selectedEmpId) {
      formData.append('employeeId', selectedEmpId);
    }

    try {
      setUploading(selectedDocType);
      const uploadRes = await api.post(`${process.env.NEXT_PUBLIC_API_URL || ``}/api/employees/upload-document`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document uploaded successfully!');
      if (selectedDocType === 'photo' && uploadRes.data.fileUrl && !selectedEmpId) {
        updateUser({ avatar: uploadRes.data.fileUrl });
      }
      
      if (selectedEmpId) {
        fetchEmployeeDocuments(selectedEmpId);
      } else {
        fetchMyDocuments();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload document');
    } finally {
      setUploading(null);
      setSelectedDocType(null);
      e.target.value = null; // reset input
    }
  };

  const handleDownload = async (fileUrl, title) => {
    try {
      const toastId = toast.loading('Starting download...');
      
      // Fetch the file as a blob to bypass CORS/browser new-tab behavior
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      
      // Attempt to extract extension from URL, fallback to pdf
      const ext = fileUrl.split('.').pop().split(/#|\?/)[0] || 'pdf';
      a.download = `${title.replace(/\s+/g, '_')}.${ext}`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.dismiss(toastId);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Direct download failed, opening in new tab instead...');
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-sm">Loading Documents...</p>
      </div>
    );
  }

  // --- MY DOCUMENTS VIEW (For everyone, including Admin) ---
  const completedCount = REQUIRED_DOCS.filter(doc => documents[doc.id]).length;
  const progress = Math.round((completedCount / REQUIRED_DOCS.length) * 100);

  return (
    <div className="space-y-6 fade-in pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{selectedEmpId ? 'Employee' : 'Onboarding'} <span className="text-blue-600">Documents</span></h1>
        <p className="text-slate-500 mt-1">{selectedEmpId ? 'Manage documents for the selected employee.' : 'Upload and manage your mandatory company documents securely.'}</p>
      </div>

      {hasAdminAccess(user) && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Employee</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <select
                value={selectedEmpId}
                onChange={(e) => fetchEmployeeDocuments(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-slate-700"
              >
                <option value="">-- My Documents --</option>
                {allEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="relative rounded-3xl shadow-xl border border-white/40 overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/40 backdrop-blur-xl p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
            <CheckCircle size={20} className={progress === 100 ? "text-emerald-500" : "text-amber-500"} /> 
            Completion Status
          </h3>
          <span className="font-black text-2xl text-slate-900">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200/50 h-4 rounded-full overflow-hidden border border-white/50 shadow-inner mt-4">
          <div 
            className={`h-full rounded-full transition-all duration-1000 shadow-sm ${progress === 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        {progress < 100 && (
          <p className="text-xs text-amber-700 mt-4 flex items-center gap-1.5 font-bold bg-amber-100/50 backdrop-blur-sm border border-amber-200 p-3 rounded-xl w-max">
            <AlertCircle size={16} className="text-amber-600" /> Please upload all mandatory documents to complete your profile.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {REQUIRED_DOCS.map((doc) => {
          const isUploaded = !!documents[doc.id];
          const fileUrl = documents[doc.id];
          const isUploadingThis = uploading === doc.id;

          return (
            <div key={doc.id} className={`relative rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl shadow-lg hover:shadow-2xl group ${isUploaded ? 'bg-gradient-to-br from-white/80 to-emerald-50/40 border-emerald-100/50' : 'bg-white/60 border-slate-200/50 hover:border-blue-300'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isUploaded ? 'bg-gradient-to-tr from-emerald-100 to-emerald-50 text-emerald-600' : 'bg-gradient-to-tr from-blue-100 to-blue-50 text-blue-600'}`}>
                  <doc.icon size={28} />
                </div>
                {isUploaded ? (
                  <span className="bg-emerald-100/80 backdrop-blur text-emerald-700 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 uppercase tracking-widest border border-emerald-200 shadow-sm">
                    <CheckCircle size={14} /> Uploaded
                  </span>
                ) : (
                  <span className="bg-slate-100/80 backdrop-blur text-slate-500 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-slate-200 shadow-sm">
                    Required
                  </span>
                )}
              </div>
              
              <h3 className="font-black text-slate-800 text-lg mb-6">{doc.title}</h3>
              
              <div className="flex gap-3">
                {isUploaded ? (
                  <>
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-3 bg-white/80 backdrop-blur hover:bg-blue-600 text-blue-600 hover:text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-blue-100 shadow-sm flex justify-center items-center gap-2 group-hover:border-blue-200"
                    >
                      <File size={16} /> View
                    </a>
                    <button 
                      onClick={() => handleUploadClick(doc.id)}
                      disabled={isUploadingThis}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/30 flex justify-center items-center gap-2 hover:-translate-y-0.5"
                      title="Update Document"
                    >
                      {isUploadingThis ? '...' : <><UploadCloud size={16} /> Replace</>}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleUploadClick(doc.id)}
                    disabled={isUploadingThis}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2 hover:-translate-y-0.5"
                  >
                    {isUploadingThis ? (
                      <>Uploading...</>
                    ) : (
                      <><UploadCloud size={16} /> Upload File</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,application/pdf"
      />
    </div>
  );
}

