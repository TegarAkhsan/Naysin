import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding NaysIn database with DEMO data...");

  // 1. Users (Owner & Staff)
  const passwordHash = await bcrypt.hash("naysin2026", 10);

  const owner = await prisma.user.upsert({
    where: { email: "owner@nayskopi.demo" },
    update: {},
    create: {
      name: "Tegar Owner [DEMO]",
      email: "owner@nayskopi.demo",
      passwordHash,
      role: Role.OWNER,
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@nayskopi.demo" },
    update: {},
    create: {
      name: "Barista Staf [DEMO]",
      email: "staff@nayskopi.demo",
      passwordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });

  console.log("Seeded Users:", { ownerId: owner.id, staffId: staff.id });

  // 2. Ingredients
  const coffeeBeans = await prisma.ingredient.upsert({
    where: { name: "Biji Kopi House Blend [DEMO]" },
    update: {},
    create: {
      name: "Biji Kopi House Blend [DEMO]",
      unit: "gram",
      currentStock: 2500,
      minimumStock: 1000,
      isActive: true,
      notes: "Racikan robusta-arabika standar espresso Nays Kopi",
    },
  });

  const freshMilk = await prisma.ingredient.upsert({
    where: { name: "Susu Segar Pasteurisasi [DEMO]" },
    update: {},
    create: {
      name: "Susu Segar Pasteurisasi [DEMO]",
      unit: "ml",
      currentStock: 4000,
      minimumStock: 2000,
      isActive: true,
      notes: "Penyimpanan chiller 4C",
    },
  });

  const palmSugar = await prisma.ingredient.upsert({
    where: { name: "Sirup Gula Aren Asli [DEMO]" },
    update: {},
    create: {
      name: "Sirup Gula Aren Asli [DEMO]",
      unit: "ml",
      currentStock: 600,
      minimumStock: 1000, // Trigger low-stock warning for testing
      isActive: true,
      notes: "Bahan pemanis utama Kopi Nays",
    },
  });

  // 3. Batches with expiry dates
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const expiringSoon = new Date();
  expiringSoon.setDate(expiringSoon.getDate() + 2); // Within 3-day threshold

  await prisma.ingredientBatch.create({
    data: {
      ingredientId: freshMilk.id,
      lotCode: "LOT-MILK-001",
      quantityRemaining: 2000,
      receivedAt: new Date(),
      expiresAt: expiringSoon,
    },
  });

  // 4. Menus & Aliases
  const kopiNays = await prisma.menu.upsert({
    where: { name: "Kopi Nays [DEMO]" },
    update: {},
    create: {
      name: "Kopi Nays [DEMO]",
      category: "Kopi",
      description: "Signature coffee Nays Kopi: perpaduan espresso mantap, susu segar gurih, dan sirup gula aren asli.",
      price: 18000,
      isAvailable: true,
      aliases: {
        create: [
          { alias: "kopi aren" },
          { alias: "es kopi aren" },
          { alias: "kopi gula aren" },
          { alias: "kopi signature" },
        ],
      },
    },
  });

  const matchaLatte = await prisma.menu.upsert({
    where: { name: "Matcha Latte [DEMO]" },
    update: {},
    create: {
      name: "Matcha Latte [DEMO]",
      category: "Non-Kopi",
      description: "Matcha bubuk murni kualitas prima diseduh dengan susu segar hangat atau dingin yang lembut.",
      price: 20000,
      isAvailable: true,
      aliases: {
        create: [{ alias: "matcha" }, { alias: "green tea" }],
      },
    },
  });

  console.log("Seeded Menus:", { kopiNaysId: kopiNays.id, matchaId: matchaLatte.id });

  // 5. Initial Setting
  await prisma.setting.upsert({
    where: { key: "EXPIRY_THRESHOLD_DAYS" },
    update: { value: "3" },
    create: { key: "EXPIRY_THRESHOLD_DAYS", value: "3" },
  });

  console.log("Database seeded successfully with labeled [DEMO] records.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

