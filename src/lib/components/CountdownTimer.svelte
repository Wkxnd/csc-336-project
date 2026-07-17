<script lang="ts">
	interface Props {
		/** ISO timestamp for when the attendance window closes. */
		expiresAt: string | null;
	}

	let { expiresAt }: Props = $props();

	let now = $state(Date.now());

	$effect(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	const remainingMs = $derived(expiresAt ? new Date(expiresAt).getTime() - now : 0);
	const isExpired = $derived(remainingMs <= 0);

	const label = $derived.by(() => {
		const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	});

	// QR token rotates every 15s aligned to the epoch (see getQrToken in data.remote.ts).
	const QR_WINDOW_MS = 15_000;
	const qrSecondsLeft = $derived(Math.ceil((QR_WINDOW_MS - (now % QR_WINDOW_MS)) / 1000));
</script>

<div class="border-t border-hairline pt-4 w-full">
	<p class="font-caption-uppercase text-[11px] text-muted uppercase">Time Remaining</p>
	<p
		class="text-2xl font-display-md tabular-nums {isExpired
			? 'text-semantic-error'
			: 'text-ink'}"
	>
		{isExpired ? 'Closed' : label}
	</p>

	{#if !isExpired}
		<p class="mt-2 text-xs text-muted">
			QR refreshes in <span class="tabular-nums font-body-strong text-ink">{qrSecondsLeft}s</span>
		</p>
	{/if}
</div>
