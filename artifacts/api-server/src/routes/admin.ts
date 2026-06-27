import { Router } from "express";
import { db, ordersTable, productsTable, orderItemsTable } from "@workspace/db";
import { sql, eq, desc, lt } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [revenueResult, ordersCountResult, customersResult, lowStockResult, pendingResult, recentOrdersRaw] =
      await Promise.all([
        db.select({ total: sql<number>`coalesce(sum(total), 0)::float` }).from(ordersTable).where(eq(ordersTable.paymentStatus, "paid")),
        db.select({ count: sql<number>`count(*)::int` }).from(ordersTable),
        db.select({ count: sql<number>`count(distinct user_id)::int` }).from(ordersTable),
        db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(lt(productsTable.stock, 5)),
        db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.status, "PENDING")),
        db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5),
      ]);

    const recentOrders = await Promise.all(
      recentOrdersRaw.map(async (order) => {
        const items = await db
          .select({
            id: orderItemsTable.id,
            productId: orderItemsTable.productId,
            quantity: orderItemsTable.quantity,
            price: orderItemsTable.price,
          })
          .from(orderItemsTable)
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
      recentOrders,
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

export default router;
