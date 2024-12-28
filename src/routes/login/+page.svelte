<script lang="ts">
import { enhance } from "$app/forms";
import { browser } from "$app/environment";
import { Turnstile } from "svelte-turnstile";
import type { ActionData, PageData } from "./$types";
import { startAuthentication } from "@simplewebauthn/browser";
    import { SEO } from "$components";

interface Props {
	data: PageData;
	form: ActionData;
}

let { data, form }: Props = $props();
const DisplayName = browser ? localStorage.getItem("displayName") : undefined;
</script>
<SEO title="Login" url="/login" />
<h1 class="text-3xl">Login</h1>
<form method="POST" action="/login" class="flex flex-col" use:enhance={async ({ formData, cancel }) => {
	if(formData.has("displayname-saved")) {
		const displayName = formData.get("displayname") as string;
		localStorage.setItem("displayName", displayName);
		formData.delete("displayname-saved");
	} else {
		localStorage.removeItem("displayName");
	}
	try {
		const res = await startAuthentication({
			optionsJSON: data.webauthn,
			useBrowserAutofill: true
		});
		formData.set("webauthn", JSON.stringify(res));
	} catch (e) {
		console.error("Failed Authentication", e);
		form = {
			error: "Failed to authenticate"
		};
		cancel();
	}
}}>
	{#if form?.error}
		<div class="bg-red-500 px-3 py-2 w-full rounded-md flex items-center gap-2 text-white"><div class="text-red-500 bg-white rounded-full p-2 w-8 h-8 flex items-center justify-center">!</div>{form.error}</div>
	{/if}
	<label for="displayname">Display Name</label>
	<input class="border-2 border-gray-500 rounded-md" type="text" name="displayname" autocomplete="username webauthn" required value={DisplayName}>
	<Turnstile siteKey={ data.turnstile } size="invisible" responseFieldName="turnstile" />
	<div class="flex gap-2 my-2">
		<input type="checkbox" name="displayname-saved" checked={DisplayName !== ""}/>
		<label class="text-xs" for="displayname-saved">Remember Display Name</label>
	</div>
	<button class="mt-1 disabled:bg-blue-200 bg-blue-400 px-4 py-1 rounded-full">Login</button>
</form>