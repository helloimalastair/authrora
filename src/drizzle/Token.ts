import { nanoid } from "nanoid";
import { sqliteTable, text, int, index } from "drizzle-orm/sqlite-core";

export const Token = sqliteTable(
	"tokens",
	{
		token: text().$defaultFn(nanoid).primaryKey(),
		userId: text("user_id").notNull(),
		clientId: text("client_id").notNull(),
		expires: int("last_used").notNull(),
	},
	(t) => [index("tokens.expires").on(t.expires)],
);
