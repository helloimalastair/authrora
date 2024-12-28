import { dev } from "$app/environment";
import {
	Challenge,
	Cookie,
	OiDCAuthentication,
	Passkey,
	Registration,
	Session,
	Token,
	User,
} from "$orm";
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
	if(!dev) {
		redirect(302, "/login");
	}
	const { DB } = event.locals;
	await DB.batch([
		DB.delete(Challenge),
		DB.delete(Cookie),
		DB.delete(OiDCAuthentication),
		DB.delete(Passkey),
		DB.delete(Registration),
		DB.delete(Session),
		DB.delete(Token),
		DB.delete(User),
	]);
	event.cookies.delete("session", {
		path: "/",
	});
	return new Response(`"Great Success!" - Borat`);
};
