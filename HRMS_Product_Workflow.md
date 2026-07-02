# Geonixa HRMS - Enterprise Product Workflow & Architecture

## 1. Executive Summary
The Geonixa HRMS (Human Resource Management System) is a comprehensive, cloud-based enterprise solution designed to streamline workforce management. It provides end-to-end capabilities spanning geolocation-based attendance tracking, leave management, performance analytics, and dynamic team structuring. 

## 2. User Roles & Access Hierarchy
The system enforces strict Role-Based Access Control (RBAC) to ensure data security and operational integrity.

- **Super Admin / Admin:** Full system access. Can onboard employees, manage teams, approve/reject attendance issues, and view company-wide financial targets.
- **HR Representative:** Manages employee documents, policies, leaves, and core HR functions.
- **Team Leader:** Manages their specific team's targets, views team attendance, and oversees team operations.
- **Employee / Intern:** Standard access. Can punch in/out, view personal performance, request leaves, and manage their assigned tasks.

## 3. Core Module Workflows

### A. Geofenced Attendance & Terminal Workflow
1. **Initiation:** Employee logs into the portal via mobile or desktop.
2. **Verification:** The system securely fetches the user's live GPS coordinates.
3. **Validation:** The system calculates the distance and verifies if the coordinates fall within the predefined corporate office radius.
4. **Execution:** 
   - *Success:* Employee successfully punches in. The exact timestamp and location are securely logged.
   - *Failure:* If outside the radius, the punch is immediately rejected.
5. **Exception Handling:** If an employee forgets to checkout, the system flags a "Missed Checkout" issue. The admin receives this in their dashboard and must resolve it (Approve/Reject with a mandatory logged reason).

### B. Team & Revenue Target Workflow
1. **Creation:** Admin creates a Team, assigns a color/graphic, a Team Leader, and adds Members.
2. **Target Assignment:** Admin sets a global revenue and unit target for the specific month.
3. **Distribution:** The Team Leader is assigned their own specific quota, and the remaining targets are automatically distributed evenly among the team members.
4. **Tracking:** As sales or tasks are completed, the system visually tracks real-time progress against the assigned targets on the centralized Teams dashboard.

### C. Leave & Holiday Management Workflow
1. **Request:** Employee submits a leave application specifying dates, leave type, and reason.
2. **Routing:** The request instantly appears on the Admin/HR dashboard.
3. **Action:** Admin reviews the employee's leave balance and approves or rejects the request.
4. **Resolution:** Employee is notified of the decision, and their available leave balances are automatically adjusted.

### D. Employee Onboarding & Document Management
1. **Onboarding:** Admin creates a new profile, assigning role, shift timings, and reporting hierarchy (Manager, HR, Team Leader).
2. **Document Upload:** Admin uploads sensitive employee documents (ID cards, resumes, agreements).
3. **Secure Storage:** Documents are instantly streamed to a secure Google Cloud Storage bucket, ensuring only authorized personnel can access them via temporary signed URLs.

## 4. Technical Architecture & Security Overview
- **Frontend Engine:** React / Next.js (Fast, fully responsive, mobile-first design)
- **Backend API:** Node.js / Express.js REST API
- **Database:** PostgreSQL with Prisma ORM for robust relational data integrity
- **Authentication:** Firebase Auth (Enterprise-grade security and session management)
- **File Storage:** Google Cloud Storage (GCS) for encrypted document and avatar hosting
- **Deployment:** Vercel (Edge-optimized delivery)
