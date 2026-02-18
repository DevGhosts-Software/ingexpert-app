'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface DashboardNavbarProps {
  title: string;
  userEmail?: string;
  userRole?: string;
  onLogout: () => void;
}

export function DashboardNavbar({ title, userEmail, userRole, onLogout }: DashboardNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-sm font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
        </Button>
        <ModeToggle />
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-medium leading-none">{userEmail}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole?.toLowerCase()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
