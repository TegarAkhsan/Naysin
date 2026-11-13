import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateStockSummary } from "@/features/inventory/alert-service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await calculateStockSummary(prisma, 3);
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Stock summary calculation error:", error);
    return NextResponse.json(
      { error: "Gagal menghitung ringkasan stok" },
      { status: 500 }
    );
  }
}

