<script lang="ts">
	import { AreaChart } from 'layerchart';
	import type { AttendanceTrendPoint } from '$lib/types';

	interface Props {
		data: AttendanceTrendPoint[];
	}

	let { data }: Props = $props();

	const parsed = $derived(
		data.map((d) => ({
			...d,
			date: new Date(d.session_date),
			attendance_rate: Number(d.attendance_rate)
		}))
	);
</script>

{#if parsed.length === 0}
	<div
		class="flex items-center justify-center h-full text-muted text-[13px] text-center py-8 px-5"
	>
		No session data yet. Create and run sessions to see trends.
	</div>
{:else}
	<AreaChart
		data={parsed}
		x="date"
		y="attendance_rate"
		yDomain={[0, 100]}
		yNice={false}
		padding={{ left: 16, bottom: 8, top: 8, right: 16 }}
		axis={true}
		grid={true}
		props={{
			xAxis: {
				format: (d: any) =>
					new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
			},
			yAxis: {
				format: (v: any) => `${v}%`
			},
			area: { fillOpacity: 0.15, class: 'fill-ink' },
			line: { class: 'stroke-ink', strokeWidth: 2 },
			highlight: {
				points: { class: 'fill-ink', r: 4 },
				lines: { class: 'stroke-ink/20' }
			},
			tooltip: {
				item: { class: 'text-[13px]' }
			}
		}}
		series={[
			{
				key: 'attendance_rate',
				label: 'Attendance Rate',
				color: 'var(--color-ink)'
			}
		]}
	/>
{/if}
