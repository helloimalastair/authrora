import type {
	CredentialDeviceType,
	AuthenticatorTransportFuture,
} from "@simplewebauthn/types";
import { nanoid } from "nanoid";
import { blob, sqliteTable, text, int } from "drizzle-orm/sqlite-core";

export const Passkey = sqliteTable(
	"passkeys",
	{
		id: text().primaryKey(),
		publicId: text("public_id").$defaultFn(nanoid).notNull(),
		displayName: text("display_name").notNull(),
		publicKey: blob("public_key", {
			mode: "buffer",
		}).notNull(),
		userId: text("user_id").notNull(),
		webauthnUserID: text("webauthn_user_id").notNull(),
		counter: blob({
			mode: "bigint",
		}).notNull(),
		deviceType: text("device_type").$type<CredentialDeviceType>().notNull(),
		backedUp: int("backed_up", {
			mode: "boolean",
		}).notNull(),
		transports: text({
			mode: "json",
		}).$type<AuthenticatorTransportFuture[]>(),
	},
	() => [],
);
