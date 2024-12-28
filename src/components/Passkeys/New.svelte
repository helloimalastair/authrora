<script lang="ts">
import { AccordionItem } from "$components";
import { invalidate } from "$app/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON, RegistrationResponseJSON } from "@simplewebauthn/types";

interface Props {
	renderAlert: RenderAlert;
}

const { renderAlert }: Props = $props();

const NewPasskey = async () => {
	const turnstile = window.turnstile.getResponse();
	const optionResponse = await fetch("/admin/passkey", {
		method: "OPTIONS",
	});
	const optionsJSON = await optionResponse.json() as PublicKeyCredentialCreationOptionsJSON;
	let webauthn: RegistrationResponseJSON;
	try {
		webauthn = await startRegistration({
			optionsJSON
		});
	} catch (e) {
		renderAlert({
			type: "error",
			message: "Failed to create new passkey"
		})
		return;
	}
	const res = await fetch("/admin/passkey", {
		method: "PUT",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			turnstile,
			webauthn
		})
	});
	if(!res.ok) {
		const { message } = await res.json() as { message: string };
		renderAlert({
			type: "error",
			message
		})
		return;
	}
	await invalidate("passkey:list");
	renderAlert({
		type: "success",
		message: "Passkey created"
	});
};
</script>
<AccordionItem>
	<button class="w-full bg-green-500 text-white rounded-lg flex justify-center items-center py-2" onclick={NewPasskey}>Add new Passkey</button>
</AccordionItem>