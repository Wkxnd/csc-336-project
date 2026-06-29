<script lang="ts">
	import { resolve } from '$app/paths';
	import { getClasses, enrollInClass } from './data.remote';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Modal from '$lib/components/Modal.svelte';

	const classesQuery = getClasses();
	const classes = $derived(classesQuery.current || []);

	let isEnrollOpen = $state(false);
</script>

<div class="flex flex-col gap-lg h-full">
	<div class="flex justify-between items-center shrink-0">
		<div>
			<h1 class="font-display-lg text-display-lg text-ink font-normal tracking-tight">
				My Classes
			</h1>
			<p class="text-muted text-[14px]">View your enrolled courses and track attendance.</p>
		</div>
		<Button onclick={() => (isEnrollOpen = true)}>Enroll in Class</Button>
	</div>

	{#if classes.length === 0}
		<div
			class="flex-1 flex flex-col items-center justify-center text-center p-xl border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-12 h-12 text-muted-soft mb-sm"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
				/>
			</svg>
			<h3 class="font-title-md text-ink text-[18px]">No Classes Yet</h3>
			<p class="text-muted text-[14px] mt-1">Enroll in your first class to get started.</p>
			<Button size="sm" variant="outline" class="mt-md" onclick={() => (isEnrollOpen = true)}>
				Enroll Now
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-base">
			{#each classes as c (c.id)}
				<a
					href={resolve(`/dashboard/student/class/${c.id}`)}
					class="block group focus:outline-none"
				>
					<Card
						class="h-full border border-hairline hover:border-ink/20 hover:shadow-md transition-all duration-200 group-focus:ring-2 group-focus:ring-ink/20"
						gradientOrb={true}
						orbVariant="sky"
					>
						<div class="flex justify-between items-start">
							<div class="min-w-0 flex-1">
								<span
									class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase block mb-1"
								>
									{c.code}
								</span>
								<h3 class="font-title-md text-[18px] text-ink font-semibold truncate">
									{c.name}
								</h3>
							</div>

							{#if c.attendance_rate !== null && c.attendance_rate !== undefined}
								<div class="text-right shrink-0 ml-sm">
									<span class="text-[20px] font-display-md text-ink font-semibold">
										{c.attendance_rate}%
									</span>
									<span class="text-[9px] text-muted-soft block">Attendance</span>
								</div>
							{:else}
								<div class="text-right shrink-0 ml-sm">
									<span class="text-sm font-semibold text-muted">0%</span>
									<span class="text-[9px] text-muted-soft block">Attendance</span>
								</div>
							{/if}
						</div>
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</div>

<Modal bind:isOpen={isEnrollOpen} title="Enroll in Class">
	{#if enrollInClass.fields?.allIssues()?.length}
		<div
			class="mb-base p-sm bg-semantic-error/10 border border-semantic-error/20 rounded-lg text-semantic-error text-[14px] font-medium flex gap-xs items-center"
		>
			{enrollInClass.fields?.allIssues()?.[0]?.message}
		</div>
	{/if}
	<form
		{...enrollInClass.enhance(async (form) => {
			if (await form.submit()) {
				form.element.reset();
				isEnrollOpen = false;
			}
		})}
		class="flex flex-col gap-base"
	>
		<Input
			id="enrollCode"
			label="Class Code"
			placeholder="e.g. CS 101"
			error={enrollInClass.fields?.classCode.issues()?.[0]?.message}
			{...enrollInClass.fields?.classCode.as('text')}
		/>
		<p class="text-xs text-muted leading-relaxed select-none">
			Ask your professor for the unique course class code (e.g. CS 101) to link your student account
			and register in the class roster.
		</p>

		<div class="flex justify-end gap-sm mt-md">
			<Button variant="outline" type="button" onclick={() => (isEnrollOpen = false)}>Cancel</Button>
			<Button type="submit" disabled={!!enrollInClass.pending}>
				{enrollInClass.pending ? 'Enrolling...' : 'Enroll'}
			</Button>
		</div>
	</form>
</Modal>
