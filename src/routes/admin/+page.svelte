<script lang="ts">
	import { AreaChart, PieChart } from 'layerchart';
	import { getRevenueOverview, exportRevenueCsv } from './data.remote';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import { PLAN_LABELS } from '$lib/plans';

	const overview = $derived(await getRevenueOverview());
	let exporting = $state(false);

	const currency = (n: number) =>
		n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });

	const monthlyTotals = $derived(
		(() => {
			const map = new Map<string, number>();
			for (const row of overview.monthly) {
				const key = String(row.month).slice(0, 10);
				map.set(key, (map.get(key) ?? 0) + Number(row.total_revenue));
			}
			return [...map.entries()]
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([month, total]) => ({ date: new Date(month), total }));
		})()
	);

	const sourceChart = $derived(
		overview.bySource.map((r) => ({
			key: r.revenue_source,
			label: r.revenue_source.replace('_', ' '),
			value: Number(r.total_revenue)
		}))
	);

	const SOURCE_COLORS: Record<string, string> = {
		subscription: 'var(--color-ink)',
		service_fee: 'var(--color-gradient-sky)',
		ads: 'var(--color-gradient-peach)',
		data_sale: 'var(--color-gradient-mint)'
	};

	async function handleExport() {
		exporting = true;
		try {
			const csv = await exportRevenueCsv();
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute('download', `attendlink_revenue_${new Date().toISOString().slice(0, 10)}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} finally {
			exporting = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
		<div>
			<h1 class="font-display-lg text-[28px] text-ink tracking-tight">Revenue dashboard</h1>
			<p class="text-muted text-[14px] mt-2">
				Unprotected developer view of subscriptions and platform income.
			</p>
		</div>
		<Button variant="outline" size="sm" disabled={exporting} onclick={handleExport}>
			{exporting ? 'Exporting…' : 'Export CSV'}
		</Button>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<Card>
			<p class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase">
				Total revenue
			</p>
			<p class="font-display-md text-[28px] text-ink mt-2">{currency(overview.totalRevenue)}</p>
		</Card>
		<Card>
			<p class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase">
				Est. MRR
			</p>
			<p class="font-display-md text-[28px] text-ink mt-2">{currency(overview.mrr)}</p>
		</Card>
		<Card>
			<p class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase">
				Transactions
			</p>
			<p class="font-display-md text-[28px] text-ink mt-2">{overview.transactionCount}</p>
		</Card>
	</div>

	<div class="grid md:grid-cols-2 gap-4">
		<Card class="min-h-72">
			<h2 class="font-title-md text-[16px] text-ink font-semibold mb-5">Revenue by month</h2>
			{#if monthlyTotals.length === 0}
				<p class="text-muted text-[13px]">No payment data yet.</p>
			{:else}
				<div class="h-56">
					<AreaChart
						data={monthlyTotals}
						x="date"
						y="total"
						padding={{ left: 16, bottom: 8, top: 8, right: 16 }}
						axis={true}
						grid={true}
						props={{
							xAxis: {
								format: (d: Date) =>
									new Date(d).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
							},
							yAxis: {
								format: (v: number) => `$${v}`
							},
							area: { fillOpacity: 0.15, class: 'fill-ink' },
							line: { class: 'stroke-ink', strokeWidth: 2 }
						}}
						series={[{ key: 'total', label: 'Revenue', color: 'var(--color-ink)' }]}
					/>
				</div>
			{/if}
		</Card>

		<Card class="min-h-72">
			<h2 class="font-title-md text-[16px] text-ink font-semibold mb-5">By source</h2>
			{#if sourceChart.length === 0}
				<p class="text-muted text-[13px]">No payment data yet.</p>
			{:else}
				<div class="h-56">
					<PieChart
						data={sourceChart}
						key="key"
						label="label"
						value="value"
						c="key"
						cRange={sourceChart.map((d) => SOURCE_COLORS[d.key] ?? 'var(--color-muted)')}
						innerRadius={0.55}
						legend={true}
					/>
				</div>
			{/if}
		</Card>
	</div>

	<Card>
		<h2 class="font-title-md text-[16px] text-ink font-semibold mb-5">Active subscribers</h2>
		<div class="flex flex-wrap gap-5">
			{#each overview.planCounts as row (row.plan)}
				<div>
					<p class="text-[12px] text-muted uppercase tracking-wider">
						{PLAN_LABELS[row.plan]}
					</p>
					<p class="font-display-md text-[22px] text-ink">{row.subscriber_count}</p>
				</div>
			{:else}
				<p class="text-muted text-[13px]">No subscribers yet.</p>
			{/each}
		</div>
	</Card>

	<Card padded={false} class="overflow-hidden">
		<div class="px-6 py-5 border-b border-hairline">
			<h2 class="font-title-md text-[16px] text-ink font-semibold">Recent payments</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-[13px]">
				<thead class="bg-surface-container text-muted font-caption-uppercase text-[10px] tracking-wider">
					<tr>
						<th class="px-6 py-3 font-semibold">Date</th>
						<th class="px-6 py-3 font-semibold">Source</th>
						<th class="px-6 py-3 font-semibold">Amount</th>
						<th class="px-6 py-3 font-semibold">User</th>
						<th class="px-6 py-3 font-semibold">Description</th>
					</tr>
				</thead>
				<tbody>
					{#each overview.recentPayments as payment (payment.id)}
						<tr class="border-t border-hairline">
							<td class="px-6 py-3 text-muted whitespace-nowrap">
								{new Date(payment.created_at).toLocaleDateString()}
							</td>
							<td class="px-6 py-3 capitalize text-ink">{payment.source.replace('_', ' ')}</td>
							<td class="px-6 py-3 text-ink font-medium">
								{currency(Number(payment.amount))}
							</td>
							<td class="px-6 py-3 text-muted">
								{payment.email ?? '—'}
							</td>
							<td class="px-6 py-3 text-muted max-w-xs truncate">
								{payment.description ?? '—'}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-6 py-6 text-muted text-center">No payments yet.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>
</div>
