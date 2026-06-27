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

export default router;
