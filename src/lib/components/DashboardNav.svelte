<script lang="ts">
	import { resolve } from '$app/paths';
	import { BadgeCheck, ChartColumn, ChevronLeft, MessageCircle, CreditCard } from '@lucide/svelte';
	import { logout, getCurrentUser } from '$lib/auth.remote';
	import Button from '$lib/components/Button.svelte';

	let { sidebarOpen = $bindable(true) }: { sidebarOpen?: boolean } = $props();

	const user = $derived(await getCurrentUser());

	const navLinks = $derived(
		user.role === 'faculty'
			? [
					{ name: 'Dashboard', icon: ChartColumn, href: '/dashboard/faculty' as const },
					{ name: 'Assistant', icon: MessageCircle, href: '/dashboard/faculty/assistant' as const },
					{ name: 'Billing', icon: CreditCard, href: '/dashboard/faculty/billing' as const }
				]
			: [{ name: 'Dashboard', icon: ChartColumn, href: '/dashboard/student' as const }]
	);
</script>

<aside
	class="h-screen border-r border-hairline bg-surface-container-lowest flex flex-col transition-all duration-300 relative z-20 shrink-0 {sidebarOpen
		? 'w-64'
		: 'w-0 overflow-hidden border-r-0'}"
>
	<div class="h-20 flex items-center px-6 border-b border-hairline shrink-0 justify-between">
		<a href={resolve(`/dashboard/${user.role}`)} class="flex items-center gap-3">
			<BadgeCheck class="w-6 h-6 text-ink" strokeWidth={1.5} />
			<span class="font-display-md text-[20px] text-ink font-normal tracking-tight">AttendLink</span
			>
		</a>
		<button
			type="button"
			aria-label="Close sidebar"
			onclick={() => (sidebarOpen = false)}
			class="text-muted hover:text-ink transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container cursor-pointer"
		>
			<ChevronLeft class="w-5 h-5" strokeWidth={1.5} />
		</button>
	</div>

	<nav class="flex-1 px-3 py-5 overflow-y-auto flex flex-col gap-2">
		{#each navLinks as link (link.href)}
			<a
				class="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-container text-ink font-body-strong transition-colors"
				href={resolve(link.href)}
			>
				<link.icon class="w-5 h-5" strokeWidth={1.5} />
				{link.name}
			</a>
		{/each}
	</nav>

	<div class="p-5 border-t border-hairline shrink-0 flex flex-col gap-3">
		<div class="flex items-center gap-3 p-2 rounded-lg">
			<div
				class="w-10 h-10 rounded-full bg-gradient-sky flex items-center justify-center font-body-strong text-ink font-semibold"
			>
				{user.first_name[0]}{user.last_name[0]}
			</div>
			<div class="flex-1 min-w-0">
				<p class="font-body-strong text-ink truncate text-[14px]">
					{user.first_name}
					{user.last_name}
				</p>
				<p class="font-caption-uppercase text-[10px] text-muted truncate mt-0.5 uppercase">
					{user.role}
				</p>
			</div>
		</div>

		<form {...logout}>
			<Button
				type="submit"
				variant="outline"
				size="sm"
				class="w-full text-xs"
				disabled={!!logout.pending}
			>
				Sign Out
			</Button>
		</form>
	</div>
</aside>
