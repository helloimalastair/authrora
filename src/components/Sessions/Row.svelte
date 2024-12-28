<script lang="ts">
// TODO: Localise date and time
import Icon from "@iconify/svelte";
import { AccordionItem } from "$components";
    import { invalidate } from "$app/navigation";

interface Props {
	session: {
    publicId: string;
    lastUsed: number;
    lastLocation: string;
    current?: true;
	}
	renderAlert: RenderAlert;
}

const { session, renderAlert }: Props = $props();

const RemoveSession = async () => {
	const res = await fetch(`/admin/session/${session.publicId}`, {
		method: "DELETE",
	});
	if(!res.ok) {
		const { message } = await res.json() as { message: string};
		renderAlert({
			type: "error",
			message
		});
		return;
	}
	await invalidate("session:list");
	renderAlert({
		type: "success",
		message: "Session removed"
	});
};
</script>
<AccordionItem class="p-2 flex justify-between">
	<p title={"Last used: " + new Date(session.lastUsed).toLocaleString("en-US", {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	})}>{session.lastLocation}</p>
		<button class={session.current ? "text-gray-200" : "hover:text-gray-700"} title={session.current ? "Unable to remove current session, try logging out instead" : undefined} disabled={session.current} onclick={RemoveSession}>
			<Icon icon="material-symbols:logout" width="24" height="24" />
		</button>
</AccordionItem>