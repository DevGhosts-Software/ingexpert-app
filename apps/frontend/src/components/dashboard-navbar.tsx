'use client';

import { useState } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@ingexpert/database';
import { UserProfileSheet } from '@/features/users/components/user-profile-sheet';

function getInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? '')
      .join('');
  }
  return email[0]?.toUpperCase() ?? '?';
}

interface DashboardNavbarProps {
  title: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role'>;
  onLogout: () => void;
}

export function DashboardNavbar({ title, user, onLogout }: DashboardNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-sm font-semibold">{title}</h1>

        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
          <Separator orientation="vertical" className="h-4" />
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent transition-colors"
            aria-label="Abrir perfil"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium leading-none">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
            </div>
            <Avatar size="sm">
              {user.avatar && <AvatarImage src={user.avatar} alt={user.name ?? user.email} />}
              <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      <UserProfileSheet user={user} open={profileOpen} onClose={() => setProfileOpen(false)} onLogout={onLogout} />
    </>
  );
}
