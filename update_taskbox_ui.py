import re

file_path = 'client/src/app/(protected)/taskbox/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add state for selectedTeam at the top of the component.
# Searching for `const [warningMessage, setWarningMessage] = useState('');` and adding `const [selectedTeamDetails, setSelectedTeamDetails] = useState(null);`

state_injection = "const [warningMessage, setWarningMessage] = useState('');\n  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null);"
content = content.replace("const [warningMessage, setWarningMessage] = useState('');", state_injection)

# Now, we replace the `Team Progress Tracking` section.
start_marker = "{/* Team Progress Tracking */}"
end_marker = "{/* Warning Modal */}"

new_ui = """{/* Team Progress Tracking */}
        <div className="mt-8">
          <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={24} className="text-blue-500" />
            Team Progress Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.map(team => {
              const progressCount = Math.min(100, team.targetTeamCount > 0 ? ((team.achievedTeamCount || 0) / team.targetTeamCount) * 100 : 0);
              const progressRev = Math.min(100, team.targetTeamRevenue > 0 ? ((team.achievedTeamRevenue || 0) / team.targetTeamRevenue) * 100 : 0);
              const teamColor = team.color || '#4f46e5';

              return (
                <div 
                  key={team.id} 
                  onClick={() => setSelectedTeamDetails(team)}
                  className="bg-white rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-500 transform hover:-translate-y-1 cursor-pointer flex flex-col"
                >
                  {/* Premium Header */}
                  <div className="h-28 relative p-5 flex justify-between items-start bg-slate-50/50 border-b border-slate-100 overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl -z-10 group-hover:bg-blue-100 transition-colors duration-500"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -z-10 group-hover:bg-indigo-100 transition-colors duration-500"></div>
                    
                    <div className="relative z-10 flex gap-4 w-full">
                      <div className="w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center font-black text-2xl text-white flex-shrink-0" style={{ backgroundColor: teamColor }}>
                        {team.image ? (
                           <img src={team.image} alt={team.name} className="w-full h-full rounded-2xl object-cover" />
                        ) : team.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-xl text-slate-800 tracking-tight truncate group-hover:text-blue-600 transition-colors">{team.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-1 truncate">
                          Leader: <span className="text-slate-600">{team.leader?.name}</span>
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold border border-slate-200">{team.members?.length || 0} Members</span>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-20 flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleEditTarget(team)}
                        className="w-8 h-8 flex items-center justify-center bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-full transition-all shadow-sm border border-slate-100"
                        title="Edit Target"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => { setWarningModalTeam(team); setWarningMessage(''); }}
                        className="w-8 h-8 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full transition-all shadow-sm border border-slate-100"
                        title="Send Warning / Alert"
                      >
                        <AlertTriangle size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Body Stats */}
                  <div className="p-6 relative bg-white flex-1">
                    <div className="space-y-5">
                      {/* Target Count */}
                      <div>
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Count</span>
                          <span className="text-sm font-black text-slate-800">{team.achievedTeamCount || 0} <span className="text-slate-400 text-xs">/ {team.targetTeamCount || 0}</span></span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 relative transition-all duration-1000" style={{ width: `${progressCount}%` }}>
                          </div>
                        </div>
                      </div>

                      {/* Revenue */}
                      <div>
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Revenue</span>
                          <span className="text-sm font-black text-slate-800">₹{(team.achievedTeamRevenue || 0).toLocaleString()} <span className="text-slate-400 text-xs">/ ₹{(team.targetTeamRevenue || 0).toLocaleString()}</span></span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 relative transition-all duration-1000" style={{ width: `${progressRev}%` }}>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Details Modal */}
        {selectedTeamDetails && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/80 flex justify-between items-start relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10 -mr-20 -mt-20"></div>
                <div className="relative z-10 flex gap-5 items-center">
                   <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md" style={{ backgroundColor: selectedTeamDetails.color || '#4f46e5' }}>
                      {selectedTeamDetails.image ? (
                         <img src={selectedTeamDetails.image} alt={selectedTeamDetails.name} className="w-full h-full rounded-2xl object-cover" />
                      ) : selectedTeamDetails.name.charAt(0)}
                   </div>
                   <div>
                     <h2 className="text-2xl font-black text-slate-800">{selectedTeamDetails.name}</h2>
                     <p className="text-sm font-bold text-slate-500 mt-1">Leader: <span className="text-slate-700">{selectedTeamDetails.leader?.name}</span> • {selectedTeamDetails.members?.length || 0} Members</p>
                   </div>
                </div>
                <button onClick={() => setSelectedTeamDetails(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors relative z-10 bg-white shadow-sm border border-slate-100">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white">
                {/* Overall Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Team Target Count</p>
                    <div className="flex items-end gap-2">
                       <span className="text-3xl font-black text-blue-900">{selectedTeamDetails.achievedTeamCount || 0}</span>
                       <span className="text-sm font-bold text-blue-400 mb-1">/ {selectedTeamDetails.targetTeamCount || 0}</span>
                    </div>
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 flex flex-col justify-center">
                    <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Team Revenue</p>
                    <div className="flex items-end gap-2">
                       <span className="text-3xl font-black text-emerald-900">₹{(selectedTeamDetails.achievedTeamRevenue || 0).toLocaleString()}</span>
                       <span className="text-sm font-bold text-emerald-500 mb-1">/ ₹{(selectedTeamDetails.targetTeamRevenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Member Breakdown */}
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    Individual Performance Breakdown
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Leader Row */}
                    {selectedTeamDetails.leaderIndividualTarget && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                           {selectedTeamDetails.leader?.avatar ? (
                             <img src={selectedTeamDetails.leader.avatar} alt="Leader" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                           ) : (
                             <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm uppercase">
                               {selectedTeamDetails.leader?.name?.charAt(0) || '?'}
                             </div>
                           )}
                           <div>
                             <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                               {selectedTeamDetails.leader?.name}
                               <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Leader</span>
                             </h4>
                             <p className="text-[10px] font-bold text-slate-400">LEADER INDIVIDUAL TARGET</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 text-right w-full sm:w-auto">
                           <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Count</p>
                             <p className="font-black text-slate-700">{selectedTeamDetails.leaderIndividualTarget.achievedCount} <span className="text-xs text-slate-400">/ {selectedTeamDetails.leaderIndividualTarget.targetCount}</span></p>
                           </div>
                           <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Revenue</p>
                             <p className="font-black text-emerald-600">₹{(selectedTeamDetails.leaderIndividualTarget.achievedRevenue || 0).toLocaleString()} <span className="text-xs text-emerald-400">/ ₹{(selectedTeamDetails.leaderIndividualTarget.targetRevenue || 0).toLocaleString()}</span></p>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* Member Rows */}
                    {selectedTeamDetails.members && selectedTeamDetails.members.length > 0 ? (
                      selectedTeamDetails.members.map(member => (
                        <div key={member.id} className="bg-white border border-slate-100 hover:border-blue-100 hover:shadow-md rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                          <div className="flex items-center gap-3">
                             {member.avatar ? (
                               <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                             ) : (
                               <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-black text-sm uppercase">
                                 {member.name?.charAt(0) || '?'}
                               </div>
                             )}
                             <div>
                               <h4 className="text-sm font-bold text-slate-800">{member.name}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.role} • {member.department}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-6 text-right w-full sm:w-auto">
                             <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Count</p>
                               <p className="font-black text-slate-700">{member.target?.achievedCount || 0} <span className="text-xs text-slate-400">/ {member.target?.targetCount || 0}</span></p>
                             </div>
                             <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Revenue</p>
                               <p className="font-black text-emerald-600">₹{(member.target?.achievedRevenue || 0).toLocaleString()} <span className="text-xs text-emerald-400">/ ₹{(member.target?.targetRevenue || 0).toLocaleString()}</span></p>
                             </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm">
                        No members assigned to this team.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Modal */}"""

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_ui + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Frontend updated successfully.")
else:
    print("Could not find the start or end marker.")
