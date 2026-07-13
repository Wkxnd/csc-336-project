<script lang="ts">
	import { Chat } from '@ai-sdk/svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import { breadcrumbs } from '$lib/breadcrumbs.svelte';

	const chat = new Chat({});

	let input = $state('');

	const suggestions = [
		'Which of my classes has the lowest attendance?',
		'List students at risk in my classes',
		'Give me an overview of my most recent class'
	];

	const isBusy = $derived(chat.status === 'submitted' || chat.status === 'streaming');

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const text = input.trim();
		if (!text || isBusy) return;
		chat.sendMessage({ text });
		input = '';
	}

	function ask(text: string) {
		if (isBusy) return;
		chat.sendMessage({ text });
	}

	$effect(() => {
		breadcrumbs.set([{ label: 'Assistant' }]);
		return () => breadcrumbs.clear();
	});
</script>

<div class="flex flex-col gap-lg h-full">
	<div class="shrink-0">
		<p class="text-muted text-[14px]">
			Ask questions about your classes, students, and attendance. Answers use your live class data.
		</p>
	</div>

	<Card class="flex-1 flex flex-col min-h-0" padded={false}>
		<div class="flex-1 overflow-y-auto p-lg flex flex-col gap-base">
			{#if chat.messages.length === 0}
				<div class="flex-1 flex flex-col items-center justify-center text-center gap-base">
					<h3 class="font-title-md text-ink text-[18px]">How can I help?</h3>
					<div class="flex flex-col gap-sm items-center">
						{#each suggestions as suggestion (suggestion)}
							<Button variant="outline" size="sm" onclick={() => ask(suggestion)}>
								{suggestion}
							</Button>
						{/each}
					</div>
				</div>
			{:else}
				{#each chat.messages as message (message.id)}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[80%] rounded-xl px-base py-sm text-[14px] leading-relaxed {message.role ===
							'user'
								? 'bg-ink text-surface-container-lowest'
								: 'bg-surface-container text-ink'}"
						>
							{#each message.parts as part, partIndex (partIndex)}
								{#if part.type === 'text'}
									<p class="whitespace-pre-wrap">{part.text}</p>
								{:else if part.type.startsWith('tool-')}
									<details class="mt-1 text-[12px] text-muted">
										<summary class="cursor-pointer select-none">
											Looked up data ({part.type.replace('tool-', '')})
										</summary>
										<pre
											class="mt-1 overflow-x-auto rounded-lg bg-surface-container-lowest p-sm text-[11px]">{JSON.stringify(
												part,
												null,
												2
											)}</pre>
									</details>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			{/if}

			{#if chat.status === 'submitted'}
				<div class="flex justify-start">
					<div class="rounded-xl bg-surface-container px-base py-sm text-[14px] text-muted">
						Thinking...
					</div>
				</div>
			{/if}

			{#if chat.error}
				<div
					class="p-sm bg-semantic-error/10 border border-semantic-error/20 rounded-lg text-semantic-error text-[13px] font-medium"
				>
					Something went wrong. Please try again.
				</div>
			{/if}
		</div>

		<form onsubmit={submit} class="shrink-0 border-t border-hairline p-base flex gap-sm items-end">
			<textarea
				bind:value={input}
				placeholder="Ask about your classes..."
				rows="1"
				onkeydown={(e) => {
					if (e.key === 'Enter' && !e.shiftKey) {
						e.preventDefault();
						submit(e as unknown as SubmitEvent);
					}
				}}
				class="flex-1 resize-none bg-surface-card border border-hairline rounded-lg px-base py-sm text-ink font-body-md placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20 transition-all duration-200"
			></textarea>
			<Button type="submit" disabled={isBusy || !input.trim()}>
				{isBusy ? 'Sending...' : 'Send'}
			</Button>
		</form>
	</Card>
</div>
