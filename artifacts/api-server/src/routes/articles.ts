import { Router, type IRouter } from "express";
import { ilike, or, eq, and } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import {
  ListArticlesQueryParams,
  ListArticlesResponse,
  GetArticleParams,
  GetArticleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/articles", async (req, res): Promise<void> => {
  const params = ListArticlesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];

  if (params.data.category) {
    conditions.push(eq(articlesTable.category, params.data.category));
  }

  if (params.data.q) {
    const searchTerm = `%${params.data.q}%`;
    conditions.push(
      or(
        ilike(articlesTable.title, searchTerm),
        ilike(articlesTable.description, searchTerm)
      )!
    );
  }

  let query = db.select().from(articlesTable);
  if (conditions.length === 1) {
    query = query.where(conditions[0]) as typeof query;
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions)!) as typeof query;
  }

  const articles = await query.orderBy(articlesTable.title);
  res.json(ListArticlesResponse.parse(articles));
});

router.get("/articles/:id", async (req, res): Promise<void> => {
  const params = GetArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.id, params.data.id));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  res.json(GetArticleResponse.parse(article));
});

export default router;
