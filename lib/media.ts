/**
 * Media adapter (simulation boundary).
 *
 * Video URLs are placeholders only — no real media is uploaded, streamed or
 * signed by this reference app. `resolveVideoUrl` validates external input at
 * the boundary and returns a URL suitable for the player component.
 *
 * Swap path: implement `MediaAdapter` with your storage provider (e.g. S3/GCS
 * signed URLs or a streaming service) and export it as `media` below. The
 * lecture model, APIs and UI stay unchanged because they depend only on this
 * interface.
 */
export interface MediaAdapter {
  resolveVideoUrl(raw: string): string;
  readonly label: string;
}

export const localPlaceholderMedia: MediaAdapter = {
  label: "Local placeholder (no real media)",
  resolveVideoUrl(raw: string): string {
    return raw.trim();
  },
};

export const media: MediaAdapter = localPlaceholderMedia;
