import { Cookie } from "$orm";
import { and, eq, gt } from "drizzle-orm";
import type { RequestEvent } from "@sveltejs/kit";

const idHash = async ({ request, locals: { platform } }: RequestEvent) =>
	new TextDecoder().decode(
		await crypto.subtle.digest(
			"SHA-512",
			new TextEncoder().encode(
				platform.env.COOKIE_SALT +
					request.headers.get("user-agent") +
					platform.cf.country,
			),
		),
	);

const cookieOpts = (expires: Date, domain: string) => ({
	domain,
	httpOnly: true,
	expires,
	sameSite: "lax" as const,
	secure: true,
	path: "/",
});

async function createCookie(event: RequestEvent) {
	const { DB, platform } = event.locals;
	const expires = Date.now() + platform.env.expirations.cookies;
	const [maybeCookie] = await DB.insert(Cookie)
		.values({
			idHash: await idHash(event),
			expires,
		})
		.returning({
			value: Cookie.value,
		});
	if (!maybeCookie) {
		throw new Error("Failed to create cookie");
	}
	event.cookies.set(
		"session",
		maybeCookie.value,
		cookieOpts(new Date(expires), new URL(event.request.url).hostname),
	);
	return maybeCookie.value;
}

export async function getCookie(event: RequestEvent, forceNew = false) {
	const value = event.cookies.get("session");
	if (!value || forceNew) {
		return {
			cookie: await createCookie(event),
			isNewCookie: true,
		};
	}
	const { DB, platform } = event.locals;
	const [expectedCookie] = await DB.update(Cookie)
		.set({ expires: Date.now() + platform.env.expirations.cookies })
		.where(and(eq(Cookie.value, value), gt(Cookie.expires, Date.now())))
		.returning({
			idHash: Cookie.idHash,
		});
	if (!expectedCookie) {
		console.log("Missing expected cookie");
		return {
			cookie: await createCookie(event),
			isNewCookie: true,
		};
	}
	if (expectedCookie.idHash !== (await idHash(event))) {
		await DB.delete(Cookie).where(eq(Cookie.value, value));
		return {
			cookie: await createCookie(event),
			isNewCookie: true,
		};
	}
	return {
		cookie: value,
		isNewCookie: false,
	};
}
