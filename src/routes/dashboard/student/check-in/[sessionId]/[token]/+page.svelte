<script lang="ts">
	import { ArrowRight, Check, CircleAlert } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { verifyQrCheckIn } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import { formatCalendarDate } from '$lib/date';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
</script>

<div class="flex flex-col items-center justify-center min-h-[60vh]">
	<!-- Ambient Blur background -->
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-150 max-h-150 bg-gradient-sky rounded-full blur-[80px] opacity-15 pointer-events-none mix-blend-multiply"
	></div>

	<main class="relative z-10 w-full max-w-112 text-center">
		<svelte:boundary>
			{const details = await verifyQrCheckIn({ sessionId: params.sessionId, token: params.token })}

			<div
				class="fade-in-up w-20 h-20 mb-6 rounded-full border border-hairline bg-surface-container-lowest flex items-center justify-center shadow-sm"
			>
				<Check class="w-8 h-8 text-ink" strokeWidth={1.5} />
			</div>

			<!-- Heading -->
			<h1
				class="fade-in-up delay-100 font-display-mega text-[44px] md:text-display-mega text-ink mb-5 tracking-tight leading-[1.1]"
			>
				Attendance<br />Completed
			</h1>
			<p
				class="fade-in-up delay-100 font-body-md text-body-md text-on-surface-variant mb-8 max-w-[28rem]"
			>
				Your presence has been recorded successfully. You are all set for this lecture session.
			</p>

			<!-- Details Card -->
			<div
				class="fade-in-up delay-200 w-full max-w-[28rem] bg-surface-container-lowest border border-hairline rounded-xl p-6 flex flex-col mb-8 shadow-sm"
			>
				<div class="flex justify-between items-center py-3 border-b border-hairline text-left">
					<span class="font-caption-uppercase text-[11px] text-muted uppercase">Class</span>
					<span class="font-body-strong text-ink font-semibold text-[14px] ml-4 text-right">
						{details.class_name}
					</span>
				</div>
				<div class="flex justify-between items-center py-3 border-b border-hairline text-left">
					<span class="font-caption-uppercase text-[11px] text-muted uppercase">Session Date</span>
					<span class="font-body-strong text-ink font-semibold text-[14px] ml-4 text-right">
						{formatCalendarDate(details.session_date, {
							weekday: 'long',
							month: 'long',
							day: 'numeric'
						})}
					</span>
				</div>
				<div class="flex justify-between items-center py-3 text-left">
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
				class="fade-in-up delay-300 flex items-center gap-3"
				onclick={() => goto(resolve('/dashboard/student'))}
			>
				View My History
				<ArrowRight class="w-4 h-4" strokeWidth={1.5} />
			</Button>

			{#snippet pending()}
				<div class="flex flex-col items-center gap-5">
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

			{#snippet failed(error: unknown, reset)}
				<!-- Error Card -->
				<Card class="text-left" gradientOrb={true} orbVariant="rose">
					<div class="flex flex-col items-center text-center p-5">
						<!-- Error Warning Icon -->
						<div
							class="w-20 h-20 mb-6 rounded-full border border-semantic-error/20 bg-semantic-error/5 flex items-center justify-center"
						>
							<CircleAlert class="w-10 h-10 text-semantic-error" strokeWidth={1.5} />
						</div>

						<h2 class="font-display-md text-[26px] text-ink tracking-tight font-normal">
							Check-In Failed
						</h2>
						<p class="font-body-md text-body-md text-on-surface-variant my-4 max-w-96">
							{error instanceof Error ? error.message : 'Unable to complete check-in'}
						</p>

						<div class="flex gap-3 w-full mt-5">
							<Button
								variant="outline"
								class="flex-1"
								onclick={() => goto(resolve('/dashboard/student'))}
							>
								Dashboard
							</Button>
							<Button class="flex-1" onclick={reset}>Try Again</Button>
						</div>
					</div>
				</Card>
			{/snippet}
		</svelte:boundary>
	</main>
</div>
