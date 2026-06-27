import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function authenticatePaymob(): Promise<string> {
  const res = await fetch("https://accept.paymob.com/api/auth/tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
  });
  const data = (await res.json()) as { token: string };
  return data.token;
}

async function createPaymobOrder(authToken: string, amountCents: number): Promise<number> {
  const res = await fetch("https://accept.paymob.com/api/ecommerce/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      items: [],
    }),
  });
  const data = (await res.json()) as { id: number };
  return data.id;
}

async function getPaymentKey(
  authToken: string,
  orderId: number,
  amountCents: number,
  billingData: Record<string, string>,
  integrationId: number,
): Promise<string> {
  const res = await fetch("https://accept.paymob.com/api/acceptance/payment_keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_token: authToken,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: billingData,
      currency: "EGP",
      integration_id: integrationId,
    }),
  });
  const data = (await res.json()) as { token: string };
  return data.token;
}

router.post("/paymob", async (req, res) => {
  try {
    const { orderId, amountCents, billingData } = req.body;
    if (!orderId || !amountCents || !billingData) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const apiKey = process.env.PAYMOB_API_KEY;
    const integrationId = parseInt(process.env.PAYMOB_INTEGRATION_ID_CARD ?? "0");

    if (!apiKey || !integrationId) {
      res.status(503).json({ error: "Payment gateway not configured" });
      return;
    }

    const authToken = await authenticatePaymob();
    const paymobOrderId = await createPaymobOrder(authToken, amountCents);
    const paymentKey = await getPaymentKey(authToken, paymobOrderId, amountCents, billingData, integrationId);

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`;

    res.json({ iframeUrl, paymentKey });
  } catch (err) {
    req.log.error({ err }, "Failed to initiate payment");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/callback", async (req, res) => {
  try {
    const { obj } = req.body;
    if (!obj) {
      res.status(400).json({ error: "Invalid callback" });
      return;
    }

    const crypto = await import("crypto");
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET ?? "";

    const fields = [
      obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
      obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
      obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
      obj.is_voided, obj.order.id, obj.owner, obj.pending, obj.source_data.pan,
      obj.source_data.sub_type, obj.source_data.type, obj.success,
    ];
    const hashString = fields.join("");
    const hmac = crypto.createHmac("sha512", hmacSecret).update(hashString).digest("hex");

    if (hmac !== req.query.hmac) {
      res.status(400).json({ error: "Invalid HMAC" });
      return;
    }

    if (obj.success && obj.order?.merchant_order_id) {
      await db
        .update(ordersTable)
        .set({ paymentStatus: "paid", status: "PROCESSING" })
        .where(eq(ordersTable.id, obj.order.merchant_order_id));
    }

    res.json({ received: true });
  } catch (err) {
    req.log.error({ err }, "Failed to process payment callback");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
