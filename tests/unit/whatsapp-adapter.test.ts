import { describe, it, expect } from "vitest";
import { verifyWhatsAppSignature } from "@/features/whatsapp/whatsapp-adapter";
import crypto from "crypto";

describe("WhatsApp Adapter - Webhook Signature & Security", () => {
  const appSecret = "meta_test_secret_key_abcdef123456";

  it("successfully validates authentic Meta webhook payload signature", () => {
    const rawPayload = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "12345", changes: [] }],
    });

    const signature = crypto
      .createHmac("sha256", appSecret)
      .update(rawPayload, "utf8")
      .digest("hex");

    const header = `sha256=${signature}`;
    const isValid = verifyWhatsAppSignature(rawPayload, header, appSecret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered webhook payload", () => {
    const originalPayload = JSON.stringify({ object: "whatsapp_business_account" });
    const tamperedPayload = JSON.stringify({ object: "hacked_payload" });

    const signature = crypto
      .createHmac("sha256", appSecret)
      .update(originalPayload, "utf8")
      .digest("hex");

    const header = `sha256=${signature}`;
    const isValid = verifyWhatsAppSignature(tamperedPayload, header, appSecret);
    expect(isValid).toBe(false);
  });

  it("rejects request if signature header is missing or empty", () => {
    const rawPayload = JSON.stringify({ test: "data" });
    expect(verifyWhatsAppSignature(rawPayload, null, appSecret)).toBe(false);
    expect(verifyWhatsAppSignature(rawPayload, "", appSecret)).toBe(false);
  });
});

