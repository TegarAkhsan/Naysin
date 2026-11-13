import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.OWNER) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  const transactions = await prisma.stockTransaction.findMany({
    include: {
      ingredient: { select: { name: true, unit: true } },
      user: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  if (format === "csv") {
    // Generate CSV export directly in memory without disk writes
    const headers = ["ID", "Waktu", "Bahan", "Tipe", "Kuantitas", "Satuan", "Sebelum", "Sesudah", "Petugas", "Catatan"];
    const rows = transactions.map((t) => [
      t.id,
      t.createdAt.toISOString(),
      `"${t.ingredient.name.replace(/"/g, '""')}"`,
      t.type,
      t.quantity,
      t.ingredient.unit,
      t.beforeQty,
      t.afterQty,
      `"${t.user.name.replace(/"/g, '""')}"`,
      `"${(t.note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="naysin_stock_report_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ transactions });
}

