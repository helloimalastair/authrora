// place files you want to import through the `$lib` alias in this folder.

function platAssert(param?: App.Platform): asserts param is App.Platform {
	if (!param) {
		throw new Error("Platform is not defined");
	}
}

function locationString(platform: App.Platform) {
	let location = platform.cf.city ?? "";
	if (location !== "") {
		location += ", ";
	}
	return location + platform.cf.country;
}

export { platAssert, locationString };
export * from "./keyManagement";
export * from "./getCookie";
export * from "./turnstile";
export * from "./oidcRedirect";