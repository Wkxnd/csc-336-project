<script lang="ts">
	import { PieChart } from 'layerchart';

	interface Props {
		present: number;
		late: number;
		absent: number;
		excused: number;
	}

	let { present, late, absent, excused }: Props = $props();

	const STATUS_COLORS: Record<string, string> = {
		Present: 'var(--color-semantic-success)',
		Late: '#f59e0b',
		Absent: 'var(--color-semantic-error)',
		Excused: 'var(--color-gradient-sky)'
	};

	const chartData = $derived(
		[
			{ key: 'Present', label: 'Present', value: present },
			{ key: 'Late', label: 'Late', value: late },
			{ key: 'Absent', label: 'Absent', value: absent },
			{ key: 'Excused', label: 'Excused', value: excused }
		].filter((d) => d.value > 0)
	);

	const total = $derived(present + late + absent + excused);
</script>

{#if total === 0}
	<div class="flex items-center justify-center h-full text-muted text-[13px] text-center py-6">
		No attendance recorded yet.
	</div>
{:else}
	<div class="relative">
		<PieChart
			data={chartData}
			key="key"
			label="label"
			value="value"
			c="key"
			cRange={chartData.map((d) => STATUS_COLORS[d.key])}
			innerRadius={0.6}
			cornerRadius={3}
			padAngle={0.02}
			legend={true}
			props={{
				tooltip: {
					item: { class: 'text-[13px]' }
				}
			}}
		/>
		<!-- Center label -->
		<div
			class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
			style="padding-bottom: 32px"
		>
			<span class="font-display-md text-[22px] text-ink font-normal"
				>{Math.round((present / total) * 100)}%</span
			>
			<span class="text-[11px] text-muted uppercase tracking-wider font-caption-uppercase"
				>Present</span
			>
		</div>
	</div>
{/if}
