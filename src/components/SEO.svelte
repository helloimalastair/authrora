<script lang="ts">
import { page } from "$app/state";

interface Props {
	title: string;
	url?: string;
	description?: string;
}
const { title, url, description = "Authentication & Authorization on the Edge" }: Props = $props();
const fullURL = url ? new URL(url, page.url).toString() : undefined;
</script>
<svelte:head>
<title>{title}</title>
<meta name="title" content={title} />
<meta name="description" content={description} />
<meta name="theme-color" content="#317EFB" />
<meta property="og:type" content="website" />
{#if fullURL}
<meta property="og:url" content={fullURL} />
<meta property="twitter:url" content={fullURL} />
{/if}
<meta property="og:title" content={title} />
<meta property="og:site_name" content="Authrora">
<meta property="og:description" content={description} />
<meta property="twitter:card" content="summary" />
<meta property="twitter:title" content={title} />
<meta property="twitter:description" content={description} />
</svelte:head>