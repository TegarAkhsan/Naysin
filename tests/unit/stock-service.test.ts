import { describe, it, expect, vi } from "vitest";
import { executeStockMutation } from "@/features/inventory/stock-service";
import { TransactionType, WasteReason } from "@prisma/client";

describe("executeStockMutation - Data Integrity & Concurrency Constraints", () => {
  it("successfully performs stock IN and increases balance", async () => {
    const mockIngredient = {
      id: "ing-1",
      name: "Biji Kopi House Blend",
      unit: "gram",
      currentStock: 1000,
      isActive: true,
    };

    const mockTx = {
      ingredient: {
        findUnique: vi.fn().mockResolvedValue(mockIngredient),
        update: vi.fn().mockResolvedValue({ ...mockIngredient, currentStock: 1500 }),
      },
      stockTransaction: {
        create: vi.fn().mockResolvedValue({
          id: "tx-1",
          ingredientId: "ing-1",
          type: TransactionType.IN,
          quantity: 500,
          beforeQty: 1000,
          afterQty: 1500,
        }),
      },
    };

    const mockPrisma = {
      stockTransaction: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => callback(mockTx)),
    } as any;

    const result = await executeStockMutation(mockPrisma, {
      ingredientId: "ing-1",
      type: TransactionType.IN,
      quantity: 500,
      userId: "user-1",
    });

    expect(result.beforeQty).toBe(1000);
    expect(result.afterQty).toBe(1500);
    expect(mockTx.ingredient.update).toHaveBeenCalledWith({
      where: { id: "ing-1" },
      data: { currentStock: 1500 },
    });
  });

  it("successfully performs stock OUT and decreases balance", async () => {
    const mockIngredient = {
      id: "ing-1",
      name: "Susu Segar",
      unit: "ml",
      currentStock: 1000,
      isActive: true,
    };

    const mockTx = {
      ingredient: {
        findUnique: vi.fn().mockResolvedValue(mockIngredient),
        update: vi.fn().mockResolvedValue({ ...mockIngredient, currentStock: 800 }),
      },
      stockTransaction: {
        create: vi.fn().mockResolvedValue({
          id: "tx-2",
          ingredientId: "ing-1",
          type: TransactionType.OUT,
          quantity: 200,
          beforeQty: 1000,
          afterQty: 800,
        }),
      },
    };

    const mockPrisma = {
      stockTransaction: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => callback(mockTx)),
    } as any;

    const result = await executeStockMutation(mockPrisma, {
      ingredientId: "ing-1",
      type: TransactionType.OUT,
      quantity: 200,
      userId: "user-1",
    });

    expect(result.beforeQty).toBe(1000);
    expect(result.afterQty).toBe(800);
  });

  it("rejects stock OUT when requested quantity exceeds available balance (No Negative Stock)", async () => {
    const mockIngredient = {
      id: "ing-1",
      name: "Sirup Karamel",
      unit: "ml",
      currentStock: 150,
      isActive: true,
    };

    const mockTx = {
      ingredient: {
        findUnique: vi.fn().mockResolvedValue(mockIngredient),
      },
    };

    const mockPrisma = {
      stockTransaction: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => callback(mockTx)),
    } as any;

    await expect(
      executeStockMutation(mockPrisma, {
        ingredientId: "ing-1",
        type: TransactionType.OUT,
        quantity: 200,
        userId: "user-1",
      })
    ).rejects.toThrow(/Saldo tidak mencukupi/);
  });

  it("safely handles idempotency keys and returns existing transaction without double deduction", async () => {
    const existingTx = {
      id: "tx-idempotent-1",
      ingredientId: "ing-1",
      type: TransactionType.OUT,
      quantity: 100,
      beforeQty: 500,
      afterQty: 400,
    };

    const mockPrisma = {
      stockTransaction: {
        findUnique: vi.fn().mockResolvedValue(existingTx),
      },
      $transaction: vi.fn(),
    } as any;

    const result = await executeStockMutation(mockPrisma, {
      ingredientId: "ing-1",
      type: TransactionType.OUT,
      quantity: 100,
      userId: "user-1",
      idempotencyKey: "unique-mobile-uuid-1234",
    });

    expect(result.idempotentReplay).toBe(true);
    expect(result.transactionId).toBe("tx-idempotent-1");
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("correctly records WASTE with reason and decreases inventory", async () => {
    const mockIngredient = {
      id: "ing-milk",
      name: "Susu Basi",
      unit: "ml",
      currentStock: 300,
      isActive: true,
    };

    const mockTx = {
      ingredient: {
        findUnique: vi.fn().mockResolvedValue(mockIngredient),
        update: vi.fn().mockResolvedValue({ ...mockIngredient, currentStock: 0 }),
      },
      stockTransaction: {
        create: vi.fn().mockResolvedValue({
          id: "tx-waste-1",
          ingredientId: "ing-milk",
          type: TransactionType.WASTE,
          quantity: 300,
          beforeQty: 300,
          afterQty: 0,
          wasteReason: WasteReason.SPOILED,
        }),
      },
    };

    const mockPrisma = {
      stockTransaction: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => callback(mockTx)),
    } as any;

    const result = await executeStockMutation(mockPrisma, {
      ingredientId: "ing-milk",
      type: TransactionType.WASTE,
      quantity: 300,
      userId: "user-staff",
      wasteReason: WasteReason.SPOILED,
      note: "Susu basi setelah disimpan di suhu ruangan semalaman",
    });

    expect(result.afterQty).toBe(0);
    expect(mockTx.stockTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: TransactionType.WASTE,
          wasteReason: WasteReason.SPOILED,
        }),
      })
    );
  });
});

