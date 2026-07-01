<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getStudentLatestCheckInDetails } from '../check-in/data.remote';
	import Button from '$lib/components/Button.svelte';

	const sessionId = $derived(page.url.searchParams.get('session_id') || '');

	// Fetch details reactively
	const detailsQuery = $derived(sessionId ? getStudentLatestCheckInDetails(sessionId) : null);
	const details = $derived(detailsQuery?.current);

	$effect(() => {
		if (!sessionId) {
			goto(resolve('/dashboard/student'));
		}
	});
</script>

<div class="flex-1 relative flex items-center justify-center min-h-[70vh]">
	<!-- Ambient Background Orb -->
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-200 max-h-200 bg-gradient-sky rounded-full blur-[100px] opacity-35 mix-blend-multiply pointer-events-none"
	></div>

	{#if detailsQuery?.loading && !details}
		<div class="relative z-10 text-center">
			<p class="text-muted animate-pulse font-title-md">Loading details...</p>
		</div>
	{:else if !details}
		<div class="relative z-10 text-center">
			<p class="text-semantic-error font-title-md">Record not found.</p>
			<Button variant="outline" class="mt-base" onclick={() => goto(resolve('/dashboard/student'))}>
				Back to Dashboard
			</Button>
		</div>
	{:else}
		<main
			class="relative z-10 w-full max-w-2xl mx-auto px-lg flex flex-col items-center text-center"
		>
			<!-- Success Check Icon -->
			<div
				class="fade-in-up w-20 h-20 mb-lg rounded-full border border-hairline bg-surface-container-lowest flex items-center justify-center shadow-sm"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-8 h-8 text-ink"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
			</div>

			<!-- Heading -->
			<h1
				class="fade-in-up delay-100 font-display-mega text-[44px] md:text-display-mega text-ink mb-md tracking-tight leading-[1.1]"
			>
				Attendance<br />Completed
			</h1>
			<p
				class="fade-in-up delay-100 font-body-md text-body-md text-on-surface-variant mb-xl max-w-[28rem]"
			>
				Your presence has been recorded successfully. You are all set for this lecture session.
			</p>

			<!-- Details Card -->
			<div
				class="fade-in-up delay-200 w-full max-w-[28rem] bg-surface-container-lowest border border-hairline rounded-xl p-lg flex flex-col mb-xl shadow-sm"
			>
				<div class="flex justify-between items-center py-sm border-b border-hairline text-left">
					<span class="font-caption-uppercase text-[11px] text-muted uppercase">Class</span>
					<span class="font-body-strong text-ink font-semibold text-[14px] ml-4 text-right">
						{details.class_name}
					</span>
				</div>
				<div class="flex justify-between items-center py-sm border-b border-hairline text-left">
					<span class="font-caption-uppercase text-[11px] text-muted uppercase">Session Date</span>
					<span class="font-body-strong text-ink font-semibold text-[14px] ml-4 text-right">
						{new Date(details.session_date).toLocaleDateString(undefined, {
							weekday: 'long',
							month: 'long',
							day: 'numeric'
						})}
					</span>
				</div>
				<div class="flex justify-between items-center py-sm text-left">
					<span class="font-caption-uppercase text-[11px] text-muted uppercase">Recorded At</span>
					<span class="font-body-strong text-ink font-semibold text-[14px] ml-4 text-right">
						{new Date(details.verified_at).toLocaleTimeString(undefined, {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit'
						})}
					</span>
				</div>
			</div>

			<!-- CTA Button -->
			<Button
				class="fade-in-up delay-300 flex items-center gap-sm"
				onclick={() => goto(resolve('/dashboard/student'))}
			>
				View My History
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-4 h-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
					/>
				</svg>
			</Button>
		</main>
	{/if}
</div>
