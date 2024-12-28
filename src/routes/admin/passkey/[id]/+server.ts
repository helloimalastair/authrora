import { getCookie } from "$lib";
import { Cookie, Passkey, Session } from "$orm";
import { error } from "@sveltejs/kit";
import type { RequestEvent, RequestHandler} from "./$types";
import { eq } from "drizzle-orm";

const authorized = async (event: RequestEvent) => {
	const {cookie, isNewCookie} = await getCookie(event);
	if(isNewCookie) {
		error(403, "Unauthorized");
	}
	const { DB } = event.locals;
	const [[session], [passkey]] = await DB.batch([DB.select({ userId: Session.userId }).from(Session).where(eq(Session.cookie, cookie)), DB.select({
		userId: Passkey.userId
	}).from(Passkey).where(eq(Passkey.publicId, event.params.id))]);
	if (!(session && passkey && session.userId === passkey.userId)) {
		error(403, "Unauthorized");
	}
};

export const PATCH: RequestHandler = async (event) => {
	const newDisplayName = await event.request.text();
	if(!newDisplayName) {
		error(400, "No display name provided");
	}
	await authorized(event);
	const res = await event.locals.DB.update(Passkey).set({
		displayName: newDisplayName
	}).where(eq(Passkey.publicId, event.params.id)).run();
	if(res.rowsAffected !== 1) {
		error(404, "Passkey not found");
	}
	return new Response();
};

export const DELETE: RequestHandler = async (event) => {
	await authorized(event);
	const passkeyId = event.params.id;
	const res = await event.locals.DB.delete(Passkey).where(eq(Passkey.publicId, passkeyId)).run();
	if(res.rowsAffected !== 1) {
		error(404, "Passkey not found");
	}
	return new Response();
};