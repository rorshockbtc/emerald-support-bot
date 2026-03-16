import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(chatRouter);

export default router;
