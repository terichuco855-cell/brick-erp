import { PageShell } from '@/components/layout/page-shell';
import { Package, Factory, Receipt, Users, TrendingUp, TriangleAlert as AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const statCards = [
  {
    label: 'Total Bricks (Stock)',
    value: '0',
    unit: 'pcs',
    change: '0%',
    up: true,
    icon: Package,
    color: 'bg-brand-brick-500',
  },
  {
    label: 'Production Today',
    value: '0',
    unit: 'pcs',
    change: '0%',
    up: true,
    icon: Factory,
    color: 'bg-brand-clay-400',
  },
  {
    label: 'Sales This Month',
    value: '0',
    unit: 'MMK',
    change: '0%',
    up: true,
    icon: Receipt,
    color: 'bg-amber-500',
  },
  {
    label: 'Outstanding Debt',
    value: '0',
    unit: 'MMK',
    change: '0%',
    up: false,
    icon: Users,
    color: 'bg-rose-500',
  },
];

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard" subtitle="Overview of your brick factory operations">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {card.label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">{card.value}</span>
                    <span className="text-xs text-muted-foreground">{card.unit}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    {card.up ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-rose-500" />
                    )}
                    <span className={`text-xs font-medium ${card.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {card.change}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className={`${card.color} flex h-10 w-10 items-center justify-center rounded-lg shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Production Logs</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest factory activity</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Factory className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No production logs yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Production entries will appear here
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Stock Alerts</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Low inventory warnings</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="space-y-3">
            {['Cement', 'Sand', 'Diesel'].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5">
                <div>
                  <p className="text-xs font-medium text-amber-900">{item}</p>
                  <p className="text-xs text-amber-600 mt-0.5">No stock data</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  --
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Sales</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Latest vouchers issued</p>
          </div>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No sales recorded yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Sales vouchers will appear here
          </p>
        </div>
      </div>
    </PageShell>
  );
}
