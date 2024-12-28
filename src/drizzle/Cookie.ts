import { nanoid } from "nanoid";
import { sqliteTable, text, index, int } from "drizzle-orm/sqlite-core";

export const Cookie = sqliteTable(
	"cookies",
	{
		value: text().$defaultFn(nanoid).primaryKey(),
		idHash: text("id_hash").notNull(),
		expires: int("expires").notNull(),
	},
	(t) => [index("cookies.expires").on(t.expires)],
);
