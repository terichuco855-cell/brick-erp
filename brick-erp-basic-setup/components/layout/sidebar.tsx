// components/layout/sidebar.tsx
'use client';

import { Flame } from 'lucide-react';
import { NavContent } from './nav-content'; // Centralized navigation [cite: 56, 81]

export function Sidebar() {
  return (
    <aside
      className="hidden md:flex h-screen w-64 flex-col shrink-0 border-r"
      style={{ backgroundColor: 'hsl(var(--sidebar-bg))' }} // [cite: 16]
    >
      {/* Logo Section [cite: 17, 18] */}
      <div
        className="flex items-center gap-3 px-6 py-5 border-b"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-clay-400 shadow-md">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div>
          <p
            className="text-sm font-bold leading-none"
            style={{ color: 'hsl(var(--sidebar-fg))' }}
          >
            BrickFactory
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
          >
            ERP System
          </p>
        </div>
      </div>

      {/* Navigation Section - Imported from nav-content [cite: 20, 81] */}
      <NavContent />

      {/* Footer Section [cite: 37, 38] */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        <div className="flex items-center gap-3 px-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: '#E29578' }}
          >
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'hsl(var(--sidebar-fg))' }}
            >
              Admin
            </p>
            <p
              className="text-xs truncate"
              style={{ color: 'hsl(var(--sidebar-muted))' }}
            >
              Administrator
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
