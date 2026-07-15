<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		class?: string;
		gradientOrb?: boolean;
		orbVariant?: 'sky' | 'peach' | 'lavender' | 'mint' | 'rose';
		padded?: boolean;
		children?: Snippet;
	}

	let {
		class: className = '',
		gradientOrb = false,
		orbVariant = 'sky',
		padded = true,
		children
	}: Props = $props();

	// Style mappings based on the Chronicle design spec
	const bgGradientMap = {
		sky: 'bg-gradient-sky',
		peach: 'bg-gradient-peach',
		lavender: 'bg-gradient-lavender',
		mint: 'bg-gradient-mint',
		rose: 'bg-gradient-rose'
	};
</script>

<div
	class="relative overflow-hidden bg-surface-card border border-hairline rounded-xl shadow-sm transition-all duration-300 {padded
		? 'p-6'
		: ''} {className}"
>
	{#if gradientOrb}
		<!-- Ambient Background Gradient Orb -->
		<div
			class="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-[48px] opacity-25 pointer-events-none mix-blend-multiply {bgGradientMap[
				orbVariant
			]}"
		></div>
	{/if}

	<div class="relative z-10">
		{@render children?.()}
	</div>
</div>
