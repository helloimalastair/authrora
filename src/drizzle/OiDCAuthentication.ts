import { sqliteTable, text, index, int } from "drizzle-orm/sqlite-core";

export const OiDCAuthentication = sqliteTable(
	"oidc_authentication",
	{
		cookie: text().primaryKey(),
		clientId: text("client_id").notNull(),
		redirectUri: text("redirect_uri").notNull(),
		state: text(),
		expires: int().notNull(),
	},
	(t) => [index("oidc_authentication.expires").on(t.expires)],
);
