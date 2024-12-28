import { eq } from "drizzle-orm";
import { getCookie } from "$lib";
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { Cookie, Session, User } from "$orm";

export const PATCH: RequestHandler = async (event) => {
	const { cookie, isNewCookie } = await getCookie(event);
	if(isNewCookie) {
		error(403, "Unauthorized");
	}
	const displayName = await event.request.text();
	if(!displayName) {
		error(400, "Missing display name");
	}
	const { DB } = event.locals;
	const [user] = await DB.select({
		userId: User.id,
	}).from(User).innerJoin(Session, eq(Session.userId, User.id)).innerJoin(Cookie, eq(Cookie.value, Session.cookie)).where(eq(Cookie.value, cookie));
	if(!user) {
		error(403, "Unauthorized");
	}
	const res = await event.locals.DB.update(User).set({
		displayName,
	}).where(eq(User.id, user.userId));
	if(res.rowsAffected !== 1) {
		error(500, "Failed to update display name");
	}
	return new Response();
};