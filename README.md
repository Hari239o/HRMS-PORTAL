# Employee Attendance Geonixa

A comprehensive, real-time employee attendance and management portal.

## Features
- Real-time internal chat with Socket.io
- Gamified performance tracking
- Leave and issue management with document uploads
- Fully responsive Tailwind UI

## Architecture
- **Frontend**: React + Vite (Tailwind CSS)
- **Backend**: Node.js + Express + Socket.io
- **Database**: Firebase Firestore

## Setup & Local Development

1. **Clone the repository**
2. **Setup Backend**:
   - Navigate to `/server`
   - Run `npm install`
   - Create a `.env` file using the `.env.example` structure. Add your Firebase admin credentials and `CLIENT_URL` (e.g., `http://localhost:5173`).
   - Run `npm start`
3. **Setup Frontend**:
   - Navigate to `/client`
   - Run `npm install`
   - Create a `.env` file based on `.env.example` and set `VITE_API_URL` to your backend URL (e.g., `http://localhost:5002`).
   - Run `npm run dev`

## Deployment

### Frontend (Vercel)
1. Import the `/client` directory as a new project in Vercel.
2. In Vercel environment variables, set `VITE_API_URL` to your live backend URL.
3. The included `vercel.json` ensures React Router works correctly on page refresh.

### Backend (Render / Railway / App Engine)
*Note: Vercel is not recommended for the backend due to Socket.io requiring persistent websocket connections.*
1. Deploy the `/server` directory to a Node.js hosting provider.
2. Ensure you set all required environment variables in the hosting provider's dashboard, crucially setting `CLIENT_URL` to your Vercel frontend URL to allow CORS.

## Features (Legacy)
- **Role-Based Authentication**: Admin (HR) and Employee roles.
- **Attendance Tracking**: Once-a-day check-in/out with "Late" detection (threshold: 9:15 AM).
- **Leave Management**: Apply for leaves, view status, and HR approval flow.
- **Employee Management**: Admin can CRUD employees.
- **Analytics Dashboard**: Visual charts for attendance and leave trends.
- **Reports**: Monthly summary and Export to Excel.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Recharts, Lucide React.
- **Backend**: Node.js, Express, JWT, Prisma.
- **Database**: SQLite (local `dev.db`).

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm run install:all
   ```

2. **Setup Database**:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

3. **Run the Application**:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

## Office Geofence
- The attendance geofencing location is configured for the Geonixa office at:
  `247, Guttala Begumpet, Kavuri Hills, Madhapur, Hyderabad, Telangana 500033`
- Default radius is now set to `5` meters.
- You can override the values with environment variables:
  - `OFFICE_LAT`
  - `OFFICE_LONG`
  - `OFFICE_RADIUS`

## Default Admin
The **first user** registered via the signup page will automatically be assigned the **Admin** role. Subsequent users will be **Employees**.

## Project Structure
- `/client`: React frontend
- `/server`: Express backend + Prisma schema
                                                                                                                                                                           