const importAlgo = {
	name: "RSASSA-PKCS1-v1_5",
	hash: { name: "SHA-256" },
};

const algorithm = {
	...importAlgo,
	modulusLength: 2048,
	publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
};

export interface JWKPair {
	publicKey: JsonWebKey;
	privateKey: JsonWebKey;
}

interface KeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
}

function loadKeyPairJSON(KV: KVNamespace) {
	return KV.get<JWKPair[]>("jwks", { type: "json" });
}

async function loadKeyPair(keyPair: JWKPair): Promise<KeyPair> {
	return {
		publicKey: await crypto.subtle.importKey(
			"jwk",
			keyPair.publicKey,
			importAlgo,
			true,
			["verify"],
		),
		privateKey: await crypto.subtle.importKey(
			"jwk",
			keyPair.privateKey,
			importAlgo,
			true,
			["sign"],
		),
	};
}

const INFLIGHT_KEYS = 2;

async function rotateKeyPairs(
	KV: KVNamespace,
	ctx: ExecutionContext,
	json: true,
): Promise<JWKPair[]>;
async function rotateKeyPairs(
	KV: KVNamespace,
	ctx: ExecutionContext,
	json?: false,
): Promise<KeyPair>;
async function rotateKeyPairs(
	KV: KVNamespace,
	ctx: ExecutionContext,
	json = false,
): Promise<JWKPair[] | KeyPair> {
	const keyPairJson = (await KV.get<JWKPair[]>("jwks", { type: "json" })) ?? [];
	const keyPair = (await crypto.subtle.generateKey(algorithm, true, [
		"sign",
		"verify",
	])) as CryptoKeyPair;
	keyPairJson.splice(0, 0, {
		privateKey: (await crypto.subtle.exportKey(
			"jwk",
			keyPair.privateKey,
		)) as JsonWebKey,
		publicKey: (await crypto.subtle.exportKey(
			"jwk",
			keyPair.publicKey,
		)) as JsonWebKey,
	});
	if (keyPairJson.length > INFLIGHT_KEYS) {
		keyPairJson.pop();
	}
	ctx.waitUntil(KV.put("jwks", JSON.stringify(keyPairJson)));
	if (json) {
		return keyPairJson;
	}
	return keyPair;
}

async function loadCurrentKeyPair(KV: KVNamespace, ctx: ExecutionContext) {
	const jsonPairs = await loadKeyPairJSON(KV);
	if (!jsonPairs) {
		return rotateKeyPairs(KV, ctx);
	}
	return loadKeyPair(jsonPairs[0]);
}

export { loadKeyPairJSON, loadCurrentKeyPair, rotateKeyPairs };
