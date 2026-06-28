import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import AxiosInterceptor from '@/components/AxiosInterceptor';

export const metadata = {
  title: 'Geonixa HR Portal',
  description: 'HR Management System by Geonixa',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Geonixa HR',
  },
};

export const viewport = {
  themeColor: '#ff5a1f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import GlobalSplash from '@/components/GlobalSplash';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased">
        <AuthProvider>
          <AxiosInterceptor>
            <GlobalSplash />
            {children}
            <Toaster position="top-right" />
          </AxiosInterceptor>
        </AuthProvider>
      </body>
    </html>
  );
}
