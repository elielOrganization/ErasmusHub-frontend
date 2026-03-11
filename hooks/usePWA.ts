'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallMethod = 'prompt' | 'ios' | 'manual' | null;

function getInstallMethod(): InstallMethod {
  if (typeof window === 'undefined') return null;

  // Already running as installed PWA
  if (window.matchMedia('(display-mode: standalone)').matches) return null;
  if ((navigator as any).standalone === true) return null;

  const ua = navigator.userAgent.toLowerCase();

  // iOS Safari: must use "Add to Home Screen"
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';

  // All other browsers: try native prompt first, fallback to manual guide
  return 'prompt';
}

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [installMethod, setInstallMethod] = useState<InstallMethod>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const method = getInstallMethod();
    setInstallMethod(method);
    setIsInstallable(method !== null);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallMethod('prompt');
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      // Native install prompt (Chrome, Edge, Samsung Internet)
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      } catch {
        setDeferredPrompt(null);
      }
    } else {
      // iOS, Firefox, Opera, Brave, etc.: show manual guide
      setShowGuide(true);
    }
  };

  const closeGuide = () => setShowGuide(false);

  return { isInstallable, installMethod, installApp, showGuide, closeGuide };
};
