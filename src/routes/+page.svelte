<script lang="ts">
import type { PageData } from "./$types";
import { Turnstile } from "svelte-turnstile";
import { invalidate } from "$app/navigation";
import { Accordion, Passkeys, SEO, Sessions } from "$components";
import AlertComponent from "$components/Alert.svelte";

let { data }: { data: PageData } = $props();
let displayName = $state<string>(data.displayName);
let alert = $state<Alert>();
let turnstileToken = $state<string>();
$effect(() => {
	if (data) {
		alert = undefined;
	}
});
$effect(() => {
	if(alert) {
		console.log("Setting timeout");
		setTimeout(() => {
			alert = undefined;
		}, 5e3);
	}
});
const renderAlert = (alrt: Alert) => {
	alert = alrt;
};
const SaveDisplayName = async () => {
	const res = await fetch("/admin/user", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json"
		},
		body: displayName
	});
	if (!res.ok) {
		const { message } = await res.json() as { message: string };
		renderAlert({
			type: "error",
			message
		});
		return;
	}
	invalidate("user:read");
};
</script>
<SEO title="Dashboard" url="/" />
<h1 class="text-3xl">Welcome!</h1>
{#if alert}
	<AlertComponent {alert} />
{/if}
<label for="displayname">Display Name</label>
<input class="border-2 border-gray-500 rounded-md px-2" type="text" name="displayname" autocomplete="username" required bind:value={displayName}>
<label for="email">Email</label>
<input class="border-2 border-gray-500 rounded-md caret-transparent text-gray-500 px-2" type="email" name="email" autocomplete="email" required readonly value={data.email}>
<button class="w-full bg-green-500 hover:bg-green-400 text-white rounded-lg flex justify-center items-center py-2" onclick={SaveDisplayName}>Save</button>
<Accordion>
	<Passkeys passkeys={data.passkeys} {renderAlert} />
	<Sessions sessions={data.sessions} {renderAlert} />
</Accordion>
<Turnstile siteKey={ data.turnstile } size="invisible" responseFieldName="turnstile" on:callback={(c) => turnstileToken = c.detail.token}/>
<a class="w-full bg-red-500 hover:bg-red-400 text-white rounded-lg flex justify-center items-center py-2" href="/logout">Logout</a>