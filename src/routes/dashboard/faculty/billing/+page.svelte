<script lang="ts">
	import { getMySubscription, upgradePlan } from '$lib/billing.remote';
	import { PLAN_LABELS, PLAN_PRICES, PLAN_LIMIT_COPY } from '$lib/plans';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { breadcrumbs } from '$lib/breadcrumbs.svelte';
	import type { SubscriptionPlan } from '$lib/types';

	const subscription = $derived(await getMySubscription());
	let upgrading = $state<SubscriptionPlan | null>(null);
	let message = $state<string | null>(null);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		breadcrumbs.set([{ label: 'Billing' }]);
		return () => breadcrumbs.clear();
	});

	const tiers: { id: SubscriptionPlan; blurb: string; features: string[] }[] = [
		{
			id: 'free',
			blurb: 'Single class to evaluate AttendLink.',
			features: ['1 class', 'QR check-in', 'Live roster']
		},
		{
			id: 'premium',
			blurb: 'Unlimited teaching load with exports.',
			features: ['Unlimited classes', 'CSV export', 'Analytics']
		},
		{
			id: 'enterprise',
			blurb: 'Network allowlists for secure campuses.',
			features: ['Everything in Premium', 'ASN allowlists', 'IP enforcement on check-in']
		}
	];

	async function handleUpgrade(plan: SubscriptionPlan) {
		if (plan === subscription.plan) return;
		upgrading = plan;
		message = null;
		errorMessage = null;
		try {
			const result = await upgradePlan({ plan });
			message =
				plan === 'free'
					? 'Switched to Free.'
					: `Upgraded to ${PLAN_LABELS[plan]} — recorded $${result.amount.toFixed(2)}.`;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Upgrade failed';
		} finally {
			upgrading = null;
		}
	}
</script>

<div class="flex flex-col gap-6 max-w-4xl">
	<div>
		<p class="text-muted text-[14px] mb-2">Current plan</p>
		<div class="flex items-center gap-3">
			<h1 class="font-display-lg text-[28px] text-ink tracking-tight">
				{PLAN_LABELS[subscription.plan]}
			</h1>
			<Badge>{subscription.status}</Badge>
		</div>
		<p class="text-muted text-[14px] mt-2">
			One-click upgrades write a subscription + payment row. No card details needed.
		</p>
	</div>

	{#if message}
		<div
			class="p-3 rounded-lg bg-semantic-success/10 border border-semantic-success/20 text-semantic-success text-[14px]"
		>
			{message}
		</div>
	{/if}
	{#if errorMessage}
		<div
			class="p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-[14px]"
		>
			{errorMessage}
		</div>
	{/if}

	<div class="grid md:grid-cols-3 gap-4">
		{#each tiers as tier (tier.id)}
			{@const isCurrent = subscription.plan === tier.id}
			<Card class="h-full flex flex-col" gradientOrb={tier.id === 'premium'} orbVariant="sky">
				<h2 class="font-title-md text-[18px] text-ink font-semibold">{PLAN_LABELS[tier.id]}</h2>
				<p class="mt-2 mb-4">
					<span class="font-display-md text-[28px] text-ink">
						{PLAN_PRICES[tier.id] === 0 ? '$0' : `$${PLAN_PRICES[tier.id].toFixed(2)}`}
					</span>
					{#if PLAN_PRICES[tier.id] > 0}
						<span class="text-muted text-[13px]">/mo</span>
					{/if}
				</p>
				<p class="text-muted text-[13px] mb-4">{tier.blurb}</p>
				<ul class="flex flex-col gap-2 mb-6 flex-1">
					{#each tier.features as f (f)}
						<li class="text-[13px] text-on-surface-variant">✓ {f}</li>
					{/each}
				</ul>
				<Button
					variant={isCurrent ? 'outline' : 'primary'}
					size="sm"
					disabled={isCurrent || upgrading !== null}
					onclick={() => handleUpgrade(tier.id)}
					class="w-full"
				>
					{#if isCurrent}
						Current plan
					{:else if upgrading === tier.id}
						Updating…
					{:else if PLAN_PRICES[tier.id] === 0}
						Switch to Free
					{:else}
						Upgrade — ${PLAN_PRICES[tier.id].toFixed(2)}
					{/if}
				</Button>
			</Card>
		{/each}
	</div>

	<p class="text-[12px] text-muted-soft">
		{PLAN_LIMIT_COPY}
	</p>
</div>
