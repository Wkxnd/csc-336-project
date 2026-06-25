<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { verifyQrCheckIn } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';

	let verifying = $state(true);
	let errorMsg = $state('');

	const sessionId = $derived(page.url.searchParams.get('session_id'));
	const token = $derived(page.url.searchParams.get('token'));

	let hasRun = false;

	$effect(() => {
		if (hasRun) return;
		if (!sessionId || !token) {
			verifying = false;
			errorMsg = 'Invalid check-in link. Missing session details.';
			return;
		}

		hasRun = true;
		verifyQrCheckIn({ sessionId, token })
			.then((res) => {
				if (res.success) {
					// Redirect to Completed Page with details
					goto(resolve(`/dashboard/student/completed?session_id=${sessionId}`));
				}
			})
			.catch((e: unknown) => {
				verifying = false;
				const err = e as Error;
				errorMsg = err.message || 'An unexpected error occurred during check-in.';
			});
	});
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh]">
	<!-- Ambient Blur background -->
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-150 max-h-150 bg-gradient-sky rounded-full blur-[80px] opacity-15 pointer-events-none mix-blend-multiply"
	></div>

	<main class="relative z-10 w-full max-w-md text-center">
		{#if verifying}
			<div class="flex flex-col items-center gap-md">
				<!-- Animated Spinner -->
				<div
					class="w-16 h-16 border-4 border-hairline border-t-ink rounded-full animate-spin"
				></div>
				<h2 class="font-display-md text-[24px] text-ink font-normal tracking-tight">
					Verifying Check-In
				</h2>
				<p class="text-muted text-[14px]">
					Recording your presence for today's lecture. Please stand by...
				</p>
			</div>
		{:else}
			<!-- Error Card -->
			<Card class="text-left" gradientOrb={true} orbVariant="rose">
				<div class="flex flex-col items-center text-center p-md">
					<!-- Error Warning Icon -->
					<div
						class="w-20 h-20 mb-lg rounded-full border border-semantic-error/20 bg-semantic-error/5 flex items-center justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="w-10 h-10 text-semantic-error"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
							/>
						</svg>
					</div>

					<h2 class="font-display-md text-[26px] text-ink tracking-tight font-normal">
						Check-In Failed
					</h2>
					<p class="font-body-md text-body-md text-on-surface-variant my-base max-w-sm">
						{errorMsg}
					</p>

					<div class="flex gap-sm w-full mt-md">
						<Button
							variant="outline"
							class="flex-1"
							onclick={() => goto(resolve('/dashboard/student'))}
						>
							Dashboard
						</Button>
						<Button class="flex-1" onclick={() => window.location.reload()}>Try Again</Button>
					</div>
				</div>
			</Card>
		{/if}
	</main>
</div>
