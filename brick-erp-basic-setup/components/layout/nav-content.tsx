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
  Truck,
  ArrowUpDown,
  UserCog,
  History,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    group: 'Operations',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'Overview' },
      { label: 'Production', href: '/production', icon: Factory, description: 'Logs' },
      { label: 'Sales', href: '/sales', icon: Receipt, description: 'Vouchers' },
      { label: 'Customers', href: '/customers', icon: Users, description: 'Debt Tracking' },
    ]
  },
  {
    group: 'Inventory & Supplies',
    items: [
      { label: 'Inventory', href: '/inventory', icon: Package, description: 'Materials' },
      { label: 'Adjustments', href: '/inventory/adjustments', icon: ArrowUpDown, description: 'Stock Correction' },
      { label: 'Purchases', href: '/purchases', icon: Truck, description: 'Material Orders' },
    ]
  },
  {
    group: 'Financials',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3, description: 'Profit & Loss' },
      { label: 'Payments', href: '/payments', icon: CreditCard, description: 'Receipts' },
      { label: 'Expenses', href: '/expenses', icon: Wallet, description: 'Cost Records' },
    ]
  },
  {
    group: 'System',
    items: [
      { label: 'Staff', href: '/staff', icon: UserCog, description: 'User Management' },
      { label: 'Audit Logs', href: '/audit', icon: History, description: 'Security' },
      { label: 'Settings', href: '/settings', icon: Settings, description: 'Global Rates' },
    ]
  }
];

export function NavContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-4 space-y-6">
      {navGroups.map((group) => (
        <div key={group.group} className="space-y-1">
          <p
            className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider opacity-60"
            style={{ color: 'hsl(var(--sidebar-muted))' }}
          >
            {group.group}
          </p>
          {group.items.map((item) => {
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
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive ? 'shadow-sm' : 'hover:bg-white/5'
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
                  <p className="leading-none text-[13px]">{item.label}</p>
                  <p
                    className="text-[11px] mt-1 truncate"
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
        </div>
      ))}
    </nav>
  );
}