'use client';
import { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(true); // default true to avoid flicker of error
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const ua = window.navigator.userAgent;
    const isIPad = !!ua.match(/iPad/i) || (!!ua.match(/Macintosh/i) && window.navigator.maxTouchPoints > 1);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIPod = !!ua.match(/iPod/i);
    if (isIPad || isIPhone || isIPod) {
      setIsIOS(true);
      // Check if they are actually in Safari (not Chrome, Firefox, or in-app browser)
      const isSafariBrowser = !!ua.match(/Version\/[\d\.]+.*Safari/) && !ua.match(/CriOS|FxiOS|EdgiOS/);
      setIsIOSSafari(isSafariBrowser);
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

  // Prevent hydration error and wait for component to mount
  if (!mounted) return null;
  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null; // Show nothing if not installable and not iOS

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-5 bg-white/95 backdrop-blur-xl border border-slate-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] z-[9999] flex flex-col items-start gap-4 animate-in slide-in-from-bottom duration-500 rounded-3xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <img src="/geonixa-logo.png" alt="Geonixa" className="w-10 h-10 rounded-xl shadow-sm border border-slate-100" />
          <div>
            <p className="text-sm font-black text-slate-900">Install Geonixa EMS</p>
            <p className="text-[11px] font-bold text-slate-500 mt-0.5 leading-tight">
              {isIOS ? 'Install the App for Quick Access' : 'Add to home screen for better experience'}
            </p>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full shrink-0">
          <X size={16} />
        </button>
      </div>
      
      {!isIOS && deferredPrompt && (
        <button 
          onClick={handleInstallClick}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95 whitespace-nowrap"
        >
          Install App
        </button>
      )}

      {isIOS && (
        isIOSSafari ? (
          <div className="flex flex-col gap-2 w-full text-xs font-bold text-slate-600 bg-blue-50/50 border border-blue-100 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-slate-100"><Share size={12} className="text-blue-500" /></span>
              <span>Tap the <strong>Share</strong> button at the bottom</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 flex items-center justify-center bg-white rounded-md shadow-sm border border-slate-100"><PlusSquare size={12} className="text-slate-700" /></span>
              <span>Select <strong>Add to Home Screen</strong></span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-2xl">
            <span>To install, please open this link in the <strong>Safari</strong> browser.</span>
          </div>
        )
      )}
    </div>
  );
}
