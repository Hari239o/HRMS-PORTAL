const fs = require('fs');

async function main() {
  const pagePath = 'client/src/app/(protected)/leaves/page.jsx';
  let content = fs.readFileSync(pagePath, 'utf8');

  const startMarker = '{/* Toolbar (Search & Filter) */}';
  const endMarker = '{/* Main Content Area */}';

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found!');
    return;
  }

  const newBlock = `{/* Toolbar (Search & Filter) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl flex flex-col md:flex-row gap-5 justify-between relative z-10 items-stretch md:items-center group">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at center, #eaeaea 2px, transparent 0)", backgroundSize: "22px 22px", opacity: 0.3 }}></div>
        <div className="flex-1 relative w-full z-10">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'leaves' ? "Search by employee, leave type, or reason..." : "Search tickets, descriptions, or categories..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#eb4917]/20 focus:border-[#eb4917] focus:bg-white transition-all text-sm font-bold text-gray-800 placeholder:text-gray-400 outline-none shadow-sm"
          />
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-4 z-10">
          <div className="relative w-full sm:w-auto sm:min-w-[160px]">
            <Filter className="absolute left-4 top-3.5 text-[#eb4917]" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-orange-50/50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-[#eb4917]/20 focus:border-[#eb4917] text-sm font-black text-[#eb4917] appearance-none outline-none cursor-pointer shadow-sm"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved/Resolved">{activeTab === 'leaves' ? 'Approved' : 'Resolved'}</option>
              <option value="Rejected">Rejected</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#eb4917] font-bold text-xs">▼</div>
          </div>
          {activeTab === 'leaves' ? (
            user.role !== 'admin' && (
              <button 
                onClick={() => setShowLeaveForm(true)}
                className="bg-[#eb4917] hover:bg-[#d43f10] text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#eb4917]/30 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
              >
                <Plus size={20} /> Apply Leave
              </button>
            )
          ) : (
            user.role !== 'admin' && (
              <button 
                onClick={() => setShowProblemForm(true)}
                className="bg-[#eb4917] hover:bg-[#d43f10] text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-[#eb4917]/30 transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto"
              >
                <MessageSquare size={20} /> Raise Issue
              </button>
            )
          )}
        </div>
      </div>

      `;

  const newContent = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync(pagePath, newContent);
  console.log('Successfully updated toolbar block for mobile responsiveness');
}

main();
