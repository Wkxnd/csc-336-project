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
		class?: string;
	}

	let { crumbs = [], class: className = 'mb-lg' }: Props = $props();
</script>

{#if crumbs.length > 0}
	<nav
		aria-label="Breadcrumb"
		class="flex items-center gap-sm font-display-lg text-[24px] tracking-tight {className}"
	>
		{#each crumbs as crumb, i (i)}
			{#if i > 0}
				<ChevronRight class="w-5 h-5 text-muted-soft shrink-0" strokeWidth={1.5} />
			{/if}

			{#if crumb.href && i < crumbs.length - 1}
				<a
					href={resolve(crumb.href)}
					class="text-muted hover:text-ink transition-colors truncate max-w-64 font-normal"
				>
					{crumb.label}
				</a>
			{:else}
				<span class="text-ink font-normal truncate max-w-80">
					{crumb.label}
				</span>
			{/if}
		{/each}
	</nav>
{/if}
