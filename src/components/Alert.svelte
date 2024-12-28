<script lang="ts">
import { slide } from "svelte/transition";

interface Props {
	alert: Alert
}
const { alert }: Props = $props();
</script>
<div class={"px-3 py-2 w-full rounded-md flex items-center gap-2 text-white " + (alert.type === "error" ? "bg-red-500" : "bg-green-500")} out:slide><div class={"bg-white rounded-full p-2 w-8 h-8 flex items-center justify-center font-bold "  + (alert.type === "error" ? "text-red-500" : "text-green-500")}>{alert.type === "error" ? "!" : "✓"}</div>{alert.message}</div>
