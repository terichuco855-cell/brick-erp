import { PageShell } from '@/components/layout/page-shell';
import { Package } from 'lucide-react';

export default function InventoryPage() {
  return (
    <PageShell title="Inventory" subtitle="Raw materials stock management">
      <div className="rounded-xl border bg-white p-12 shadow-sm flex flex-col items-center justify-center text-center">
        <Package className="h-14 w-14 text-muted-foreground/25 mb-4" />
        <h2 className="text-base font-semibold text-foreground">Inventory Module</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
          Track cement, sand, diesel, and finished brick stock levels.
          Purchase orders and stock adjustments will be managed here.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 w-full max-w-lg">
          {['Cement', 'Sand', 'Diesel', 'Bricks'].map((mat) => (
            <div key={mat} className="rounded-lg border bg-brand-sand-100 p-3 text-center">
              <p className="text-xs font-semibold text-foreground">{mat}</p>
              <p className="text-lg font-bold text-brand-brick-500 mt-1">0</p>
              <p className="text-xs text-muted-foreground">units</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
