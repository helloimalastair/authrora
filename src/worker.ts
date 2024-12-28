import { drizzle } from "drizzle-orm/libsql/web";
import { createClient } from "@libsql/client/web";
import svelteKitWorker from "../.svelte-kit/cloudflare/_worker";
import { Challenge, Cookie, OiDCAuthentication, Registration, Session, Token } from "$orm";
import { gt, lt } from "drizzle-orm";
import { rotateKeyPairs } from "$lib";

export default {
	fetch: svelteKitWorker.fetch,
	async scheduled(ctr, env, ctx) {
		switch(ctr.cron) {
			case "*/5 * * * *": {
				await rotateKeyPairs(env.KV, ctx);
				break;
			}
			case "0 0 * * *": {
				const DB = drizzle({
					client: createClient({
						url: env.TURSO_URL,
						authToken: env.TURSO_AUTH_TOKEN,
					}),
				});
				const now = Date.now();
				await DB.batch([
					DB.delete(Challenge).where(lt(Challenge.expires, now)),
					DB.delete(Cookie).where(lt(Cookie.expires, now)),
					DB.delete(OiDCAuthentication).where(lt(OiDCAuthentication.expires, now)),
					DB.delete(Registration).where(lt(Registration.expires, now)),
					DB.delete(Session).where(gt(Session.lastUsed,  now + env.expirations.sessions)),
					DB.delete(Token).where(lt(Token.expires, now)),
				]);
				break;
			}
		}
	},
} satisfies ExportedHandler<Env>;

