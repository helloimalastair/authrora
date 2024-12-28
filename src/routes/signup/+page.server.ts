import {
	verifyRegistrationResponse,
	type VerifiedRegistrationResponse,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { Buffer } from "node:buffer";
import type { PageServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import { Challenge, OiDCAuthentication, Passkey, Registration, Session, User } from "$orm";
import {
	getCookie,
	locationString,
	oidcRedirect,
	validateTurnstile,
} from "$lib";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

export const load: PageServerLoad = async (event) => {
	const registrationId = new URL(event.request.url).searchParams.get("registration_id");
	if(!registrationId) {
		redirect(302, "/login");
	}
	const { cookie, isNewCookie } = await getCookie(event, true);
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
	const [registration] = await DB.update(Registration).set({
		cookie,
	}).where(eq(Registration.id, registrationId)).returning({
		email: Registration.email
	});
	if(!registration) {
		redirect(302, "/login");
	}
	return {
		email: registration.email,
		turnstile: event.locals.platform.env.TURNSTILE_SITEKEY,
	};
};

export const actions = {
	default: async (event) => {
		const { request, locals } = event;
		const data = await request.formData();
		const displayName = data.get("displayname") as string;
		const email = data.get("email") as string;
		const turnstile = data.get("turnstile") as string;
		const webauthnRaw = data.get("webauthn") as string;
		const { success } = await validateTurnstile(
			turnstile,
			locals.platform.env.TURNSTILE_SECRET,
		);
		if (!success) {
			return {
				error: "Invalid Turnstile",
			};
		}
		const { cookie } = await getCookie(event);
		const [registration] = await locals.DB.select({
			email: Registration.email,
		}).from(Registration).where(eq(Registration.cookie, cookie));
		if(!(registration && registration.email === email)) {
			error(404, "Registration not found");
		}
		const { DB } = locals;
		const [maybeChallenge] = await DB.select({
			challenge: Challenge.challenge,
			webauthnUserID: Challenge.webauthnUserID,
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
		if (!maybeChallenge.webauthnUserID) {
			return {
				error: "Missing webauthnUserID",
			};
		}
		const response = JSON.parse(webauthnRaw) as RegistrationResponseJSON;
		let verification: VerifiedRegistrationResponse;
		try {
			const url = new URL(request.url);
			verification = await verifyRegistrationResponse({
				response,
				expectedChallenge: maybeChallenge.challenge,
				expectedOrigin: url.origin,
				expectedRPID: url.hostname,
			});
		} catch (error) {
			console.error("Error while verifying registration", error);
			return {
				error: "WebAuthn registration failure",
			};
		}
		const { registrationInfo } = verification;
		if (!registrationInfo) {
			return {
				error: "WebAuthn registration failure",
			};
		}
		const [{ id: userId }] = await DB.insert(User)
			.values({
				email,
				displayName,
			})
			.returning({ id: User.id });
		const { credential, credentialDeviceType, credentialBackedUp } =
			registrationInfo;
		const [insertPasskey, insertSession] = await DB.batch([
			DB.insert(Passkey).values([
				{
					id: credential.id,
					displayName:
						response.clientExtensionResults.credProps
						// @ts-expect-error authenticatorDisplayName may not be standard
							?.authenticatorDisplayName ?? "Passkey",
					publicKey: Buffer.from(credential.publicKey),
					userId,
					webauthnUserID: maybeChallenge.webauthnUserID,
					counter: BigInt(credential.counter),
					deviceType: credentialDeviceType,
					backedUp: credentialBackedUp,
					transports: credential.transports,
				},
			]),
			DB.insert(Session).values([
				{
					cookie,
					userId,
					lastUsed: Date.now(),
					lastLocation: locationString(locals.platform),
				},
			]),
		]);
		if (
			!(insertPasskey.rowsAffected === 1 && insertSession.rowsAffected === 1)
		) {
			console.error("Failed to insert passkey");
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
			if (maybeOiDCAuthentication.expires >= Date.now()) {
				await oidcRedirect({
					DB,
					redirectUri: maybeOiDCAuthentication.redirectUri,
					userId: userId,
					clientId: maybeOiDCAuthentication.clientId,
					tokenExpiration: locals.platform.env.expirations.tokens,
					state: maybeOiDCAuthentication.state ?? undefined,
				});
			}
		}
		return redirect(302, "/");
	},
};
