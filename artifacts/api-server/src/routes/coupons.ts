import { Router } from "express";
import { db, couponsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.post("/validate", async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code || orderTotal === undefined) {
      res.status(400).json({ error: "code and orderTotal are required" });
      return;
    }

    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase()));

    if (!coupon) {
      res.status(400).json({ error: "الكود غير صالح" });
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ error: "انتهت صلاحية الكود" });
      return;
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      res.status(400).json({ error: "تم استنفاد الكود" });
      return;
    }

    if (orderTotal < coupon.minOrder) {
      res.status(400).json({ error: `الحد الأدنى للطلب ${coupon.minOrder} جنيه` });
      return;
    }

    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (orderTotal * coupon.discount) / 100;
    } else {
      discountAmount = Math.min(coupon.discount, orderTotal);
    }

    res.json({
      valid: true,
      discount: coupon.discount,
      type: coupon.type,
      discountAmount: Math.round(discountAmount * 100) / 100,
      message: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to validate coupon");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
    res.json(coupons);
  } catch (err) {
    req.log.error({ err }, "Failed to list coupons");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { code, discount, type, minOrder, expiresAt, usageLimit } = req.body;
    if (!code || discount === undefined || !type) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [coupon] = await db
      .insert(couponsTable)
      .values({
        code: code.toUpperCase(),
        discount,
        type,
        minOrder: minOrder ?? 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit ?? null,
      })
      .returning();
    res.status(201).json(coupon);
  } catch (err) {
    req.log.error({ err }, "Failed to create coupon");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(couponsTable).where(eq(couponsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete coupon");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
