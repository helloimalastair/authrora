<script lang="ts">
import Session from "./Row.svelte";
import { AccordionSegment } from "$components";

interface Props {
	sessions: {
    publicId: string;
    lastUsed: number;
    lastLocation: string;
    current?: true;
	}[];
	renderAlert: RenderAlert;
}

const { sessions, renderAlert }: Props = $props();
</script>
<AccordionSegment title="Sessions">
	{#each sessions as session}
		<Session {session} {renderAlert} />
	{/each}
</AccordionSegment>