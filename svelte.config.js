import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		csrf: false,
		adapter: adapter(),
		alias: {
			$orm: "./src/drizzle",
			$components: "./src/components",
		},
	},
};

export default config;
