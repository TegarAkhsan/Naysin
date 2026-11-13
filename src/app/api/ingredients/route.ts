import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ingredients });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RBAC: Only OWNER can create master ingredients
  if (user.role !== Role.OWNER) {
    return NextResponse.json(
      { error: "Akses ditolak: Hanya pemilik yang dapat menambahkan master bahan baku" },
      { status: 403 }
    );
  }

  try {
    const { name, unit, minimumStock, notes } = await req.json();

    if (!name || !unit) {
      return NextResponse.json(
        { error: "Nama dan satuan bahan baku wajib diisi" },
        { status: 400 }
      );
    }

    const newIngredient = await prisma.ingredient.create({
      data: {
        name: name.trim(),
        unit: unit.trim().toLowerCase(),
        minimumStock: Number(minimumStock) || 0,
        notes: notes?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ ingredient: newIngredient }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Nama bahan baku sudah terdaftar" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Gagal menyimpan bahan baku" }, { status: 500 });
  }
}

