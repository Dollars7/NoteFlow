import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workspaceState = sqliteTable("workspace_state", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  updatedAt: text("updated_at").notNull(),
});
