<script lang="ts">
	import { fly } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { Check } from '@lucide/svelte';
	import { getLiveCheckIns } from '../../routes/dashboard/faculty/class/[classId]/session/[sessionId]/data.remote';

	interface Props {
		sessionId: string;
	}

	let { sessionId }: Props = $props();

	const liveCheckIns = $derived(getLiveCheckIns(sessionId));
</script>

{#if liveCheckIns.connected}
	{@const students = await liveCheckIns}
	<div class="border-t border-hairline pt-4 w-full">
		<p class="font-caption-uppercase text-[11px] text-muted uppercase mb-3">
			Checked In ({students.length})
		</p>

		{#if students.length === 0}
			<p class="text-xs text-muted">Waiting for students to scan…</p>
		{:else}
			<ul class="flex flex-col gap-2 max-h-72 overflow-y-auto">
				{#each students as student (student.email)}
					<li
						class="flex items-center gap-3 rounded-full border border-hairline bg-surface-container-lowest px-3 py-2"
						in:fly={{ y: -8, duration: 250 }}
						animate:flip={{ duration: 250 }}
					>
						<span
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-semantic-success/10"
						>
							<Check class="h-3.5 w-3.5 text-semantic-success" strokeWidth={2} />
						</span>
						<span class="font-body-strong text-ink text-[13px] truncate">
							{student.first_name}
							{student.last_name}
						</span>
						{#if student.verified_at}
							<span class="ml-auto shrink-0 text-[11px] text-muted tabular-nums">
								{new Date(student.verified_at).toLocaleTimeString(undefined, {
									hour: '2-digit',
									minute: '2-digit'
								})}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}
