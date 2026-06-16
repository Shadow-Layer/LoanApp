import React, { createContext, useContext, useEffect, useState } from 'react';

type BrandingConfig = {
  id: number;
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  canvasColor: string;
  surfaceColor: string;
};

const defaultBranding: BrandingConfig = {
  id: 1,
  appName: 'LoanAP',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#1A1A1A',
  accentColor: '#E8C547',
  canvasColor: '#F7F5F0',
  surfaceColor: '#FFFFFF'
};

const BrandingContext = createContext<BrandingConfig>(defaultBranding);

function applyBranding(branding: BrandingConfig): void {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', branding.primaryColor);
  root.style.setProperty('--color-accent', branding.accentColor);
  root.style.setProperty('--color-canvas', branding.canvasColor);
  root.style.setProperty('--color-surface', branding.surfaceColor);
  root.style.setProperty('--color-status-submitted-bg', '#E0E0E0');
  root.style.setProperty('--color-status-submitted-fg', '#424242');
  root.style.setProperty('--color-status-verification-bg', '#FFF8E1');
  root.style.setProperty('--color-status-verification-fg', '#F57C00');
  root.style.setProperty('--color-status-complete-bg', '#E3F2FD');
  root.style.setProperty('--color-status-complete-fg', '#1565C0');
  root.style.setProperty('--color-status-credit-bg', '#EDE7F6');
  root.style.setProperty('--color-status-credit-fg', '#6A1B9A');
  root.style.setProperty('--color-status-approved-bg', '#E8F5E9');
  root.style.setProperty('--color-status-approved-fg', '#2E7D32');
  root.style.setProperty('--color-status-rejected-bg', '#FFEBEE');
  root.style.setProperty('--color-status-rejected-fg', '#D32F2F');
  root.style.setProperty('--color-status-disbursed-bg', '#E0F2F1');
  root.style.setProperty('--color-status-disbursed-fg', '#00695C');
  document.title = branding.appName;

  const existingIcons = Array.from(document.querySelectorAll("link[rel~='icon']")) as HTMLLinkElement[];
  existingIcons.forEach((link) => link.remove());

  if (branding.faviconUrl) {
    const created = document.createElement('link');
    created.rel = 'icon';
    created.href = branding.faviconUrl;
    document.head.appendChild(created);
  }
}

async function fetchBranding(): Promise<BrandingConfig> {
  const response = await fetch('/api/config/branding');
  return (await response.json()) as BrandingConfig;
}

export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      try {
        const nextBranding = await fetchBranding();
        if (!active) {
          return;
        }
        setBranding(nextBranding);
        applyBranding(nextBranding);
      } catch {
        if (active) {
          setBranding(defaultBranding);
          applyBranding(defaultBranding);
        }
      }
    }

    const handleBrandingUpdated = (): void => {
      void load();
    };

    applyBranding(defaultBranding);
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 60000);
    window.addEventListener('branding-updated', handleBrandingUpdated);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('branding-updated', handleBrandingUpdated);
    };
  }, []);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingConfig {
  return useContext(BrandingContext);
}
