<script lang="ts">
import NewPasskey from "./New.svelte";
import PasskeyRow from "./Row.svelte";
import { AccordionSegment } from "$components";

interface Props {
	passkeys: {
		id: string;
		displayName: string;
	}[];
	renderAlert: RenderAlert;
}

const { passkeys, renderAlert }: Props = $props();
</script>
<AccordionSegment title="Passkeys">
	{#each passkeys as passkey}
		<PasskeyRow {passkey} disabled={passkeys.length <= 1} {renderAlert} />
	{/each}
	<NewPasskey {renderAlert} />
</AccordionSegment>