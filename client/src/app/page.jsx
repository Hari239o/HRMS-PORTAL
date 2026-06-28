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

  return (
    <div className="relative flex h-[100dvh] w-screen flex-col items-center justify-center overflow-hidden bg-[#ff5a1f] bg-gradient-to-br from-[#ff5a1f] to-[#e64a10]">
      {/* Background Shadow Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none scale-[2.5] md:scale-[3.5] -rotate-12 transition-transform duration-1000">
        <Image 
          src="/geonixa-logo.png" 
          alt="Background Logo" 
          width={800} 
          height={800} 
          className="object-contain brightness-0 invert"
          priority
        />
      </div>

      {/* Main Centered Logo */}
      <div className="z-10 flex flex-col items-center justify-center animate-pulse" style={{ animationDuration: '3s' }}>
        <Image 
          src="/geonixa-logo.png" 
          alt="Geonixa" 
          width={280} 
          height={90} 
          className="object-contain"
          priority
        />
      </div>
      
      {/* Loading indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        <div className="w-2.5 h-2.5 bg-white/80 rounded-full animate-bounce [animation-delay:-0.3s] shadow-sm"></div>
        <div className="w-2.5 h-2.5 bg-white/80 rounded-full animate-bounce [animation-delay:-0.15s] shadow-sm"></div>
        <div className="w-2.5 h-2.5 bg-white/80 rounded-full animate-bounce shadow-sm"></div>
      </div>
    </div>
  );
}
