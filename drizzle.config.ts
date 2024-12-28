import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/drizzle",
	out: "./migrations",
	dialect: "turso",
	dbCredentials: {
		url: "https://my.turso.url",
		authToken:
			"MY_TURSO_TOKEN",
	},
});
