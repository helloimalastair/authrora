import { nanoid } from "nanoid";
import { sqliteTable, text, int, index } from "drizzle-orm/sqlite-core";

export const Session = sqliteTable(
	"sessions",
	{
		cookie: text().primaryKey(),
		publicId: text("public_id").$defaultFn(nanoid).notNull().unique(),
		userId: text("user_id").notNull(),
		lastUsed: int("last_used").notNull(),
		lastLocation: text("last_location").notNull(),
	},
	(t) => [index("sessions.last_used").on(t.lastUsed)],
);
