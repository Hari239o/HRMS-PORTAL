"use client";

import { Clock, UserX, Briefcase, Mail, CalendarOff, Lock, ChevronRight, ShieldCheck, DownloadCloud } from 'lucide-react';

export default function HRPolicies() {
  const policies = [
    {
      title: "Work Timings",
      icon: Clock,
      color: "blue",
      content: (
        <div className="space-y-3 text-slate-600 text-sm font-medium leading-relaxed">
          <p>Work hours run from <strong>11:00 AM to 8:00 PM</strong>. Employees are expected to start on time and maintain steady attendance.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lunch break is one hour.</li>
            <li>A single 15-minute tea break is allowed.</li>
            <li>Extra breaks or extended downtime will be monitored by HR.</li>
          </ul>
        </div>
      )
    },
    {
      title: "Late Logins & No Show",
      icon: UserX,
      color: "rose",
      content: (
        <div className="space-y-4 text-slate-600 text-sm font-medium leading-relaxed">
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
            <h4 className="font-bold text-rose-700 mb-1">Late Logins</h4>
            <p>Only two late logins of up to 15 minutes each are allowed per month, and HR must be informed in advance. Anything beyond this results in Loss of Pay (LOP) and further review.</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
            <h4 className="font-bold text-rose-700 mb-1">No Call No Show Policy</h4>
            <p>Any employee who fails to report to work without informing HR or their manager will be marked as "No Call No Show." One instance triggers a formal warning. Repeated incidents lead to immediate termination. This rule applies to all employees, including interns.</p>
          </div>
        </div>
      )
    },
    {
      title: "Internship Guidelines",
      icon: Briefcase,
      color: "amber",
      content: (
        <div className="space-y-3 text-slate-600 text-sm font-medium leading-relaxed">
          <p>The first four months are considered an internship period. After four months of internship, you become eligible for a full-time position.</p>
          <div className="flex gap-2 items-start bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-800">
            <span className="mt-0.5 text-amber-600">⚠️</span>
            <p>No leaves are allowed during this period; all leaves will be counted as LOP. Any delay or absence must be approved by the TL, Manager, or HR.</p>
          </div>
        </div>
      )
    },
    {
      title: "Workplace & Mail Etiquette",
      icon: Mail,
      color: "sky",
      content: (
        <div className="space-y-3 text-slate-600 text-sm font-medium leading-relaxed">
          <p>Every call must start politely. Unprofessional or offensive language is not acceptable under any circumstances. Communication must reflect maturity and responsibility.</p>
          <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl mt-3">
            <h4 className="font-bold text-sky-700 mb-2">Mail Etiquette Rules:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sky-900">
              <li>Use a clear subject line and open with a proper greeting.</li>
              <li>Keep the message short, direct, and free of errors or slang.</li>
              <li>Attach files with correct names and mention them in the mail body.</li>
              <li>Close the email professionally and avoid sending work messages from personal accounts.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Notice Period",
      icon: CalendarOff,
      color: "indigo",
      content: (
        <div className="space-y-3 text-slate-600 text-sm font-medium leading-relaxed">
          <p>A <strong>one-month notice period</strong> is mandatory for all employees. It must be served in full.</p>
          <p>Relieving, experience letters, and final settlements will only be processed after all handovers and responsibilities are completed. Leaving without notice will be treated as absconding.</p>
        </div>
      )
    },
    {
      title: "Confidentiality",
      icon: Lock,
      color: "emerald",
      content: (
        <div className="space-y-3 text-slate-600 text-sm font-medium leading-relaxed">
          <p>All internal information must stay strictly within the company.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sharing client data is prohibited.</li>
            <li>Sharing internal processes or financial details is prohibited.</li>
            <li>Discussing salaries is strictly prohibited.</li>
          </ul>
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mt-2">
            <p className="text-emerald-800 font-bold">Any breach will be treated as a major violation and handled immediately.</p>
          </div>
        </div>
      )
    }
  ];

  const getColorClasses = (color) => {
    const classes = {
      blue: "bg-blue-50 text-blue-600 border-blue-100",
      rose: "bg-rose-50 text-rose-600 border-rose-100",
      amber: "bg-amber-50 text-amber-600 border-amber-100",
      sky: "bg-sky-50 text-sky-600 border-sky-100",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
      emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };
    return classes[color] || classes.blue;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-1 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
            Company <span className="text-[#ff5a1f]">Policies</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Our workplace expectations, professionalism, safety, and growth guidelines.
          </p>
        </div>
        
        <a 
          href="/HR%20Policies.pdf" 
          download="Geonixa_HR_Policies.pdf" 
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:border-[#ff5a1f]/50 hover:bg-[#ff5a1f]/5 text-slate-700 hover:text-[#ff5a1f] rounded-xl font-bold text-sm shadow-sm transition-all"
        >
          <DownloadCloud size={18} /> Download PDF
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {policies.map((policy, index) => (
          <div key={index} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col group">
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-110 ${getColorClasses(policy.color)}`}>
                <policy.icon size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 leading-tight">
                {policy.title}
              </h3>
            </div>
            
            <div className="flex-1 flex flex-col">
              {policy.content}
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-end">
              <span className="text-slate-300 group-hover:text-[#ff5a1f] transition-colors">
                <ChevronRight size={20} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Banner */}
      <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck size={24} className="text-[#ff5a1f]" />
            </div>
            <div>
              <h4 className="font-black text-lg">Compliance & Ethics</h4>
              <p className="text-slate-400 text-sm font-medium mt-1">For any queries regarding policies, please contact HR.</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-[#ff5a1f] hover:bg-[#e04812] text-white rounded-xl font-bold shadow-lg shadow-[#ff5a1f]/30 transition-all hover:-translate-y-0.5 whitespace-nowrap">
            Contact HR
          </button>
        </div>
      </div>
    </div>
  );
}
