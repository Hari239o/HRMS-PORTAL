"use client";

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Users, Briefcase, Trash2, Link as LinkIcon, Send } from 'lucide-react';

export default function RecruitmentPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Shared state
  const [jobs, setJobs] = useState([]);
  
  // Admin state
  const [showAddJob, setShowAddJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobDepartment, setJobDepartment] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobJdUrl, setJobJdUrl] = useState('');
  
  // Employee state
  const [showReferral, setShowReferral] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateResume, setCandidateResume] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/recruitment/jobs');
      setJobs(res.data);
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/recruitment/jobs', {
        title: jobTitle,
        department: jobDepartment,
        description: jobDescription,
        requirements: jobRequirements,
        salary: jobSalary,
        location: jobLocation,
        jdUrl: jobJdUrl
      });
      toast.success('Job posted successfully');
      setJobTitle('');
      setJobDepartment('');
      setJobDescription('');
      setJobRequirements('');
      setJobSalary('');
      setJobLocation('');
      setJobJdUrl('');
      setShowAddJob(false);
      fetchJobs();
    } catch (err) {
      toast.error('Failed to post job');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Delete this job posting?")) return;
    try {
      await api.delete(`/api/recruitment/jobs/${id}`);
      toast.success('Job deleted');
      fetchJobs();
    } catch (err) {
      toast.error('Failed to delete job');
    }
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/recruitment/referrals', {
        jobId: selectedJob,
        candidateName,
        candidateEmail,
        resumeUrl: candidateResume
      });
      toast.success('Referral submitted successfully!');
      setCandidateName('');
      setCandidateEmail('');
      setCandidateResume('');
      setShowReferral(false);
    } catch (err) {
      toast.error('Failed to submit referral');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold tracking-widest uppercase">Loading Jobs...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Recruitment & Referrals</h1>
            <p className="text-sm text-slate-500">
              {user.role === 'admin' ? 'Manage open positions and referrals' : 'Refer friends for open positions'}
            </p>
          </div>
        </div>
        
        {user.role === 'admin' && (
          <button 
            onClick={() => setShowAddJob(!showAddJob)} 
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm"
          >
            {showAddJob ? <Users size={18} /> : <Plus size={18} />}
            {showAddJob ? 'View Jobs' : 'Post New Job'}
          </button>
        )}
      </div>

      {user.role === 'admin' && showAddJob && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Post a New Position</h2>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Job Title</label>
                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Senior React Developer" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Department</label>
                <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={jobDepartment} onChange={(e) => setJobDepartment(e.target.value)} placeholder="e.g., Engineering" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Salary (Optional)</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={jobSalary} onChange={(e) => setJobSalary(e.target.value)} placeholder="e.g., ₹10,00,000 - ₹12,00,000" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Location (Optional)</label>
                <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={jobLocation} onChange={(e) => setJobLocation(e.target.value)} placeholder="e.g., Remote / Hyderabad" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Job Description PDF Link (Optional)</label>
              <input type="url" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={jobJdUrl} onChange={(e) => setJobJdUrl(e.target.value)} placeholder="https://link-to-jd.pdf" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Job Description</label>
              <textarea required rows="3" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Describe the role..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Requirements</label>
              <textarea required rows="3" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium resize-none" value={jobRequirements} onChange={(e) => setJobRequirements(e.target.value)} placeholder="List required skills and qualifications..." />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all">
                Post Job
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Refer a Friend Modal (Employee) */}
      {showReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6">
            <h3 className="text-xl font-black text-slate-800 mb-4">Refer a Friend</h3>
            <form onSubmit={handleSubmitReferral} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Position</label>
                <select 
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                >
                  <option value="">Select a job...</option>
                  {jobs.filter(j => j.status === 'Open').map(job => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Candidate Name</label>
                <input 
                  type="text" required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                  value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Candidate Email</label>
                <input 
                  type="email" required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                  value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Resume / LinkedIn URL</label>
                <input 
                  type="url" required placeholder="https://"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                  value={candidateResume} onChange={(e) => setCandidateResume(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReferral(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Send size={16} /> Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No Open Positions</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative group overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-black text-slate-800">{job.title}</h3>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{job.department}</p>
                </div>
                {user.role === 'admin' ? (
                  <button onClick={() => handleDeleteJob(job.id)} className="text-slate-400 hover:text-rose-500 p-1 transition-colors">
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg">Open</span>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {job.location && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">📍 {job.location}</span>}
                {job.salary && <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">💰 {job.salary}</span>}
              </div>
              
              <p className="text-sm text-slate-600 mb-6 line-clamp-3 flex-grow">
                {job.description}
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                <span className="text-xs font-bold text-slate-400">Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-4">
                  {job.jdUrl && (
                    <a href={job.jdUrl} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-blue-600 text-sm font-bold flex items-center gap-1 transition-colors">
                      <LinkIcon size={14} /> JD PDF
                    </a>
                  )}
                  {user.role !== 'admin' && job.status === 'Open' && (
                    <button 
                      onClick={() => { setSelectedJob(job.id); setShowReferral(true); }}
                      className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:text-blue-700 transition-colors"
                    >
                      <Plus size={14} /> Refer Friend
                    </button>
                  )}
                </div>
              </div>

              {/* Admin Referral Count Preview (optional) */}
              {user.role === 'admin' && job.referrals && job.referrals.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    {job.referrals.length} Referral{job.referrals.length > 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {job.referrals.map(ref => (
                      <div key={ref.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{ref.candidateName}</p>
                          <p className="text-[10px] font-semibold text-slate-500">Referred by: {ref.referrer?.name}</p>
                        </div>
                        <a href={ref.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs font-bold hover:underline">View Profile</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
