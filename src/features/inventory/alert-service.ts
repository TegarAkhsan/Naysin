import { PrismaClient } from "@prisma/client";

export interface StockSummaryAlerts {
  totalIngredients: number;
  lowStockCount: number;
  expiringBatchesCount: number;
  expiredBatchesCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    currentStock: number;
    minimumStock: number;
    unit: string;
  }>;
  expiringBatches: Array<{
    id: string;
    ingredientName: string;
    lotCode: string | null;
    quantityRemaining: number;
    unit: string;
    expiresAt: Date;
    isExpired: boolean;
  }>;
}

/**
 * Request-time deterministic calculation for stock alerts and summary.
 * Complies with Netlify Serverless stateless constraints (no daemon/cron required).
 */
export async function calculateStockSummary(
  prisma: PrismaClient,
  thresholdDays: number = 3
): Promise<StockSummaryAlerts> {
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(now.getDate() + thresholdDays);

  const [ingredients, batches] = await Promise.all([
    prisma.ingredient.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minimumStock: true,
        unit: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.ingredientBatch.findMany({
      where: {
        quantityRemaining: { gt: 0 },
        expiresAt: { not: null, lte: thresholdDate },
      },
      include: {
        ingredient: {
          select: { name: true, unit: true },
        },
      },
      orderBy: { expiresAt: "asc" },
    }),
  ]);

  const lowStockItems = ingredients.filter(
    (item) => item.currentStock <= item.minimumStock
  );

  let expiredBatchesCount = 0;
  let expiringBatchesCount = 0;

  const expiringBatches = batches.map((b) => {
    const isExpired = b.expiresAt! < now;
    if (isExpired) {
      expiredBatchesCount++;
    } else {
      expiringBatchesCount++;
    }
    return {
      id: b.id,
      ingredientName: b.ingredient.name,
      lotCode: b.lotCode,
      quantityRemaining: b.quantityRemaining,
      unit: b.ingredient.unit,
      expiresAt: b.expiresAt!,
      isExpired,
    };
  });

  return {
    totalIngredients: ingredients.length,
    lowStockCount: lowStockItems.length,
    expiringBatchesCount,
    expiredBatchesCount,
    lowStockItems,
    expiringBatches,
  };
}

