import re

file_path = 'client/backend/routes/reports.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we add exceljs at the top if it's not there
if "const ExcelJS" not in content:
    content = "const ExcelJS = require('exceljs');\n" + content

# Replace the /export route block
start_pattern = "router.get('/export'"
start_idx = content.find(start_pattern)

if start_idx != -1:
    end_idx = content.find("function parseDateRange", start_idx)
    
    if end_idx != -1:
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
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    worksheet.columns = [
      { header: 'Employee Name', key: 'name', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Punch In', key: 'punchIn', width: 15 },
      { header: 'Punch Out', key: 'punchOut', width: 15 },
      { header: 'Hours at Office', key: 'hours', width: 15 }
    ];
    
    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    allAttendance.forEach(a => {
      let punchIn = a.checkIn ? DateTime.fromJSDate(a.checkIn).setZone('Asia/Kolkata').toFormat('HH:mm:ss') : 'N/A';
      let punchOut = a.checkOut ? DateTime.fromJSDate(a.checkOut).setZone('Asia/Kolkata').toFormat('HH:mm:ss') : 'N/A';
      let hours = '0.00';
      
      if (a.checkIn && a.checkOut) {
        const diff = DateTime.fromJSDate(a.checkOut).diff(DateTime.fromJSDate(a.checkIn), 'hours');
        hours = diff.hours.toFixed(2);
      }
      
      worksheet.addRow({
        name: a.employee?.name || 'Unknown',
        department: a.employee?.department || 'Unknown',
        date: a.date,
        status: a.status,
        punchIn,
        punchOut,
        hours
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

"""
        new_content = content[:start_idx] + new_route + content[end_idx:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Backend export route updated to use ExcelJS successfully.")
    else:
        print("End marker not found")
else:
    print("Start marker not found")
