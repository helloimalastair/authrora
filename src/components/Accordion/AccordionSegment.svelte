<script lang="ts">
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";

	interface Props {
		id?: string;
		title: string;
		children: Snippet;
	}

	let open = $state(false);
	let { id, title, children }: Props = $props();
	if(!id) {
		id = title.toLowerCase().replace(/\s/g, "-");
	}
</script>
<div class="border-b border-gray-200 last:border-b-0">
	<button
		class="rounded-lg w-full p-2 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors duration-200 ease-in-out text-left"
		class:bg-gray-50={open}
		onclick={() => open = !open}
		aria-expanded={open}
		aria-controls={id}
	>
		<span class="text-base font-medium text-gray-900">{title}</span>
		<svg
			class="w-6 h-6 text-gray-500 transform transition-transform duration-200 ease-in-out"
			class:rotate-180={open}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path d="M6 9l6 6 6-6" />
		</svg>
	</button>
	
	{#if open}
		<div 
			class="p-2 bg-white flex flex-col"
			transition:slide
		>
			{@render children()}
		</div>
	{/if}
</div>