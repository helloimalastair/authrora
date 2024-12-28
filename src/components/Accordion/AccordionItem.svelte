<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	class?: string;
	children: Snippet;
}

let { class: className, children }: Props = $props();
</script>
<div class={"border-b-2 last:border-b-0 border-gray-200" + (className ? " " + className : "")}>
	{@render children()}
</div>