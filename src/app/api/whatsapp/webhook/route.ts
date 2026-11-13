import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyWhatsAppSignature,
  sendWhatsAppMessage,
  WhatsAppWebhookPayload,
} from "@/features/whatsapp/whatsapp-adapter";
import { answerMenuQuery } from "@/features/assistant/menu-ai-service";

/**
 * GET Webhook Challenge Verification (Meta Cloud API Standard).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === expectedVerifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden verification token" }, { status: 403 });
}

/**
 * POST Webhook Inbound Message Processing.
 * Validates HMAC signature, deduplicates messages, generates grounded response, and replies.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // Signature check if secret configured
  if (appSecret) {
    const isValid = verifyWhatsAppSignature(rawBody, signatureHeader, appSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const entries = payload.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const messages = change.value?.messages || [];
      for (const msg of messages) {
        if (msg.type === "text" && msg.text?.body) {
          const externalMessageId = msg.id;
          const userPhone = msg.from;
          const questionText = msg.text.body;

          // Inbound deduplication via externalMessageId
          const existingLog = await prisma.chatLog.findUnique({
            where: { externalMessageId },
          });

          if (existingLog) {
            // Duplicate event replayed by provider; acknowledge without double-replying
            continue;
          }

          // Generate grounded menu response
          const aiRes = await answerMenuQuery(prisma, questionText, "WHATSAPP");

          // Save audit log with external message id
          await prisma.chatLog.create({
            data: {
              channel: "WHATSAPP",
              externalMessageId,
              question: questionText,
              answer: aiRes.answer,
              status: aiRes.status,
              modelVersion: "grounded-rag-v1",
            },
          });

          // Send reply back to customer WhatsApp
          await sendWhatsAppMessage(userPhone, aiRes.answer);
        }
      }
    }
  }

  return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
}

