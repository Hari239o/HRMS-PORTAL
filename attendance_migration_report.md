# Migration Report: Attendance Module (Firebase -> Prisma)

## Overview
This report details the successful migration of the Attendance module from Firebase Firestore to PostgreSQL using the Prisma ORM, following the same pattern established in the Employee migration.

## Files Modified
1. `server/prisma/schema.prisma`
2. `server/src/routes/attendance.js`

## Firestore Queries Removed
The following `db.collection('attendance')` and `db.collection('employees')` operations within the Attendance module were fully replaced with Prisma queries:
- `db.collection('attendance').where(...).get()` (Check-in duplicate prevention and checkout fetching)
- `db.collection('attendance').doc(id).set(...)` (New check-in creation)
- `db.collection('attendance').doc(id).update(...)` (Checkout updates, status modifications, and background self-healing)
- `db.collection('attendance').orderBy(...).get()` (Admin fetching all records)
- `db.collection('employees').doc(employeeId).get()` (Device lock validation)
- `db.collection('employees').doc(employeeId).update(...)` (Initial device pairing)
- `db.collection('employees').where('role', '==', 'admin').get()` (Fetching admin ID for Darwin Bot alerts)

## Prisma Queries Added
- `prisma.employee.findUnique()` / `prisma.employee.findFirst()` / `prisma.employee.update()`
- `prisma.attendance.findFirst()`
- `prisma.attendance.create()`
- `prisma.attendance.update()`
- `prisma.attendance.findMany()` with `include: { employee: true }`

## Schema Enhancements
To faithfully capture all data handled by the legacy Firestore Attendance module without data loss, the following fields were added to the `Attendance` Prisma model:
- `checkInLatitude` (Float?)
- `checkInLongitude` (Float?)
- `checkOutLatitude` (Float?)
- `checkOutLongitude` (Float?)
- `adminEdited` (Boolean, default `false`)

## Maintained Functionality
- **Attendance Logic**: Full preservation of half-day, absent, and late-penalty calculations.
- **GPS Validation & Geofencing**: Distance calculation (`getDistance`) and 15m radius restrictions accurately implemented using the new schema coordinates.
- **Photos**: Cloudinary integration for check-in and check-out photos correctly stored in the PostgreSQL rows.
- **Relations**: Replaced manual `employeesMap` mapping with Prisma's native `.findMany({ include: { employee: true } })`.
- **Admin Alerts**: Retained Darwin Bot integrations writing to the untouched `messages` Firestore collection.

## Potential Risks & Considerations
- Because cross-module queries weren't allowed, modules like `reports.js` and `salary.js` which query `db.collection('attendance')` directly from Firestore will no longer see the newly recorded attendance data. Those modules will break dynamically until they are also migrated to query `prisma.attendance`.
- Ensure `npx prisma db push` is run on the production server to sync the schema additions.
