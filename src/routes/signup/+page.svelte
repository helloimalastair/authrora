<script lang="ts">
import { SEO } from "$components";
import { enhance } from "$app/forms";
import { Turnstile } from "svelte-turnstile";
import type { ActionData, PageData } from "./$types";
import {
	startRegistration,
	type PublicKeyCredentialCreationOptionsJSON,
} from "@simplewebauthn/browser";

interface Props {
	data: PageData;
	form: ActionData;
}

let { data, form }: Props = $props();
</script>
<SEO title="Signup" url="/signup" />
<h1 class="text-3xl">Signup</h1>
<form method="POST" action="/signup" class="flex flex-col" use:enhance={async ({ formData, cancel }) => {
	const optsResponse = await fetch("/signup/challenge", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			email: formData.get("email"),
			displayName: formData.get("displayname"),
		})
	});
	const body = await optsResponse.text();
	console.log("Hoonk", body);
	const optionsJSON = JSON.parse(body) as PublicKeyCredentialCreationOptionsJSON;

	try {
		const res = await startRegistration({
			optionsJSON
		});
		formData.set("webauthn", JSON.stringify(res));
	} catch (e) {
		cancel();
	}
	if(formData.has("displayname-saved")) {
		const displayName = formData.get("displayname") as string;
		localStorage.setItem("displayName", displayName);
		formData.delete("displayname-saved");
	} else {
		localStorage.removeItem("displayName");
	}
}}>
	{#if form?.error}
		<div class="bg-red-500 px-3 py-2 w-full rounded-md flex items-center gap-2 text-white"><div class="text-red-500 bg-white rounded-full p-2 w-8 h-8 flex items-center justify-center">!</div>{form.error}</div>
	{/if}
	<label for="displayname">Display Name</label>
	<input class="border-2 border-gray-500 rounded-md" type="text" name="displayname" autocomplete="username" required>
	<label for="email">Email</label>
	<input class="border-2 border-gray-500 rounded-md caret-transparent text-gray-500" type="email" name="email" autocomplete="email" required readonly value={data.email}>
	<Turnstile siteKey={ data.turnstile } size="invisible" responseFieldName="turnstile" />
	<div class="flex gap-2 my-2">
		<input type="checkbox" name="displayname-saved" value="checked" />
		<label class="text-xs" for="displayname-saved">Remember Display Name</label>
	</div>
	<button class="mt-1 disabled:bg-blue-200 bg-blue-400 px-4 py-1 rounded-full">Signup</button>
</form>