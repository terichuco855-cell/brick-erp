"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  canSell,
  computeSaleAmounts,
  getCustomerBalanceDelta,
} from "@/lib/utils/erp-logic";
import { PaymentStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// ── Helper types ─────────────────────────────────────────────────
export type ActionResult<T = void> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// ── Input validation schema ──────────────────────────────────────
const createSaleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  quantity: z.coerce.number().int().positive("Quantity must be a positive integer"),
  paymentStatus: z.nativeEnum(PaymentStatus),
  amountPaid: z.coerce.number().nonnegative().optional(),
});

// ══════════════════════════════════════════════════════════════════
// CREATE SALE (server action)
// ══════════════════════════════════════════════════════════════════
export async function createSale(
  formData: FormData | z.infer<typeof createSaleSchema>,
  userId: string
): Promise<ActionResult<{ saleId: string }>> {
  // 1. Validate input
  let validated: z.infer<typeof createSaleSchema>;
  if (formData instanceof FormData) {
    const raw = Object.fromEntries(formData.entries());
    const parsed = createSaleSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    validated = parsed.data;
  } else {
    const parsed = createSaleSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors.map(e => e.message).join(", ") };
    }
    validated = parsed.data;
  }

  const { customerId, quantity, paymentStatus, amountPaid: rawAmountPaid } = validated;

  // 2. Fetch required data (outside transaction)
  const [brickInventory, settings] = await Promise.all([
    prisma.inventory.findUnique({ where: { materialType: "BRICK" } }),
    prisma.globalSettings.findUnique({ where: { id: "current" } }),
  ]);

  if (!brickInventory) {
    return { success: false, error: "Brick inventory record not found." };
  }

  const currentStock = Number(brickInventory.quantity);
  const salesPricePerUnit = Number(settings?.salesPricePerUnit ?? 0);
  if (salesPricePerUnit <= 0) {
    return { success: false, error: "Sales price per unit is not configured." };
  }

  // 3. Validate stock availability
  const stockCheck = canSell(quantity, currentStock);
  if (!stockCheck.possible) {
    return { success: false, error: stockCheck.message };
  }

  // 4. Compute financials
  const saleAmounts = computeSaleAmounts({
    quantity,
    salesPricePerUnit,
    paymentStatus,
    amountPaid: rawAmountPaid,
  });
  const balanceDelta = getCustomerBalanceDelta(
    saleAmounts.totalAmount,
    saleAmounts.effectiveAmountPaid
  );

  // 5. Execute atomic transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // a) Decrement brick inventory
      await tx.inventory.update({
        where: { materialType: "BRICK" },
        data: {
          quantity: { decrement: quantity },
          updatedAt: new Date(),
        },
      });

      // b) Update customer balance
      await tx.customer.update({
        where: { id: customerId },
        data: {
          currentBalance: { increment: balanceDelta },
        },
      });

      // c) Create Sale record
      const sale = await tx.sale.create({
        data: {
          customerId,
          quantity,
          salesPriceAtTime: salesPricePerUnit,
          totalAmount: saleAmounts.totalAmount,
          amountPaid: saleAmounts.effectiveAmountPaid,
          balanceDue: saleAmounts.balanceDue,
          paymentStatus,
          saleDate: new Date(),
          createdById: userId,
        },
      });

      // d) If any amount paid, create a PaymentReceipt
      if (saleAmounts.effectiveAmountPaid > 0) {
        await tx.paymentReceipt.create({
          data: {
            customerId,
            saleId: sale.id,
            amountPaid: saleAmounts.effectiveAmountPaid,
            paymentDate: new Date(),
            note: `Initial payment for sale #${sale.id}`,
          },
        });
      }

      // e) Audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          entity: "SALE",
          entityId: sale.id,
          details: JSON.stringify({
            customerId,
            quantity,
            totalAmount: saleAmounts.totalAmount,
            paymentStatus,
            balanceDue: saleAmounts.balanceDue,
          }),
        },
      });

      return sale;
    });

    revalidatePath("/sales");
    revalidatePath("/customers");
    revalidatePath("/inventory");
    return { success: true, data: { saleId: result.id }, message: "Sale created successfully." };
  } catch (error) {
    console.error("createSale failed:", error);
    if (error instanceof Error && error.message.includes("Foreign key")) {
      return { success: false, error: "Customer not found." };
    }
    return { success: false, error: "Failed to create sale. Please try again." };
  }
}

// ══════════════════════════════════════════════════════════════════
// LIST SALES (with filters & pagination)
// ══════════════════════════════════════════════════════════════════
export interface ListSalesParams {
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

export async function listSales(params: ListSalesParams = {}) {
  const {
    customerId,
    dateFrom,
    dateTo,
    paymentStatus,
    page = 1,
    pageSize = 20,
  } = params;

  const where: Prisma.SaleWhereInput = { deletedAt: null };

  if (customerId) {
    where.customerId = customerId;
  }
  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }
  if (dateFrom || dateTo) {
    where.saleDate = {};
    if (dateFrom) where.saleDate.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.saleDate.lte = end;
    }
  }

  const [sales, totalCount] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { saleDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  };
}

// ══════════════════════════════════════════════════════════════════
// SOFT DELETE SALE
// ══════════════════════════════════════════════════════════════════
export async function softDeleteSale(
  saleId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const existing = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!existing) {
      return { success: false, error: "Sale not found." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id: saleId },
        data: { deletedAt: new Date() },
      });
       
       // 1. အုတ်စတော့ကို ပြန်တိုးပေးရန် (Inventory Reversal)
     await tx.inventory.update({
   where: { materialType: "BRICK" },
  data: {
    quantity: { increment: existing.quantity },
  },
});

  // 2. Customer ရဲ့ balance ကို ပြန်နုတ်ပေးရန် (Balance Reversal)
// မှတ်ချက် - BalanceDue ပမာဏကိုပဲ ပြန်နုတ်ပေးရပါမယ် (ဘာလို့ဆို ပေးပြီးသားပမာဏက ငွေထဲဝင်သွားပြီမို့လို့ပါ)
if (existing.balanceDue > 0) {
  await tx.customer.update({
    where: { id: existing.customerId },
    data: {
      currentBalance: { decrement: existing.balanceDue },
    },
  });
}
      // 3. Audit Log ထဲမှာ အသေးစိတ်မှတ်ရန်
await tx.auditLog.create({
  data: {
    userId,
    action: "DELETE",
    entity: "SALE",
    entityId: saleId,
    details: JSON.stringify({
      reason: "Sale voided/deleted",
      revertedQuantity: existing.quantity,
      revertedBalance: existing.balanceDue,
    }),
  },
});

    revalidatePath("/sales");
    return { success: true, data: undefined, message: "Sale deleted successfully." };
  } catch (error) {
    console.error("softDeleteSale failed:", error);
    return { success: false, error: "Failed to delete sale." };
  }
}