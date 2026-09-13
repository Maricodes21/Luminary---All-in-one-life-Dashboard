import { useEffect } from 'react';
import { Platform } from 'react-native';

export function PwaBootstrap() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    ensureWebInstallMetadata();
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = () => {
      void navigator.serviceWorker.register('/service-worker.js');
    };
    if (document.readyState === 'complete') registerServiceWorker();
    else window.addEventListener('load', registerServiceWorker, { once: true });

    return () => window.removeEventListener('load', registerServiceWorker);
  }, []);

  return null;
}

function ensureWebInstallMetadata() {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.webmanifest';
    document.head.appendChild(manifest);
  }

  const metadata = [
    ['theme-color', '#0c0e10'],
    ['apple-mobile-web-app-capable', 'yes'],
    ['apple-mobile-web-app-status-bar-style', 'black-translucent'],
    ['apple-mobile-web-app-title', 'Luminary'],
  ];
  for (const [name, content] of metadata) {
    if (document.querySelector(`meta[name="${name}"]`)) continue;
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  }
}
