import { pgTable, text, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { productsTable } from "./products";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text("order_number").unique().$defaultFn(() => `KNZ-${Date.now()}`),
  userId: text("user_id"),
  status: text("status").notNull().default("PENDING"),
  total: real("total").notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  couponCode: text("coupon_code"),
  discount: real("discount").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull().references(() => ordersTable.id),
  productId: text("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
});

export const ordersRelations = relations(ordersTable, ({ many }) => ({
  items: many(orderItemsTable),
}));

export const orderItemsRelations = relations(orderItemsTable, ({ one }) => ({
  order: one(ordersTable, { fields: [orderItemsTable.orderId], references: [ordersTable.id] }),
  product: one(productsTable, { fields: [orderItemsTable.productId], references: [productsTable.id] }),
}));

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, orderNumber: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
