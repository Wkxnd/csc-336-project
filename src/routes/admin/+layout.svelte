<script lang="ts">
	import { resolve } from '$app/paths';
	import { BadgeCheck } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="min-h-screen bg-surface text-body font-body-md antialiased">
	<header
		class="h-16 flex items-center justify-between px-6 border-b border-hairline bg-surface-container-lowest"
	>
		<a href={resolve('/admin')} class="flex items-center gap-3">
			<BadgeCheck class="w-6 h-6 text-ink" strokeWidth={1.5} />
			<span class="font-display-md text-[18px] text-ink">AttendLink Revenue</span>
		</a>
		<a href={resolve('/')} class="text-[13px] text-muted hover:text-ink transition-colors"
			>Back to site</a
		>
	</header>
	<main class="max-w-6xl mx-auto p-6">{@render children()}</main>
</div>
