import { PageShell } from '@/components/layout/page-shell';
import { ChartBar as BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <PageShell title="Reports" subtitle="Profit & Loss analysis">
      <div className="rounded-xl border bg-white p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <BarChart3 className="h-14 w-14 text-muted-foreground/25 mb-4" />
        <h2 className="text-base font-semibold text-foreground">Reports Module</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          View comprehensive Profit & Loss reports, revenue vs cost breakdowns,
          and production efficiency analysis over customizable date ranges.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md w-full">
          {[
            { label: 'Total Revenue', value: '0 MMK', variant: 'emerald' },
            { label: 'Total Costs', value: '0 MMK', variant: 'rose' },
            { label: 'Net Profit', value: '0 MMK', variant: 'brand' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-brand-sand-100 p-3 text-center">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-bold text-brand-brick-500 mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
