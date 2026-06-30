'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SplashScreen() {
 const router = useRouter();
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 // Check auth status and redirect after a delay
 const timer = setTimeout(() => {
 const token = sessionStorage.getItem('token');
 if (token) {
 router.push('/dashboard');
 } else {
 router.push('/login');
 }
 }, 2800);

 return () => clearTimeout(timer);
 }, [router]);

 if (!mounted) return null;

 return null;
}
