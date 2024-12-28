import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getCookie, locationString } from "$lib";
import { Session } from "$orm";
import { eq } from "drizzle-orm";

export const GET: RequestHandler = async (event) => {
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
	redirect(302, "/login");
};
