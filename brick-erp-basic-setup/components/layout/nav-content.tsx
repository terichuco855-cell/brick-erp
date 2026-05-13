'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Factory,
  Receipt,
  ChartBar as BarChart3,
  Users,
  Wallet,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview',
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: Package,
    description: 'Materials',
  },
  {
    label: 'Production',
    href: '/production',
    icon: Factory,
    description: 'Logs',
  },
  { label: 'Sales', href: '/sales', icon: Receipt, description: 'Vouchers' },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Profit & Loss',
  },
  {
    label: 'Customers',
    href: '/customers',
    icon: Users,
    description: 'Debt Tracking',
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: Wallet,
    description: 'Cost Records',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Global Rates',
  },
];

export function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-0.5">
      <p
        className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'hsl(var(--sidebar-muted))' }}
      >
        Main Menu
      </p>
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
              isActive ? 'shadow-sm' : 'hover:opacity-100'
            )}
            style={
              isActive
                ? {
                    backgroundColor: 'hsl(var(--sidebar-active-bg))',
                    color: 'hsl(var(--sidebar-fg))',
                  }
                : { color: 'hsl(var(--sidebar-muted))' }
            }
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                isActive && 'text-brand-clay-400'
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="leading-none">{item.label}</p>
              <p
                className="text-xs mt-0.5 truncate"
                style={{
                  color: isActive ? '#E29578cc' : 'hsl(var(--sidebar-muted))',
                }}
              >
                {item.description}
              </p>
            </div>
            {isActive && (
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: '#E29578' }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
