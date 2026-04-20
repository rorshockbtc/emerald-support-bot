import { pgTable, text, serial, timestamp, integer, real, index } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    /**
     * Discriminator for the row kind. Two shapes share this table:
     *   - "feedback":  thumbs-up/down on a specific bot reply.
     *                  `rating`, `userMessage`, `botReply`,
     *                  `responseSource` are required.
     *   - "suggestion": visitor-submitted "I wish the bot could
     *                   answer this." The question lives in
     *                   `userMessage`, optional clarifying context
     *                   in `context`, no rating, no botReply.
     * The admin dashboard filters on this column.
     */
    kind: text("kind").notNull().default("feedback"),
    sessionId: text("session_id").notNull(),
    personaSlug: text("persona_slug").notNull(),
    /** Required for kind="feedback"; null for kind="suggestion". */
    rating: integer("rating"),
    /**
     * For kind="feedback": the visitor's question that produced
     * the rated reply.
     * For kind="suggestion": the question the visitor wishes the
     * bot could answer.
     */
    userMessage: text("user_message").notNull(),
    /** Required for kind="feedback"; null for kind="suggestion". */
    botReply: text("bot_reply"),
    comment: text("comment"),
    /**
     * Optional clarifying context the visitor typed alongside a
     * suggestion (e.g. "we hit this when onboarding a new admin").
     * Null for kind="feedback" rows.
     */
    context: text("context"),
    /** Required for kind="feedback"; null for kind="suggestion". */
    responseSource: text("response_source"),
    biasId: text("bias_id"),
    biasLabel: text("bias_label"),
    latencyMs: integer("latency_ms"),
    cosineScore: real("cosine_score"),
    // No user-agent or IP captured. The session id sent by the client
    // is the only stable identifier we want — anything else is a
    // passive fingerprinting signal that breaks the no-PII commitment.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    personaIdx: index("feedback_persona_idx").on(table.personaSlug),
    ratingIdx: index("feedback_rating_idx").on(table.rating),
    createdAtIdx: index("feedback_created_at_idx").on(table.createdAt),
    kindIdx: index("feedback_kind_idx").on(table.kind),
  }),
);

export type Feedback = typeof feedbackTable.$inferSelect;
export type InsertFeedback = typeof feedbackTable.$inferInsert;
