import type { GlobalSettingsData } from '@/types';
import { MaterialType, PaymentStatus } from '@prisma/client';
import Decimal from 'decimal.js';

// Configure Decimal.js for high precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ---------------------------------------------------------------
// Helper: Convert a plain value to Decimal, multiply, return number
// ---------------------------------------------------------------
// lib/erp-logic.ts
function dec(value: any): Decimal {
  if (value === undefined || value === null || value === '') return new Decimal(0);
  const num = Number(value);
  if (isNaN(num)) return new Decimal(0);
  return new Decimal(num);
}

/**
 * Round a Decimal to a specific number of decimal places,
 * then convert to number for easier use in React components.
 */
function toNum(d: Decimal, dp = 2): number {
  return d.toDecimalPlaces(dp, Decimal.ROUND_HALF_UP).toNumber();
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — UNIT CONVERSION
// Storage layer always uses BASE units.
// Display and purchase layers use PURCHASE units.
//
//   CEMENT : purchase = bag (အိတ်)    | base = kg
//   SAND   : purchase = ကျင်း (unit)  | base = ပုံး (bucket)
//   DIESEL : purchase = gallon        | base = liter
//   BRICK  : purchase = piece         | base = piece  (1:1)
// ═══════════════════════════════════════════════════════════════

/**
 * Convert a BASE-unit amount → PURCHASE-unit amount.
 * Used for Inventory display (show bags, not kg).
 *
 * @example toPurchaseUnit(500, "CEMENT", settings) → 10  (bags)
 */
export function toPurchaseUnit(
  baseAmount: number,
  materialType: MaterialType,
  settings: Pick<
    GlobalSettingsData,
    'cementConversionFactor' | 'sandConversionFactor' | 'dieselConversionFactor'
  >
): number {
  const factor = conversionFactorFor(materialType, settings);
  if (factor === 0) return 0;
  return baseAmount / factor;
}

/**
 * Convert a PURCHASE-unit amount → BASE-unit amount.
 * Used when recording purchases or adjustments entered in purchase units.
 *
 * @example toBaseUnit(10, "CEMENT", settings) → 500  (kg)
 */
export function toBaseUnit(
  purchaseAmount: number,
  materialType: MaterialType,
  settings: Pick<
    GlobalSettingsData,
    'cementConversionFactor' | 'sandConversionFactor' | 'dieselConversionFactor'
  >
): number {
  return purchaseAmount * conversionFactorFor(materialType, settings);
}

/**
 * Generic conversion — accepts an explicit factor.
 * Used by Inventory rows where the factor comes from Inventory.conversionFactor.
 */
export function toPurchaseUnitByFactor(
  baseAmount: number,
  conversionFactor: number
): number {
  if (conversionFactor === 0) return 0;
  return baseAmount / conversionFactor;
}

export function toBaseUnitByFactor(
  purchaseAmount: number,
  conversionFactor: number
): number {
  return purchaseAmount * conversionFactor;
}

/** Internal helper — pick the right factor for a material from settings. */
function conversionFactorFor(
  materialType: MaterialType,
  settings: Pick<
    GlobalSettingsData,
    'cementConversionFactor' | 'sandConversionFactor' | 'dieselConversionFactor'
  >
): number {
  switch (materialType) {
    case MaterialType.CEMENT:
      return settings.cementConversionFactor;
    case MaterialType.SAND:
      return settings.sandConversionFactor;
    case MaterialType.DIESEL:
      return settings.dieselConversionFactor;
    case MaterialType.BRICK:
      return 1; // 1:1
  }
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — MATERIAL CONSUMPTION PER BRICK
// Ratios are stored in BASE units per brick.
// ═══════════════════════════════════════════════════════════════

export interface MaterialConsumption {
  cement: number; // kg
  sand: number; // buckets (ပုံး)
  diesel: number; // liters
}

/**
 * Calculate raw material consumption for a given brick count.
 * Returns amounts in BASE units (kg, buckets, liters).
 */
export function calcMaterialConsumption(brickCount, settings) {
  const n = dec(brickCount);
  return {
    cement: toNum(n.mul(dec(settings.cementRatio)), 6),
    sand:   toNum(n.mul(dec(settings.sandRatio)), 6),
    diesel: toNum(n.mul(dec(settings.dieselRatio)), 6),
  };
}

/**
 * Same as above but in PURCHASE units (bags, ကျင်း, gallons).
 * Useful for purchase planning and production preview UI.
 */
export function calcMaterialConsumptionInPurchaseUnits(
  brickCount: number,
  settings: GlobalSettingsData
): MaterialConsumption {
  const base = calcMaterialConsumption(brickCount, settings);
  return {
    cement: toPurchaseUnit(base.cement, MaterialType.CEMENT, settings),
    sand: toPurchaseUnit(base.sand, MaterialType.SAND, settings),
    diesel: toPurchaseUnit(base.diesel, MaterialType.DIESEL, settings),
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — COST CALCULATIONS
// All costs are in Kyat (ks). Base-unit costs are from settings.
// ═══════════════════════════════════════════════════════════════

export interface CostBreakdown {
  cementCost: number;
  sandCost: number;
  dieselCost: number;
  laborCost: number;
  totalCost: number;
}

/**
 * Estimated production cost per brick using settings ratios.
 * Used for live preview in SettingsForm and Dashboard KPIs.
 *
 * Formula:
 *   cement cost = cementRatio (kg) × cementUnitCost (ks/kg)
 *   sand cost   = sandRatio (ပုံး) × sandUnitCost (ks/ပုံး)
 *   diesel cost = dieselRatio (L)  × dieselUnitCost (ks/L)
 *   labor cost  = laborRate (ks/brick)
 */
export function calcCostPerBrick(
  settings: Pick<
    GlobalSettingsData,
    'cementRatio' | 'sandRatio' | 'dieselRatio'
    | 'cementUnitCost' | 'sandUnitCost' | 'dieselUnitCost'
    | 'laborRate'
  >
): CostBreakdown {
  const cementCost = dec(settings.cementRatio).mul(dec(settings.cementUnitCost));
  const sandCost   = dec(settings.sandRatio).mul(dec(settings.sandUnitCost));
  const dieselCost = dec(settings.dieselRatio).mul(dec(settings.dieselUnitCost));
  const laborCost  = dec(settings.laborRate);

  const totalCost = cementCost.plus(sandCost).plus(dieselCost).plus(laborCost);

  return {
    cementCost: toNum(cementCost),
    sandCost:   toNum(sandCost),
    dieselCost: toNum(dieselCost),
    laborCost:  toNum(laborCost),
    totalCost:  toNum(totalCost),
  };
}

/**
 * Actual production cost for a completed ProductionLog entry.
 * Uses snapshot costs (stored at time of production), not current settings.
 * Called in Step 3 (ProductionLog) server actions.
 */
export function calcActualProductionCost({
  cementUsed,
  sandUsed,
  dieselUsed,
  bricksProduced,
  cementCostAtTime,
  sandCostAtTime,
  dieselCostAtTime,
  laborRateAtTime,
}: {
  cementUsed: number;
  sandUsed: number;
  dieselUsed: number;
  bricksProduced: number;
  cementCostAtTime: number;
  sandCostAtTime: number;
  dieselCostAtTime: number;
  laborRateAtTime: number;
}): CostBreakdown {
  const cementCost = dec(cementUsed).mul(dec(cementCostAtTime));
  const sandCost   = dec(sandUsed).mul(dec(sandCostAtTime));
  const dieselCost = dec(dieselUsed).mul(dec(dieselCostAtTime));
  const laborCost  = dec(bricksProduced).mul(dec(laborRateAtTime));
  const totalCost = cementCost.plus(sandCost).plus(dieselCost).plus(laborCost);

  return {
    cementCost: toNum(cementCost),
    sandCost: toNum(sandCost),
    dieselCost: toNum(dieselCost),
    laborCost: toNum(laborCost),
    totalCost: toNum(totalCost),
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — PROFIT CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export interface ProfitBreakdown {
  revenuePerBrick: number;
  costPerBrick: number;
  grossProfit: number;
  maintenanceReserve: number;
  netProfit: number; // take-home after maintenance deduction
  marginPercent: number; // net profit / revenue × 100
}

/**
 * Full profit breakdown per brick using current settings.
 * The maintenance reserve is ring-fenced from net profit.
 */
export function calcProfitPerBrick(
  settings: Pick<
    GlobalSettingsData,
    | 'salesPricePerUnit'
    | 'maintenanceReservePerUnit'
    | 'cementRatio'
    | 'sandRatio'
    | 'dieselRatio'
    | 'cementUnitCost'
    | 'sandUnitCost'
    | 'dieselUnitCost'
    | 'laborRate'
  >
): ProfitBreakdown {
   const { totalCost } = calcCostPerBrick(settings);
  const revenue = dec(settings.salesPricePerUnit);
  const reserve = dec(settings.maintenanceReservePerUnit);
  const grossProfit = revenue.minus(totalCost);
  const netProfit = grossProfit.minus(reserve);
  const marginPercent = revenue.gt(0)
    ? netProfit.div(revenue).mul(100).toDP(1)
    : dec(0);

  return {
    revenuePerBrick: toNum(revenue),
    costPerBrick: totalCost,
    grossProfit: toNum(grossProfit),
    maintenanceReserve: toNum(reserve),
    netProfit: toNum(netProfit),
    marginPercent: marginPercent.toNumber(),
  };
}

/**
 * Profit for a given quantity of bricks sold.
 * Uses actual production cost (from ProductionLog) + sale price.
 */
export function calcSaleProfit({
  quantity,
  salePricePerUnit,
  actualCostPerBrick,
  maintenanceReservePerUnit,
}: {
  quantity: number;
  salePricePerUnit: number;
  actualCostPerBrick: number;
  maintenanceReservePerUnit: number;
}): {
  revenue: number;
  cost: number;
  maintenanceReserved: number;
  netProfit: number;
} {
  const qty = dec(quantity);
  const revenue = qty.mul(dec(salePricePerUnit));
  const cost = qty.mul(dec(actualCostPerBrick));
  const reserve = qty.mul(dec(maintenanceReservePerUnit));
  const net = revenue.minus(cost).minus(reserve);
  return {
    revenue: toNum(revenue),
    cost: toNum(cost),
    maintenanceReserved: toNum(reserve),
    netProfit: toNum(net),
  };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5 — INVENTORY HELPERS
// ═══════════════════════════════════════════════════════════════

export function isLowStock(quantity: number, minStockLevel: number): boolean {
  return quantity <= minStockLevel;
}

export function stockHealthPercent(
  quantity: number,
  minStockLevel: number
): number {
  if (minStockLevel === 0) return 100;
  return Math.min((quantity / (minStockLevel * 3)) * 100, 100);
}

export function stockHealthColor(percent: number): 'red' | 'amber' | 'green' {
  if (percent < 33) return 'red';
  if (percent < 66) return 'amber';
  return 'green';
}

/**
 * Check if there is enough base-unit stock to produce N bricks.
 * Used in Step 3 (ProductionLog) before committing a production entry.
 */
export function canProduce(
  brickCount: number,
  settings: Pick<
    GlobalSettingsData,
    'cementRatio' | 'sandRatio' | 'dieselRatio'
  >,
  stock: { cement: number; sand: number; diesel: number }
): { possible: boolean; shortfalls: string[] } {
  const needed = calcMaterialConsumption(brickCount, settings);
  const shortfalls: string[] = [];

  if (stock.cement < needed.cement)
    shortfalls.push(
      `Cement: need ${needed.cement.toFixed(2)} kg, have ${stock.cement.toFixed(
        2
      )} kg`
    );
  if (stock.sand < needed.sand)
    shortfalls.push(
      `Sand: need ${needed.sand.toFixed(2)} ပုံး, have ${stock.sand.toFixed(
        2
      )} ပုံး`
    );
  if (stock.diesel < needed.diesel)
    shortfalls.push(
      `Diesel: need ${needed.diesel.toFixed(2)} L, have ${stock.diesel.toFixed(
        2
      )} L`
    );

  return { possible: shortfalls.length === 0, shortfalls };
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6 — FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════

export function formatKs(amount: number, decimals = 0): string {
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ks`;
}

export function formatQty(
  quantity: number,
  unit: string,
  decimals = 2
): string {
  return `${quantity.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  })} ${unit}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 7 — PRODUCTION LOG CALCULATIONS
// (was "SECTION 5" in original file, renumbered for clarity)
// ═══════════════════════════════════════════════════════════════

export interface ProductionSuggestion {
  cementKg: number; // base: kg
  sandBuckets: number; // base: ပုံး (buckets)
  dieselLiters: number; // base: liters
}

/**
 * Auto-suggest material amounts for a given brick count.
 * Uses the production ratios stored in GlobalSettings.
 * These are the "AI suggestions" shown in the form.
 */
export function suggestMaterials(
  brickCount: number,
  settings: Pick<
    GlobalSettingsData,
    'cementRatio' | 'sandRatio' | 'dieselRatio'
  >
): ProductionSuggestion {
  return {
    cementKg: round4(brickCount * settings.cementRatio),
    sandBuckets: round4(brickCount * settings.sandRatio),
    dieselLiters: round4(brickCount * settings.dieselRatio),
  };
}

/**
 * Full cost + profit breakdown for a production batch.
 * Uses ACTUAL material amounts entered (may differ from suggestions).
 * Costs are snapshot values passed from settings at save time.
 */

export interface BatchResult {
  bricksProduced: number;
  netYield: number;
  wastageCount: number;
  wastagePercent: number;
  cementCost: number;
  sandCost: number;
  dieselCost: number;
  laborCost: number;
  totalCost: number;
  costPerBrick: number;
  estimatedRevenue: number;
  estimatedProfit: number;
  maintenanceReserved: number;
  netProfit: number;
  marginPercent: number;
}

export function calcBatchResult({
  bricksProduced,
  wastageCount,
  cementUsed,
  sandUsed,
  dieselUsed,
  cementCostAtTime,
  sandCostAtTime,
  dieselCostAtTime,
  laborRateAtTime,
  salesPriceAtTime,
  maintenanceReserveAtTime,
}: {
  bricksProduced: number;
  wastageCount: number;
  cementUsed: number;
  sandUsed: number;
  dieselUsed: number;
  cementCostAtTime: number;
  sandCostAtTime: number;
  dieselCostAtTime: number;
  laborRateAtTime: number;
  salesPriceAtTime: number;
  maintenanceReserveAtTime: number;
}): BatchResult {
  const netYield = bricksProduced - wastageCount;
  const wastagePercent = bricksProduced
    ? (wastageCount / bricksProduced) * 100
    : 0;

  const cementCost = dec(cementUsed).mul(dec(cementCostAtTime));
const sandCost   = dec(sandUsed).mul(dec(sandCostAtTime));
const dieselCost = dec(dieselUsed).mul(dec(dieselCostAtTime));
const laborCost  = dec(bricksProduced).mul(dec(laborRateAtTime));
const totalCost  = cementCost.plus(sandCost).plus(dieselCost).plus(laborCost);
const costPerBrick = netYield ? toNum(totalCost.div(dec(netYield)), 6) : 0;

const revenue = dec(netYield).mul(dec(salesPriceAtTime));
const grossProfit = revenue.minus(totalCost);
const reserve = dec(netYield).mul(dec(maintenanceReserveAtTime));
const netProfit = grossProfit.minus(reserve);
const marginPercent = revenue.gt(0) ? netProfit.div(revenue).mul(100).toDP(1) : dec(0);

  return {
    bricksProduced,
    netYield,
    wastageCount,
    wastagePercent,
    cementCost: toNum(cementCost),
    sandCost: toNum(sandCost),
    dieselCost: toNum(dieselCost),
    laborCost: toNum(laborCost),
    totalCost: toNum(totalCost),
    costPerBrick,
    estimatedRevenue: toNum(revenue),
    estimatedProfit: toNum(grossProfit),
    maintenanceReserved: toNum(reserve),
    netProfit: toNum(netProfit),
    marginPercent: marginPercent.toNumber(),
  };
}

/**
 * Aggregate daily production for the chart.
 * Input: raw ProductionLog rows. Output: array sorted by date.
 */
export interface DailyProductionPoint {
  date: string; // "DD MMM" e.g. "01 Jun"
  bricks: number;
  netYield: number;
  wastage: number;
  totalCost: number;
  estimatedProfit: number;
}

export function aggregateDailyProduction(
  logs: {
    productionDate: Date;
    bricksProduced: number;
    netYield: number;
    wastageCount: number;
    totalCost: number | string;
  }[]
): DailyProductionPoint[] {
  const map = new Map<string, DailyProductionPoint>();

  for (const log of logs) {
    const dateKey = new Date(log.productionDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });

    const existing = map.get(dateKey);
    const cost = Number(log.totalCost);

    if (existing) {
      existing.bricks += log.bricksProduced;
      existing.netYield += log.netYield;
      existing.wastage += log.wastageCount;
      existing.totalCost += cost;
    } else {
      map.set(dateKey, {
        date: dateKey,
        bricks: log.bricksProduced,
        netYield: log.netYield,
        wastage: log.wastageCount,
        totalCost: cost,
        estimatedProfit: 0, // filled below
      });
    }
  }

  return Array.from(map.values());
}

// ── Internal helper ──────────────────────────────────────────────
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 8 — SALES & CUSTOMER LOGIC (NEW)
// ═══════════════════════════════════════════════════════════════

/**
 * Check whether the requested quantity can be sold given the current brick stock.
 */
export function canSell(
  quantity: number,
  brickStock: number
): { possible: boolean; message: string } {
  if (quantity <= 0) {
    return { possible: false, message: 'Quantity must be greater than zero.' };
  }
  if (quantity > brickStock) {
    const available = brickStock.toLocaleString('en-US');
    const needed = quantity.toLocaleString('en-US');
    return {
      possible: false,
      message: `Insufficient stock. Available: ${available} pcs, needed: ${needed} pcs.`,
    };
  }
  return { possible: true, message: '' };
}

/**
 * Compute sale amounts based on payment status.
 * - CASH   → amountPaid = totalAmount, balanceDue = 0
 * - CREDIT → amountPaid = 0, balanceDue = totalAmount
 * - PARTIAL → amountPaid as provided (must be < totalAmount), balanceDue = remainder
 */
export interface SaleAmounts {
  totalAmount: number;
  balanceDue: number;
  effectiveAmountPaid: number;
}

export function computeSaleAmounts({
  quantity,
  salesPricePerUnit,
  paymentStatus,
  amountPaid,
}: {
  quantity: number;
  salesPricePerUnit: number;
  paymentStatus: PaymentStatus;
  amountPaid?: number;
}): SaleAmounts {
  const totalAmount = quantity * salesPricePerUnit;

  switch (paymentStatus) {
    case PaymentStatus.CASH:
      return { totalAmount, balanceDue: 0, effectiveAmountPaid: totalAmount };

    case PaymentStatus.CREDIT:
      return { totalAmount, balanceDue: totalAmount, effectiveAmountPaid: 0 };

    case PaymentStatus.PARTIAL: {
      const effective = Math.min(amountPaid ?? 0, totalAmount); // safety cap
      return {
        totalAmount,
        balanceDue: totalAmount - effective,
        effectiveAmountPaid: effective,
      };
    }

    default:
      throw new Error(`Unknown payment status: ${paymentStatus}`);
  }
}

/**
 * Delta to add to Customer.currentBalance after a sale.
 * Positive means the customer owes more; negative means overpayment (unlikely).
 */
export function getCustomerBalanceDelta(
  totalAmount: number,
  amountPaid: number
): number {
  return totalAmount - amountPaid;
}

/**
 * Aggregate sales data daily for the sales trend chart.
 * Works just like aggregateDailyProduction but for Sale entries.
 */
export interface DailySalesPoint {
  date: string; // "DD MMM"
  quantity: number;
  revenue: number;
}

export function aggregateSalesDaily(
  sales: {
    saleDate: Date;
    quantity: number;
    totalAmount: number | string;
  }[]
): DailySalesPoint[] {
  const map = new Map<string, DailySalesPoint>();

  for (const sale of sales) {
    const dateKey = new Date(sale.saleDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });

    const amount = Number(sale.totalAmount);
    const existing = map.get(dateKey);

    if (existing) {
      existing.quantity += sale.quantity;
      existing.revenue += amount;
    } else {
      map.set(dateKey, {
        date: dateKey,
        quantity: sale.quantity,
        revenue: amount,
      });
    }
  }

  return Array.from(map.values());
}
