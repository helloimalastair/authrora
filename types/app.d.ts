// See https://svelte.dev/docs/kit/types#app.d.ts
import type { LibSQLDatabase } from "drizzle-orm/libsql/driver-core";

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			DB: LibSQLDatabase;
			platform: Platform;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
			cf: IncomingRequestCfProperties;
			env: Env & {
				clients: {
					[client_id: string]: {
						redirect_uris: string;
						secret: string;
					};
				};
			};
		}
	}
}
