<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'outline' | 'text';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		onclick,
		class: className = '',
		children
	}: Props = $props();

	// Style mappings based on the Chronicle design spec
	const baseStyles =
		'inline-flex items-center justify-center font-button font-medium rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50 disabled:cursor-not-allowed';

	const variantStyles = {
		primary: 'bg-ink text-surface-container-lowest hover:opacity-90 active:scale-[0.98]',
		outline:
			'bg-transparent border border-hairline text-ink hover:bg-surface-container active:scale-[0.98]',
		text: 'bg-transparent text-ink hover:underline'
	};

	const sizeStyles = {
		sm: 'px-lg py-xs text-[13px] h-8',
		md: 'px-xl py-sm text-button h-10',
		lg: 'px-xl py-base text-[16px] h-12'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="{baseStyles} {variantStyles[variant]} {sizeStyles[size]} {className}"
>
	{@render children?.()}
</button>
