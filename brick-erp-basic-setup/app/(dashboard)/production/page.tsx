// app/(dashboard)/production/page.tsx
import { prisma } from '@/lib/prisma';
import { ProductionLog, User } from '@prisma/client';
import { ProductionList } from './production-list';
import { ProductionForm } from './production-form';
import { DailyProductionChart } from '@/components/production/daily-production-chart';
import { FilterBar } from '@/components/production/filter-bar';
import { Decimal } from 'decimal.js';
import { endOfDay, startOfDay } from 'date-fns';

// Placeholder auth
async function getSessionUser(): Promise<{
  id: string;
  role: 'ADMIN' | 'WORKER';
}> {
  return { id: 'cmockworker1', role: 'WORKER' }; // replace with real session
}

const ITEMS_PER_PAGE = 20;

export default async function ProductionPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getSessionUser();
  if (!session) return <div>Not authorized</div>;

  // Extract filters
  const startDateParam =
    typeof searchParams.startDate === 'string' ? searchParams.startDate : '';
  const endDateParam =
    typeof searchParams.endDate === 'string' ? searchParams.endDate : '';
  const workerIdFilter =
    typeof searchParams.workerId === 'string' ? searchParams.workerId : '';

  // Build Prisma where
  const where: any = {
    // Default: last 30 days if no filter
    productionDate: {
      gte: startDateParam
        ? startOfDay(new Date(startDateParam))
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lte: endDateParam ? endOfDay(new Date(endDateParam)) : new Date(),
    },
  };
  if (workerIdFilter) {
    where.workerId = workerIdFilter;
  }

  const logs = await prisma.productionLog.findMany({
    where,
    orderBy: { productionDate: 'desc' },
    take: ITEMS_PER_PAGE,
    include: { worker: true },
  });

  // Fetch settings & workers (unchanged)
  const settings = await prisma.globalSettings.findUnique({
    where: { id: 'current' },
  });

  const defaultSettings = {
    salesPricePerUnit: 0,
    maintenanceReservePerUnit: 0,
    laborRate: 0,
    cementUnitCost: 0,
    sandUnitCost: 0,
    dieselUnitCost: 0,
    cementRatio: 0.02,
    sandRatio: 0.001,
    dieselRatio: 0.005,
  };

  const settingsMissing = !settings;

  const serializedLogs = logs.map((log) => ({
    id: log.id,
    worker: log.worker,
    bricksProduced: log.bricksProduced,
    wastageCount: log.wastageCount,
    netYield: log.netYield,
    cementUsed: log.cementUsed.toNumber(),
    sandUsed: log.sandUsed.toNumber(),
    dieselUsed: log.dieselUsed.toNumber(),
    laborRateAtTime: log.laborRateAtTime.toNumber(),
    cementCostAtTime: log.cementCostAtTime.toNumber(),
    sandCostAtTime: log.sandCostAtTime.toNumber(),
    dieselCostAtTime: log.dieselCostAtTime.toNumber(),
    totalCost: log.totalCost.toNumber(),
    productionDate: log.productionDate,
  }));

  const serializedSettings = {
    salesPricePerUnit: settings
      ? settings.salesPricePerUnit.toNumber()
      : defaultSettings.salesPricePerUnit,
    maintenanceReservePerUnit: settings
      ? settings.maintenanceReservePerUnit.toNumber()
      : defaultSettings.maintenanceReservePerUnit,
    laborRate: settings ? settings.laborRate.toNumber() : defaultSettings.laborRate,
    cementUnitCost: settings
      ? settings.cementUnitCost.toNumber()
      : defaultSettings.cementUnitCost,
    sandUnitCost: settings
      ? settings.sandUnitCost.toNumber()
      : defaultSettings.sandUnitCost,
    dieselUnitCost: settings
      ? settings.dieselUnitCost.toNumber()
      : defaultSettings.dieselUnitCost,
    cementRatio: settings
      ? settings.cementRatio.toNumber()
      : defaultSettings.cementRatio,
    sandRatio: settings ? settings.sandRatio.toNumber() : defaultSettings.sandRatio,
    dieselRatio: settings
      ? settings.dieselRatio.toNumber()
      : defaultSettings.dieselRatio,
  };

  const workers = await prisma.user.findMany({
    where: { role: 'WORKER', isActive: true },
    select: { id: true, name: true },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with form */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Log</h1>
          <p className="text-muted-foreground">
            Record daily brick production.
          </p>
        </div>
        <ProductionForm
          settings={serializedSettings}
          workers={workers}
          currentUser={{ id: session.id, role: session.role }}
        />
      </div>

      {settingsMissing && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
          Global settings are not configured yet. Production calculations will use fallback values.
          Please configure settings in the Settings page for accurate cost estimates.
        </div>
      )}

      {/* Filter bar */}
      <FilterBar
        currentStartDate={startDateParam}
        currentEndDate={endDateParam}
        currentWorkerId={workerIdFilter}
        workers={workers}
      />

      {/* Chart & list */}
      {serializedLogs.length > 0 && (
        <DailyProductionChart logs={serializedLogs} />
      )}
      <ProductionList logs={serializedLogs} />
    </div>
  );
}
