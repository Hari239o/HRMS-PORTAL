"use client";

import { useEffect, useState } from 'react';

export default function GlobalSplash() {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    // Fallback timeout in case video fails to load or play (e.g., low power mode)
    const timer = setTimeout(() => {
      setShow(false);
    }, 4500); 
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-white">
      <video
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain pointer-events-none"
        onEnded={() => setShow(false)}
      >
        <source src="/splash-animation.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
