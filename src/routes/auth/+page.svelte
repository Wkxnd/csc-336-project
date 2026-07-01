<script lang="ts">
	import { BadgeCheck, TriangleAlert } from '@lucide/svelte';
	import { login, register } from '$lib/auth.remote';
	import Input from '$lib/components/Input.svelte';
	import Button from '$lib/components/Button.svelte';
	import Card from '$lib/components/Card.svelte';

	// TODO: find a clean way to redirect to dashboard if user is already logged in with remote functions
	// const currentUser = await getCurrentUser();

	// goto(resolve(`/dashboard/${currentUser.role}`));
	let isRegister = $state(false);
	let role = $state<'faculty' | 'student'>('student');
</script>

<div
	class="relative min-h-screen bg-surface flex flex-col items-center justify-center p-md overflow-hidden text-body font-body-md antialiased"
>
	<div
		class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-200 max-h-200 bg-gradient-sky rounded-full blur-[120px] opacity-25 pointer-events-none mix-blend-multiply"
	></div>
	<div
		class="absolute -top-40 -left-40 w-96 h-96 bg-gradient-peach rounded-full blur-[100px] opacity-15 pointer-events-none"
	></div>

	<main class="relative z-10 w-full max-w-112 flex flex-col items-center text-center fade-in-up">
		<div class="flex items-center gap-sm mb-lg">
			<BadgeCheck class="w-8 h-8 text-ink" strokeWidth={1.5} />
			<h1 class="font-display-md text-[28px] text-ink tracking-tight font-normal">AttendLink</h1>
		</div>

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

			{#if !isRegister && login.fields?.allIssues()?.length}
				<div
					class="mb-base p-sm bg-semantic-error/10 border border-semantic-error/20 rounded-lg text-semantic-error text-[14px] font-medium flex gap-xs items-center"
				>
					<TriangleAlert class="w-5 h-5 shrink-0" fill="currentColor" />
					{login.fields?.allIssues()?.[0]?.message}
				</div>
			{/if}

			{#if isRegister && register.fields?.allIssues()?.length}
				<div
					class="mb-base p-sm bg-semantic-error/10 border border-semantic-error/20 rounded-lg text-semantic-error text-[14px] font-medium flex gap-xs items-center"
				>
					<TriangleAlert class="w-5 h-5 shrink-0" fill="currentColor" />
					{register.fields?.allIssues()?.[0]?.message}
				</div>
			{/if}

			{#if !isRegister}
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

					<Button type="submit" class="w-full mt-sm" disabled={!!login.pending}>
						{#if login.pending}
							Loading...
						{:else}
							Sign In
						{/if}
					</Button>
				</form>
			{:else}
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

					<div class="flex flex-col gap-1.5">
						<span class="font-caption-uppercase text-caption-uppercase text-muted select-none"
							>Role</span
						>
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

					<Button type="submit" class="w-full mt-sm" disabled={!!register.pending}>
						{#if register.pending}
							Loading...
						{:else}
							Create Account
						{/if}
					</Button>
				</form>
			{/if}

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

		<footer class="mt-xl text-[12px] text-muted-soft">
			&copy; {new Date().getFullYear()} AttendLink. Premium Class Attendance SAAS.
		</footer>
	</main>
</div>
