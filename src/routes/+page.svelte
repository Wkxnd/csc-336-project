<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { login, register, getCurrentUser } from '$lib/auth.remote';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	// Page state for toggle
	let isRegister = $state(false);
	let role = $state<'faculty' | 'student'>('student');

	// Query the current user
	const userQuery = getCurrentUser();
	const user = $derived(userQuery.current);

	const redirectTo = $derived(page.url.searchParams.get('redirect'));

	// Check if already logged in and redirect reactively
	$effect(() => {
		if (user) {
			const target = redirectTo || `/dashboard/${user.role}`;
			goto(target);
		}
	});
</script>

<div
	class="relative min-h-screen bg-surface flex flex-col items-center justify-center p-md overflow-hidden text-body font-body-md antialiased"
>
	<!-- Ambient Background Blur Orb -->
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-gradient-sky rounded-full blur-[120px] opacity-25 pointer-events-none mix-blend-multiply"
	></div>
	<div
		class="absolute -top-40 -left-40 w-96 h-96 bg-gradient-peach rounded-full blur-[100px] opacity-15 pointer-events-none"
	></div>

	<main class="relative z-10 w-full max-w-md flex flex-col items-center text-center fade-in-up">
		<!-- App Identity -->
		<div class="flex items-center gap-sm mb-lg">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="w-8 h-8 text-ink"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
				/>
			</svg>
			<h1 class="font-display-md text-[28px] text-ink tracking-tight font-normal">AttendLink</h1>
		</div>

		<!-- Card Wrapper -->
		<Card class="w-full text-left" gradientOrb={true} orbVariant="peach">
			<div class="mb-lg">
				<h2 class="font-title-md text-ink text-[22px] tracking-tight">
					{isRegister ? 'Create Account' : 'Welcome Back'}
				</h2>
				<p class="text-muted text-[14px] mt-1">
					{isRegister
						? 'Join AttendLink to track and manage class attendance.'
						: 'Sign in to access your attendance dashboard.'}
				</p>
			</div>

			<!-- General validation/error display -->
			{#if !isRegister && login.fields?.allIssues()?.length}
				<div
					class="mb-base p-sm bg-semantic-error/10 border border-semantic-error/20 rounded-lg text-semantic-error text-[14px] font-medium flex gap-xs items-center"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="w-5 h-5 shrink-0"
					>
						<path
							fill-rule="evenodd"
							d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
							clip-rule="evenodd"
						/>
					</svg>
					{login.fields?.allIssues()?.[0]?.message}
				</div>
			{/if}

			{#if isRegister && register.fields?.allIssues()?.length}
				<div
					class="mb-base p-sm bg-semantic-error/10 border border-semantic-error/20 rounded-lg text-semantic-error text-[14px] font-medium flex gap-xs items-center"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="w-5 h-5 shrink-0"
					>
						<path
							fill-rule="evenodd"
							d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
							clip-rule="evenodd"
						/>
					</svg>
					{register.fields?.allIssues()?.[0]?.message}
				</div>
			{/if}

			{#if !isRegister}
				<!-- Login Form -->
				<form {...login} class="flex flex-col gap-base">
					<Input
						id="email"
						label="Email"
						error={login.fields?.email.issues()?.[0]?.message}
						{...login.fields?.email.as('email')}
					/>

					<Input
						id="password"
						label="Password"
						error={login.fields?.password.issues()?.[0]?.message}
						{...login.fields?.password.as('password')}
					/>

					<!-- Submit Button -->
					<Button type="submit" class="w-full mt-sm" disabled={!!login.pending}>
						{#if login.pending}
							Loading...
						{:else}
							Sign In
						{/if}
					</Button>
				</form>
			{:else}
				<!-- Register Form -->
				<form {...register} class="flex flex-col gap-base">
					<div class="flex gap-sm">
						<Input
							id="firstName"
							label="First Name"
							error={register.fields?.firstName.issues()?.[0]?.message}
							{...register.fields?.firstName.as('text')}
						/>
						<Input
							id="lastName"
							label="Last Name"
							error={register.fields?.lastName.issues()?.[0]?.message}
							{...register.fields?.lastName.as('text')}
						/>
					</div>

					<!-- Role Selection Pill Tabs -->
					<div class="flex flex-col gap-1.5">
						<span class="font-caption-uppercase text-caption-uppercase text-muted select-none"
							>Role</span
						>
						<!-- Hidden input to submit the role field -->
						<input type="hidden" name="role" value={role} />
						<div class="flex p-0.5 bg-surface-container rounded-full border border-hairline w-full">
							<button
								type="button"
								onclick={() => (role = 'student')}
								class="flex-1 py-1.5 text-center font-button text-[14px] rounded-full transition-all duration-200 cursor-pointer {role ===
								'student'
									? 'bg-surface-card text-ink font-semibold shadow-sm'
									: 'text-muted hover:text-ink'}"
							>
								Student
							</button>
							<button
								type="button"
								onclick={() => (role = 'faculty')}
								class="flex-1 py-1.5 text-center font-button text-[14px] rounded-full transition-all duration-200 cursor-pointer {role ===
								'faculty'
									? 'bg-surface-card text-ink font-semibold shadow-sm'
									: 'text-muted hover:text-ink'}"
							>
								Faculty
							</button>
						</div>
					</div>

					<Input
						id="email"
						label="Email"
						error={register.fields?.email.issues()?.[0]?.message}
						{...register.fields?.email.as('email')}
					/>

					<Input
						id="password"
						label="Password"
						error={register.fields?.password.issues()?.[0]?.message}
						{...register.fields?.password.as('password')}
					/>

					<!-- Submit Button -->
					<Button type="submit" class="w-full mt-sm" disabled={!!register.pending}>
						{#if register.pending}
							Loading...
						{:else}
							Create Account
						{/if}
					</Button>
				</form>
			{/if}

			<!-- Toggle Switch -->
			<div class="mt-lg text-center">
				<button
					type="button"
					onclick={() => {
						isRegister = !isRegister;
					}}
					class="font-body-strong text-ink hover:underline text-[14px] cursor-pointer"
				>
					{isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
				</button>
			</div>
		</Card>

		<!-- Footer copyright -->
		<footer class="mt-xl text-[12px] text-muted-soft">
			&copy; {new Date().getFullYear()} AttendLink. Premium Class Attendance SAAS.
		</footer>
	</main>
</div>
