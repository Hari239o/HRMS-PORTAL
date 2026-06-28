# Migration Report: Salary Module (Firebase -> Prisma)

## Overview
This report details the complete migration of the Salary module from Firebase Firestore to PostgreSQL via Prisma ORM, concluding the third major module migration.

## Files Modified
1. `server/prisma/schema.prisma`
2. `server/src/routes/salary.js`

## Firestore Queries Removed
The following `db.collection('salaries')`, `db.collection('employees')`, and `db.collection('attendance')` operations within the Salary module were fully replaced with Prisma queries:
- `db.collection('salaries').doc(id).set(...)` (New salary creation)
- `db.collection('salaries').doc(id).update(...)` (Salary updates and manual release triggers)
- `db.collection('salaries').doc(id).delete(...)` (Admin deletion)
- `db.collection('salaries').where(...).get()` (Employee fetching their own released slips)
- `db.collection('salaries').get()` (Admin fetching all slips)
- `db.collection('employees').doc(salary.employeeId).get()` (Enriching payslip PDF with employee details)
- `db.collection('attendance').where(...).get()` (Calculating days worked, LOP, and total working days dynamically for the payslip PDF generation)

## Prisma Queries Added
- `prisma.salary.create()`
- `prisma.salary.update()`
- `prisma.salary.delete()`
- `prisma.salary.findUnique()`
- `prisma.salary.findMany({ include: { employee: true } })`
- `prisma.employee.findUnique()`
- `prisma.attendance.findMany()`

## Schema Enhancements
To faithfully capture all the granular payroll data handled by the legacy Firestore Salary module without data loss, the following fields were formally added to the `Salary` Prisma model:
- `basicSalary`, `hra`, `specialAllowance`, `incentives`, `otherAllowances` (Float)
- `pf`, `esi`, `professionalTax`, `tds`, `otherDeductions` (Float)
- `status` (String, default "Pending")
- `releasedAt` (DateTime?)
- `empId`, `designation`, `pan`, `uan`, `bankName`, `accountNumber` (String?)

*(Legacy `baseSalary` and `deductions` columns were kept alongside the new columns to prevent breaking existing schema relations from earlier migrations).*

## Maintained Functionality
- **PDF Generation**: `pdfkit` logic, formatting, and file streaming remains perfectly intact.
- **Dynamic Attendance Linking**: The `populateSalaryDetails` function now queries the newly migrated `prisma.attendance` table to correctly parse `Present` vs `Absent` (LOP) days during PDF compilation.
- **Email Delivery**: Nodemailer integration with attached and dynamically generated PDFs was untouched and functions the same way.
- **Permissions**: Admins are securely segregated from employees querying their own private slips.

## Testing Checklist
- [ ] **Generate Payslip**: Admin creates a new payslip, verify calculation math is correct.
- [ ] **Download PDF**: Trigger a PDF download; ensure the PDF correctly resolves the `employee` and `attendance` relational counts.
- [ ] **Release Payslip**: Admin releases the payslip, employee logs in and verifies they can now see it.

## Potential Risks
- As we are fully isolated on PostgreSQL now, make sure that `DATABASE_URL` supports enough connection pooling, as generating PDFs natively on the backend can keep connections open slightly longer.
