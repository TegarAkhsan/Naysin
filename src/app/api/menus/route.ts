import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  const menus = await prisma.menu.findMany({
    include: {
      aliases: true,
      ingredients: {
        include: {
          ingredient: { select: { name: true, unit: true } },
        },
      },
    },
    orderBy: { category: "asc" },
  });

  return NextResponse.json({ menus });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.OWNER) {
    return NextResponse.json(
      { error: "Akses ditolak: Hanya pemilik yang dapat menambahkan master menu" },
      { status: 403 }
    );
  }

  try {
    const { name, category, description, price, aliases } = await req.json();

    if (!name || !category || !description) {
      return NextResponse.json(
        { error: "Nama, kategori, dan deskripsi menu wajib diisi" },
        { status: 400 }
      );
    }

    const newMenu = await prisma.menu.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: price ? Number(price) : null,
        isAvailable: true,
        aliases: aliases && Array.isArray(aliases)
          ? {
              create: aliases
                .filter((a: string) => a.trim().length > 0)
                .map((a: string) => ({ alias: a.trim().toLowerCase() })),
            }
          : undefined,
      },
      include: { aliases: true },
    });

    return NextResponse.json({ menu: newMenu }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Nama menu sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan menu baru" }, { status: 500 });
  }
}

