import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import chatRouter from "./chat";
import ingestRouter from "./ingest";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(chatRouter);
router.use(ingestRouter);

export default router;
