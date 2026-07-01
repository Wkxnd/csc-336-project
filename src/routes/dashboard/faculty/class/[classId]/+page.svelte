<script lang="ts">
	import { Calendar } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { getClass, getSessions, createSession } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import type { PageProps } from './$types';

	let { params }: PageProps = $props();
	const classId = $derived(params.classId);

	const classData = $derived(await getClass(classId));
	const sessions = $derived(await getSessions(classId));

	let isCreateSessionOpen = $state(false);
	let newSessionDate = $state(new Date().toISOString().slice(0, 10));
</script>

<!-- TODO: for loading state use svelte boundaries -->

<div class="flex flex-col gap-lg h-full">
	<Breadcrumbs
		crumbs={[
			{ label: 'Classes', href: '/dashboard/faculty' },
			{ label: classData?.name || 'Loading...' }
		]}
	/>

	<!-- Class Header -->
	<Card class="shrink-0" gradientOrb={true} orbVariant="sky">
		<span class="font-caption-uppercase text-caption-uppercase text-muted">{classData.code}</span>
		<h2 class="font-display-md text-[24px] text-ink font-normal tracking-tight mt-1">
			{classData.name}
		</h2>
		{#if classData.description}
			<p class="text-sm text-on-surface-variant mt-sm leading-relaxed">
				{classData.description}
			</p>
		{/if}
	</Card>

	<!-- Sessions Section -->
	<div class="flex-1 flex flex-col min-h-0">
		<div class="flex justify-between items-center mb-base">
			<h3 class="font-title-md text-[18px] text-ink">Sessions</h3>
			<Button onclick={() => (isCreateSessionOpen = true)}>New Session</Button>
		</div>

		{#if sessions.length === 0}
			<div
				class="flex-1 flex flex-col items-center justify-center text-center p-xl border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
			>
				<Calendar class="w-10 h-10 text-muted-soft mb-sm" strokeWidth={1.5} />
				<h3 class="font-title-md text-ink text-[16px]">No Sessions Yet</h3>
				<p class="text-muted text-[13px] mt-1">Create a session to start tracking attendance.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base overflow-y-auto">
				{#each sessions as s (s.id)}
					{@const isActive =
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
								<p class="text-xs text-semantic-success mt-sm font-body-strong">
									Attendance Active
								</p>
							{/if}
						</Card>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>

<Modal bind:isOpen={isCreateSessionOpen} title="Create Session">
	<form
		{...createSession.enhance(async (form) => {
			if (await form.submit()) {
				form.element.reset();
				isCreateSessionOpen = false;
			}
		})}
		class="flex flex-col gap-base"
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

		<div class="flex justify-end gap-sm mt-md">
			<Button variant="outline" type="button" onclick={() => (isCreateSessionOpen = false)}>
				Cancel
			</Button>
			<Button type="submit" disabled={!!createSession.pending}>
				{createSession.pending ? 'Creating...' : 'Create Session'}
			</Button>
		</div>
	</form>
</Modal>
