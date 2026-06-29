<script lang="ts">
	import { page } from '$app/state';
	import { getClass, getStudentAttendanceHistory } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';

	const classId = $derived(page.params.classId!);

	const classQuery = $derived(getClass(classId));
	const historyQuery = $derived(getStudentAttendanceHistory(classId));

	const classData = $derived(classQuery.current);
	const attendanceHistory = $derived(historyQuery.current || []);
</script>

<div class="flex flex-col gap-lg h-full">
	<Breadcrumbs
		crumbs={[
			{ label: 'My Classes', href: '/dashboard/student' },
			{ label: classData?.name || 'Loading...' }
		]}
	/>

	{#if classData}
		<Card class="shrink-0" gradientOrb={true} orbVariant="lavender">
			<div class="flex justify-between items-center">
				<div>
					<span class="font-caption-uppercase text-caption-uppercase text-muted"
						>{classData.code}</span
					>
					<h2 class="font-display-md text-[24px] text-ink font-normal tracking-tight mt-1">
						{classData.name}
					</h2>
					{#if classData.description}
						<p class="text-sm text-on-surface-variant mt-sm leading-relaxed">
							{classData.description}
						</p>
					{/if}
				</div>

				<div
					class="text-center bg-surface-container px-lg py-sm rounded-lg border border-hairline shrink-0 ml-lg"
				>
					<span class="font-display-lg text-[28px] text-ink font-semibold">
						{classData.attendance_rate || 0}%
					</span>
					<span class="text-[10px] text-caption-uppercase text-muted block mt-0.5">
						Your Attendance
					</span>
				</div>
			</div>
		</Card>

		<div class="flex-1 flex flex-col min-h-0">
			<h3 class="font-title-md text-[18px] text-ink mb-base">Attendance History</h3>

			{#if attendanceHistory.length === 0}
				<div
					class="flex-1 flex flex-col items-center justify-center text-center p-xl border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-10 h-10 text-muted-soft mb-sm"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
						/>
					</svg>
					<h3 class="font-title-md text-ink text-[16px]">No Sessions Yet</h3>
					<p class="text-muted text-[13px] mt-1">
						No lecture sessions have been recorded for this class yet.
					</p>
				</div>
			{:else}
				<div class="flex flex-col gap-xs overflow-y-auto">
					{#each attendanceHistory as r (r.session_date)}
						<div
							class="flex justify-between items-center p-base border border-hairline rounded-xl bg-surface-card hover:bg-surface-container-low transition-colors"
						>
							<div class="min-w-0">
								<span class="font-body-strong text-ink text-sm block">
									{new Date(r.session_date).toLocaleDateString(undefined, {
										weekday: 'long',
										month: 'long',
										day: 'numeric',
										year: 'numeric'
									})}
								</span>
								{#if r.verified_at}
									<span class="text-[10px] text-muted block mt-1">
										Checked in at: {new Date(r.verified_at).toLocaleTimeString(undefined, {
											hour: '2-digit',
											minute: '2-digit'
										})}
									</span>
								{:else}
									<span class="text-[10px] text-muted block mt-1">No check-in timestamp</span>
								{/if}
							</div>

							<Badge variant={r.status}>
								{r.status}
							</Badge>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="flex-1 flex items-center justify-center">
			<p class="text-muted animate-pulse font-title-md">Loading...</p>
		</div>
	{/if}
</div>
