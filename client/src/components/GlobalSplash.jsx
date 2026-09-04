"use client";

import { useEffect, useState } from 'react';

export default function GlobalSplash() {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    // Only show splash screen once per session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShow(false);
      return;
    }

    // Fallback timeout in case video fails to load or play (increased to 15s to ensure full video plays)
    const timer = setTimeout(() => {
      handleVideoEnd();
    }, 15000); 
    
    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-white">
      <video
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain pointer-events-none mix-blend-multiply contrast-125 brightness-110"
        onEnded={handleVideoEnd}
        onError={handleVideoEnd}
      >
        <source src="/splash video.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
