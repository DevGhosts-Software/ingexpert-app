import type { Metadata } from 'next';
import './globals.css';
import { PowerSyncDebug } from '@/components/powersync-debug';
import { AppQueryClientProvider } from '@/components/providers/query-client-provider';
import { PowerSyncProvider } from '@/components/providers/powersync-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UpdaterChecker } from '@/components/updater-checker';

export const metadata: Metadata = {
  title: 'IngExpert - Manejo de inventario',
  description: 'Sistema de manejo de inventario.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shouldShowPowerSyncDebug =
    process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_POWERSYNC_DEBUG === 'true';

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <UpdaterChecker />
        <AppQueryClientProvider>
          <PowerSyncProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider>
                {children}
                <Toaster />
                {shouldShowPowerSyncDebug ? <PowerSyncDebug className="left-auto right-4" /> : null}
              </TooltipProvider>
            </ThemeProvider>
          </PowerSyncProvider>
        </AppQueryClientProvider>
      </body>
    </html>
  );
}
