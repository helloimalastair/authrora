import { Session } from "$orm";
import { eq } from "drizzle-orm";
import { getCookie } from "$lib";
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
	const { cookie } = await getCookie(event);
	if (cookie) {
		await event.locals.DB.delete(Session).where(eq(Session.cookie, cookie));
	}
	redirect(302, "/login");
};
