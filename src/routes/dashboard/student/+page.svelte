<script lang="ts">
	import { getClasses, enrollInClass, getStudentAttendanceHistory } from './data.remote';
	import type { Class } from '$lib/types';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Modal from '$lib/components/Modal.svelte';

	// Reactive queries (deduplicated client-side)
	const classesQuery = getClasses();
	let selectedClass = $state<Class | null>(null);

	const attendanceHistoryQuery = $derived(
		selectedClass ? getStudentAttendanceHistory(selectedClass.id) : null
	);

	// Derived arrays
	const classes = $derived(classesQuery.current || []);
	const attendanceHistory = $derived(attendanceHistoryQuery?.current || []);

	// Enroll Modal states
	let isEnrollOpen = $state(false);

	function selectClass(c: Class) {
		selectedClass = c;
		if (selectedClass) {
			void getStudentAttendanceHistory(selectedClass.id).refresh();
		}
	}
</script>

<div class="flex flex-col gap-lg h-full">
	<!-- Top Summary Header -->
	<div class="flex justify-between items-center shrink-0">
		<div>
			<h1 class="font-display-lg text-display-lg text-ink font-normal tracking-tight">
				Student Dashboard
			</h1>
			<p class="text-muted text-[14px]">
				View your classes, track your attendance rates, and enroll in courses.
			</p>
		</div>
		<Button onclick={() => (isEnrollOpen = true)}>Enroll in Class</Button>
	</div>

	<!-- Main Workspace Split Panel -->
	<div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-lg overflow-hidden min-h-0">
		<!-- Left Panel: Enrolled Class Cards list (span 4) -->
		<div class="lg:col-span-4 flex flex-col gap-base overflow-y-auto pr-xs">
			{#if classes.length === 0}
				<div
					class="text-center p-lg border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
				>
					<p class="text-muted text-sm">You are not enrolled in any classes yet.</p>
					<Button size="sm" variant="outline" class="mt-sm" onclick={() => (isEnrollOpen = true)}>
						Enroll Now
					</Button>
				</div>
			{:else}
				{#each classes as c (c.id)}
					<button
						onclick={() => selectClass(c)}
						class="w-full text-left transition-all duration-200 cursor-pointer block focus:outline-none"
					>
						<Card
							class="hover:shadow-md transition-all border {selectedClass?.id === c.id
								? 'border-ink bg-surface-container-low shadow-sm'
								: 'border-hairline bg-surface-card'}"
							gradientOrb={true}
							orbVariant={selectedClass?.id === c.id ? 'mint' : 'sky'}
						>
							<div class="flex justify-between items-start">
								<div>
									<span
										class="font-caption-uppercase text-[10px] tracking-wider text-muted uppercase"
										>{c.code}</span
									>
									<h3 class="font-title-md text-[16px] text-ink font-semibold mt-1 truncate">
										{c.name}
									</h3>
								</div>

								<!-- Attendance Rate Badge -->
								{#if c.attendance_rate !== null && c.attendance_rate !== undefined}
									<div class="text-right">
										<span class="text-[18px] font-display-md text-ink font-semibold"
											>{c.attendance_rate}%</span
										>
										<span class="text-[9px] text-muted-soft block">Attendance</span>
									</div>
								{:else}
									<div class="text-right">
										<span class="text-sm font-semibold text-muted">0%</span>
										<span class="text-[9px] text-muted-soft block">Attendance</span>
									</div>
								{/if}
							</div>
						</Card>
					</button>
				{/each}
			{/if}
		</div>

		<!-- Right Panel: Course History (span 8) -->
		<div class="lg:col-span-8 flex flex-col min-h-0">
			{#if !selectedClass}
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
							d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 12.408 2.11 2.112c.49.49 1.28.49 1.77 0l4.15-4.151M9 7.5h6"
						/>
					</svg>
					<h3 class="font-title-md text-ink text-[18px]">Select a Class</h3>
					<p class="text-muted text-[14px] mt-1">
						Choose a class from the list to see your full attendance records and history.
					</p>
				</div>
			{:else}
				<div class="flex-grow flex flex-col min-h-0 gap-sm">
					<!-- Class Header Banner -->
					<Card class="shrink-0" gradientOrb={true} orbVariant="lavender">
						<div class="flex justify-between items-center">
							<div>
								<span class="font-caption-uppercase text-caption-uppercase text-muted"
									>Attendance History</span
								>
								<h3 class="font-display-md text-[22px] text-ink font-normal mt-1">
									{selectedClass.code}: {selectedClass.name}
								</h3>
							</div>

							<!-- Rate Indicator -->
							<div
								class="text-center bg-surface-container px-lg py-sm rounded-lg border border-hairline"
							>
								<span class="font-display-lg text-[28px] text-ink font-semibold"
									>{selectedClass.attendance_rate || 0}%</span
								>
								<span class="text-[10px] text-caption-uppercase text-muted block mt-0.5"
									>Your Attendance</span
								>
							</div>
						</div>
					</Card>

					<!-- Roster History List -->
					<div class="flex-grow overflow-y-auto flex flex-col gap-xs pr-xs min-h-[300px] mt-sm">
						{#if attendanceHistory.length === 0}
							<div
								class="text-center p-xl border border-hairline rounded-xl bg-surface-container-lowest"
							>
								<p class="text-muted text-sm">
									No lecture sessions have been recorded for this class yet.
								</p>
							</div>
						{:else}
							{#each attendanceHistory as r (r.session_date)}
								<div
									class="flex justify-between items-center p-base border border-hairline rounded-xl bg-surface-card hover:bg-surface-container-low transition-colors"
								>
									<div class="min-w-0">
										<span class="font-body-strong text-ink text-sm block">
											{new Date(r.session_date).toLocaleDateString(undefined, {
												weekday: 'long',
												month: 'long',
												day: 'numeric',
												year: 'numeric'
											})}
										</span>
										{#if r.verified_at}
											<span class="text-[10px] text-muted block mt-1"
												>Checked in at: {new Date(r.verified_at).toLocaleTimeString(undefined, {
													hour: '2-digit',
													minute: '2-digit'
												})}</span
											>
										{:else}
											<span class="text-[10px] text-muted block mt-1">No check-in timestamp</span>
										{/if}
									</div>

									<Badge variant={r.status}>
										{r.status}
									</Badge>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Modal: Enroll In Class -->
<Modal isOpen={isEnrollOpen} title="Enroll in Class">
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
