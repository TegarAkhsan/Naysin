import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== Role.OWNER) {
    return NextResponse.json(
      { error: "Akses ditolak: Hanya pemilik yang dapat mengubah master bahan baku" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const { name, minimumStock, isActive, notes } = await req.json();

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(minimumStock !== undefined ? { minimumStock: Number(minimumStock) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
      },
    });

    return NextResponse.json({ ingredient: updated });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui data bahan baku" },
      { status: 500 }
    );
  }
}

