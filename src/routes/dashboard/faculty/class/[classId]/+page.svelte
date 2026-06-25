<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { getClass, getSessions, createSession } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	const classId = $derived(page.params.classId!);

	const classQuery = $derived(getClass(classId));
	const sessionsQuery = $derived(getSessions(classId));

	const classData = $derived(classQuery.current);
	const sessions = $derived(sessionsQuery.current || []);

	let isCreateSessionOpen = $state(false);
	let newSessionDate = $state(new Date().toISOString().slice(0, 10));
</script>

<div class="flex flex-col gap-lg h-full">
	<!-- Breadcrumb -->
	<nav class="flex items-center gap-xs text-sm text-muted shrink-0">
		<a
			href="{base}/dashboard/faculty"
			class="hover:text-ink transition-colors"
		>
			Classes
		</a>
		<span class="text-muted-soft">/</span>
		<span class="text-ink font-body-strong">{classData?.name || 'Loading...'}</span>
	</nav>

	{#if classData}
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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="w-10 h-10 text-muted-soft mb-sm"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
						/>
					</svg>
					<h3 class="font-title-md text-ink text-[16px]">No Sessions Yet</h3>
					<p class="text-muted text-[13px] mt-1">Create a session to start tracking attendance.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base overflow-y-auto">
					{#each sessions as s (s.id)}
						{@const isActive =
							s.attendance_expires_at !== null &&
							new Date(s.attendance_expires_at) > new Date()}
						<a
							href="{base}/dashboard/faculty/class/{classId}/session/{s.id}"
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
	{:else}
		<div class="flex-1 flex items-center justify-center">
			<p class="text-muted animate-pulse font-title-md">Loading...</p>
		</div>
	{/if}
</div>

<Modal isOpen={isCreateSessionOpen} title="Create Session">
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
