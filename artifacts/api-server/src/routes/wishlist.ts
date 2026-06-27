import { Router } from "express";
import { db, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { inArray, eq, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { ids } = req.query as { ids?: string };
    if (!ids) {
      res.json([]);
      return;
    }

    const idList = ids.split(",").filter(Boolean);
    if (idList.length === 0) {
      res.json([]);
      return;
    }

    const products = await db
      .select({
        id: productsTable.id,
        nameAr: productsTable.nameAr,
        descriptionAr: productsTable.descriptionAr,
        price: productsTable.price,
        comparePrice: productsTable.comparePrice,
        stock: productsTable.stock,
        images: productsTable.images,
        categoryId: productsTable.categoryId,
        featured: productsTable.featured,
        createdAt: productsTable.createdAt,
        category: {
          id: categoriesTable.id,
          nameAr: categoriesTable.nameAr,
          slug: categoriesTable.slug,
          image: categoriesTable.image,
        },
        avgRating: sql<number>`round(avg(${reviewsTable.rating})::numeric, 1)`,
        reviewCount: sql<number>`count(distinct ${reviewsTable.id})::int`,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(reviewsTable, eq(reviewsTable.productId, productsTable.id))
      .where(inArray(productsTable.id, idList))
      .groupBy(productsTable.id, categoriesTable.id);

    res.json(products);
  } catch (err) {
    req.log.error({ err }, "Failed to get wishlist");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
