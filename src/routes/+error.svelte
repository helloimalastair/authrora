<script lang="ts">
import { page } from "$app/state";
import { SEO } from "$components";
</script>
<SEO title="Not found" />
<h1>{page.status} Error</h1>
<p>{page.error?.message}</p>