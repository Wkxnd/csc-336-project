<script lang="ts">
	import { AreaChart, PieChart } from 'layerchart';
	import {
		DollarSign,
		TrendingUp,
		Receipt,
		ChartLine,
		ChartPie,
		Users,
		Inbox
	} from '@lucide/svelte';
	import { getRevenueOverview, exportRevenueCsv } from './data.remote';
	import type { RevenueBySource, RevenueMonthly, PaymentWithUser, PlanCount } from './data.remote';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';
	import { PLAN_LABELS } from '$lib/plans';
	import type { RevenueDateRange } from '$lib/types';

	type Preset = 'all' | 'month' | '30d' | 'year' | 'custom';

	function toIsoDate(d: Date): string {
		return d.toISOString().slice(0, 10);
	}

	function presetRange(preset: Exclude<Preset, 'custom'>): RevenueDateRange {
		const now = new Date();
		if (preset === 'all') return { startDate: null, endDate: null };
		if (preset === '30d') {
			const start = new Date(now);
			start.setDate(start.getDate() - 30);
			return { startDate: toIsoDate(start), endDate: null };
		}
		if (preset === 'month') {
			return {
				startDate: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
				endDate: null
			};
		}
		return { startDate: toIsoDate(new Date(now.getFullYear(), 0, 1)), endDate: null };
	}

	let activePreset = $state<Preset>('all');
	let range = $state<RevenueDateRange>(presetRange('all'));

	function selectPreset(preset: Exclude<Preset, 'custom'>) {
		activePreset = preset;
		range = presetRange(preset);
	}

	function setCustomStart(value: string) {
		activePreset = 'custom';
		range = { ...range, startDate: value || null };
	}

	function setCustomEnd(value: string) {
		activePreset = 'custom';
		range = { ...range, endDate: value || null };
	}

	const dateRangeError = $derived(
		range.startDate && range.endDate && range.startDate > range.endDate
			? 'From date must be before To date'
			: null
	);

	const EMPTY_OVERVIEW = {
		bySource: [] as RevenueBySource[],
		monthly: [] as RevenueMonthly[],
		recentPayments: [] as PaymentWithUser[],
		planCounts: [] as PlanCount[],
		totalRevenue: 0,
		transactionCount: 0,
		mrr: 0
	};

	const overviewQuery = $derived(getRevenueOverview(range));
	const overview = $derived(overviewQuery.current ?? EMPTY_OVERVIEW);
	let exporting = $state(false);
	let exportError = $state<string | null>(null);

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
		ads: 'var(--color-gradient-peach)',
		data_sale: 'var(--color-gradient-mint)'
	};

	const AREA_CHART_PADDING = { left: 16, bottom: 8, top: 8, right: 16 };
	const AREA_CHART_SERIES = [{ key: 'total', label: 'Revenue', color: 'var(--color-ink)' }];
	const AREA_CHART_PROPS = {
		xAxis: {
			format: (d: Date) =>
				new Date(d).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
		},
		yAxis: {
			format: (v: number) => `$${v}`
		},
		area: { fillOpacity: 0.15, class: 'fill-ink' },
		line: { class: 'stroke-ink', strokeWidth: 2 }
	};

	async function handleExport() {
		exporting = true;
		exportError = null;
		try {
			const csv = await exportRevenueCsv(range);
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.setAttribute(
				'download',
				`attendlink_revenue_${new Date().toISOString().slice(0, 10)}.csv`
			);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error('Failed to export revenue CSV:', err);
			exportError = err instanceof Error ? err.message : 'Failed to export CSV';
		} finally {
			exporting = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="flex items-center gap-3">
				<h1
					class="font-display-lg text-[32px] leading-tight tracking-tight text-ink sm:text-[36px]"
				>
					Revenue dashboard
				</h1>
				{#if overviewQuery.loading}
					<span class="text-[12px] text-muted animate-pulse">Updating…</span>
				{/if}
			</div>
			<p class="mt-1.5 text-[14px] text-muted">
				Unprotected developer view of subscriptions and platform income.
			</p>
		</div>
		<div class="flex flex-col items-start gap-1 sm:items-end">
			<Button variant="outline" size="sm" disabled={exporting} onclick={handleExport}>
				{exporting ? 'Exporting…' : 'Export CSV'}
			</Button>
			{#if exportError}
				<span class="text-[12px] text-semantic-error">{exportError}</span>
			{/if}
		</div>
	</div>

	<Card padded={false} class="flex flex-col gap-4 p-4 sm:p-5">
		<div class="flex flex-wrap items-center gap-2">
			<Button
				variant={activePreset === 'all' ? 'primary' : 'outline'}
				size="sm"
				onclick={() => selectPreset('all')}
			>
				All time
			</Button>
			<Button
				variant={activePreset === '30d' ? 'primary' : 'outline'}
				size="sm"
				onclick={() => selectPreset('30d')}
			>
				Last 30 days
			</Button>
			<Button
				variant={activePreset === 'month' ? 'primary' : 'outline'}
				size="sm"
				onclick={() => selectPreset('month')}
			>
				This month
			</Button>
			<Button
				variant={activePreset === 'year' ? 'primary' : 'outline'}
				size="sm"
				onclick={() => selectPreset('year')}
			>
				This year
			</Button>
		</div>
		<div
			class="flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:flex-wrap sm:items-start"
		>
			<div class="w-full sm:w-auto">
				<Input
					id="revenueStartDate"
					label="From"
					type="date"
					class="sm:w-48"
					value={range.startDate ?? ''}
					error={dateRangeError ?? ''}
					oninput={(e) => setCustomStart(e.currentTarget.value)}
				/>
			</div>
			<div class="w-full sm:w-auto">
				<Input
					id="revenueEndDate"
					label="To"
					type="date"
					class="sm:w-48"
					value={range.endDate ?? ''}
					error={dateRangeError ?? ''}
					oninput={(e) => setCustomEnd(e.currentTarget.value)}
				/>
			</div>
		</div>
	</Card>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
		<Card class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<p class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase">
					Total revenue
				</p>
				<DollarSign class="h-4 w-4 text-muted-soft" strokeWidth={1.5} />
			</div>
			<p class="font-display-md text-[28px] leading-none text-ink">
				{currency(overview.totalRevenue)}
			</p>
		</Card>
		<Card class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<p class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase">
					Est. MRR
				</p>
				<TrendingUp class="h-4 w-4 text-muted-soft" strokeWidth={1.5} />
			</div>
			<p class="font-display-md text-[28px] leading-none text-ink">{currency(overview.mrr)}</p>
			<p class="text-[11px] text-muted-soft">Current run rate, not scoped to date range</p>
		</Card>
		<Card class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<p class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase">
					Transactions
				</p>
				<Receipt class="h-4 w-4 text-muted-soft" strokeWidth={1.5} />
			</div>
			<p class="font-display-md text-[28px] leading-none text-ink">{overview.transactionCount}</p>
		</Card>
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<Card class={monthlyTotals.length > 0 ? 'min-h-72' : ''}>
			<h2 class="font-title-md mb-5 text-[16px] font-semibold text-ink">Revenue by month</h2>
			{#if monthlyTotals.length === 0}
				<div class="flex flex-col items-center gap-2 py-8 text-center">
					<ChartLine class="h-7 w-7 text-muted-soft" strokeWidth={1.5} />
					<p class="text-[13px] font-medium text-ink">No revenue yet</p>
					<p class="max-w-64 text-[12px] text-muted">
						Once payments start coming in, monthly revenue trends will appear here.
					</p>
				</div>
			{:else}
				<div class="h-56">
					<AreaChart
						data={monthlyTotals}
						x="date"
						y="total"
						padding={AREA_CHART_PADDING}
						axis={true}
						grid={true}
						props={AREA_CHART_PROPS}
						series={AREA_CHART_SERIES}
					/>
				</div>
			{/if}
		</Card>

		<Card class={sourceChart.length > 0 ? 'min-h-72' : ''}>
			<h2 class="font-title-md mb-5 text-[16px] font-semibold text-ink">By source</h2>
			{#if sourceChart.length === 0}
				<div class="flex flex-col items-center gap-2 py-8 text-center">
					<ChartPie class="h-7 w-7 text-muted-soft" strokeWidth={1.5} />
					<p class="text-[13px] font-medium text-ink">No revenue sources yet</p>
					<p class="max-w-64 text-[12px] text-muted">
						A breakdown by subscriptions, fees, ads, and data sales will show up here.
					</p>
				</div>
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
		<h2 class="font-title-md mb-5 text-[16px] font-semibold text-ink">Active subscribers</h2>
		{#if overview.planCounts.length === 0}
			<div class="flex flex-col items-center gap-2 py-6 text-center">
				<Users class="h-7 w-7 text-muted-soft" strokeWidth={1.5} />
				<p class="text-[13px] font-medium text-ink">No subscribers yet</p>
				<p class="max-w-64 text-[12px] text-muted">
					Faculty subscriptions will show up here once someone upgrades.
				</p>
			</div>
		{:else}
			<div class="flex flex-wrap gap-5">
				{#each overview.planCounts as row (row.plan)}
					<div>
						<p class="text-[12px] tracking-wider text-muted uppercase">
							{PLAN_LABELS[row.plan]}
						</p>
						<p class="font-display-md mt-1 text-[22px] text-ink">{row.subscriber_count}</p>
					</div>
				{/each}
			</div>
		{/if}
	</Card>

	<Card padded={false} class="overflow-hidden">
		<div class="border-b border-hairline px-6 py-5">
			<h2 class="font-title-md text-[16px] font-semibold text-ink">Recent payments</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-[13px]">
				<thead
					class="font-caption-uppercase border-b border-hairline bg-surface-container-high text-[10px] tracking-wider text-muted"
				>
					<tr>
						<th class="px-6 py-3 font-semibold">Date</th>
						<th class="px-6 py-3 font-semibold">Source</th>
						<th class="px-6 py-3 text-right font-semibold">Amount</th>
						<th class="px-6 py-3 font-semibold">User</th>
						<th class="px-6 py-3 font-semibold">Description</th>
					</tr>
				</thead>
				<tbody>
					{#each overview.recentPayments as payment (payment.id)}
						<tr
							class="border-t border-hairline transition-colors hover:bg-surface-container-lowest"
						>
							<td class="px-6 py-3 whitespace-nowrap text-muted">
								{new Date(payment.created_at).toLocaleDateString()}
							</td>
							<td class="px-6 py-3 text-ink capitalize">{payment.source.replace('_', ' ')}</td>
							<td class="px-6 py-3 text-right font-medium tabular-nums text-ink">
								{currency(Number(payment.amount))}
							</td>
							<td class="px-6 py-3 text-muted">
								{payment.email ?? '—'}
							</td>
							<td class="max-w-xs truncate px-6 py-3 text-muted">
								{payment.description ?? '—'}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-6 py-10">
								<div class="flex flex-col items-center gap-2 text-center">
									<Inbox class="h-7 w-7 text-muted-soft" strokeWidth={1.5} />
									<p class="text-[13px] font-medium text-ink">No payments yet</p>
									<p class="text-[12px] text-muted">
										Transactions will appear here once revenue starts coming in.
									</p>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</Card>
</div>
