<script lang="ts">
	import { QrCode } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { browser, dev } from '$app/environment';
	import QRCode from '@castlenine/svelte-qrcode';
	import {
		getSession,
		startAttendance,
		stopAttendance,
		getLiveRotatingQrToken
	} from './data.remote';
	import { getClass } from '../../data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import LiveCount from '$lib/components/LiveCount.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const { classId, sessionId } = $derived(params);

	const classData = $derived(getClass(classId));
	const session = $derived(getSession(sessionId));
	const liveQrToken = $derived(getLiveRotatingQrToken(sessionId));
	const liveQr = $derived(await liveQrToken);

	const isAttendanceActive = $derived(liveQr.active);

	let durationMinutes = $state(10);
</script>

<div class="flex flex-col gap-lg h-full">
	{const session_date = new Date((await session).session_date).toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})}
	<Breadcrumbs
		crumbs={[
			{ label: 'Classes', href: '/dashboard/faculty' },
			{ label: (await classData).code, href: `/dashboard/faculty/class/${classId}` },
			{
				label: session_date
			}
		]}
	/>

	<!-- Session Header Card -->
	<Card class="shrink-0" gradientOrb={isAttendanceActive} orbVariant="mint">
		<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-md">
			<div>
				<span class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase">
					Session
				</span>
				<h2 class="font-display-md text-[24px] text-ink font-normal tracking-tight mt-1">
					{session_date}
				</h2>
			</div>

			<div class="flex items-center gap-sm">
				{#if isAttendanceActive}
					<Button
						variant="outline"
						class="border-semantic-error text-semantic-error hover:bg-semantic-error/5"
						onclick={async () => {
							await stopAttendance(sessionId);
						}}
					>
						Stop Session
					</Button>
				{:else}
					<div class="flex items-center gap-xs">
						<select
							bind:value={durationMinutes}
							class="h-10 px-sm bg-surface-card border border-hairline rounded-full text-xs font-body-md focus:outline-none focus:ring-2 focus:ring-ink/20"
						>
							<option value={5}>5 mins</option>
							<option value={10}>10 mins</option>
							<option value={15}>15 mins</option>
							<option value={30}>30 mins</option>
						</select>
						<Button
							onclick={async () => {
								await startAttendance({ sessionId, durationMinutes });
							}}>Start Attendance</Button
						>
					</div>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Main Content: QR Code + Counter -->
	<div class="flex-1 min-h-0 overflow-y-auto">
		{#if isAttendanceActive && liveQr.token}
			{@const checkInPath = resolve(`/dashboard/student/check-in/${sessionId}/${liveQr.token}`)}
			<div class="flex flex-col lg:flex-row gap-lg items-start w-full">
				<!-- QR Code Column -->
				<div class="flex flex-col items-center gap-sm flex-1 min-w-0">
					{#if browser}
						{@const checkInUrl = `${window.location.origin}${checkInPath}`}
						<div
							class="w-full max-w-80 aspect-square border border-hairline p-sm rounded-2xl bg-white flex items-center justify-center shadow-sm"
						>
							<QRCode data={checkInUrl} />
						</div>
					{/if}
				</div>

				<!-- Stats Column -->
				<div class="flex flex-col gap-base lg:w-70 shrink-0 w-full">
					<!-- Live Attendance Counter -->
					<LiveCount {sessionId} />

					<!-- Dev copy link -->
					{#if browser && dev}
						{@const checkInUrl = `${window.location.origin}${checkInPath}`}
						{let copySuccess = $state(false)}
						<button
							onclick={async () => {
								await navigator.clipboard.writeText(checkInUrl);
								copySuccess = true;
								setTimeout(() => {
									copySuccess = false;
								}, 2000);
							}}
							class="text-[12px] font-body-strong text-ink hover:underline border border-hairline px-base py-xs rounded-full bg-surface-card hover:bg-surface-container transition-colors cursor-pointer"
						>
							{copySuccess ? 'Copied Link!' : 'Copy Check-in Link'}
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Inactive State -->
			<div
				class="flex flex-col items-center justify-center text-center p-xl border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
			>
				<QrCode class="w-16 h-16 text-muted-soft mb-base" strokeWidth={1.5} />
				<h3 class="font-title-md text-ink text-[18px]">Attendance Not Active</h3>
				<p class="text-muted text-[14px] mt-sm max-w-80">
					Start an attendance session above to display the dynamic check-in QR code.
				</p>

				<!-- Show live count even when inactive -->
				<LiveCount {sessionId} />
			</div>
		{/if}
	</div>
</div>
