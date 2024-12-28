import { eq } from "drizzle-orm";
import { error, redirect } from "@sveltejs/kit";
import { getCookie, locationString, oidcRedirect } from "$lib";
import type { PageServerLoad } from "./$types";
import { OiDCAuthentication, Session } from "$orm";

export const load: PageServerLoad = async (event) => {
	const {
		request: { url },
		locals: { DB, platform },
	} = event;
	const { searchParams } = new URL(url);
	const clientId = searchParams.get("client_id");
	if (!clientId) {
		error(400, {
			message: "Missing client_id",
		});
	}
	const client = platform.env.clients[clientId];
	if (!client) {
		error(400, {
			message: "Invalid client_id",
		});
	}
	const redirectUri = searchParams.get("redirect_uri");
	if (!redirectUri) {
		error(400, {
			message: "Missing redirect_uri",
		});
	}
	if (!client.redirect_uris.includes(redirectUri)) {
		error(400, {
			message: "Invalid redirect_uri",
		});
	}
	const state = searchParams.get("state") ?? undefined;
	const { cookie, isNewCookie } = await getCookie(event);
	if (!isNewCookie) {
		const [maybeActiveSession] = await DB.update(Session)
			.set({
				lastUsed: Date.now(),
				lastLocation: locationString(platform),
			})
			.where(eq(Session.cookie, cookie))
			.returning({
				userId: Session.userId,
				lastUsed: Session.lastUsed,
			});
		if (maybeActiveSession) {
			const { expirations } = platform.env;
			if (maybeActiveSession.lastUsed + expirations.sessions > Date.now()) {
				// TODO: Turnstile?
				await oidcRedirect({
					DB,
					redirectUri,
					userId: maybeActiveSession.userId,
					clientId,
					tokenExpiration: expirations.tokens,
					state,
				});
			}
		}
	}
	const { rowsAffected } = await DB.insert(OiDCAuthentication)
		.values({
			cookie,
			clientId,
			redirectUri,
			state,
			expires: Date.now() + platform.env.expirations.oidc,
		})
		.onConflictDoUpdate({
			target: OiDCAuthentication.cookie,
			set: {
				clientId,
				redirectUri,
				state,
				expires: Date.now() + platform.env.expirations.oidc,
			},
		});
	if (rowsAffected !== 1) {
		error(500, {
			message: "Failed to create OiDC Authentication Session",
		});
	}
	redirect(302, "/login");
};
