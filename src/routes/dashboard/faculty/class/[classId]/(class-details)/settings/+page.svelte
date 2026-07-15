<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		getNetworkRestrictions,
		addNetworkRestriction,
		removeNetworkRestriction
	} from '../../data.remote';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Card from '$lib/components/Card.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const classId = $derived(params.classId);

	const data = $derived(await getNetworkRestrictions(classId));
	let asnInput = $state('');
	let formError = $state<string | null>(null);
	let busy = $state(false);

	async function handleAdd(e: Event) {
		e.preventDefault();
		formError = null;
		const allowedAsn = Number(asnInput);
		if (!Number.isInteger(allowedAsn) || allowedAsn < 1) {
			formError = 'Enter a positive integer ASN.';
			return;
		}
		busy = true;
		try {
			await addNetworkRestriction({ classId, allowedAsn });
			asnInput = '';
		} catch (err) {
			formError = err instanceof Error ? err.message : 'Failed to add ASN';
		} finally {
			busy = false;
		}
	}

	async function handleRemove(allowedAsn: number) {
		busy = true;
		formError = null;
		try {
			await removeNetworkRestriction({ classId, allowedAsn });
		} catch (err) {
			formError = err instanceof Error ? err.message : 'Failed to remove ASN';
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex flex-col gap-6 max-w-xl">
	<div>
		<h2 class="font-title-md text-[18px] text-ink font-semibold">Network restrictions</h2>
		<p class="text-muted text-[14px] mt-2 leading-relaxed">
			Allow student check-ins only from listed ASNs (campus Wi‑Fi). Leave empty to allow any
			network. Local / private IPs resolve to demo ASN <code class="text-ink">64512</code>.
		</p>
	</div>

	{#if !data.canManage}
		<Card gradientOrb={true} orbVariant="peach">
			<p class="text-ink text-[15px] font-medium mb-3">Enterprise feature</p>
			<p class="text-muted text-[14px] mb-4">
				ASN allowlists are available on the Enterprise plan. Your current plan is
				<span class="text-ink capitalize">{data.plan}</span>.
			</p>
			<a href={resolve('/dashboard/faculty/billing')}>
				<Button size="sm">Upgrade to Enterprise</Button>
			</a>
		</Card>
	{:else}
		{#if formError}
			<div
				class="p-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-[14px]"
			>
				{formError}
			</div>
		{/if}

		<form class="flex flex-col sm:flex-row gap-3 items-end" onsubmit={handleAdd}>
			<Input
				id="allowedAsn"
				label="Allowed ASN"
				type="number"
				placeholder="64512"
				bind:value={asnInput}
			/>
			<Button type="submit" size="sm" disabled={busy} class="shrink-0">Add ASN</Button>
		</form>

		{#if data.restrictions.length === 0}
			<p class="text-muted text-[14px]">No restrictions — any network can check in.</p>
		{:else}
			<ul class="flex flex-col gap-2 border border-hairline rounded-xl overflow-hidden">
				{#each data.restrictions as row (row.allowed_asn)}
					<li
						class="flex items-center justify-between px-5 py-3 bg-surface-container-lowest border-b border-hairline last:border-b-0"
					>
						<span class="font-body-strong text-[14px] text-ink">ASN {row.allowed_asn}</span>
						<Button
							variant="text"
							size="sm"
							disabled={busy}
							onclick={() => handleRemove(row.allowed_asn)}
							class="text-semantic-error"
						>
							Remove
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
