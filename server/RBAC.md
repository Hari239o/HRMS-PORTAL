Role-Based Access Control (RBAC) — Geonixa CRM

Overview
- Two primary permission levels enforced by middleware:
  - `admin`: full access to administrative endpoints and cross-user data.
  - `employee`: regular user (and other non-admin roles) — limited to own data and team scopes where applicable.

Implementation
- New middleware: `server/src/middleware/rbac.js`
  - `permitRoles(allowed)`: express middleware that accepts role names (e.g., ['admin'] or ['employee']). When `employee` is allowed, any non-admin role is permitted.
  - `ownerOrAdmin(ownerId)`: helper to enforce that the requestor is the resource owner or an admin.

Key changes
- Admin-level CRM Settings endpoints added in `server/src/routes/crm-settings.js`:
  - `GET /api/crm-settings/sheet/:employeeId` — view a user's sheet config (admin only)
  - `POST /api/crm-settings/sheet/save/:employeeId` — save a sheet URL for a user (admin only)
  - `DELETE /api/crm-settings/sheet/:employeeId` — remove a user's sheet config (admin only)

Notes & guidance
- Existing routes already enforce ownership checks (leads, sheets, call logs, approvals, payments, reports, targets, employees management, etc.). The new RBAC helpers provide a central place to add more policies.
- Admin detection is strict: `req.user.role === 'admin'`.
- "Employee" in `permitRoles` is a convenience meaning "any non-admin role" — this preserves existing manager/team behaviors while allowing grouped permission checks.

Next steps
- Optionally, we can perform a repository-wide audit to convert scattered `req.user.role === 'employee'` checks to use `permitRoles(['employee'])` or `ownerOrAdmin(...)` for consistency.
- Add unit/integration tests for RBAC middleware and critical protected endpoints.

Contact
- If you'd like, I can now:
  - apply `permitRoles` to more routes for consistency,
  - replace ad-hoc ownership checks with `ownerOrAdmin`, and
  - add automated tests.
