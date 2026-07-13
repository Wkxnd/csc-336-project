<script lang="ts">
	import { BookOpen } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { getClasses, createClass } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { breadcrumbs } from '$lib/breadcrumbs.svelte';

	const classes = $derived(await getClasses());

	let isCreateClassOpen = $state(false);

	$effect(() => {
		breadcrumbs.set([{ label: 'Classes' }]);
		return () => breadcrumbs.clear();
	});
</script>

<div class="flex flex-col gap-lg h-full">
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base">
		<button
			onclick={() => (isCreateClassOpen = true)}
			class="w-full block group text-left focus:outline-none h-full cursor-pointer"
		>
			<Card
				class="h-full border border-dashed border-hairline hover:border-ink/20 hover:shadow-md transition-all duration-200 group-focus:ring-2 group-focus:ring-ink/20 flex flex-col justify-center"
			>
				<div class="flex items-center gap-sm">
					<BookOpen
						class="w-5 h-5 text-muted-soft group-hover:text-ink transition-colors"
						strokeWidth={1.5}
					/>
					<span
						class="font-title-md text-[18px] text-muted group-hover:text-ink transition-colors font-semibold"
					>
						New Class
					</span>
				</div>
				{#if classes.length === 0}
					<p class="text-[12px] text-muted-soft mt-sm font-body">
						Create your first class to get started.
					</p>
				{/if}
			</Card>
		</button>

		{#each classes as c (c.id)}
			<a href={resolve(`/dashboard/faculty/class/${c.id}`)} class="block group focus:outline-none">
				<Card
					class="h-full border border-hairline hover:border-ink/20 hover:shadow-md transition-all duration-200 group-focus:ring-2 group-focus:ring-ink/20"
					gradientOrb={true}
					orbVariant="sky"
				>
					<span
						class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase block mb-1"
					>
						{c.code}
					</span>
					<h3 class="font-title-md text-[18px] text-ink font-semibold truncate">
						{c.name}
					</h3>
					{#if c.description}
						<p class="text-sm text-on-surface-variant mt-sm leading-relaxed line-clamp-2">
							{c.description}
						</p>
					{/if}
				</Card>
			</a>
		{/each}
	</div>
</div>

<Modal bind:isOpen={isCreateClassOpen} title="Create New Class">
	{#if createClass.fields?.allIssues()?.length}
		<div
			class="mb-base p-sm bg-semantic-error/10 border border-semantic-error/20 rounded-lg text-semantic-error text-[14px] font-medium flex gap-xs items-center"
		>
			{createClass.fields?.allIssues()?.[0]?.message}
		</div>
	{/if}
	<form
		{...createClass.enhance(async (form) => {
			if (await form.submit()) {
				form.element.reset();
				isCreateClassOpen = false;
			}
		})}
		class="flex flex-col gap-base"
	>
		<Input
			id="classCode"
			label="Class Code (e.g. CS 101)"
			placeholder="CS 101"
			error={createClass.fields?.code.issues()?.[0]?.message}
			{...createClass.fields?.code.as('text')}
		/>
		<Input
			id="className"
			label="Class Name"
			placeholder="Intro to Computer Science"
			error={createClass.fields?.name.issues()?.[0]?.message}
			{...createClass.fields?.name.as('text')}
		/>
		<div class="flex flex-col gap-1 w-full">
			<label
				for="classDesc"
				class="font-caption-uppercase text-caption-uppercase text-muted select-none"
			>
				Description
			</label>
			<textarea
				id="classDesc"
				name="description"
				placeholder="Add a brief description of the class syllabus or times..."
				rows="3"
				class="w-full p-base bg-surface-card border border-hairline rounded-lg text-ink font-body-md placeholder:text-muted-soft focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-hairline transition-all duration-200"
			></textarea>
		</div>

		<div class="flex justify-end gap-sm mt-md">
			<Button variant="outline" type="button" onclick={() => (isCreateClassOpen = false)}>
				Cancel
			</Button>
			<Button type="submit" disabled={!!createClass.pending}>
				{createClass.pending ? 'Creating...' : 'Create'}
			</Button>
		</div>
	</form>
</Modal>
