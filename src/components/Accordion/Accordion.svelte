<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<div class="w-full border border-gray-200 rounded-lg">
  {@render children()}
</div>