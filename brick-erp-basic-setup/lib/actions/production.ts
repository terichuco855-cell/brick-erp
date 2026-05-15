'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { canProduce } from '@/lib/utils/erp-logic';
import { Decimal } from 'decimal.js';


const productionSchema = z.object({
  workerId: z.string().min(1),
  bricksProduced: z.number().int().positive(),
  wastageCount: z.number().int().min(0),
  cementUsed: z.number().min(0),
  sandUsed: z.number().min(0),
  dieselUsed: z.number().min(0),
});

export async function createProductionLog(
  data: z.input<typeof productionSchema>
) {
  console.log('createProductionLog called with data:', data);
  // 1. Validate
  const parsed = productionSchema.safeParse(data);
  if (!parsed.success) {
    console.log('Validation failed:', parsed.error.format());
    return { success: false, error: 'Invalid data' };
  }

  const {
    workerId,
    bricksProduced,
    wastageCount,
    cementUsed,
    sandUsed,
    dieselUsed,
  } = parsed.data;
  const netYield = bricksProduced - wastageCount;
  if (netYield < 0) {
    return { success: false, error: 'Wastage cannot exceed produced.' };
  }

  // 2. Fetch current settings (snapshot costs)
  const settings = await prisma.globalSettings.findUnique({
    where: { id: 'current' },
  });
  if (!settings) {
    console.log('Global settings not found');
    return { success: false, error: 'Global settings not configured.' };
  }

  const cementUnitCost = settings.cementUnitCost.toNumber();
  const sandUnitCost = settings.sandUnitCost.toNumber();
  const dieselUnitCost = settings.dieselUnitCost.toNumber();
  const laborRate = settings.laborRate.toNumber();
  const salesPrice = settings.salesPricePerUnit.toNumber();
  const maintenanceReserve = settings.maintenanceReservePerUnit.toNumber();
  const cementRatio = settings.cementRatio.toNumber();
  const sandRatio = settings.sandRatio.toNumber();
  const dieselRatio = settings.dieselRatio.toNumber();

  // 3. Check inventory availability
  const inventory = await prisma.inventory.findMany();
  const stock = {
    cement:
      inventory.find((i) => i.materialType === 'CEMENT')?.quantity.toNumber() ??
      0,
    sand:
      inventory.find((i) => i.materialType === 'SAND')?.quantity.toNumber() ??
      0,
    diesel:
      inventory.find((i) => i.materialType === 'DIESEL')?.quantity.toNumber() ??
      0,
  };

  const check = canProduce(
    bricksProduced,
    { cementRatio, sandRatio, dieselRatio },
    stock
  );
  if (!check.possible) {
    return {
      success: false,
      error: `Insufficient materials:\n${check.shortfalls.join('\n')}`,
    };
  }

  // 4. Calculate total cost
  const totalCost = new Decimal(cementUsed)
    .mul(cementUnitCost)
    .plus(new Decimal(sandUsed).mul(sandUnitCost))
    .plus(new Decimal(dieselUsed).mul(dieselUnitCost))
    .plus(new Decimal(bricksProduced).mul(laborRate))
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    .toNumber();

  // 5. Perform update in a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Deduct raw materials
      if (cementUsed > 0) {
        await tx.inventory.update({
          where: { materialType: 'CEMENT' },
          data: { quantity: { decrement: cementUsed } },
        });
      }
      if (sandUsed > 0) {
        await tx.inventory.update({
          where: { materialType: 'SAND' },
          data: { quantity: { decrement: sandUsed } },
        });
      }
      if (dieselUsed > 0) {
        await tx.inventory.update({
          where: { materialType: 'DIESEL' },
          data: { quantity: { decrement: dieselUsed } },
        });
      }

      // Increment brick inventory
      await tx.inventory.upsert({
        where: { materialType: 'BRICK' },
        update: { quantity: { increment: netYield } },
        create: {
          materialType: 'BRICK',
          quantity: netYield,
          baseUnit: 'piece',
          purchaseUnit: 'piece',
          conversionFactor: 1,
        },
      });

      // Create production log
      const log = await tx.productionLog.create({
        data: {
          workerId,
          bricksProduced,
          wastageCount,
          netYield,
          cementUsed,
          sandUsed,
          dieselUsed,
          laborRateAtTime: laborRate,
          cementCostAtTime: cementUnitCost,
          sandCostAtTime: sandUnitCost,
          dieselCostAtTime: dieselUnitCost,
          totalCost,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: workerId, // the worker who logged it (or admin)
          action: 'CREATE',
          entity: 'ProductionLog',
          entityId: log.id,
          details: JSON.stringify({
            bricksProduced,
            netYield,
            cementUsed,
            sandUsed,
            dieselUsed,
          }),
        },
      });
       return { success: true, netYield };
    });

     revalidatePath('/production');
     return result;
  } catch (error: any) {
    console.error('createProductionLog error:', error);
    return { success: false, error: 'Database error. Production not saved.' };
  }
}
