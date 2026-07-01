<script lang="ts">
	import { resolve } from '$app/paths';
	import { logout, getCurrentUser } from '$lib/auth.remote';
	import Button from '$lib/components/Button.svelte';

	let { sidebarOpen = $bindable(true) }: { sidebarOpen?: boolean } = $props();

	const user = $derived(await getCurrentUser());

	const navLinks = $derived(
		user.role === 'faculty'
			? [
					{ name: 'Dashboard', icon: 'dashboard', href: '/dashboard/faculty' as const },
					{ name: 'Assistant', icon: 'assistant', href: '/dashboard/faculty/assistant' as const }
				]
			: [{ name: 'Dashboard', icon: 'dashboard', href: '/dashboard/student' as const }]
	);
</script>

<aside
	class="h-screen border-r border-hairline bg-surface-container-lowest flex flex-col transition-all duration-300 relative z-20 shrink-0 {sidebarOpen
		? 'w-64'
		: 'w-0 overflow-hidden border-r-0'}"
>
	<!-- TODO: use lucide svelte instead of svg -->
	<div class="h-20 flex items-center px-lg border-b border-hairline shrink-0 justify-between">
		<a href={resolve(`/dashboard/${user.role}`)} class="flex items-center gap-sm">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-6 h-6 text-ink"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
				/>
			</svg>
			<span class="font-display-md text-[20px] text-ink font-normal tracking-tight">AttendLink</span
			>
		</a>
		<button
			type="button"
			aria-label="Close sidebar"
			onclick={() => (sidebarOpen = false)}
			class="text-muted hover:text-ink transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container cursor-pointer"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-5 h-5"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
		</button>
	</div>

	<nav class="flex-1 px-sm py-md overflow-y-auto flex flex-col gap-xs">
		{#each navLinks as link (link.href)}
			<a
				class="flex items-center gap-sm px-sm py-xs rounded-lg bg-surface-container text-ink font-body-strong transition-colors"
				href={resolve(link.href)}
			>
				{#if link.icon === 'assistant'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-5 h-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
						/>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-5 h-5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
						/>
					</svg>
				{/if}
				{link.name}
			</a>
		{/each}
	</nav>

	<div class="p-md border-t border-hairline shrink-0 flex flex-col gap-sm">
		<div class="flex items-center gap-sm p-xs rounded-lg">
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
