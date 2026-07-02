import re

file_path = 'client/src/app/(protected)/attendance/page.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_pattern = "const resolveIssue = async (issueId, action) => {"
start_idx = content.find(start_pattern)

if start_idx != -1:
    end_idx = content.find("};", start_idx)
    
    if end_idx != -1:
        new_resolve = """const resolveIssue = async (issueId, action) => {
    try {
      let reasonText = 'Resolved via dashboard';
      if (action === 'reject') {
        const input = window.prompt("Please enter the reason for rejection:");
        if (input === null) return; // User clicked Cancel
        if (!input.trim()) {
          toast.error("Rejection reason is required");
          return;
        }
        reasonText = input.trim();
      }
      
      await api.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/approvals/${issueId}/${action}`, { note: reasonText, reason: reasonText });
      toast.success(`Issue ${action} successfully`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} issue`);
    }"""
                  
        content = content[:start_idx] + new_resolve + content[end_idx:]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Updated resolveIssue function.")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
