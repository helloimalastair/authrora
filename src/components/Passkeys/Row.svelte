<script lang="ts">
	import Icon from "@iconify/svelte";
  import { AccordionItem } from "../Accordion";
  import { invalidate } from "$app/navigation";

	interface Props {
		passkey: {
			id: string;
			displayName: string;
		}
		renderAlert: RenderAlert;
		disabled?: boolean;
	}
	const { passkey, renderAlert, disabled }: Props = $props();
	let mode = $state<"view" | "edit">("view");
	let input = $state<HTMLInputElement>();
	$effect(() =>{
		if (input && mode === "edit") {
			input.focus();
		}
	});
	const Save = async () => {
		if(!input) return;
		const res = await fetch(`/admin/passkey/${passkey.id}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json"
			},
			body: input.value
		});
		if(!res.ok) {
			renderAlert({
				type: "error",
				message: "Failed to save passkey"
			});
			return;
		}
		mode = "view";
		await invalidate("passkey:list");
		renderAlert({
			type: "success",
			message: "Passkey edited"
		});
	};
	const Delete = async () => {
		if(disabled) return;
		const res = await fetch(`/admin/passkey/${passkey.id}`, {
			method: "DELETE"
		});
		if(!res.ok) {
			renderAlert({
				type: "error",
				message: "Failed to delete passkey"
			});
		}
		await invalidate("passkey:list");
		renderAlert({
			type: "success",
			message: "Passkey deleted"
		});
	};
</script>

<AccordionItem class="p-2 flex justify-between">
	{#if mode === "edit"}
		<input class="w-36 border-2 rounded-sm px-1" type="text" value={passkey.displayName} bind:this={input} />
	{:else}
		<p class="w-40">{passkey.displayName}</p>
	{/if}

	<div class="flex gap-1">
		{#if mode === "edit"}
			<button class="hover:text-gray-500" onclick={Save}>
				<Icon icon="material-symbols:save" width="24" height="24" />
			</button>
		{:else}
		<button class="hover:text-gray-500" onclick={() => mode = "edit"}>
			<Icon icon="material-symbols:edit" width="24" height="24" />
		</button>
		<button title={disabled ? "Unable to delete only Passkey" : undefined} class={disabled ? "text-gray-500" : "hover:text-gray-500"} onclick={Delete} disabled={disabled}>
			<Icon icon="material-symbols:delete" width="24" height="24" />
		</button>
		{/if}
	</div>
</AccordionItem>