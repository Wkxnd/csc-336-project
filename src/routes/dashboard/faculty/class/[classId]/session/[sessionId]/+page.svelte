<script lang="ts">
	import { resolve } from '$app/paths';
	import { dev } from '$app/environment';
	import { onDestroy } from 'svelte';
	import QRCode from '@castlenine/svelte-qrcode';
	import { getSession, startAttendance, stopAttendance, getRotatingQrToken } from './data.remote';
	import { getClass } from '../../data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import LiveCount from '$lib/components/LiveCount.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const classId = $derived(params.classId);
	const sessionId = $derived(params.sessionId);

	const classData = $derived(getClass(classId));
	const session = $derived(await getSession(sessionId));

	const isAttendanceActive = $derived(
		session?.attendance_expires_at !== null &&
			session?.attendance_expires_at !== undefined &&
			new Date(session.attendance_expires_at) > new Date()
	);

	// QR rotation
	let qrToken = $state<string | null>(null);
	let qrTimeRemaining = $state(15);
	let durationMinutes = $state(10);
	let qrInterval = $state<ReturnType<typeof setInterval> | null>(null);
	let qrTimer = $state<ReturnType<typeof setInterval> | null>(null);

	onDestroy(() => {
		stopRotators();
	});

	$effect(() => {
		if (isAttendanceActive && !qrInterval) {
			void startQrRotator();
		} else if (!isAttendanceActive && qrInterval) {
			stopRotators();
			qrToken = null;
		}
	});

	// TODO: maybe this should be a query.live remote function instead
	async function rotateToken() {
		try {
			const res = await getRotatingQrToken(sessionId);
			if (res.active) {
				qrToken = res.token;
			} else {
				stopRotators();
				qrToken = null;
			}
		} catch (e) {
			console.error(e);
		}
	}

	function stopRotators() {
		if (qrInterval != null) clearInterval(qrInterval);
		if (qrTimer != null) clearInterval(qrTimer);
		qrInterval = null;
		qrTimer = null;
	}

	async function startQrRotator() {
		stopRotators();
		await rotateToken();

		qrInterval = setInterval(async () => {
			await rotateToken();
		}, 15000);

		qrTimeRemaining = 15;
		qrTimer = setInterval(() => {
			qrTimeRemaining -= 1;
			if (qrTimeRemaining <= 0) {
				qrTimeRemaining = 15;
			}
		}, 1000);
	}

	// async function handleStartAttendance() {
	// 	try {
	// 		const res = await startAttendance({ sessionId, durationMinutes });
	// 		if (res.success) {
	// 			session = res.session;
	// 		}
	// 	} catch (e) {
	// 		console.error(e);
	// 	}
	// }

	// async function handleStopAttendance() {
	// 	try {
	// 		const res = await stopAttendance(sessionId);
	// 		if (res.success) {
	// 			session = res.session;
	// 		}
	// 	} catch (e) {
	// 		console.error(e);
	// 	}
	// }

	let copySuccess = $state(false);
	async function handleCopyLink() {
		if (!checkInUrl) return;
		try {
			await navigator.clipboard.writeText(checkInUrl);
			copySuccess = true;
			setTimeout(() => {
				copySuccess = false;
			}, 2000);
		} catch (e) {
			console.error('Failed to copy check-in URL:', e);
		}
	}

	const checkInUrl = $derived(
		qrToken
			? `${window.location.origin}${resolve(`/dashboard/student/check-in?session_id=${sessionId}&token=${qrToken}`)}`
			: null
	);

	// const qrCodeUrl = $derived(
	// 	checkInUrl
	// 		? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(checkInUrl)}`
	// 		: null
	// );
</script>

<div class="flex flex-col gap-lg h-full">
	<Breadcrumbs
		crumbs={[
			{ label: 'Classes', href: '/dashboard/faculty' },
			{ label: (await classData).code, href: `/dashboard/faculty/class/${classId}` },
			{
				label: new Date(session.session_date).toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
					year: 'numeric'
				})
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
					{new Date(session.session_date).toLocaleDateString(undefined, {
						weekday: 'long',
						month: 'long',
						day: 'numeric'
					})}
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
		{#if isAttendanceActive && qrToken}
			<div class="flex flex-col lg:flex-row gap-lg items-start w-full">
				<!-- QR Code Column -->
				<div class="flex flex-col items-center gap-sm flex-1 min-w-0">
					<div
						class="w-full max-w-80 aspect-square border border-hairline p-sm rounded-2xl bg-white flex items-center justify-center shadow-sm"
					>
						<QRCode
							data={`${window.location.origin}${resolve(`/dashboard/student/check-in?session_id=${sessionId}&token=${qrToken}`)}`}
						/>
						<!-- {#if qrCodeUrl}
							<img src={qrCodeUrl} alt="Session QR Check-in" class="w-full h-full object-contain" />
						{:else}
							<div class="text-sm text-muted animate-pulse">Generating QR...</div>
						{/if} -->
					</div>

					<!-- Timer -->
					<div class="w-full max-w-80 text-center">
						<div class="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
							<div
								class="h-full bg-ink transition-all duration-1000 ease-linear rounded-full"
								style="width: {(qrTimeRemaining / 15) * 100}%"
							></div>
						</div>
						<span class="text-[11px] text-muted-soft block mt-1">
							Refreshes in {qrTimeRemaining}s
						</span>
					</div>
				</div>

				<!-- Stats Column -->
				<div class="flex flex-col gap-base lg:w-70 shrink-0 w-full">
					<!-- Live Attendance Counter -->
					<LiveCount {sessionId} />
					<!-- <div
						class="border border-hairline rounded-xl bg-surface-container-lowest p-lg text-center"
					>
						{#if liveCount.current}
							<p class="font-display-lg text-[48px] text-ink tracking-tight leading-none">
								{liveCount.current.present}/{liveCount.current.total}
							</p>
							<p class="text-sm text-muted mt-sm">students present</p>
						{:else}
							<p class="text-sm text-muted animate-pulse">Loading count...</p>
						{/if}
					</div> -->

					<!-- Dev copy link -->
					{#if dev}
						<button
							onclick={handleCopyLink}
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
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-16 h-16 text-muted-soft mb-base"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5ZM13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z"
					/>
				</svg>
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
