import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import ordersRouter from "./orders";
import couponsRouter from "./coupons";
import uploadRouter from "./upload";
import adminRouter from "./admin";
import wishlistRouter from "./wishlist";
import paymentRouter from "./payment";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/orders", ordersRouter);
router.use("/coupons", couponsRouter);
router.use("/upload", uploadRouter);
router.use("/admin", adminRouter);
router.use("/wishlist", wishlistRouter);
router.use("/payment", paymentRouter);

export default router;
