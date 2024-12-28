import { TimeSpan } from "oslo";
import { eq } from "drizzle-orm";
import { Token, User } from "$orm";
import { createJWT } from "oslo/jwt";
import type { RequestHandler } from "./$types";
import { loadCurrentKeyPair } from "$lib";

export const POST: RequestHandler = async ({
	request,
	locals: { platform, DB },
}) => {
	const authorization = request.headers.get("authorization");
	if (!authorization) {
		return new Response("Unauthorized", { status: 401 });
	}
	const [type, credentials] = authorization.split(" ");
	if (type !== "Basic") {
		return new Response("Unauthorized", { status: 401 });
	}
	const [clientId, clientSecret] = atob(credentials).split(":");
	const client = platform.env.clients[clientId];
	if (!client) {
		return new Response("Unauthorized", { status: 401 });
	}
	if (client.secret !== clientSecret) {
		return new Response("Unauthorized", { status: 401 });
	}
	const formData = await request.formData();
	const token = formData.get("code");
	if (typeof token !== "string") {
		return new Response("Unauthorized", { status: 401 });
	}
	const [maybeToken] = await DB.select({
		clientId: Token.clientId,
		email: User.email,
		displayName: User.displayName,
		expires: Token.expires,
	})
		.from(Token)
		.where(eq(Token.token, token))
		.innerJoin(User, eq(User.id, Token.userId));
	if (!maybeToken) {
		return new Response("Unauthorized", { status: 401 });
	}
	if (maybeToken.clientId !== clientId) {
		return new Response("Unauthorized", { status: 401 });
	}
	if (maybeToken.expires < Date.now()) {
		return new Response("Unauthorized", { status: 401 });
	}
	const keyPair = await loadCurrentKeyPair(platform.env.KV, platform.context);
	const id_token = await createJWT(
		"RS256",
		keyPair.privateKey,
		{
			email: maybeToken.email,
			display_name: maybeToken.displayName,
		},
		{
			issuer: new URL(request.url).origin,
			expiresIn: new TimeSpan(1, "h"),
			audiences: [clientId],
		},
	);
	return Response.json({
		scope: "identify email",
		id_token,
	});
};
