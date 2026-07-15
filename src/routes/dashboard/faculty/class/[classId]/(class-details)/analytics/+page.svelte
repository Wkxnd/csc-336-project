<script lang="ts">
	import { BarChart2 } from '@lucide/svelte';
	import { getClassAttendanceTrend, getClassStudentSummary, getSessions } from '../../data.remote';
	import Card from '$lib/components/Card.svelte';
	import AttendanceTrendChart from '$lib/components/charts/AttendanceTrendChart.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const classId = $derived(params.classId);

	// Get promises synchronously
	const trend = $derived(await getClassAttendanceTrend(classId));
	const studentSummary = $derived(getClassStudentSummary(classId));
	const sessions = $derived(await getSessions(classId));

	const totalStudents = $derived((await studentSummary).length);

	const avgRate = $derived(
		totalStudents > 0
			? Math.round(
					(await studentSummary).reduce((sum, s) => sum + Number(s.attendance_rate), 0) /
						totalStudents
				)
			: null
	);
</script>

<div class="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto mt-3">
	<!-- Stat bar -->
	<div class="grid grid-cols-3 gap-4 shrink-0">
		<Card class="text-center">
			<p class="font-display-md text-[28px] text-ink font-normal">{sessions.length}</p>
			<p class="text-muted text-[12px] font-caption-uppercase uppercase tracking-wider mt-1">
				Total Sessions
			</p>
		</Card>
		<Card class="text-center">
			<p class="font-display-md text-[28px] text-ink font-normal">
				{avgRate !== null ? `${avgRate}%` : '—'}
			</p>
			<p class="text-muted text-[12px] font-caption-uppercase uppercase tracking-wider mt-1">
				Avg. Attendance
			</p>
		</Card>
		<Card class="text-center">
			<p class="font-display-md text-[28px] text-ink font-normal">{totalStudents}</p>
			<p class="text-muted text-[12px] font-caption-uppercase uppercase tracking-wider mt-1">
				Students
			</p>
		</Card>
	</div>

	<!-- Trend chart -->
	<Card>
		<h3 class="font-title-md text-[16px] text-ink mb-5">Attendance Trend</h3>
		<div class="h-52">
			<AttendanceTrendChart data={trend} />
		</div>
	</Card>

	<!-- Student breakdown table -->
	{#if totalStudents > 0}
		<Card>
			<h3 class="font-title-md text-[16px] text-ink mb-5">Student Breakdown</h3>
			<div class="overflow-x-auto">
				<table class="w-full text-[13px]">
					<thead>
						<tr class="text-left border-b border-hairline">
							<th
								class="pb-3 font-caption-uppercase text-muted uppercase text-[11px] tracking-wider"
								>Name</th
							>
							<th
								class="pb-3 font-caption-uppercase text-muted uppercase text-[11px] tracking-wider"
								>Rate</th
							>
							<th
								class="pb-3 font-caption-uppercase text-muted uppercase text-[11px] tracking-wider hidden sm:table-cell"
								>Present</th
							>
							<th
								class="pb-3 font-caption-uppercase text-muted uppercase text-[11px] tracking-wider hidden sm:table-cell"
								>Late</th
							>
							<th
								class="pb-3 font-caption-uppercase text-muted uppercase text-[11px] tracking-wider hidden sm:table-cell"
								>Absent</th
							>
							<th
								class="pb-3 font-caption-uppercase text-muted uppercase text-[11px] tracking-wider hidden md:table-cell"
								>Excused</th
							>
						</tr>
					</thead>
					<tbody>
						{#each await studentSummary as s (s.student_email)}
							<tr
								class="border-b border-hairline/50 last:border-0 hover:bg-surface-container-lowest transition-colors"
							>
								<td class="py-3 pr-4">
									<p class="font-body-strong text-ink">{s.student_name}</p>
									<p class="text-muted text-[11px]">{s.student_email}</p>
								</td>
								<td class="py-3 pr-4">
									<div class="flex items-center gap-3">
										{const rate = s.attendance_rate}
										{const rateColor =
											rate >= 80
												? 'text-semantic-success'
												: rate >= 60
													? 'text-amber-600'
													: 'text-semantic-error'}
										<span class="font-body-strong {rateColor}">{rate}%</span>
										<!-- inline bar -->
										<div
											class="h-1.5 w-16 bg-hairline rounded-full overflow-hidden hidden sm:block"
										>
											<div
												class="h-full rounded-full transition-all duration-300 {rate >= 80
													? 'bg-semantic-success'
													: rate >= 60
														? 'bg-amber-500'
														: 'bg-semantic-error'}"
												style="width: {rate}%"
											></div>
										</div>
									</div>
								</td>
								<td class="py-3 pr-4 text-ink hidden sm:table-cell">{s.present_count}</td>
								<td class="py-3 pr-4 text-amber-600 hidden sm:table-cell">{s.late_count}</td>
								<td class="py-3 pr-4 text-semantic-error hidden sm:table-cell"
									>{s.absent_count}</td
								>
								<td class="py-3 text-muted hidden md:table-cell">{s.excused_count}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card>
	{:else}
		<div
			class="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
		>
			<BarChart2 class="w-10 h-10 text-muted-soft mb-3" strokeWidth={1.5} />
			<h3 class="font-title-md text-ink text-[16px]">No Data Yet</h3>
			<p class="text-muted text-[13px] mt-1">
				Create sessions and record attendance to see analytics.
			</p>
		</div>
	{/if}
</div>
