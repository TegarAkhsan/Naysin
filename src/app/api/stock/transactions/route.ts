import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { executeStockMutation } from "@/features/inventory/stock-service";
import { TransactionType, WasteReason } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ingredientId = searchParams.get("ingredientId");
  const type = searchParams.get("type") as TransactionType | null;

  const where: any = {};
  if (ingredientId) where.ingredientId = ingredientId;
  if (type) where.type = type;

  const transactions = await prisma.stockTransaction.findMany({
    where,
    include: {
      ingredient: { select: { name: true, unit: true } },
      user: { select: { name: true, role: true } },
      batch: { select: { lotCode: true, expiresAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ transactions });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      ingredientId,
      type,
      quantity,
      batchId,
      note,
      wasteReason,
      idempotencyKey,
    } = body;

    if (!ingredientId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: "ingredientId, type, dan quantity wajib diisi" },
        { status: 400 }
      );
    }

    const result = await executeStockMutation(prisma, {
      ingredientId,
      type: type as TransactionType,
      quantity: Number(quantity),
      userId: user.userId,
      batchId: batchId || undefined,
      note: note || undefined,
      wasteReason: wasteReason as WasteReason | undefined,
      idempotencyKey: idempotencyKey || undefined,
    });

    return NextResponse.json({ result }, { status: result.idempotentReplay ? 200 : 201 });
  } catch (error: any) {
    console.error("Stock mutation error:", error.message);
    const isConflict = error.message.includes("Saldo tidak mencukupi") || error.message.includes("stok tidak boleh negatif");
    return NextResponse.json(
      { error: error.message || "Gagal memproses mutasi stok" },
      { status: isConflict ? 409 : 400 }
    );
  }
}

