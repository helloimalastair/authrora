import { getCookie } from "$lib";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { Passkey, Session, User } from "$orm";
import { eq } from "drizzle-orm";

export const load: PageServerLoad = async (event) => {
	event.depends("passkey:list");
	event.depends("session:list");
	const { cookie } = await getCookie(event);
	if (!cookie) {
		redirect(302, "/login");
	}
	const [maybeUser] = await event.locals.DB.select({
		id: User.id,
		sessionId: Session.publicId,
		displayName: User.displayName,
		email: User.email,
	}).from(Session).innerJoin(User, eq(User.id, Session.userId)).where(eq(Session.cookie, cookie));

	if (!maybeUser) {
		redirect(302, "/login");
	}
	const { DB, platform } = event.locals;
	const passkeys = await DB.select({
		id: Passkey.publicId,
		displayName: Passkey.displayName,
	}).from(Passkey).where(eq(Passkey.userId, maybeUser.id));
	const sessions = (await DB.select({
		publicId: Session.publicId,
		lastUsed: Session.lastUsed,
		lastLocation: Session.lastLocation,
	}).from(Session).where(eq(Session.userId, maybeUser.id)) as {
		publicId: string;
		lastUsed: number;
		lastLocation: string;
		current?: true;
	}[]).map((session) => {
		if(session.publicId === maybeUser.sessionId) {
			session.current = true;
		}
		return session;
	});
	return {
		displayName: maybeUser.displayName,
		email: maybeUser.email,
		passkeys,
		sessions,
		turnstile: platform.env.TURNSTILE_SITEKEY,
	};
};
