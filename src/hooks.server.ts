import { platAssert } from "$lib";
import type { Handle } from "@sveltejs/kit";
import { drizzle } from "drizzle-orm/libsql/web";
import { createClient } from "@libsql/client/web";

export const handle: Handle = async ({ event, resolve }) => {
	platAssert(event.platform);
	event.locals.platform = event.platform;
	const { env } = event.platform;
	event.locals.DB = drizzle({
		client: createClient({
			url: env.TURSO_URL,
			authToken: env.TURSO_AUTH_TOKEN,
		}),
	});
	return resolve(event);
};
