<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { ChevronRight } from '@lucide/svelte';

	interface Crumb {
		label: string;
		href?: Pathname;
	}

	interface Props {
		crumbs?: Crumb[];
	}

	let { crumbs = [] }: Props = $props();
</script>

{#if crumbs.length > 0}
	<nav aria-label="Breadcrumb" class="flex items-center gap-1.5 text-[13px] text-muted mb-lg">
		{#each crumbs as crumb, i (i)}
			{#if i > 0}
				<ChevronRight class="w-3.5 h-3.5 text-muted-soft shrink-0" />
			{/if}

			{#if crumb.href && i < crumbs.length - 1}
				<a href={resolve(crumb.href)} class="hover:text-ink transition-colors truncate max-w-50">
					{crumb.label}
				</a>
			{:else}
				<span class="text-ink font-medium truncate max-w-62.5">
					{crumb.label}
				</span>
			{/if}
		{/each}
	</nav>
{/if}
