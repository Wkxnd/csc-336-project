<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<
		HTMLInputAttributes,
		'value' | 'id' | 'type' | 'placeholder' | 'required' | 'disabled' | 'class'
	> {
		label?: string;
		id: string;
		type?: string;
		placeholder?: string;
		value?: string | number;
		error?: string;
		required?: boolean;
		disabled?: boolean;
		class?: string;
	}

	let {
		label = '',
		id,
		type = 'text',
		placeholder = '',
		value = $bindable(''),
		error = '',
		required = false,
		disabled = false,
		class: className = '',
		...rest
	}: Props = $props();
</script>

<div class="flex flex-col gap-1 w-full {className}">
	{#if label}
		<label for={id} class="font-caption-uppercase text-caption-uppercase text-muted select-none">
			{label}
			{#if required}
				<span class="text-semantic-error font-medium">*</span>
			{/if}
		</label>
	{/if}

	<input
		{id}
		{type}
		{placeholder}
		{required}
		{disabled}
		bind:value
		{...rest}
		class="w-full h-11 {type === 'date' ? 'pl-4 pr-2' : 'px-4'} bg-surface-card border {error
			? 'border-semantic-error focus:ring-semantic-error/20'
			: 'border-hairline focus:ring-ink/20'} rounded-lg text-ink font-body-md tabular-nums placeholder:text-muted-soft focus:outline-none focus:ring-2 disabled:bg-surface-container-low disabled:text-muted disabled:cursor-not-allowed transition-all duration-200 [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
	/>

	{#if error}
		<span class="text-semantic-error text-xs font-medium mt-0.5">{error}</span>
	{/if}
</div>
