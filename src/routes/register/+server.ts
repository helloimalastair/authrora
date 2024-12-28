import { Registration, User } from "$orm";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";
import { error, redirect } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ locals: { DB, platform }, request }) => {
	const url = new URL(request.url);
	if(url.searchParams.get("registration_key") !== platform.env.REGISTRATION_SECRET) {
		redirect(302, "/login");
	}
	const email = url.searchParams.get("email");
	if(!email) {
		error(400, "Missing email");
	}
	const [existingUser] = await DB.select({ id: User.id }).from(User).where(eq(User.email, email));
	if(existingUser) {
		error(409, "User already exists");
	}
	const [registration] = await DB.insert(Registration).values({
		email,
		expires: Date.now() + platform.env.expirations.registrations,
	}).returning({
		id: Registration.id,
	});
	if(!registration) {
		error(500, "Failed to create registration");
	}
	const signupUrl = new URL("/signup", request.url);
	signupUrl.searchParams.set("registration_id", registration.id);
	return Response.json({
		url: signupUrl.toString(),
	});
};