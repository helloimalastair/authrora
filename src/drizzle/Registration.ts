import { nanoid } from "nanoid";
import { sqliteTable, text, index, int } from "drizzle-orm/sqlite-core";

export const Registration = sqliteTable(
	"registrations",
	{
		id: text().$defaultFn(nanoid).primaryKey(),
		email: text("email").notNull(),
		cookie: text("cookie"),
		expires: int("expires").notNull(),
	},
	(t) => [index("registrations.expires").on(t.expires)],
);
