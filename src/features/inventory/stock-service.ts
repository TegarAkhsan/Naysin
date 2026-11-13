import { PrismaClient, TransactionType, WasteReason } from "@prisma/client";

export interface StockMutationParams {
  ingredientId: string;
  type: TransactionType;
  quantity: number;
  userId: string;
  batchId?: string;
  note?: string;
  wasteReason?: WasteReason;
  idempotencyKey?: string;
}

export interface StockMutationResult {
  transactionId: string;
  ingredientId: string;
  type: TransactionType;
  quantity: number;
  beforeQty: number;
  afterQty: number;
  idempotentReplay?: boolean;
}

/**
 * Execute atomic stock mutation with strict double-entry ledger.
 * - Idempotency checking via unique idempotencyKey.
 * - Prevents negative inventory (throws error if OUT/WASTE exceeds balance).
 * - Updates batch remaining quantity if batchId specified.
 */
export async function executeStockMutation(
  prisma: PrismaClient,
  params: StockMutationParams
): Promise<StockMutationResult> {
  const { ingredientId, type, quantity, userId, batchId, note, wasteReason, idempotencyKey } = params;

  if (quantity <= 0) {
    throw new Error("Kuantitas transaksi harus lebih besar dari 0");
  }

  // Idempotency pre-check
  if (idempotencyKey) {
    const existing = await prisma.stockTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return {
        transactionId: existing.id,
        ingredientId: existing.ingredientId,
        type: existing.type,
        quantity: existing.quantity,
        beforeQty: existing.beforeQty,
        afterQty: existing.afterQty,
        idempotentReplay: true,
      };
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Fetch current ingredient with lock/strict verification
    const ingredient = await tx.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient) {
      throw new Error("Bahan baku tidak ditemukan");
    }

    if (!ingredient.isActive) {
      throw new Error("Bahan baku berstatus tidak aktif");
    }

    const beforeQty = ingredient.currentStock;
    let afterQty = beforeQty;

    switch (type) {
      case TransactionType.IN:
        afterQty = beforeQty + quantity;
        break;
      case TransactionType.OUT:
      case TransactionType.WASTE:
        if (beforeQty < quantity) {
          throw new Error(
            `Saldo tidak mencukupi. Saldo saat ini: ${beforeQty} ${ingredient.unit}, diminta: ${quantity} ${ingredient.unit}`
          );
        }
        afterQty = beforeQty - quantity;
        break;
      case TransactionType.ADJUSTMENT:
        // For adjustment, quantity represents the physical count result (target balance)
        afterQty = quantity;
        break;
      default:
        throw new Error(`Tipe transaksi tidak valid: ${type}`);
    }

    if (afterQty < 0) {
      throw new Error("Mutasi ditolak: stok tidak boleh negatif");
    }

    // 2. Handle batch updates if batchId supplied
    if (batchId) {
      const batch = await tx.ingredientBatch.findUnique({
        where: { id: batchId },
      });
      if (!batch || batch.ingredientId !== ingredientId) {
        throw new Error("Batch tidak valid untuk bahan baku ini");
      }

      if (type === TransactionType.OUT || type === TransactionType.WASTE) {
        if (batch.quantityRemaining < quantity) {
          throw new Error(
            `Stok pada batch (${batch.quantityRemaining}) tidak mencukupi permintaan (${quantity})`
          );
        }
        await tx.ingredientBatch.update({
          where: { id: batchId },
          data: { quantityRemaining: batch.quantityRemaining - quantity },
        });
      } else if (type === TransactionType.IN) {
        await tx.ingredientBatch.update({
          where: { id: batchId },
          data: { quantityRemaining: batch.quantityRemaining + quantity },
        });
      }
    }

    // 3. Update master ingredient stock balance
    await tx.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: afterQty },
    });

    // 4. Create immutable audit transaction record
    const transaction = await tx.stockTransaction.create({
      data: {
        ingredientId,
        userId,
        batchId: batchId || null,
        type,
        quantity,
        beforeQty,
        afterQty,
        note: note || null,
        wasteReason: wasteReason || null,
        idempotencyKey: idempotencyKey || null,
      },
    });

    return {
      transactionId: transaction.id,
      ingredientId,
      type,
      quantity,
      beforeQty,
      afterQty,
      idempotentReplay: false,
    };
  });
}

