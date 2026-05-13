import { prisma } from '@/lib/prisma';
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
      salesPricePerUnit: 0,
      maintenanceReservePerUnit: 0,
      laborRate: 0,
      cementUnitCost: 0,
      sandUnitCost: 0,
      dieselUnitCost: 0,
      cementConversionFactor: 50, // sensible default
      sandConversionFactor: 100,
      dieselConversionFactor: 3.785,
      cementRatio: 0.02,
      sandRatio: 0.001,
      dieselRatio: 0.005,
      updatedById: '',
      updatedAt: new Date(),
    };
  }

  // Convert Prisma Decimal fields to plain numbers for the client.
  const serialized = {
    salesPricePerUnit: settings.salesPricePerUnit,
    maintenanceReservePerUnit: settings.maintenanceReservePerUnit,
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

  return <SettingsForm settings={serialized} />;
}
