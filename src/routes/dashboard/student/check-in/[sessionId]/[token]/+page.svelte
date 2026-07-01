<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { verifyQrCheckIn } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh]">
	<!-- Ambient Blur background -->
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-150 max-h-150 bg-gradient-sky rounded-full blur-[80px] opacity-15 pointer-events-none mix-blend-multiply"
	></div>

	<main class="relative z-10 w-full max-w-112 text-center">
		<svelte:boundary
			onerror={(e) => {
				console.log(e);
			}}
		>
			{const details = await verifyQrCheckIn({ sessionId: params.sessionId, token: params.token })}

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

			{#snippet pending()}
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
			{/snippet}

			{#snippet failed(error)}
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
						<p class="font-body-md text-body-md text-on-surface-variant my-base max-w-96">
							<!-- TODO: how to properly type these errors -->
							{const message = 'message' in error.body ? error.body.message : error}
							{message}
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
			{/snippet}
		</svelte:boundary>
	</main>
</div>
