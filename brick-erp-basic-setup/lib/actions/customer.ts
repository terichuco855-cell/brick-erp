'use server';

import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

// ── Helper types ─────────────────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

// ── Input validation schemas ────────────────────────────────────
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.string().min(1),
});

export interface CustomerWithBalance {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  currentBalance: number;
  deletedAt: Date | null;
}

// ══════════════════════════════════════════════════════════════════
// CREATE CUSTOMER
// ══════════════════════════════════════════════════════════════════
export async function createCustomer(
  formData: FormData | z.infer<typeof createCustomerSchema>,
  userId: string
): Promise<ActionResult<{ customerId: string }>> {
  let validated: z.infer<typeof createCustomerSchema>;

  if (formData instanceof FormData) {
    const raw = Object.fromEntries(formData.entries());
    const parsed = createCustomerSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(', '),
      };
    }
    validated = parsed.data;
  } else {
    const parsed = createCustomerSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(', '),
      };
    }
    validated = parsed.data;
  }

  const { name, phone, address } = validated;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          name,
          phone,
          address,
          currentBalance: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          entity: 'CUSTOMER',
          entityId: customer.id,
          details: JSON.stringify({ name, phone, address }),
        },
      });

      return customer;
    });

    revalidatePath('/customers');
    return {
      success: true,
      data: { customerId: result.id },
      message: 'Customer created.',
    };
  } catch (error) {
    console.error('createCustomer failed:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return { success: false, error: 'Phone number already exists.' };
    }
    return { success: false, error: 'Failed to create customer.' };
  }
}

// ══════════════════════════════════════════════════════════════════
// LIST CUSTOMERS (with search & pagination)
// ══════════════════════════════════════════════════════════════════
export interface ListCustomersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers(params: ListCustomersParams = {}) {
  const { search, page = 1, pageSize = 20 } = params;

  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
  };
}

// ══════════════════════════════════════════════════════════════════
// GET CUSTOMER BY ID (with optional relations)
// ══════════════════════════════════════════════════════════════════
export async function getCustomerById(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        where: { deletedAt: null },
        orderBy: { saleDate: 'desc' },
      },
      payments: {
        where: { deletedAt: null },
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  if (!customer || customer.deletedAt) {
    return null;
  }
  return customer;
}

// ══════════════════════════════════════════════════════════════════
// SOFT DELETE CUSTOMER
// ══════════════════════════════════════════════════════════════════
export async function softDeleteCustomer(
  customerId: string,
  userId: string
): Promise<ActionResult> {
  try {
    const existing = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!existing || existing.deletedAt) {
      return { success: false, error: 'Customer not found.' };
    }
    if (existing.currentBalance > 0) {
      return {
        success: false,
        error:
          'Cannot delete customer with an outstanding balance. Please settle the balance first.',
      };
    }
    await prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: { deletedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entity: 'CUSTOMER',
          entityId: customerId,
          details: JSON.stringify({ deletedAt: new Date().toISOString() }),
        },
      });
    });

    revalidatePath('/customers');
    return {
      success: true,
      data: undefined,
      message: 'Customer deleted successfully.',
    };
  } catch (error) {
    console.error('softDeleteCustomer failed:', error);
    return { success: false, error: 'Failed to delete customer.' };
  }
}
