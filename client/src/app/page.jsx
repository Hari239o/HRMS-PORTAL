import { redirect } from 'next/navigation';

export default function RootPage() {
  // Since we don't know auth state on the server easily without cookies/tokens configured here, 
  // we redirect to /dashboard which is protected and will push to /login if unauthenticated.
  redirect('/dashboard');
}
