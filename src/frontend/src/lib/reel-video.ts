import { ExternalBlob } from "@caffeineai/object-storage";

/**
 * Resolve a playable URL for a reel's stored video.
 *
 * The backend stores the video as an object-storage `ExternalBlob`. The
 * generated bindings hand back an `ExternalBlob` whose `directURL` is only
 * meaningful for a blob created in this browser session (an upload-time
 * `blob:` URL). After a reload, or for any other viewer, that URL is stale or
 * empty, so playback must resolve the URL from the stored blob reference
 * instead.
 *
 * `getDirectURL()` returns the gateway proxy URL for a stored blob. When the
 * value is not an `ExternalBlob` (e.g. a test double or a plain URL string),
 * fall back to the value itself so the seam stays tolerant.
 */
export function resolveReelVideoUrl(video: unknown): string {
  if (video instanceof ExternalBlob) {
    return video.getDirectURL();
  }
  if (typeof video === "string") {
    return video;
  }
  if (video && typeof video === "object") {
    const candidate = video as {
      getDirectURL?: () => string;
      directURL?: string;
    };
    if (typeof candidate.getDirectURL === "function") {
      return candidate.getDirectURL();
    }
    if (typeof candidate.directURL === "string") {
      return candidate.directURL;
    }
  }
  return "";
}
