<script lang="ts">
      import QrScanner from 'qr-scanner';

      interface Props {
              /** Fires with the decoded QR string (the check-in URL). */
              ondetect: (data: string) => void;
      }

      let { ondetect }: Props = $props();

      let videoEl = $state<HTMLVideoElement>();
      let errorMessage = $state<string | null>(null);

      $effect(() => {
              let scanner: QrScanner | null = null;
              let cancelled = false;

              (async () => {
                      try {
                              if (!(await QrScanner.hasCamera())) {
                                      errorMessage = 'No camera was found on this device.';
                                      return;
                              }

                             if (!videoEl) return;
                             scanner = new QrScanner(videoEl, (result) => ondetect(result.data), {
                                      returnDetailedScanResult: true,
                                      highlightScanRegion: true,
                                      highlightCodeOutline: true,
                                      preferredCamera: 'environment'
                              });

                              if (!cancelled) await scanner.start();
                      } catch (err) {
                              console.error('QR scanner failed to start:', err);
                              errorMessage =
                                      err instanceof Error && err.name === 'NotAllowedError'
                                              ? 'Camera permission was denied. Enable it in your browser settings and try again.'
                                              : 'Unable to access the camera. The site must be served over HTTPS for the camera to work.';
                      }
              })();

              // Cleanup when the component is destroyed (modal closed) — stops the camera.
              return () => {
                      cancelled = true;
                      scanner?.stop();
                      scanner?.destroy();
              };
      });
</script>

{#if errorMessage}
      <p class="text-semantic-error text-[13px] text-center py-6">{errorMessage}</p>
{:else}
      <!-- svelte-ignore a11y_media_has_caption -->
      <video bind:this={videoEl} class="w-full aspect-square object-cover rounded-xl bg-black"></video>
{/if}