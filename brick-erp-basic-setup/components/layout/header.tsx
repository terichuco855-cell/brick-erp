// components/layout/header.tsx
'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, Menu, Flame, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { NavContent } from './nav-content';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    // Add your logout logic here (e.g., supabase.auth.signOut() or next-auth)
    console.log('Logging out...');
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-white/95 backdrop-blur px-4 md:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Hamburger button on mobile only */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
            >
              {' '}
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-none">
              {title}
            </h1>{' '}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}{' '}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />{' '}
            <Input
              placeholder="Search..."
              className="pl-8 h-8 w-52 text-sm bg-background border-border"
            />{' '}
          </div>
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {' '}
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-brand-brick-500" />
          </Button>{' '}
          <div className="h-8 w-px bg-border" />
          {/* Logout Action (Replaced Profile Info) */}
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-3 h-9 text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline-block">
              Logout
            </span>
          </Button>
        </div>
      </header>

      {/* Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0"
          style={{ backgroundColor: 'hsl(var(--sidebar-bg))' }}
        >
          {' '}
          <div className="flex h-screen flex-col">
            {/* Logo inside sheet */}
            <div
              className="flex items-center gap-3 px-6 py-5 border-b"
              style={{ borderColor: 'hsl(var(--sidebar-border))' }}
            >
              {' '}
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-clay-400 shadow-md">
                {' '}
                <Flame className="h-5 w-5 text-white" />
              </div>{' '}
              <div>
                <p
                  className="text-sm font-bold leading-none"
                  style={{ color: 'hsl(var(--sidebar-fg))' }}
                >
                  BrickFactory
                </p>{' '}
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'hsl(var(--sidebar-muted))' }}
                >
                  ERP System
                </p>{' '}
              </div>
            </div>
            <NavContent onItemClick={() => setMobileMenuOpen(false)} />
            {/* Mobile Footer: Keeps the Admin info here as requested, matching the sidebar style */}
            <div
              className="px-4 py-4 border-t"
              style={{ borderColor: 'hsl(var(--sidebar-border))' }}
            >
              {' '}
              <div className="flex items-center gap-3 px-2">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: '#E29578' }}
                >
                  {' '}
                  AD
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'hsl(var(--sidebar-fg))' }}
                  >
                    Admin
                  </p>{' '}
                  <p
                    className="text-xs truncate"
                    style={{ color: 'hsl(var(--sidebar-muted))' }}
                  >
                    Administrator
                  </p>{' '}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
