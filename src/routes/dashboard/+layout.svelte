<script lang="ts">
	import { Menu } from '@lucide/svelte';
	import DashboardNav from '$lib/components/DashboardNav.svelte';

	let { children } = $props();

	let sidebarOpen = $state(true);
</script>

<div class="h-screen bg-surface flex relative font-body-md text-body antialiased overflow-hidden">
	<DashboardNav bind:sidebarOpen />

	<div class="flex-1 flex flex-col min-h-0">
		<div class="flex-1 overflow-y-auto overflow-x-hidden p-lg bg-surface relative">
			{#if !sidebarOpen}
				<button
					type="button"
					aria-label="Open sidebar"
					onclick={() => (sidebarOpen = true)}
					class="absolute top-lg left-lg text-muted hover:text-ink transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container cursor-pointer z-10"
				>
					<Menu class="w-5 h-5" strokeWidth={1.5} />
				</button>
			{/if}

			<div
				class="fixed -bottom-40 -right-40 w-96 h-96 bg-gradient-mint rounded-full blur-[100px] opacity-10 pointer-events-none"
			></div>
			{@render children()}
		</div>
	</div>
</div>
