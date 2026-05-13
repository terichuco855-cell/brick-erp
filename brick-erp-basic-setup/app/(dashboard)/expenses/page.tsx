import { PageShell } from '@/components/layout/page-shell';
import { Wallet } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <PageShell title="Expenses" subtitle="Operational cost records">
      <div className="rounded-xl border bg-white p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <Wallet className="h-14 w-14 text-muted-foreground/25 mb-4" />
        <h2 className="text-base font-semibold text-foreground">Expenses Module</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          Record and categorize operational expenses outside of production costs.
          Track miscellaneous spending for accurate Profit & Loss reporting.
        </p>
        <div className="mt-6 flex items-center gap-4 flex-wrap justify-center">
          {['Maintenance', 'Utilities', 'Transport', 'Labour', 'Other'].map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-brand-clay-200 bg-brand-sand-100 px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
