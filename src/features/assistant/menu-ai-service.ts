import { PrismaClient } from "@prisma/client";

export interface AssistantResponse {
  answer: string;
  isGrounded: boolean;
  status: "SUCCESS" | "FALLBACK" | "ERROR";
  matchedMenuItems: string[];
}

export const FALLBACK_MESSAGE =
  "Maaf, informasi mengenai menu tersebut belum tersedia secara resmi di sistem kami. Silakan langsung tanyakan atau konfirmasi kepada barista/staf Nays Kopi kami.";

/**
 * Normalizes query string for token matching
 */
function normalizeQuery(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

/**
 * Grounded Menu Retrieval and Answering Logic.
 * Strictly adheres to verified active menus and aliases.
 * Never invents prices, recipes, allergens, or promotions.
 */
export async function answerMenuQuery(
  prisma: PrismaClient,
  query: string,
  _channel: "WEB" | "WHATSAPP" = "WEB"
): Promise<AssistantResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      answer: "Halo! Ada yang bisa kami bantu terkait menu Nays Kopi?",
      isGrounded: true,
      status: "SUCCESS",
      matchedMenuItems: [],
    };
  }

  const tokens = normalizeQuery(cleanQuery);
  const activeMenus = await prisma.menu.findMany({
    where: { isAvailable: true },
    include: {
      aliases: true,
      ingredients: {
        include: {
          ingredient: { select: { name: true, unit: true } },
        },
      },
    },
  });

  // Score menus based on exact alias match or token overlap
  const scoredMenus = activeMenus
    .map((menu) => {
      let score = 0;
      const lowerName = menu.name.toLowerCase();
      const lowerCategory = menu.category.toLowerCase();

      if (cleanQuery.toLowerCase().includes(lowerName)) {
        score += 15;
      }

      for (const alias of menu.aliases) {
        const lowerAlias = alias.alias.toLowerCase();
        if (cleanQuery.toLowerCase().includes(lowerAlias)) {
          score += 20; // Highest weight for verified informal alias
        }
      }

      for (const token of tokens) {
        if (lowerName.includes(token)) score += 3;
        if (lowerCategory.includes(token)) score += 2;
        if (menu.description.toLowerCase().includes(token)) score += 1;
      }

      return { menu, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredMenus.length === 0) {
    return {
      answer: FALLBACK_MESSAGE,
      isGrounded: false,
      status: "FALLBACK",
      matchedMenuItems: [],
    };
  }

  // Pick top matched item(s)
  const topMatch = scoredMenus[0].menu;
  const matchedNames = [topMatch.name];

  const asksPrice = /berapa|harga|biaya|tarif|rp|cost/i.test(cleanQuery);
  const asksIngredients = /komposisi|bahan|resep|terbuat|isi/i.test(cleanQuery);

  let responseText = "";

  if (asksPrice) {
    if (topMatch.price !== null && topMatch.price !== undefined) {
      responseText = `Harga resmi untuk ${topMatch.name} (${topMatch.category}) adalah Rp${topMatch.price.toLocaleString("id-ID")}. ${topMatch.description}`;
    } else {
      responseText = `Untuk ${topMatch.name}, harga resmi saat ini belum tercatat di sistem kami. Silakan langsung konfirmasi ke barista/staf Nays Kopi.`;
    }
  } else if (asksIngredients) {
    if (topMatch.ingredients && topMatch.ingredients.length > 0) {
      const ingList = topMatch.ingredients
        .map((i) => i.ingredient.name)
        .join(", ");
      responseText = `${topMatch.name} dibuat menggunakan bahan: ${ingList}. Catatan: ${topMatch.description}`;
    } else {
      responseText = `${topMatch.name} adalah ${topMatch.description}. Untuk rincian bahan lengkap atau pantangan alergen, silakan konfirmasi langsung kepada barista kami.`;
    }
  } else {
    // General menu description or recommendation
    const priceText =
      topMatch.price !== null
        ? ` (Rp${topMatch.price.toLocaleString("id-ID")})`
        : "";
    responseText = `${topMatch.name}${priceText}: ${topMatch.description}`;

    // If another relevant item is also found, suggest it
    if (scoredMenus.length > 1 && scoredMenus[1].score >= 5) {
      const secondMatch = scoredMenus[1].menu;
      matchedNames.push(secondMatch.name);
      const secondPrice =
        secondMatch.price !== null
          ? ` (Rp${secondMatch.price.toLocaleString("id-ID")})`
          : "";
      responseText += `\n\nPilihan lainnya yang juga cocok: ${secondMatch.name}${secondPrice} - ${secondMatch.description}`;
    }
  }

  return {
    answer: responseText,
    isGrounded: true,
    status: "SUCCESS",
    matchedMenuItems: matchedNames,
  };
}

