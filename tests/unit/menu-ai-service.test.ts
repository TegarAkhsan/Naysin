import { describe, it, expect, vi } from "vitest";
import { answerMenuQuery, FALLBACK_MESSAGE } from "@/features/assistant/menu-ai-service";

describe("answerMenuQuery - Grounded AI Assistant with Zero Hallucination", () => {
  const verifiedMenus = [
    {
      id: "menu-1",
      name: "Kopi Nays",
      category: "Kopi",
      description: "Kopi susu dengan racikan gula aren khas Nays Kopi.",
      price: 18000,
      isAvailable: true,
      aliases: [
        { id: "al-1", alias: "kopi aren" },
        { id: "al-2", alias: "es kopi nays" },
        { id: "al-3", alias: "kopi gula aren" },
      ],
      ingredients: [
        { ingredient: { name: "Espresso House Blend", unit: "ml" } },
        { ingredient: { name: "Susu Segar", unit: "ml" } },
        { ingredient: { name: "Sirup Gula Aren", unit: "ml" } },
      ],
    },
    {
      id: "menu-2",
      name: "Nays Matcha Latte",
      category: "Non-Kopi",
      description: "Matcha murni berpadu dengan steamed fresh milk gurih lembut.",
      price: null, // Price unverified
      isAvailable: true,
      aliases: [{ id: "al-4", alias: "matcha" }],
      ingredients: [],
    },
    {
      id: "menu-3",
      name: "Seasonal Cold Brew",
      category: "Kopi",
      description: "Cold brew terbatas.",
      price: 25000,
      isAvailable: false, // Inactive item
      aliases: [{ id: "al-5", alias: "cold brew" }],
      ingredients: [],
    },
  ];

  const mockPrisma = {
    menu: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        if (where?.isAvailable) {
          return Promise.resolve(verifiedMenus.filter((m) => m.isAvailable));
        }
        return Promise.resolve(verifiedMenus);
      }),
    },
  } as any;

  it("identifies informal alias 'kopi aren' and explains Kopi Nays accurately", async () => {
    const res = await answerMenuQuery(mockPrisma, "tolong jelaskan kopi aren rasanya gimana?");
    expect(res.status).toBe("SUCCESS");
    expect(res.isGrounded).toBe(true);
    expect(res.matchedMenuItems).toContain("Kopi Nays");
    expect(res.answer).toContain("Kopi Nays");
    expect(res.answer).toContain("gula aren khas Nays Kopi");
  });

  it("accurately returns verified price when available", async () => {
    const res = await answerMenuQuery(mockPrisma, "berapa harga kopi nays?");
    expect(res.status).toBe("SUCCESS");
    expect(res.answer).toContain("18.000");
  });

  it("does not hallucinate price when price is unverified/null in database", async () => {
    const res = await answerMenuQuery(mockPrisma, "berapa harga matcha latte?");
    expect(res.status).toBe("SUCCESS");
    expect(res.answer).toContain("harga resmi saat ini belum tercatat");
    expect(res.answer).toContain("konfirmasi ke barista/staf Nays Kopi");
    expect(res.answer).not.toMatch(/Rp\s*\d+/); // Must not invent numbers
  });

  it("never recommends inactive menu items", async () => {
    const res = await answerMenuQuery(mockPrisma, "apakah ada cold brew?");
    expect(res.matchedMenuItems).not.toContain("Seasonal Cold Brew");
    expect(res.status).toBe("FALLBACK");
    expect(res.answer).toBe(FALLBACK_MESSAGE);
  });

  it("returns safe fallback when querying unknown products (e.g. burger, pizza)", async () => {
    const res = await answerMenuQuery(mockPrisma, "apakah jual burger keju dan kentang goreng?");
    expect(res.status).toBe("FALLBACK");
    expect(res.isGrounded).toBe(false);
    expect(res.answer).toBe(FALLBACK_MESSAGE);
  });
});

