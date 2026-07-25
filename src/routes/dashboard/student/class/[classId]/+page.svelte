<script lang='ts'>
import { Calendar, QrCode } from '@lucide/svelte';
      import { getClass, getStudentAttendanceHistory } from './data.remote';
      import { verifyQrCheckIn } from '../../check-in/[sessionId]/[token]/data.remote';
      import Card from '$lib/components/Card.svelte';
      import Badge from '$lib/components/Badge.svelte';
      import Button from '$lib/components/Button.svelte';
      import Modal from '$lib/components/Modal.svelte';
      import QrScanner from '$lib/components/QrScanner.svelte';
      import { breadcrumbs } from '$lib/breadcrumbs.svelte';
      import { formatCalendarDate } from '$lib/date';
      import type { PageProps } from './$types';

      let { params }: PageProps = $props();
      const classId = $derived(params.classId);

      const classData = $derived(await getClass(classId));
      const attendanceHistory = $derived(await getStudentAttendanceHistory(classId));


      let showScanner = $state(false);
      let checkinPending = $state(false);
      let checkinError = $state<string | null>(null);
      let checkinSuccess = $state<{ class_name: string; verified_at: string } | null>(null);

      async function handleDetect(data: string) {
              if (checkinPending) return; // ignore extra frames while one is in flight

              // The QR encodes: https://host/dashboard/student/check-in/{sessionId}/{token}
              let sessionId: string | undefined;
              let token: string | undefined;
              try {
                      const parts = new URL(data).pathname.split('/').filter(Boolean);
                      const i = parts.indexOf('check-in');
                      if (i !== -1) {
                              sessionId = parts[i + 1];
                              token = parts[i + 2];
                      }
              } catch {
                      // not a URL — fall through to the error below
              }

              if (!sessionId || !token) {
                      checkinError = 'That QR code is not a valid check-in code.';
                      showScanner = false;
                      return;
              }

              checkinPending = true;
              checkinError = null;
              showScanner = false; // stop the camera as soon as we have a code
              try {
                      const result = await verifyQrCheckIn({ sessionId, token });
                      checkinSuccess = { class_name: result.class_name, verified_at: result.verified_at };
                      await getStudentAttendanceHistory(classId).refresh(); // update the history list below
              } catch (err) {
                      checkinError = err instanceof Error ? err.message : 'Check-in failed';
              } finally {
                      checkinPending = false;
              }
      }


      $effect(() => {
              breadcrumbs.set([
                      { label: 'My Classes', href: '/dashboard/student' },
                      { label: classData.code }
              ]);

              return () => breadcrumbs.clear();
      });
</script>



<div class="flex flex-col gap-6 h-full">
	<Card class="shrink-0" gradientOrb={true} orbVariant="lavender">
		<div class="flex justify-between items-center">
			<div>
				<span class="font-caption-uppercase text-caption-uppercase text-muted"
					>{classData.code}</span
				>
				<h2 class="font-display-md text-[24px] text-ink font-normal tracking-tight mt-1">
					{classData.name}
				</h2>
				{#if classData.description}
					<p class="text-sm text-on-surface-variant mt-3 leading-relaxed">
						{classData.description}
					</p>
				{/if}
			</div>
			 <div class="flex items-center gap-3 shrink-0 ml-6">
                              <div
                                      class="text-center bg-surface-container px-6 py-3 rounded-lg border border-hairline"
                              >
                                      <span class="font-display-lg text-[28px] text-ink font-semibold">
                                              {classData.attendance_rate || 0}%
                                      </span>
                                      <span class="text-[10px] text-caption-uppercase text-muted block mt-0.5">
                                              Your Attendance
                                      </span>
                              </div>

                              <Button size="sm" onclick={() => { checkinError = null; showScanner = true; }}>
                                      <QrCode class="w-4 h-4 mr-2" strokeWidth={1.5} />
                                      Check In
                              </Button>
                      </div>
		</div>
	</Card>

	<div class="flex-1 flex flex-col min-h-0">
		<h3 class="font-title-md text-[18px] text-ink mb-4">Attendance History</h3>

		{#if attendanceHistory.length === 0}
			<div
				class="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-hairline rounded-xl bg-surface-container-lowest"
			>
				<Calendar class="w-10 h-10 text-muted-soft mb-3" strokeWidth={1.5} />
				<h3 class="font-title-md text-ink text-[16px]">No Sessions Yet</h3>
				<p class="text-muted text-[13px] mt-1">
					No lecture sessions have been recorded for this class yet.
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2 overflow-y-auto">
				{#each attendanceHistory as r (r.session_date)}
					<div
						class="flex justify-between items-center p-4 border border-hairline rounded-xl bg-surface-card hover:bg-surface-container-low transition-colors"
					>
						<div class="min-w-0">
							<span class="font-body-strong text-ink text-sm block">
								{formatCalendarDate(r.session_date, {
									weekday: 'long',
									month: 'long',
									day: 'numeric',
									year: 'numeric'
								})}
							</span>
							{#if r.verified_at}
								<span class="text-[10px] text-muted block mt-1">
									Checked in at: {new Date(r.verified_at).toLocaleTimeString(undefined, {
										hour: '2-digit',
										minute: '2-digit'
									})}
								</span>
							{:else}
								<span class="text-[10px] text-muted block mt-1">No check-in timestamp</span>
							{/if}
						</div>

						<Badge variant={r.status}>
							{r.status}
						</Badge>
					</div>
				{/each}
			</div>
		{/if}
	</div>
	 {#if checkinSuccess}
              <div class="p-4 rounded-xl border border-semantic-success/30 bg-semantic-success/5 text-sm text-ink">
                      ✅ Checked in to <strong>{checkinSuccess.class_name}</strong> at
                      {new Date(checkinSuccess.verified_at).toLocaleTimeString()}.
              </div>
      {/if}
      {#if checkinError}
              <div class="p-4 rounded-xl border border-semantic-error/30 bg-semantic-error/5 text-sm text-semantic-error">
                      {checkinError}
              </div>
      {/if}

      <Modal bind:isOpen={showScanner} title="Scan Check-In QR" onclose={() => (showScanner = false)}>
              <p class="text-muted text-[13px] mb-4">
                      Point your camera at the QR code on the projector to mark your attendance.
              </p>
              {#if showScanner}
                      <QrScanner ondetect={handleDetect} />
              {/if}
      </Modal>
</div>
