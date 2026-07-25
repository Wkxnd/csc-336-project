<script lang="ts">
	import { QrCode } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { dev } from '$app/environment';
	import QRCode from '@castlenine/svelte-qrcode';
	import {
		getSession,
		startAttendance,
		stopAttendance,
		getLiveRotatingQrToken,
		exportSessionCsv
	} from './data.remote';
	import { getClass } from '../../data.remote';
	import { getMySubscription } from '$lib/billing.remote';
	import Button from '$lib/components/Button.svelte';
	import LiveCount from '$lib/components/LiveCount.svelte';
	import CountdownTimer from '$lib/components/CountdownTimer.svelte';
	import LiveCheckInList from '$lib/components/LiveCheckInList.svelte';
	import { breadcrumbs } from '$lib/breadcrumbs.svelte';
	import { formatCalendarDate } from '$lib/date';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();

	const { classId, sessionId } = $derived(params);

	const session = $derived(await getSession(sessionId));
	const liveQrToken = $derived(getLiveRotatingQrToken(sessionId));
	const liveQr = $derived(await liveQrToken);
	const subscription = $derived(await getMySubscription());
	const canExport = $derived(subscription.plan === 'premium' || subscription.plan === 'enterprise');

	const isAttendanceActive = $derived(liveQr.active);

	let durationMinutes = $state(10);
	let exportError = $state<string | null>(null);
	let sessionError = $state<string | null>(null);
	let sessionPending = $state(false);

	const classCode = $derived((await getClass(classId)).code);

	const formattedSessionDate = $derived(
		formatCalendarDate(session.session_date, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		})
	);

	$effect(() => {
		breadcrumbs.set([
			{ label: 'Classes', href: '/dashboard/faculty' },
			{ label: classCode, href: `/dashboard/faculty/class/${classId}` },
			{ label: formattedSessionDate }
		]);

		return () => breadcrumbs.clear();
	});

	async function handleExport() {
		exportError = null;
		if (!canExport) {
			exportError = 'CSV export requires Premium or Enterprise. Upgrade from Billing.';
			return;
		}
		try {
			const csvContent = await exportSessionCsv(sessionId);
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			const safeDate = formattedSessionDate.replace(/[\s,]+/g, '_');
			link.setAttribute('download', `session_attendance_${classCode}_${safeDate}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Failed to export CSV:', err);
			exportError = err instanceof Error ? err.message : 'Failed to export CSV';
		}
	}
</script>

<div class="flex flex-col gap-6 h-full">
	<!-- Action Header Bar -->
	<div
		class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 shrink-0 mb-3"
	>
		<!-- <div>
			<p class="text-muted text-[14px]">
				Manage attendance session settings, display the dynamic check-in QR code, and export
				attendance records.
			</p>
		</div> -->

		<div class="flex flex-col gap-2 shrink-0">
			<div class="flex items-center gap-3 flex-wrap">
				{#if canExport}
					<Button variant="outline" size="sm" onclick={handleExport}>Export CSV</Button>
				{:else}
					<a href={resolve('/dashboard/faculty/billing')}>
						<Button variant="outline" size="sm">Upgrade to export</Button>
					</a>
				{/if}

				{#if isAttendanceActive}
					<Button
						variant="outline"
						size="sm"
						class="border-semantic-error text-semantic-error hover:bg-semantic-error/5"
						disabled={sessionPending}
						onclick={async () => {
							sessionError = null;
							sessionPending = true;
							try {
								await stopAttendance(sessionId);
							} catch (err) {
								console.error('Failed to stop attendance:', err);
								sessionError = err instanceof Error ? err.message : 'Failed to stop attendance';
							} finally {
								sessionPending = false;
							}
						}}
					>
						Stop Session
					</Button>
				{:else}
					<div class="flex items-center gap-2">
						<select
							bind:value={durationMinutes}
							class="h-9 px-3 bg-surface-card border border-hairline rounded-full text-xs font-body-md focus:outline-none focus:ring-2 focus:ring-ink/20"
						>
							<option value={5}>5 mins</option>
							<option value={10}>10 mins</option>
							<option value={15}>15 mins</option>
							<option value={30}>30 mins</option>
						</select>
						<Button
							size="sm"
							disabled={sessionPending}
							onclick={async () => {
								sessionError = null;
								sessionPending = true;
								try {
									await startAttendance({ sessionId, durationMinutes });
								} catch (err) {
									console.error('Failed to start attendance:', err);
									sessionError = err instanceof Error ? err.message : 'Failed to start attendance';
								} finally {
									sessionPending = false;
								}
							}}

						>
							{sessionPending ? 'Starting...' : 'Start Attendance'}
						</Button>
					</div>
				{/if}
			</div>
			{#if exportError}
				<p class="text-semantic-error text-[12px]">{exportError}</p>
			{/if}
			{#if sessionError}
				<p class="text-semantic-error text-[12px]">{sessionError}</p>
			{/if}
		</div>
	</div>

	<!-- Main Content: QR Code + Counter -->
	<div class="flex-1 min-h-0 overflow-y-auto">
		{#if isAttendanceActive && liveQr.token}
			{const checkInPath = resolve(`/dashboard/student/check-in/${sessionId}/${liveQr.token}`)}

			{const checkInUrl = `${window.location.origin}${checkInPath}`}
			<div class="flex flex-col lg:flex-row gap-6 items-start w-full">
				<!-- QR Code Column -->
				<div class="flex flex-col items-center gap-3 flex-1 min-w-0">
					<!-- {#if browser}
						{const checkInUrl = `${window.location.origin}${checkInPath}`} -->
					<div
						class="w-full max-w-80 aspect-square border border-hairline p-3 rounded-2xl bg-white flex items-center justify-center shadow-sm"
					>
						<QRCode data={checkInUrl} />
					</div>
					<!-- {/if} -->
				</div>

				<!-- Stats Column -->
				<div class="flex flex-col gap-4 lg:w-70 shrink-0 w-full">
					<!-- Countdown until attendance closes -->
					<CountdownTimer expiresAt={liveQr.expiresAt} />

					<!-- Live Attendance Counter -->
					<LiveCount {sessionId} />

					<!-- Live list of students who have marked attendance -->
					<LiveCheckInList {sessionId} />

					<!-- Dev copy link -->
					{#if dev}
						<!-- {const checkInUrl = `${window.location.origin}${checkInPath}`} -->
						{let copySuccess = $state(false)}
						<button
							onclick={async () => {
								await navigator.clipboard.writeText(checkInUrl);
								copySuccess = true;
								setTimeout(() => {
									copySuccess = false;
								}, 2000);
							}}
							class="text-[12px] font-body-strong text-ink hover:underline border border-hairline px-4 py-2 rounded-full bg-surface-card hover:bg-surface-container transition-colors cursor-pointer"
						>
							{copySuccess ? 'Copied Link!' : 'Copy Check-in Link'}
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<!-- Inactive State -->
			<div
				class="flex flex-col items-center justify-center text-center p-8 border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
			>
				<QrCode class="w-16 h-16 text-muted-soft mb-4" strokeWidth={1.5} />
				<h3 class="font-title-md text-ink text-[18px]">Attendance Not Active</h3>
				<p class="text-muted text-[14px] mt-3 max-w-80">
					Start an attendance session above to display the dynamic check-in QR code.
				</p>

				<!-- Show live count even when inactive -->
				<LiveCount {sessionId} />
			</div>
		{/if}
	</div>
</div>
