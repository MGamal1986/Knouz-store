import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { productsTable } from "@workspace/db";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await db
      .select({
        id: categoriesTable.id,
        nameAr: categoriesTable.nameAr,
        slug: categoriesTable.slug,
        image: categoriesTable.image,
        productCount: sql<number>`count(${productsTable.id})::int`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id);
    res.json(categories);
  } catch (err) {
    req.log.error({ err }, "Failed to list categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nameAr, slug, image } = req.body;
    if (!nameAr || !slug) {
      res.status(400).json({ error: "nameAr and slug are required" });
      return;
    }
    const [category] = await db.insert(categoriesTable).values({ nameAr, slug, image }).returning();
    res.status(201).json(category);
  } catch (err) {
    req.log.error({ err }, "Failed to create category");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, slug, image } = req.body;
    const updates: Record<string, unknown> = {};
    if (nameAr !== undefined) updates.nameAr = nameAr;
    if (slug !== undefined) updates.slug = slug;
    if (image !== undefined) updates.image = image;
    const [category] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  } catch (err) {
    req.log.error({ err }, "Failed to update category");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [productCheck] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(eq(productsTable.categoryId, id));
    if ((productCheck?.count ?? 0) > 0) {
      res.status(400).json({ error: "لا يمكن حذف فئة تحتوي على منتجات" });
      return;
    }
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete category");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
