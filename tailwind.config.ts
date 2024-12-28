import type { Config } from "tailwindcss";

export default {
	content: ["./src/**/*.{html,svelte,ts}"],

	theme: {
		extend: {
			colors: {
				bloo: "#317EFB"
			}
		},
	},

	plugins: [],
} satisfies Config;
