import crypto from "crypto";

export interface WhatsAppInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messaging_product: string;
        metadata?: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppInboundMessage[];
      };
      field: string;
    }>;
  }>;
}

/**
 * Validates HMAC-SHA256 signature from Meta Webhooks.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;
  const parts = signatureHeader.split("sha256=");
  const signature = parts[1];
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "utf8"),
    Buffer.from(expectedSignature, "utf8")
  );
}

/**
 * Sends a WhatsApp reply using Meta Cloud API.
 * Returns { success: boolean, status: string }.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<{ success: boolean; status: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      success: false,
      status: "PENDING_CREDENTIALS: Official WhatsApp credentials not configured.",
    };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const errData = await res.text();
      return { success: false, status: `API_ERROR: ${res.status} - ${errData}` };
    }

    return { success: true, status: "DELIVERED" };
  } catch (err: unknown) {
    return {
      success: false,
      status: `NETWORK_ERROR: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

