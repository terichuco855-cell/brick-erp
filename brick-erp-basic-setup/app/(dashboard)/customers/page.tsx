import { PageShell } from '@/components/layout/page-shell';
import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <PageShell title="Customers" subtitle="Customer debt tracking">
      <div className="rounded-xl border bg-white p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <Users className="h-14 w-14 text-muted-foreground/25 mb-4" />
        <h2 className="text-base font-semibold text-foreground">Customers Module</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          Manage customer profiles, track outstanding balances and credit debts.
          Record payment receipts and view per-customer transaction history.
        </p>
        <div className="mt-6 flex items-center gap-4">
          {[
            { label: 'Total Customers', value: '0' },
            { label: 'With Debt', value: '0' },
            { label: 'Total Owed', value: '0 MMK' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-brand-sand-100 px-5 py-3 text-center">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-brand-brick-500 mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
