import {
	getCookie,
	locationString,
	oidcRedirect,
	validateTurnstile,
} from "$lib";
import { Challenge, OiDCAuthentication, Passkey, Session } from "$orm";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";
import {
	generateAuthenticationOptions,
	type AuthenticationResponseJSON,
	type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { error, redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
	const { cookie, isNewCookie } = await getCookie(event);
	const { DB, platform } = event.locals;
	if (!isNewCookie) {
		const [maybeSession] = await DB.update(Session)
			.set({
				lastUsed: Date.now(),
				lastLocation: locationString(platform),
			})
			.where(eq(Session.cookie, cookie))
			.returning({
				lastUsed: Session.lastUsed,
			});
		if (maybeSession) {
			if (
				maybeSession.lastUsed + platform.env.expirations.sessions >
				Date.now()
			) {
				redirect(302, "/");
			}
			await DB.delete(Session).where(eq(Session.cookie, cookie));
		}
	}
	const webauthn = await generateAuthenticationOptions({
		rpID: new URL(event.request.url).hostname,
		userVerification: "preferred",
	});
	const { rowsAffected } = await DB.insert(Challenge)
		.values({
			cookie,
			challenge: webauthn.challenge,
			expires: Date.now() + platform.env.expirations.challenges,
		})
		.onConflictDoUpdate({
			target: Challenge.cookie,
			set: {
				challenge: webauthn.challenge,
				webauthnUserID: undefined,
				expires: Date.now() + platform.env.expirations.challenges,
			},
		});
	if (rowsAffected !== 1) {
		console.error("Failed to insert challenge");
		error(500, {
			message: "Database connection failure",
		});
	}
	return {
		turnstile: event.locals.platform.env.TURNSTILE_SITEKEY,
		webauthn,
	};
};

export const actions = {
	default: async (event) => {
		const { request, locals } = event;
		const data = await request.formData();
		const turnstile = data.get("turnstile") as string;
		const webauthnRaw = data.get("webauthn") as string;
		const { success, error } = await validateTurnstile(
			turnstile,
			locals.platform.env.TURNSTILE_SECRET,
		);
		if (!success) {
			console.error(error);
			return {
				error: "Invalid Turnstile",
			};
		}
		const { cookie } = await getCookie(event);
		const { DB, platform } = locals;
		const [maybeChallenge] = await DB.select({
			challenge: Challenge.challenge,
			expires: Challenge.expires,
		})
			.from(Challenge)
			.where(eq(Challenge.cookie, cookie));
		if (!maybeChallenge) {
			return {
				error: "Missing Challenge",
			};
		}
		await DB.delete(Challenge).where(eq(Challenge.cookie, cookie));
		if (maybeChallenge.expires < Date.now()) {
			return {
				error: "Challenge expired",
			};
		}
		const response = JSON.parse(webauthnRaw) as AuthenticationResponseJSON;
		const [maybePasskey] = await DB.select({
			userId: Passkey.userId,
			publicKey: Passkey.publicKey,
			counter: Passkey.counter,
		})
			.from(Passkey)
			.where(eq(Passkey.id, response.id));
		if (!maybePasskey) {
			return {
				error: "User not found",
			};
		}
		let verification: VerifiedAuthenticationResponse;
		try {
			const url = new URL(request.url);
			verification = await verifyAuthenticationResponse({
				response,
				expectedChallenge: maybeChallenge.challenge,
				expectedOrigin: url.origin,
				expectedRPID: url.hostname,
				credential: {
					id: response.id,
					publicKey: maybePasskey.publicKey,
					counter: Number(maybePasskey.counter),
				},
			});
		} catch (error) {
			console.error("Error while verifying authentication", error);
			return {
				error: "WebAuthn authentication failure",
			};
		}
		const { verified } = verification;
		if (!verified) {
			return {
				error: "Invalid Passkey",
			};
		}
		const {
			authenticationInfo: { newCounter },
		} = verification;
		const [passkeyUpdate, sessionSet] = await DB.batch([
			DB.update(Passkey)
				.set({
					counter: BigInt(newCounter),
				})
				.where(eq(Passkey.id, response.id)),
			DB.insert(Session)
				.values({
					cookie,
					userId: maybePasskey.userId,
					lastUsed: Date.now(),
					lastLocation: locationString(platform),
				})
				.onConflictDoUpdate({
					target: Session.cookie,
					set: {
						userId: maybePasskey.userId,
						lastUsed: Date.now(),

						lastLocation: locationString(platform),
					},
				}),
		]);
		if (!(passkeyUpdate.rowsAffected === 1 && sessionSet.rowsAffected === 1)) {
			console.error("Failed to update passkey or session");
			return {
				error: "Database connection failure",
			};
		}
		const [maybeOiDCAuthentication] = await DB.select({
			clientId: OiDCAuthentication.clientId,
			redirectUri: OiDCAuthentication.redirectUri,
			state: OiDCAuthentication.state,
			expires: OiDCAuthentication.expires,
		})
			.from(OiDCAuthentication)
			.where(eq(OiDCAuthentication.cookie, cookie));
		if (maybeOiDCAuthentication) {
			await DB.delete(OiDCAuthentication).where(
				eq(OiDCAuthentication.cookie, cookie),
			);
			if (maybeOiDCAuthentication.expires >= Date.now()) {
				await oidcRedirect({
					DB,
					redirectUri: maybeOiDCAuthentication.redirectUri,
					userId: maybePasskey.userId,
					clientId: maybeOiDCAuthentication.clientId,
					tokenExpiration: locals.platform.env.expirations.tokens,
					state: maybeOiDCAuthentication.state ?? undefined,
				});
			}
		}
		return redirect(302, "/");
	},
};
