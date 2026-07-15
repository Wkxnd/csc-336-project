<script lang="ts">
	// this component could probably be a snippet in the session +page.svelte
	import { slide } from 'svelte/transition';
	import { getLiveAttendanceCount } from '../../routes/dashboard/faculty/class/[classId]/session/[sessionId]/data.remote';

	interface Props {
		sessionId: string;
	}

	let { sessionId }: Props = $props();

	const liveCount = $derived(getLiveAttendanceCount(sessionId));
</script>

{#if liveCount.connected}
	<div transition:slide class="mt-6 border-t border-hairline pt-4 w-full">
		<p class="text-2xl font-display-md text-ink">
			<!-- TODO: these 2 awaits will get combined together right? -->
			{(await liveCount).present}/{(await liveCount).total}
			<!-- {liveCount.current.present}/{liveCount.current.total} -->
		</p>
		<p class="text-xs text-muted mt-1">students marked present</p>
	</div>
{/if}
