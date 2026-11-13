import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { answerMenuQuery } from "@/features/assistant/menu-ai-service";

export async function POST(req: NextRequest) {
  try {
    const { question, channel } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Pertanyaan wajib diisi" },
        { status: 400 }
      );
    }

    const result = await answerMenuQuery(prisma, question, channel || "WEB");

    // Persist to ChatLog for evaluation and continuous audit (minimizing PII)
    await prisma.chatLog.create({
      data: {
        channel: channel || "WEB",
        question: question.slice(0, 500),
        answer: result.answer,
        status: result.status,
        modelVersion: "grounded-rag-v1",
      },
    });

    return NextResponse.json({
      answer: result.answer,
      isGrounded: result.isGrounded,
      status: result.status,
      matchedMenuItems: result.matchedMenuItems,
    });
  } catch (error) {
    console.error("Assistant API error:", error);
    return NextResponse.json(
      {
        answer:
          "Maaf, sistem asisten menu sedang mengalami gangguan sementara. Silakan tanyakan langsung ke barista kami.",
        isGrounded: false,
        status: "ERROR",
      },
      { status: 500 }
    );
  }
}

