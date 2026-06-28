"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function GlobalSplash() {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    // Show the splash screen for 2.8 seconds on every initial load or refresh
    const timer = setTimeout(() => {
      setShow(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* Background Shadow Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none scale-[2.5] md:scale-[3.5] -rotate-12 transition-transform duration-1000">
        <Image 
          src="/geonixa-logo.png" 
          alt="Background Logo" 
          width={800} 
          height={800} 
          className="object-contain"
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
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
      
      {/* Loading indicator */}
      <div className="absolute bottom-16 flex space-x-2 z-10">
        <div className="w-2 h-2 bg-[#ff5a1f] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-[#ff5a1f] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-[#ff5a1f] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
