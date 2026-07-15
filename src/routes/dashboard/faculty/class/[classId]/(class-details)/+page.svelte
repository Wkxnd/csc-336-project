<script lang="ts">
	import { Calendar } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { getSessions, createSession } from '../data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const classId = $derived(params.classId);

	let isCreateSessionOpen = $state(false);
	let newSessionDate = $state(new Date().toISOString().slice(0, 10));
</script>

<div class="flex-1 flex flex-col min-h-0 pt-4">
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-6">
		<button
			onclick={() => (isCreateSessionOpen = true)}
			class="w-full block group text-left focus:outline-none h-full cursor-pointer"
		>
			<Card
				class="h-full border border-dashed border-hairline hover:border-ink/20 hover:shadow-md transition-all duration-200 group-focus:ring-2 group-focus:ring-ink/20 flex flex-col justify-center"
			>
				<div class="flex items-center gap-2">
					<Calendar
						class="w-4 h-4 text-muted-soft group-hover:text-ink transition-colors"
						strokeWidth={1.5}
					/>
					<span
						class="font-body-strong text-muted group-hover:text-ink transition-colors text-[15px]"
					>
						New Session
					</span>
				</div>
			</Card>
		</button>

		{#each await getSessions(classId) as s (s.id)}
			{const isActive =
				s.attendance_expires_at !== null && new Date(s.attendance_expires_at) > new Date()}
			<a
				href={resolve(`/dashboard/faculty/class/${classId}/session/${s.id}`)}
				class="block group focus:outline-none"
			>
				<Card
					class="h-full border border-hairline hover:border-ink/20 hover:shadow-md transition-all duration-200 group-focus:ring-2 group-focus:ring-ink/20"
				>
					<div class="flex justify-between items-center">
						<span class="font-body-strong text-ink text-[15px]">
							{new Date(s.session_date).toLocaleDateString(undefined, {
								weekday: 'short',
								month: 'short',
								day: 'numeric',
								year: 'numeric'
							})}
						</span>
						{#if isActive}
							<span class="w-2.5 h-2.5 bg-semantic-success rounded-full animate-pulse"></span>
						{/if}
					</div>
					{#if isActive}
						<p class="text-xs text-semantic-success mt-3 font-body-strong">Attendance Active</p>
					{/if}
				</Card>
			</a>
		{/each}
	</div>
</div>

<Modal bind:isOpen={isCreateSessionOpen} title="Create Session">
	<form
		{...createSession.enhance(async (form) => {
			if (await form.submit()) {
				form.element.reset();
				isCreateSessionOpen = false;
				// Refresh the sessions list
				void getSessions(classId).refresh();
			}
		})}
		class="flex flex-col gap-4"
	>
		{#if createSession.fields}
			<input {...createSession.fields.classId.as('hidden', classId)} />
		{/if}
		<Input
			id="sessionDate"
			label="Session Date"
			error={createSession.fields?.sessionDate.issues()?.[0]?.message}
			{...createSession.fields?.sessionDate.as('date', newSessionDate)}
		/>

		<div class="flex justify-end gap-3 mt-5">
			<Button variant="outline" type="button" onclick={() => (isCreateSessionOpen = false)}>
				Cancel
			</Button>
			<Button type="submit" disabled={!!createSession.pending}>
				{createSession.pending ? 'Creating...' : 'Create Session'}
			</Button>
		</div>
	</form>
</Modal>
