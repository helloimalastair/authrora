import { eq } from "drizzle-orm";
import { error } from "@sveltejs/kit";
import { Challenge, Session, User, Passkey } from "$orm";
import { getCookie, validateTurnstile } from "$lib";
import type { RequestEvent, RequestHandler } from "./$types";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { generateRegistrationOptions, verifyRegistrationResponse, type VerifiedRegistrationResponse } from "@simplewebauthn/server";

const authAndName = async (event: RequestEvent) => {
	const { cookie, isNewCookie } = await getCookie(event);
	if(isNewCookie) {
		error(403, "Unauthorized");
	}
	const { DB } = event.locals;
	const [user] = await DB.select({ id: User.id, displayName: User.displayName }).from(User).innerJoin(Session, eq(Session.userId, User.id)).where(eq(Session.cookie, cookie));
	if(!user) {
		error(403, "Unauthorized");
	}
	return {
		userId: user.id,
		displayName: user.displayName,
		cookie
	};
};

export const OPTIONS: RequestHandler = async (event) => {
	const {displayName, cookie} = await authAndName(event);
	const { DB, platform } = event.locals;
	const webauthn = await generateRegistrationOptions({
		rpID: new URL(event.request.url).hostname,
		rpName: platform.env.rpName,
		userName: displayName,
	});
	const { rowsAffected } = await DB.insert(Challenge)
		.values({
			cookie,
			challenge: webauthn.challenge,
			webauthnUserID: webauthn.user.id,
			expires: Date.now() + platform.env.expirations.challenges,
		})
		.onConflictDoUpdate({
			target: Challenge.cookie,
			set: {
				challenge: webauthn.challenge,
				webauthnUserID: webauthn.user.id,
				expires: Date.now() + platform.env.expirations.challenges,
			},
		});
	if (rowsAffected !== 1) {
		console.error("Failed to insert challenge");
		error(500, {
			message: "Database connection failure",
		});
	}
	return Response.json(webauthn);
};

export const PUT: RequestHandler = async (event) => {
	const { userId, cookie } = await authAndName(event);
	const { DB, platform } = event.locals;
	const { turnstile, webauthn } = await event.request.json() as {
		turnstile: string,
		webauthn: RegistrationResponseJSON
	};
	const { success, error: turnstileError } = await validateTurnstile(
		turnstile,
		platform.env.TURNSTILE_SECRET,
	);
	if (!success) {
		console.error(turnstileError);
		error(403, "Turnstile Failure");
	}
	const [maybeChallenge] = await DB.select({
		challenge: Challenge.challenge,
		webauthnUserID: Challenge.webauthnUserID,
		expires: Challenge.expires,
	})
		.from(Challenge)
		.where(eq(Challenge.cookie, cookie));
	if (!maybeChallenge) {
		error(403, "Missing Challenge");
	}
	await DB.delete(Challenge).where(eq(Challenge.cookie, cookie));
	if (maybeChallenge.expires < Date.now()) {
		error(403, "Challenge expired");
	}
	if (!maybeChallenge.webauthnUserID) {
		error(403, "Missing webauthnUserID");
	}
	let verification: VerifiedRegistrationResponse;
	try {
		const url = new URL(event.request.url);
		verification = await verifyRegistrationResponse({
			response: webauthn,
			expectedChallenge: maybeChallenge.challenge,
			expectedOrigin: url.origin,
			expectedRPID: url.hostname,
		});
	} catch (e) {
		console.error("Error while verifying registration", e);
		error(403, "WebAuthn registration failure");
	}
	const { registrationInfo } = verification;
	if (!registrationInfo) {
		error(403, "WebAuthn registration failure");
	}
	const { credential, credentialDeviceType, credentialBackedUp } =
			registrationInfo;
	const { rowsAffected } = await DB.insert(Passkey).values([
		{
			id: credential.id,
			displayName:
				webauthn.clientExtensionResults.credProps
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
	]);
	if(rowsAffected !== 1) {
		error(500, "Failed to insert passkey");
	}
	return Response.json({ success: true });
};