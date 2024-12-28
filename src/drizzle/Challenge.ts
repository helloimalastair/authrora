import { sqliteTable, text, index, int } from "drizzle-orm/sqlite-core";

export const Challenge = sqliteTable(
	"challenges",
	{
		cookie: text().primaryKey(),
		challenge: text().notNull(),
		webauthnUserID: text("webauthn_user_id"),
		expires: int().notNull(),
	},
	(t) => [index("challenge.expires").on(t.expires)],
);
