import { nanoid } from "nanoid";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const User = sqliteTable(
	"users",
	{
		id: text().$defaultFn(nanoid).primaryKey(),
		email: text().notNull().unique(),
		displayName: text("display_name").notNull().unique(),
	},
	() => [],
);
