<script lang="ts">
	import { Menu } from '@lucide/svelte';
	import DashboardNav from '$lib/components/DashboardNav.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import { breadcrumbs } from '$lib/breadcrumbs.svelte';

	let { children } = $props();

	let sidebarOpen = $state(true);
</script>

<div class="h-screen bg-surface flex relative font-body-md text-body antialiased overflow-hidden">
	<DashboardNav bind:sidebarOpen />

	<div class="flex-1 flex flex-col min-h-0">
		<header
			class="h-20 flex items-center px-6 border-b border-hairline bg-surface-container-lowest shrink-0 gap-3 relative z-10"
		>
			{#if !sidebarOpen}
				<button
					type="button"
					aria-label="Open sidebar"
					onclick={() => (sidebarOpen = true)}
					class="text-muted hover:text-ink transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container cursor-pointer z-10 shrink-0"
				>
					<Menu class="w-5 h-5" strokeWidth={1.5} />
				</button>
			{/if}

			{#if breadcrumbs.crumbs.length > 0}
				<div class="flex items-center gap-3 min-w-0">
					<Breadcrumbs crumbs={breadcrumbs.crumbs} class="mb-0" />
					{#if breadcrumbs.extra}
						<span class="text-muted-soft text-[20px] select-none">|</span>
						<span class="text-muted text-[20px] font-normal font-display-lg truncate"
							>{breadcrumbs.extra}</span
						>
					{/if}
				</div>
			{/if}
		</header>

		<div class="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-surface relative">
			<div
				class="fixed -bottom-40 -right-40 w-96 h-96 bg-gradient-mint rounded-full blur-[100px] opacity-10 pointer-events-none"
			></div>
			{@render children()}
		</div>
	</div>
</div>
