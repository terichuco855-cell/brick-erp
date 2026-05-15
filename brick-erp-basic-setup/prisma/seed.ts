// prisma/seed.ts
import { PrismaClient, Role, MaterialType, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Create a plain PrismaClient – no driver adapter needed
const prisma = new PrismaClient();
async function main() {
  // 1. Clean existing data
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.paymentReceipt.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.productionLog.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.supplier.deleteMany(),
    prisma.inventoryAdjustment.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.globalSettings.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // 2. Users
  const admin = await prisma.user.create({
    data: {
      id: 'user_admin_01',
      name: 'Admin Aung',
      email: 'admin@brickfactory.com',
      password: 'admin123',
      role: Role.ADMIN,
    },
  });
  const worker = await prisma.user.create({
    data: {
      id: 'user_worker_01',
      name: 'Worker Myo',
      email: 'myo@brickfactory.com',
      password: 'worker123',
      role: Role.WORKER,
    },
  });

  // 3. Global Settings
  await prisma.globalSettings.create({
    data: {
      id: 'current',
      salesPricePerUnit: new Decimal(150),
      maintenanceReservePerUnit: new Decimal(5),
      laborRate: new Decimal(20),
      cementUnitCost: new Decimal(2.5),
      sandUnitCost: new Decimal(0.8),
      dieselUnitCost: new Decimal(1.2),
      cementConversionFactor: new Decimal(50),
      sandConversionFactor: new Decimal(100),
      dieselConversionFactor: new Decimal(3.785),
      cementRatio: new Decimal(0.02),
      sandRatio: new Decimal(0.001),
      dieselRatio: new Decimal(0.005),
      updatedById: admin.id,
    },
  });

  // 4. Inventory
  await prisma.inventory.createMany({
    data: [
      {
        materialType: MaterialType.CEMENT,
        quantity: new Decimal(500),
        baseUnit: 'kg',
        purchaseUnit: 'bag',
        conversionFactor: new Decimal(50),
        minStockLevel: new Decimal(100),
      },
      {
        materialType: MaterialType.SAND,
        quantity: new Decimal(2000),
        baseUnit: 'bucket',
        purchaseUnit: 'ကျင်း',
        conversionFactor: new Decimal(100),
        minStockLevel: new Decimal(500),
      },
      {
        materialType: MaterialType.DIESEL,
        quantity: new Decimal(200),
        baseUnit: 'litre',
        purchaseUnit: 'gallon',
        conversionFactor: new Decimal(3.785),
        minStockLevel: new Decimal(50),
      },
      {
        materialType: MaterialType.BRICK,
        quantity: new Decimal(10000),
        baseUnit: 'piece',
        purchaseUnit: 'piece',
        conversionFactor: new Decimal(1),
        minStockLevel: new Decimal(1000),
      },
    ],
  });

  // 5. Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Shwe Cement Supply',
      phone: '09123456789',
      address: 'Mandalay',
    },
  });
  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Sand & Stone Depot',
      phone: '09876543210',
      address: 'Yangon',
    },
  });

  // 6. Purchase Orders
  await prisma.purchaseOrder.createMany({
    data: [
      {
        supplierId: supplier1.id,
        materialType: MaterialType.CEMENT,
        orderQuantity: new Decimal(10),
        unitPrice: new Decimal(125),
        totalAmount: new Decimal(1250),
        receivedById: admin.id,
        purchaseDate: new Date('2025-05-01'),
      },
      {
        supplierId: supplier2.id,
        materialType: MaterialType.SAND,
        orderQuantity: new Decimal(3),
        unitPrice: new Decimal(800),
        totalAmount: new Decimal(2400),
        receivedById: admin.id,
        purchaseDate: new Date('2025-05-02'),
      },
      {
        supplierId: supplier1.id,
        materialType: MaterialType.DIESEL,
        orderQuantity: new Decimal(20),
        unitPrice: new Decimal(4.5),
        totalAmount: new Decimal(90),
        receivedById: worker.id,
        purchaseDate: new Date('2025-05-03'),
      },
    ],
  });

  // 7. Production Logs
  await prisma.productionLog.createMany({
    data: [
      {
        workerId: worker.id,
        bricksProduced: 1000,
        wastageCount: 50,
        netYield: 950,
        cementUsed: new Decimal(1000 * 0.02),
        sandUsed: new Decimal(1000 * 0.001),
        dieselUsed: new Decimal(1000 * 0.005),
        laborRateAtTime: new Decimal(20),
        cementCostAtTime: new Decimal(2.5),
        sandCostAtTime: new Decimal(0.8),
        dieselCostAtTime: new Decimal(1.2),
        totalCost: new Decimal((1000 * 0.02 * 2.5) + (1000 * 0.001 * 0.8) + (1000 * 0.005 * 1.2) + (1000 * 20)),
        productionDate: new Date('2025-05-04'),
      },
      {
        workerId: worker.id,
        bricksProduced: 800,
        wastageCount: 20,
        netYield: 780,
        cementUsed: new Decimal(800 * 0.02),
        sandUsed: new Decimal(800 * 0.001),
        dieselUsed: new Decimal(800 * 0.005),
        laborRateAtTime: new Decimal(20),
        cementCostAtTime: new Decimal(2.5),
        sandCostAtTime: new Decimal(0.8),
        dieselCostAtTime: new Decimal(1.2),
        totalCost: new Decimal((800 * 0.02 * 2.5) + (800 * 0.001 * 0.8) + (800 * 0.005 * 1.2) + (800 * 20)),
        productionDate: new Date('2025-05-05'),
      },
    ],
  });

  // 8. Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'U Kyaw Construction',
      phone: '09111122233',
      address: 'Monywa',
    },
  });
  const customer2 = await prisma.customer.create({
    data: {
      name: 'Daw Hla Retail',
      phone: '09444555666',
      address: 'Sagaing',
      currentBalance: new Decimal(5000),
    },
  });

  // 9. Sales
  const sale1 = await prisma.sale.create({
    data: {
      customerId: customer1.id,
      quantity: 500,
      salesPriceAtTime: new Decimal(150),
      totalAmount: new Decimal(500 * 150),
      amountPaid: new Decimal(500 * 150),
      balanceDue: new Decimal(0),
      paymentStatus: PaymentStatus.CASH,
      saleDate: new Date('2025-05-06'),
      createdById: admin.id,
    },
  });
  const sale2 = await prisma.sale.create({
    data: {
      customerId: customer2.id,
      quantity: 200,
      salesPriceAtTime: new Decimal(150),
      totalAmount: new Decimal(200 * 150),
      amountPaid: new Decimal(10_000),
      balanceDue: new Decimal(20_000),
      paymentStatus: PaymentStatus.PARTIAL,
      saleDate: new Date('2025-05-07'),
      createdById: admin.id,
    },
  });
  const sale3 = await prisma.sale.create({
    data: {
      customerId: customer2.id,
      quantity: 100,
      salesPriceAtTime: new Decimal(150),
      totalAmount: new Decimal(15_000),
      amountPaid: new Decimal(0),
      balanceDue: new Decimal(15_000),
      paymentStatus: PaymentStatus.CREDIT,
      saleDate: new Date('2025-05-08'),
      createdById: worker.id,
    },
  });

  // 10. Payment Receipts
  await prisma.paymentReceipt.createMany({
    data: [
      {
        customerId: customer2.id,
        saleId: sale2.id,
        amountPaid: new Decimal(10_000),
        paymentDate: new Date('2025-05-07'),
        note: 'Partial payment for Sale #2',
      },
      {
        customerId: customer2.id,
        amountPaid: new Decimal(5_000),
        paymentDate: new Date('2025-05-01'),
        note: 'Settlement of old balance',
      },
    ],
  });

  // 11. Expenses
  await prisma.expense.createMany({
    data: [
      {
        category: 'Maintenance',
        amount: new Decimal(15_000),
        description: 'Monthly kiln repair',
        date: new Date('2025-05-02'),
      },
      {
        category: 'Transportation',
        amount: new Decimal(7_500),
        description: 'Truck diesel for delivery',
        date: new Date('2025-05-05'),
      },
    ],
  });

  // 12. Inventory Adjustments
  await prisma.inventoryAdjustment.create({
    data: {
      materialType: MaterialType.SAND,
      diffQuantity: new Decimal(-100),
      reason: 'Spillage during handling',
      updatedBy: { connect: { id: admin.id } },
    },
  });

  // 13. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'CREATE',
        entity: 'GlobalSettings',
        entityId: 'current',
        details: JSON.stringify({ initial: 'Setup' }),
      },
      {
        userId: admin.id,
        action: 'CREATE',
        entity: 'Inventory',
        details: JSON.stringify({ action: 'Initial stock loaded' }),
      },
    ],
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });