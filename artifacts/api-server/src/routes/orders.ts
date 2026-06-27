import { Router } from "express";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";

const router = Router();

function buildOrderResponse(order: Record<string, unknown>, items: Record<string, unknown>[]) {
  return {
    ...order,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      quantity: item.quantity,
      price: item.price,
    })),
  };
}

router.get("/track", async (req, res) => {
  try {
    const { orderNumber, phone } = req.query as Record<string, string>;
    if (!orderNumber || !phone) {
      res.status(400).json({ error: "orderNumber and phone are required" });
      return;
    }
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.orderNumber, orderNumber));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const addr = order.shippingAddress as Record<string, string>;
    if (addr.phone !== phone) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const items = await db
      .select({
        id: orderItemsTable.id,
        productId: orderItemsTable.productId,
        quantity: orderItemsTable.quantity,
        price: orderItemsTable.price,
        productName: productsTable.nameAr,
        productImage: sql<string>`${productsTable.images}[1]`,
      })
      .from(orderItemsTable)
      .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(orderItemsTable.orderId, order.id));
    res.json(buildOrderResponse(order as Record<string, unknown>, items as Record<string, unknown>[]));
  } catch (err) {
    req.log.error({ err }, "Failed to track order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { status, page = "1", userId } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = 20;
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (status) conditions.push(eq(ordersTable.status, status));
    if (userId) conditions.push(eq(ordersTable.userId, userId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, orders] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(where),
      db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limitNum).offset(offset),
    ]);

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await db
          .select({
            id: orderItemsTable.id,
            productId: orderItemsTable.productId,
            quantity: orderItemsTable.quantity,
            price: orderItemsTable.price,
            productName: productsTable.nameAr,
            productImage: sql<string>`${productsTable.images}[1]`,
          })
          .from(orderItemsTable)
          .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
          .where(eq(orderItemsTable.orderId, order.id));
        return buildOrderResponse(order as Record<string, unknown>, items as Record<string, unknown>[]);
      }),
    );

    const total = totalResult[0]?.count ?? 0;
    res.json({ orders: ordersWithItems, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    req.log.error({ err }, "Failed to list orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, total, shippingAddress, paymentMethod, couponCode, discount, items } = req.body;
    if (!total || !shippingAddress || !paymentMethod || !items?.length) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [order] = await db
      .insert(ordersTable)
      .values({ userId, total, shippingAddress, paymentMethod, couponCode, discount: discount ?? 0 })
      .returning();

    await db.insert(orderItemsTable).values(
      items.map((item: { productId: string; quantity: number; price: number }) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    );

    const orderItems = await db
      .select({
        id: orderItemsTable.id,
        productId: orderItemsTable.productId,
        quantity: orderItemsTable.quantity,
        price: orderItemsTable.price,
        productName: productsTable.nameAr,
        productImage: sql<string>`${productsTable.images}[1]`,
      })
      .from(orderItemsTable)
      .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(orderItemsTable.orderId, order.id));

    res.status(201).json(buildOrderResponse(order as Record<string, unknown>, orderItems as Record<string, unknown>[]));
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const items = await db
      .select({
        id: orderItemsTable.id,
        productId: orderItemsTable.productId,
        quantity: orderItemsTable.quantity,
        price: orderItemsTable.price,
        productName: productsTable.nameAr,
        productImage: sql<string>`${productsTable.images}[1]`,
      })
      .from(orderItemsTable)
      .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(orderItemsTable.orderId, id));
    res.json(buildOrderResponse(order as Record<string, unknown>, items as Record<string, unknown>[]));
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    const [order] = await db.update(ordersTable).set(updates).where(eq(ordersTable.id, id)).returning();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const items = await db
      .select({
        id: orderItemsTable.id,
        productId: orderItemsTable.productId,
        quantity: orderItemsTable.quantity,
        price: orderItemsTable.price,
        productName: productsTable.nameAr,
        productImage: sql<string>`${productsTable.images}[1]`,
      })
      .from(orderItemsTable)
      .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
      .where(eq(orderItemsTable.orderId, id));
    res.json(buildOrderResponse(order as Record<string, unknown>, items as Record<string, unknown>[]));
  } catch (err) {
    req.log.error({ err }, "Failed to update order");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
