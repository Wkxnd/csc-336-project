<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { logout, getCurrentUser } from '$lib/auth.remote';
	import type { User } from '$lib/types';
	import Button from '$lib/components/Button.svelte';

	let { children } = $props();

	// Query the current user (caching handles deduplication)
	const userQuery = getCurrentUser();
	let user = $state<User | null>(null);
	let loading = $state(true);

	// Await the promise resolution to determine authentication status safely
	$effect(() => {
		userQuery.then((val) => {
			console.log('E2E_DEBUG: getCurrentUser resolved to:', val);
			user = val;
			loading = false;
			if (!val) {
				const returnTo = window.location.pathname + window.location.search;
				goto(resolve('/') + `?redirect=${encodeURIComponent(returnTo)}`);
			}
		});
	});

	async function handleLogout() {
		try {
			await logout();
			goto(resolve('/'));
		} catch (e) {
			console.error('Logout error:', e);
		}
	}

	// Navigation lists based on role
	const navLinks = $derived(
		user?.role === 'faculty'
			? [{ name: 'Dashboard', icon: 'dashboard', href: '/dashboard/faculty' as const }]
			: [{ name: 'Dashboard', icon: 'dashboard', href: '/dashboard/student' as const }]
	);

	let sidebarOpen = $state(true);
</script>

{#if user}
	<div class="min-h-screen bg-surface flex relative font-body-md text-body antialiased">
		<!-- Sidebar Panel -->
		<aside
			class="h-screen border-r border-hairline bg-surface-container-lowest flex flex-col transition-all duration-300 relative z-20 shrink-0 {sidebarOpen
				? 'w-64'
				: 'w-0 overflow-hidden border-r-0'}"
		>
			<!-- Logo Block -->
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
					<span class="font-display-md text-[20px] text-ink font-normal tracking-tight"
						>AttendLink</span
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

			<!-- Navigation items -->
			<nav class="flex-1 px-sm py-md overflow-y-auto flex flex-col gap-xs">
				{#each navLinks as link (link.href)}
					<a
						class="flex items-center gap-sm px-sm py-xs rounded-lg bg-surface-container text-ink font-body-strong transition-colors"
						href={resolve(link.href)}
					>
						<!-- Dashboard Lucide Icon -->
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
						{link.name}
					</a>
				{/each}
			</nav>

			<!-- Profile & Logout Panel -->
			<div class="p-md border-t border-hairline shrink-0 flex flex-col gap-sm">
				<div class="flex items-center gap-sm p-xs rounded-lg">
					<div
						class="w-10 h-10 rounded-full bg-gradient-sky flex items-center justify-center font-body-strong text-ink font-semibold"
					>
						{user.firstName[0]}{user.lastName[0]}
					</div>
					<div class="flex-1 min-w-0">
						<p class="font-body-strong text-ink truncate text-[14px]">
							{user.firstName}
							{user.lastName}
						</p>
						<p class="font-caption-uppercase text-[10px] text-muted truncate mt-0.5 uppercase">
							{user.role}
						</p>
					</div>
				</div>

				<Button variant="outline" size="sm" class="w-full text-xs" onclick={handleLogout}>
					Sign Out
				</Button>
			</div>
		</aside>

		<!-- Main Workspace Content -->
		<div class="flex-1 flex flex-col h-screen overflow-hidden">
			<!-- Header Bar -->
			<header
				class="h-20 border-b border-hairline px-lg flex items-center justify-between shrink-0"
			>
				<div class="flex items-center gap-sm">
					{#if !sidebarOpen}
						<button
							type="button"
							aria-label="Open sidebar"
							onclick={() => (sidebarOpen = true)}
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
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
								/>
							</svg>
						</button>
					{/if}
					<h2 class="font-title-md text-[18px] text-ink capitalize">{user.role} Portal</h2>
				</div>

				<div class="text-xs text-muted-soft">
					Local time: {new Date().toLocaleDateString(undefined, {
						weekday: 'long',
						month: 'short',
						day: 'numeric'
					})}
				</div>
			</header>

			<!-- Content Scroll viewport -->
			<div class="flex-1 overflow-y-auto p-lg bg-surface relative">
				<!-- Ambient Gradient Orb -->
				<div
					class="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-mint rounded-full blur-[100px] opacity-10 pointer-events-none"
				></div>
				{@render children()}
			</div>
		</div>
	</div>
{:else if loading}
	<!-- Session Loading Mask -->
	<div class="min-h-screen bg-surface flex items-center justify-center">
		<p class="text-muted animate-pulse font-title-md">Loading Session...</p>
	</div>
{/if}
