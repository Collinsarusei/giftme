// components/ui/install-pwa.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Download } from 'lucide-react';

export const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
      });
    }
  };

  if (!installPrompt) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
      onClick={handleInstallClick}
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
};
