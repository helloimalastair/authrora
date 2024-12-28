import { Token } from "$orm";
import { error, redirect } from "@sveltejs/kit";
import type { LibSQLDatabase } from "drizzle-orm/libsql/driver-core";

interface OidcRedirect {
	DB: LibSQLDatabase;
	redirectUri: string;
	userId: string;
	clientId: string;
	tokenExpiration: number;
	state?: string;
}

export async function oidcRedirect({
	DB,
	redirectUri,
	userId,
	state,
	tokenExpiration,
	clientId,
}: OidcRedirect) {
	const [maybeToken] = await DB.insert(Token)
		.values({
			userId,
			clientId,
			expires: Date.now() + tokenExpiration,
		})
		.returning({
			token: Token.token,
		});
	if (!maybeToken) {
		error(500, {
			message: "Failed to create token",
		});
	}
	const url = new URL(redirectUri);
	if (state) {
		url.searchParams.set("state", state);
	}
	url.searchParams.set("code", maybeToken.token);
	redirect(302, url.toString());
}
