'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      // Hard reload to ensure the new service worker's assets are used
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const promptUpdate = (worker: ServiceWorker) => {
      setUpdating(true);
      worker.postMessage({ type: 'SKIP_WAITING' });
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // If a new version is already waiting when the page loads, activate it now.
        if (registration.waiting && navigator.serviceWorker.controller) {
          promptUpdate(registration.waiting);
          return;
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // A new version is waiting. Show the overlay and tell the SW to activate.
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptUpdate(newWorker);
            }
          });
        });
      } catch (err) {
        console.error('PWA registration failed:', err);
      }
    };

    register();

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  if (!updating) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <div className="text-center p-6">
        <Loader2 className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Updating Captain&apos;s Log
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Getting the latest version, please wait...
        </p>
      </div>
    </div>
  );
}
