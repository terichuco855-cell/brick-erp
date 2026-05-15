'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from 'decimal.js';

// Strict validation: all conversion factors and ratios must be > 0
const positiveDecimal = z.number().gt(0, 'Must be greater than 0');

const settingsSchema = z.object({
  salesPricePerUnit: z.number().min(0),
  maintenanceReservePerUnit: z.number().min(0),
  laborRate: z.number().min(0),
  cementUnitCost: z.number().min(0),
  sandUnitCost: z.number().min(0),
  dieselUnitCost: z.number().min(0),
  cementConversionFactor: positiveDecimal,
  sandConversionFactor: positiveDecimal,
  dieselConversionFactor: positiveDecimal,
  cementRatio: z.number().min(0), // consumption per brick can be 0
  sandRatio: z.number().min(0),
  dieselRatio: z.number().min(0),
});

export type SettingsUpdateResult = {
  success: boolean;
  updated: boolean;
  error?: string;
};

/**
 * Updates global settings inside a transaction.
 * Creates an audit log entry detailing every changed field.
 * - If no previous settings exist, they are created (initial setup).
 * - The `updatedById` is taken from the server-side session.
 */
export async function updateGlobalSettings(
  data: z.input<typeof settingsSchema>
): Promise<SettingsUpdateResult> {
  // 1. Validate
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path[0]}: ${i.message}`)
      .join(', ');
      console.log('Validation failed:', parsed.error.format());
    return { success: false, updated: false, error: `Invalid data: ${issues}` };
  }
  const newValues = parsed.data;

  // 2. Retrieve server-side user ID (replace with real session later)
  // const session = await getServerSession(authOptions);
  // if (!session || session.user.role !== 'ADMIN') return { success: false, updated: false, error: 'Unauthorized' };
  const userId = 'cmockadmin'; // placeholder

  // 3. Run the whole update + audit inside a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      const oldSettings = await tx.globalSettings.findUnique({
        where: { id: 'current' },
      });

      if (!oldSettings) {
        // ---- INITIAL CREATION ----
        const created = await tx.globalSettings.create({
          data: {
            id: 'current',
            ...newValues,
            updatedById: userId,
          },
        });

        // Build details: full snapshot of created fields
        const details = Object.entries(newValues).reduce(
          (acc, [key, value]) => {
            acc[key] = { old: null, new: value };
            return acc;
          },
          {} as Record<string, any>
        );

        await tx.auditLog.create({
          data: {
            userId,
            action: 'CREATE',
            entity: 'GlobalSettings',
            entityId: 'current',
            details: JSON.stringify(details),
          },
        });

        return { created: true, changed: true };
      } else {
        // ---- COMPARE AND UPDATE ----
        // Build a map of old plain values from the existing record
        const oldPlain = {
          salesPricePerUnit: oldSettings.salesPricePerUnit.toNumber(),
          maintenanceReservePerUnit:
            oldSettings.maintenanceReservePerUnit.toNumber(),
          laborRate: oldSettings.laborRate.toNumber(),
          cementUnitCost: oldSettings.cementUnitCost.toNumber(),
          sandUnitCost: oldSettings.sandUnitCost.toNumber(),
          dieselUnitCost: oldSettings.dieselUnitCost.toNumber(),
          cementConversionFactor: oldSettings.cementConversionFactor.toNumber(),
          sandConversionFactor: oldSettings.sandConversionFactor.toNumber(),
          dieselConversionFactor: oldSettings.dieselConversionFactor.toNumber(),
          cementRatio: oldSettings.cementRatio.toNumber(),
          sandRatio: oldSettings.sandRatio.toNumber(),
          dieselRatio: oldSettings.dieselRatio.toNumber(),
        };

        // Compute changes using Decimal.js for precise comparison
        const changes: Record<string, { old: number; new: number }> = {};
        let hasChanges = false;
        for (const [key, newVal] of Object.entries(newValues)) {
          const oldVal = oldPlain[key as keyof typeof oldPlain];
          if (!new Decimal(oldVal).eq(newVal)) {
            changes[key] = { old: oldVal, new: newVal };
            hasChanges = true;
          }
        }

        if (!hasChanges) {
          return { created: false, changed: false };
        }

        // Apply update
        await tx.globalSettings.update({
          where: { id: 'current' },
          data: {
            ...newValues,
            updatedById: userId,
          },
        });

        // Write audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE',
            entity: 'GlobalSettings',
            entityId: 'current',
            details: JSON.stringify(changes),
          },
        });

        return { created: false, changed: true };
      }
    });

    // 4. Revalidate relevant pages
    revalidatePath('/settings');
    revalidatePath('/dashboard');
    // (add other paths that depend on settings, e.g., /production, /sales, etc.)

    return {
      success: true,
      updated: result.changed,
      error: result.changed
        ? undefined
        : 'No changes detected – nothing was updated.',
    };
  } catch (error) {
    console.error('updateGlobalSettings error:', error);
    return {
      success: false,
      updated: false,
      error: 'Database error. Please try again.',
    };
  }
}
