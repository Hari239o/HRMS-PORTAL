import re

file_path = 'client/backend/routes/reports.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the router.get('/export', ...) block
# We will use regex to find and replace it

start_pattern = "router.get('/export'"
# Find the start index
start_idx = content.find(start_pattern)

if start_idx != -1:
    # Find the matching closing brace for this route
    # We can just look for the next "function parseDateRange"
    end_idx = content.find("function parseDateRange", start_idx)
    
    if end_idx != -1:
        # The new route code
        new_route = """router.get('/export', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let attendanceFilter = {};
    if (month && year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = DateTime.fromISO(startDate).plus({ months: 1 }).minus({ days: 1 }).toISODate();
        attendanceFilter = {
            date: {
                gte: startDate,
                lte: endDate
            }
        };
    }

    const allAttendance = await prisma.attendance.findMany({
      where: attendanceFilter,
      include: {
        employee: {
          select: { name: true, department: true }
        }
      },
      orderBy: [
        { date: 'asc' },
        { employeeId: 'asc' }
      ]
    });

    const today = DateTime.now().setZone('Asia/Kolkata').toISODate();
    let title = month && year ? `Master_Log_${month}_${year}` : `Master_Log_${today}`;
    
    let csv = 'Employee Name,Department,Date,Status,Punch In,Punch Out,Hours at Office\\n';
    
    allAttendance.forEach(a => {
      let punchIn = a.checkIn ? DateTime.fromJSDate(a.checkIn).setZone('Asia/Kolkata').toFormat('HH:mm:ss') : 'N/A';
      let punchOut = a.checkOut ? DateTime.fromJSDate(a.checkOut).setZone('Asia/Kolkata').toFormat('HH:mm:ss') : 'N/A';
      let hours = '0.00';
      
      if (a.checkIn && a.checkOut) {
        const diff = DateTime.fromJSDate(a.checkOut).diff(DateTime.fromJSDate(a.checkIn), 'hours');
        hours = diff.hours.toFixed(2);
      }
      
      csv += `"${a.employee?.name || 'Unknown'}","${a.employee?.department || 'Unknown'}","${a.date}","${a.status}","${punchIn}","${punchOut}","${hours}"\\n`;
    });

    res.setHeader('Content-Disposition', `attachment; filename="${title}.csv"`);
    res.type('text/csv');
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

"""
        new_content = content[:start_idx] + new_route + content[end_idx:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Export route updated successfully.")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
