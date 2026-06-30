"use client";

import React, { useState, useEffect } from 'react';
import api from '@/utils/api';
import { Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';

const StudentDashboard = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/api/messages');
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Student Portal Dashboard</h1>
        <p className="mt-4 text-slate-600 max-w-2xl">Welcome to your student portal. Access your latest payments, enrollment status, documents, certificates, support tickets and realtime updates from one place.</p>
      </div>
      
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Mail size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Messages & Alerts</h2>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-100 rounded-2xl w-full"></div>
              ))}
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-900">{msg.senderName || 'Admin'}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
              <p className="text-slate-500">No new messages</p>
            </div>
          )}
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <p className="mt-3 text-slate-600">View your latest enrollment progress, payment confirmations, and ticket updates right from the portal.</p>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
