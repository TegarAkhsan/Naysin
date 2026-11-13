import { describe, it, expect, vi } from "vitest";
import { answerMenuQuery } from "@/features/assistant/menu-ai-service";
import evaluationDataset from "./evaluation-dataset.json";

describe("AI Menu Assistant Accuracy Evaluation Benchmark (>=90% Target)", () => {
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
        { id: "al-4", alias: "kopi signature" },
      ],
      ingredients: [
        { ingredient: { name: "Espresso House Blend", unit: "ml" } },
        { ingredient: { name: "Susu Segar", unit: "ml" } },
        { ingredient: { name: "Sirup Gula Aren", unit: "ml" } },
      ],
    },
    {
      id: "menu-2",
      name: "Matcha Latte",
      category: "Non-Kopi",
      description: "Matcha bubuk murni kualitas prima diseduh dengan susu segar lembut.",
      price: 20000,
      isAvailable: true,
      aliases: [
        { id: "al-5", alias: "matcha" },
        { id: "al-6", alias: "green tea" },
      ],
      ingredients: [
        { ingredient: { name: "Bubuk Matcha Murni", unit: "gram" } },
        { ingredient: { name: "Susu Segar", unit: "ml" } },
      ],
    },
    {
      id: "menu-3",
      name: "Earl Grey Milk Tea",
      category: "Non-Kopi",
      description: "Teh aromatik Earl Grey berpadu manis susu segar.",
      price: null, // Price unverified intentionally to test non-hallucination
      isAvailable: true,
      aliases: [{ id: "al-7", alias: "earl grey" }],
      ingredients: [],
    },
    {
      id: "menu-4",
      name: "Seasonal Cold Brew",
      category: "Kopi",
      description: "Cold brew edisi terbatas.",
      price: 25000,
      isAvailable: false, // Inactive item
      aliases: [{ id: "al-8", alias: "cold brew" }],
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

  it("evaluates dataset of 30 questions against ground truth expectations", async () => {
    let passedCount = 0;
    const totalQuestions = evaluationDataset.length;

    for (const item of evaluationDataset) {
      const response = await answerMenuQuery(mockPrisma, item.question);

      let isCorrect = false;

      if (item.expectedStatus === "FALLBACK") {
        isCorrect = response.status === "FALLBACK";
      } else if (item.expectedStatus === "SUCCESS") {
        const matchesMenu = item.expectedMenu
          ? response.matchedMenuItems.includes(item.expectedMenu)
          : true;

        const containsKeywords = item.mustContain
          ? item.mustContain.every((kw) =>
              response.answer.toLowerCase().includes(kw.toLowerCase())
            )
          : true;

        const avoidsKeywords = item.mustNotContain
          ? item.mustNotContain.every(
              (kw) => !response.answer.toLowerCase().includes(kw.toLowerCase())
            )
          : true;

        isCorrect = response.status === "SUCCESS" && matchesMenu && containsKeywords && avoidsKeywords;
      }

      if (isCorrect) {
        passedCount++;
      } else {
        console.warn(`Evaluation failed for question: "${item.question}"`, {
          expected: item,
          actual: response,
        });
      }
    }

    const accuracy = (passedCount / totalQuestions) * 100;
    console.log(`Evaluation Benchmark Result: ${passedCount}/${totalQuestions} passed (${accuracy.toFixed(1)}%)`);

    expect(accuracy).toBeGreaterThanOrEqual(90);
  });
});
