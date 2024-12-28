import type { RequestHandler } from "./$types";
import { loadKeyPairJSON, rotateKeyPairs } from "$lib";

export const GET: RequestHandler = async ({ locals: { platform } }) => {
	const { KV } = platform.env;
	let keys = await loadKeyPairJSON(KV);
	if (!keys) {
		keys = await rotateKeyPairs(KV, platform.context, true);
	}
	return Response.json({
		keys: keys.map(({ publicKey }) => ({
			alg: "RS256",
			kid: "jwtRS256",
			...publicKey,
		})),
	});
};
