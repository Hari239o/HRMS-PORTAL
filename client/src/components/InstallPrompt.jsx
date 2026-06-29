'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Only run in browser
  if (typeof window === 'undefined') return null;
  if (isStandalone || dismissed || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[9999] flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom duration-500 rounded-t-3xl">
      <div className="flex items-center gap-4 w-full">
        <img src="/geonixa-logo.png" alt="Geonixa" className="w-12 h-12 rounded-2xl shadow-sm border border-slate-100" />
        <div className="flex-grow">
          <p className="text-base font-black text-slate-900">Install Geonixa HR</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Add to home screen for quick access and better experience
          </p>
        </div>
        <button 
          onClick={handleInstallClick}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 whitespace-nowrap"
        >
          Install App
        </button>
        <button onClick={() => setDismissed(true)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full shrink-0">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
