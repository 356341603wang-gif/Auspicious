export function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";

  const wholeSeconds = Math.floor(Math.max(0, seconds));
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remaining = wholeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function progressRatio(currentTime, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return clamp(currentTime / duration, 0, 1);
}

export function seekFromPointer(clientX, left, width, duration) {
  if (!Number.isFinite(width) || width <= 0) return 0;
  return clamp((clientX - left) / width, 0, 1) * Math.max(0, duration);
}

export function createLotusGeometry(count = 8, radius = 1) {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    return {
      angle,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  });
}

export function visualEnergy(low, mid, high, isPlaying) {
  if (!isPlaying) return 0;
  return clamp(low * 0.4 + mid * 0.3 + high * 0.3, 0, 1);
}
