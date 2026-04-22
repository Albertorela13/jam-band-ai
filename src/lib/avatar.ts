/**
 * DiceBear avatar URL helper for Jam Session.
 * Stable per seed, warm palette backgrounds.
 */
export function getAvatarUrl(seed: string): string {
  const bg = "f4b940,e8725c,6b8e4e,d99b3a";
  const safe = encodeURIComponent(seed || "jam");
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${safe}&backgroundColor=${bg}&radius=50`;
}
