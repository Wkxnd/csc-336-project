<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		isOpen: boolean;
		title: string;
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	}

	let { isOpen = $bindable(false), title, children, footer, onclose }: Props = $props();

	function close() {
		isOpen = false;
		if (onclose) onclose();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-5">
		<!-- Backdrop -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			transition:fade={{ duration: 200 }}
			onclick={close}
			class="absolute inset-0 bg-ink/30 backdrop-blur-sm"
		></div>

		<!-- Dialog Container -->
		<div
			transition:fly={{ y: 20, duration: 300 }}
			class="relative w-full max-w-[32rem] bg-surface-card border border-hairline rounded-xl shadow-xl z-10 flex flex-col overflow-hidden"
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-hairline">
				<h3 class="font-title-md text-ink text-[18px]">{title}</h3>
				<button
					onclick={close}
					class="text-muted hover:text-ink w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
					aria-label="Close modal"
				>
					<X class="w-5 h-5" strokeWidth={1.5} />
				</button>
			</div>

			<!-- Body -->
			<div class="p-6 overflow-y-auto max-h-[60vh] font-body-md text-body leading-relaxed">
				{@render children?.()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div
					class="flex justify-end gap-3 p-6 border-t border-hairline bg-surface-container-lowest"
				>
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
