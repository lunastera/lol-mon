/**
 * Pre-download quiz images into the browser's Cache Storage. public/sw.js
 * serves Data Dragon requests from the same cache, so pre-downloaded images
 * load without any network access.
 */
export const IMAGE_CACHE = "ddragon-images";

const FLAG_KEY = "lol-ken.predownloaded-version";

export function canPredownload(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

/** Whether a pre-download has completed for this Data Dragon version. */
export function isPredownloaded(version: string): boolean {
  try {
    return localStorage.getItem(FLAG_KEY) === version;
  } catch {
    return false;
  }
}

export async function predownloadImages(
  urls: readonly string[],
  version: string,
  onProgress: (done: number, total: number) => void,
): Promise<void> {
  const cache = await caches.open(IMAGE_CACHE);

  // Drop entries left over from older Data Dragon versions.
  for (const request of await cache.keys()) {
    if (!request.url.includes(`/cdn/${version}/`)) {
      await cache.delete(request);
    }
  }

  let done = 0;
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (;;) {
        const url = queue.pop();
        if (!url) return;
        if (!(await cache.match(url))) {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`${res.status}: ${url}`);
          await cache.put(url, res);
        }
        done++;
        onProgress(done, urls.length);
      }
    }),
  );

  try {
    localStorage.setItem(FLAG_KEY, version);
  } catch {
    // Cache Storage succeeded; the flag is only a UI hint.
  }
}
