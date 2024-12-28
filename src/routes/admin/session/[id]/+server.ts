import { eq } from "drizzle-orm";
import { getCookie } from "$lib";
import { error } from "@sveltejs/kit";
import { Cookie, Session } from "$orm";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = async (event) => {
	const { cookie, isNewCookie } = await getCookie(event);
	if(isNewCookie) {
		error(403, "Unauthorized");
	}
	const { DB } = event.locals;
	const sessionId = event.params.id;
	const [[user], [selectedSession]] = await DB.batch([
		DB.select({ userId: Session.userId }).from(Session).innerJoin(Cookie, eq(Cookie.value, Session.cookie)).where(eq(Cookie.value, cookie)),
		DB.select({ userId: Session.userId }).from(Session).where(eq(Session.publicId, sessionId)),
	]);
	if (!(user && selectedSession && user.userId === selectedSession.userId)) {
		throw error(403, "Unauthorized");
	}
	await DB.delete(Session).where(eq(Session.publicId, sessionId));
	return new Response();
};