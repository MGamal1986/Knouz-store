import { Router } from "express";
import { db, ordersTable, productsTable, orderItemsTable } from "@workspace/db";
import { sql, eq, desc, lt, gte } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      revenueResult,
      ordersCountResult,
      customersResult,
      lowStockResult,
      pendingResult,
      todayResult,
      productsCountResult,
      recentOrdersRaw,
      lowStockProductsRaw,
    ] = await Promise.all([
      db.select({ total: sql<number>`coalesce(sum(total), 0)::float` }).from(ordersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable),
      db.select({ count: sql<number>`count(distinct user_id)::int` }).from(ordersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(lt(productsTable.stock, 5)),
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.status, "PENDING")),
      db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(gte(ordersTable.createdAt, todayStart)),
      db.select({ count: sql<number>`count(*)::int` }).from(productsTable),
      db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10),
      db
        .select({ id: productsTable.id, nameAr: productsTable.nameAr, stock: productsTable.stock })
        .from(productsTable)
        .where(lt(productsTable.stock, 5))
        .orderBy(productsTable.stock)
        .limit(10),
    ]);

    const recentOrders = await Promise.all(
      recentOrdersRaw.map(async (order) => {
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
        return { ...order, items };
      }),
    );

    res.json({
      totalRevenue: revenueResult[0]?.total ?? 0,
      totalOrders: ordersCountResult[0]?.count ?? 0,
      totalCustomers: customersResult[0]?.count ?? 0,
      lowStockCount: lowStockResult[0]?.count ?? 0,
      pendingOrders: pendingResult[0]?.count ?? 0,
      todayOrders: todayResult[0]?.count ?? 0,
      totalProducts: productsCountResult[0]?.count ?? 0,
      recentOrders,
      lowStockProducts: lowStockProductsRaw,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sales-chart", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        to_char(date_trunc('month', created_at), 'YYYY-MM') AS month,
        coalesce(sum(total), 0)::float AS revenue,
        count(*)::int AS orders
      FROM orders
      WHERE created_at >= now() - interval '12 months'
      GROUP BY 1
      ORDER BY 1
    `);

    const result = (rows as { rows: Array<{ month: string; revenue: number; orders: number }> }).rows ?? rows;

    res.json(
      Array.isArray(result)
        ? result.map((r) => ({ month: r.month, revenue: Number(r.revenue), orders: Number(r.orders) }))
        : [],
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get sales chart");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/category-sales", async (req, res) => {
  try {
    const rows = await db.execute(sql`
      SELECT
        c.name_ar AS name,
        coalesce(sum(oi.price * oi.quantity), 0)::float AS value
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      GROUP BY c.id, c.name_ar
      ORDER BY value DESC
    `);
    const result = (rows as { rows: Array<{ name: string; value: number }> }).rows ?? rows;
    res.json(Array.isArray(result) ? result : []);
  } catch (err) {
    req.log.error({ err }, "Failed to get category sales");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers", async (req, res) => {
  try {
    const { search, page = "1" } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = 20;
    const offset = (pageNum - 1) * limitNum;

    const searchCond = search
      ? sql`AND jsonb_extract_path_text(o.shipping_address, 'name') ILIKE ${"%" + search + "%"}`
      : sql``;

    const rows = await db.execute(sql`
      SELECT
        o.user_id AS "userId",
        jsonb_extract_path_text(o.shipping_address, 'name') AS "name",
        jsonb_extract_path_text(o.shipping_address, 'phone') AS "phone",
        count(o.id)::int AS "orderCount",
        coalesce(sum(o.total), 0)::float AS "totalSpend",
        min(o.created_at) AS "createdAt"
      FROM orders o
      WHERE o.user_id IS NOT NULL
      ${searchCond}
      GROUP BY o.user_id,
        jsonb_extract_path_text(o.shipping_address, 'name'),
        jsonb_extract_path_text(o.shipping_address, 'phone')
      ORDER BY "totalSpend" DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `);

    const countRows = await db.execute(sql`
      SELECT count(distinct user_id)::int AS total FROM orders WHERE user_id IS NOT NULL
    `);

    const rawRows = (rows as { rows: unknown[] }).rows ?? rows;
    const rawCount = (countRows as { rows: Array<{ total: number }> }).rows ?? countRows;

    res.json({
      customers: Array.isArray(rawRows) ? rawRows : [],
      total: (Array.isArray(rawCount) ? rawCount[0]?.total : 0) ?? 0,
      page: pageNum,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get customers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers/:userId/orders", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, userId))
      .orderBy(desc(ordersTable.createdAt));

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
        return { ...order, items };
      }),
    );

    res.json(ordersWithItems);
  } catch (err) {
    req.log.error({ err }, "Failed to get customer orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/export", async (req, res) => {
  try {
    const { status } = req.query as Record<string, string>;

    const orders = await db
      .select()
      .from(ordersTable)
      .where(status ? eq(ordersTable.status, status) : undefined)
      .orderBy(desc(ordersTable.createdAt));

    const header = "رقم الطلب,الحالة,الإجمالي,طريقة الدفع,تاريخ الطلب";
    const rows = orders.map((o) => {
      return [
        o.orderNumber ?? o.id,
        o.status,
        o.total,
        o.paymentMethod,
        o.createdAt?.toISOString().split("T")[0] ?? "",
      ].join(",");
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
    res.send("\uFEFF" + [header, ...rows].join("\n"));
  } catch (err) {
    req.log.error({ err }, "Failed to export orders");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
