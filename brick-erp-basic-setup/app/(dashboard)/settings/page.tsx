import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { PageShell } from '@/components/layout/page-shell';

// Replace with your actual auth import:
// import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import SettingsForm from './settings-form';

// Placeholder: later replace with real session.
async function getAdminSession() {
  // Simulate an admin user.
  // TODO: Replace with actual auth logic.
  return {
    user: {
      id: 'cmockadmin',
      role: 'ADMIN' as const,
    },
  };
}

export default async function SettingsPage() {
  const session = await getAdminSession();
  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        You are not authorised to view this page.
      </div>
    );
  }
  /*if (!session || session.user.role !== 'ADMIN') {
    return (/* unauthorized UI 
  }*/

  let settings = await prisma.globalSettings.findUnique({
    where: { id: 'current' },
  });

  // If no settings row exists yet, provide default zeros (or typical defaults)
  if (!settings) {
    settings = {
      id: 'current',
      salesPricePerUnit: new Prisma.Decimal(0),
      maintenanceReservePerUnit: new Prisma.Decimal(0),
      laborRate: new Prisma.Decimal(0),
      cementUnitCost: new Prisma.Decimal(0),
      sandUnitCost: new Prisma.Decimal(0),
      dieselUnitCost: new Prisma.Decimal(0),
      cementConversionFactor: new Prisma.Decimal(50), // sensible default
      sandConversionFactor: new Prisma.Decimal(100),
      dieselConversionFactor: new Prisma.Decimal(3.785),
      cementRatio: new Prisma.Decimal(0.02),
      sandRatio: new Prisma.Decimal(0.001),
      dieselRatio: new Prisma.Decimal(0.005),
      updatedById: '',
      updatedAt: new Date(),
    };
  }

  // Convert Prisma Decimal fields to plain numbers for the client.
  const serialized = {
    salesPricePerUnit: settings.salesPricePerUnit.toNumber(),
    maintenanceReservePerUnit: settings.maintenanceReservePerUnit.toNumber(),
    laborRate: settings.laborRate.toNumber(),
    cementUnitCost: settings.cementUnitCost.toNumber(),
    sandUnitCost: settings.sandUnitCost.toNumber(),
    dieselUnitCost: settings.dieselUnitCost.toNumber(),
    cementConversionFactor: settings.cementConversionFactor.toNumber(),
    sandConversionFactor: settings.sandConversionFactor.toNumber(),
    dieselConversionFactor: settings.dieselConversionFactor.toNumber(),
    cementRatio: settings.cementRatio.toNumber(),
    sandRatio: settings.sandRatio.toNumber(),
    dieselRatio: settings.dieselRatio.toNumber(),
  };

  return (
    <PageShell title="Settings" subtitle="Configure global settings for your brick factory">
      <SettingsForm settings={serialized} />
    </PageShell>
  );
}
