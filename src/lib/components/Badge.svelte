<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'present' | 'absent' | 'late' | 'excused' | 'info';
		children?: Snippet;
		class?: string;
	}

	let { variant = 'info', children, class: className = '' }: Props = $props();

	const variantStyles = {
		present: 'bg-gradient-mint/20 border-gradient-mint text-semantic-success',
		absent: 'bg-error-container/20 border-error-container text-semantic-error',
		late: 'bg-gradient-peach/20 border-gradient-peach text-secondary',
		excused: 'bg-gradient-lavender/20 border-gradient-lavender text-tertiary',
		info: 'bg-surface-container border-hairline text-muted'
	};
</script>

<span
	class="inline-flex items-center px-3 py-0.5 border rounded-full font-caption-uppercase text-caption-uppercase font-semibold tracking-wider select-none {variantStyles[
		variant
	]} {className}"
>
	{@render children?.()}
</span>
