export function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max);
}

export function artworkLayout(
  width,
  height,
  naturalWidth,
  naturalHeight,
) {
  const mobile = width < 700;
  const destinationHeight = height * (mobile ? 1.04 : 1.22);
  const destinationWidth = destinationHeight * (naturalWidth / naturalHeight);
  const centerX = width * (mobile ? 0.55 : 0.53);

  return {
    destinationHeight,
    destinationWidth,
    destinationX: centerX - destinationWidth * 0.5,
    destinationY: -height * (mobile ? 0.015 : 0.08),
  };
}

export function outwardRingProgress(ringIndex, ringCount, time) {
  if (ringCount <= 0) return 0;
  return (
    (Math.max(0, ringIndex) / ringCount + Math.max(0, time) * 0.018) % 1
  );
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

export function shouldShowLyrics(currentTime, paused, phase) {
  return phase === "opening" || currentTime > 0.05 || !paused;
}

export function seekFromPointer(clientX, left, width, duration) {
  if (!Number.isFinite(width) || width <= 0) return 0;
  return clamp((clientX - left) / width, 0, 1) * Math.max(0, duration);
}

export function shouldTogglePlayback(eventType, pointerType, elapsedSinceTouch) {
  if (eventType === "pointerup") return pointerType === "touch";
  if (eventType === "click") return elapsedSinceTouch > 700;
  return false;
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

export function buildLyricTimeline(
  groups,
  timings,
  cycleOffsets,
  section = "prayer",
) {
  return cycleOffsets.flatMap((offset, cycleIndex) =>
    groups.map((lines, groupIndex) => ({
      cycle: cycleIndex + 1,
      groupIndex,
      lines,
      section,
      start: timings[groupIndex].start + offset,
      end: timings[groupIndex].end + offset,
      lineStarts: timings[groupIndex].lineStarts?.map((start) => start + offset),
      lineEnds: timings[groupIndex].lineEnds?.map((end) => end + offset),
      characterStarts: timings[groupIndex].characterStarts?.map((line) =>
        line.map((start) => start + offset),
      ),
    })),
  );
}

export function buildMeasuredLyricTimeline(
  groups,
  cycleTimings,
  section = "prayer",
) {
  return cycleTimings.flatMap((timings, cycleIndex) =>
    groups.map((lines, groupIndex) => ({
      cycle: cycleIndex + 1,
      groupIndex,
      lines,
      section,
      ...timings[groupIndex],
    })),
  );
}

export function karaokeProgressAtTime(
  currentTime,
  lineStart,
  lineEnd,
  characterStarts,
) {
  const duration = Math.max(0.001, lineEnd - lineStart);
  if (!Array.isArray(characterStarts) || characterStarts.length === 0) {
    return clamp((currentTime - lineStart) / duration, 0, 1);
  }

  if (currentTime < characterStarts[0]) return 0;

  let characterIndex = 0;
  while (
    characterIndex + 1 < characterStarts.length &&
    characterStarts[characterIndex + 1] <= currentTime
  ) {
    characterIndex += 1;
  }

  const characterStart = characterStarts[characterIndex];
  const characterEnd = characterStarts[characterIndex + 1] ?? lineEnd;
  const characterProgress = clamp(
    (currentTime - characterStart) /
      Math.max(0.001, characterEnd - characterStart),
    0,
    1,
  );

  return clamp(
    (characterIndex + characterProgress) / characterStarts.length,
    0,
    1,
  );
}

export function lyricStateAtTime(currentTime, timeline) {
  const safeTime = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0;
  const first = timeline[0];

  if (!first || safeTime < first.start) {
    return {
      active: false,
      cycle: first?.cycle ?? 1,
      groupIndex: first?.groupIndex ?? 0,
      lineIndex: 0,
      lineProgress: 0,
      phase: "prelude",
    };
  }

  let cueIndex = 0;
  while (
    cueIndex + 1 < timeline.length &&
    timeline[cueIndex + 1].start <= safeTime
  ) {
    cueIndex += 1;
  }

  const cue = timeline[cueIndex];
  const duration = Math.max(0.001, cue.end - cue.start);
  const groupProgress = clamp((safeTime - cue.start) / duration, 0, 1);
  const hasMeasuredLines =
    Array.isArray(cue.lineStarts) && cue.lineStarts.length === cue.lines.length;
  let lineIndex;
  let lineProgress;

  if (hasMeasuredLines) {
    lineIndex = 0;
    while (
      lineIndex + 1 < cue.lineStarts.length &&
      cue.lineStarts[lineIndex + 1] <= safeTime
    ) {
      lineIndex += 1;
    }
    const lineStart = cue.lineStarts[lineIndex];
    const measuredLineEnd = cue.lineEnds?.[lineIndex];
    const lineEnd = Number.isFinite(measuredLineEnd)
      ? measuredLineEnd
      : cue.lineStarts[lineIndex + 1] ?? cue.end;
    lineProgress = karaokeProgressAtTime(
      safeTime,
      lineStart,
      lineEnd,
      cue.characterStarts?.[lineIndex],
    );
  } else {
    const linePosition = groupProgress * cue.lines.length;
    lineIndex = Math.min(
      cue.lines.length - 1,
      Math.max(0, Math.floor(linePosition)),
    );
    lineProgress = clamp(linePosition - lineIndex, 0, 1);
  }
  const active = safeTime <= cue.end;
  const hasNext = cueIndex + 1 < timeline.length;

  return {
    active,
    cycle: cue.cycle,
    groupIndex: cue.groupIndex,
    lineIndex,
    lineProgress: active ? lineProgress : 1,
    phase: active ? cue.section : hasNext ? "interlude" : "outro",
  };
}
