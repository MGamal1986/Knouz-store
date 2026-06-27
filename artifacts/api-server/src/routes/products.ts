import { Router } from "express";
import { db, productsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, and, gte, lte, desc, asc, sql, ilike, inArray } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      sort = "newest",
      page = "1",
      limit = "12",
      featured,
      search,
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (category) conditions.push(eq(productsTable.categoryId, category));
    if (minPrice) conditions.push(gte(productsTable.price, parseFloat(minPrice)));
    if (maxPrice) conditions.push(lte(productsTable.price, parseFloat(maxPrice)));
    if (featured === "true") conditions.push(eq(productsTable.featured, true));
    if (search) conditions.push(ilike(productsTable.nameAr, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    switch (sort) {
      case "price_asc": orderBy = asc(productsTable.price); break;
      case "price_desc": orderBy = desc(productsTable.price); break;
      default: orderBy = desc(productsTable.createdAt);
    }

    const [totalResult, products] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
      db
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
        .where(where)
        .groupBy(productsTable.id, categoriesTable.id)
        .orderBy(orderBy)
        .limit(limitNum)
        .offset(offset),
    ]);

    const total = totalResult[0]?.count ?? 0;
    res.json({
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nameAr, descriptionAr, price, comparePrice, stock, images, categoryId, featured } = req.body;
    if (!nameAr || !descriptionAr || price === undefined || !categoryId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    const [product] = await db
      .insert(productsTable)
      .values({ nameAr, descriptionAr, price, comparePrice, stock: stock ?? 0, images: images ?? [], categoryId, featured: featured ?? false })
      .returning();
    res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to create product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db
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
      .where(eq(productsTable.id, id))
      .groupBy(productsTable.id, categoriesTable.id);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, descriptionAr, price, comparePrice, stock, images, categoryId, featured } = req.body;
    const updates: Record<string, unknown> = {};
    if (nameAr !== undefined) updates.nameAr = nameAr;
    if (descriptionAr !== undefined) updates.descriptionAr = descriptionAr;
    if (price !== undefined) updates.price = price;
    if (comparePrice !== undefined) updates.comparePrice = comparePrice;
    if (stock !== undefined) updates.stock = stock;
    if (images !== undefined) updates.images = images;
    if (categoryId !== undefined) updates.categoryId = categoryId;
    if (featured !== undefined) updates.featured = featured;

    const [product] = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(product);
  } catch (err) {
    req.log.error({ err }, "Failed to update product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.productId, id))
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews);
  } catch (err) {
    req.log.error({ err }, "Failed to list reviews");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, userId, userName } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5" });
      return;
    }
    const [review] = await db
      .insert(reviewsTable)
      .values({ productId: id, userId: userId ?? "guest", userName, rating, comment })
      .returning();
    res.status(201).json(review);
  } catch (err) {
    req.log.error({ err }, "Failed to create review");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
