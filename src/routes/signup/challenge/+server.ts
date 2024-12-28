import { eq } from "drizzle-orm";
import { getCookie } from "$lib";
import { Challenge, Registration } from "$orm";
import type { RequestHandler } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import { generateRegistrationOptions } from "@simplewebauthn/server";

export const POST: RequestHandler = async (event) => {
	const { cookie, isNewCookie } = await getCookie(event);
	if(isNewCookie) {
		redirect(302, "/login");
	}
	const { locals, request } = event;
	const { email, displayName } = await request.json() as { email: string, displayName: string };
	if(!email || !displayName) {
		error(400, "Missing email or display name");
	}
	const [registration] = await locals.DB.select({
		email: Registration.email,
	}).from(Registration).where(eq(Registration.cookie, cookie));
	if(!(registration && registration.email === email)) {
		console.log(registration);
		error(404, "Registration not found");
	}
	const webauthn = await generateRegistrationOptions({
		rpID: new URL(request.url).hostname,
		rpName: locals.platform.env.rpName,
		userName: displayName,
	});
	const { DB, platform } = locals;
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
