import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import AxiosInterceptor from '@/components/AxiosInterceptor';

export const metadata = {
 title: 'Geonixa EMS Portal',
 description: 'EMS by Geonixa',
 manifest: '/manifest.json',
 icons: {
 apple: '/maskable-logo-v2.png',
 },
 appleWebApp: {
 capable: true,
 statusBarStyle: 'default',
 title: 'Geonixa EMS',
 },
};

export const viewport = {
 themeColor: '#ffffff',
 width: 'device-width',
 initialScale: 1,
 maximumScale: 1,
 userScalable: false,
};

import GlobalSplash from '@/components/GlobalSplash';
import InstallPrompt from '@/components/InstallPrompt';

export default function RootLayout({ children }) {
 return (
 <html lang="en">
 <body className="bg-[#f8fafc] text-slate-900 font-sans antialiased">
 <AuthProvider>
 <AxiosInterceptor>
 <GlobalSplash />
 <InstallPrompt />
 {children}
 <Toaster position="top-right" />
 </AxiosInterceptor>
 </AuthProvider>
 </body>
 </html>
 );
}
