export function getYouTubeApiKey(): string | null {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!key || typeof key !== "string" || key.trim().length === 0) return null;
  return key.trim();
}
