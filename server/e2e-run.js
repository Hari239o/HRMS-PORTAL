const { db } = require('./src/db');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const http = require('http');

(async () => {
  try {
    const empId = 'e2e-test-' + Date.now();
    const salaryId = 'salary-e2e-' + Date.now();

    // Create employee
    const empData = {
      id: empId,
      name: 'E2E Tester',
      email: 'e2e@test.local',
      role: 'employee',
      department: 'QA',
      designation: 'Test Engineer',
      createdAt: new Date().toISOString()
    };
    await db.collection('employees').doc(empId).set(empData);
    console.log('Employee created:', empId);

    // Create salary (Released)
    const month = new Date().toISOString().slice(0,7);
    const baseSalary = 50000;
    const bonus = 0;
    const deductions = 0;
    const netSalary = baseSalary + bonus - deductions;

    const salaryData = {
      id: salaryId,
      employeeId: empId,
      month,
      baseSalary,
      bonus,
      deductions,
      netSalary,
      status: 'Released',
      createdAt: new Date().toISOString(),
      releasedAt: new Date().toISOString()
    };
    await db.collection('salaries').doc(salaryId).set(salaryData);
    console.log('Salary created:', salaryId);

    // Generate JWT
    const token = jwt.sign({ id: empId, role: 'employee' }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '1h' });

    // Request PDF
    const outDir = path.join(__dirname, 'temp');
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'e2e-payslip.pdf');

    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 5002,
      path: `/api/salary/generate/${salaryId}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', (chunk) => body += chunk.toString());
        res.on('end', () => console.error('Failed to fetch payslip:', res.statusCode, body));
        return;
      }
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Saved payslip to', outPath);
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e);
    });

    req.end();

  } catch (err) {
    console.error('E2E test failed:', err);
  }
})();
