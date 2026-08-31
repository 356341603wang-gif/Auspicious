import {
  artworkLayout,
  buildLyricTimeline,
  buildMeasuredLyricTimeline,
  formatTime,
  lyricStateAtTime,
  outwardRingProgress,
  progressRatio,
  seekFromPointer,
} from "./player-core.js?v=12";
import {
  CHINESE_LYRIC_GROUPS,
  LYRIC_CYCLE_TIMINGS,
  OPENING_MANTRA_GROUPS,
  OPENING_MANTRA_TIMINGS,
} from "./lyrics.js?v=12";

const ARTWORK_URL = "./manjushri-statue.jpg";
const FALLBACK_DURATION = 438.079;
const PLAY_ICON = `
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
  </svg>`;
const PAUSE_ICON = `
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="14" y="3" width="5" height="18" rx="1"></rect>
    <rect x="5" y="3" width="5" height="18" rx="1"></rect>
  </svg>`;

const lyricTimeline = [
  ...buildLyricTimeline(
    OPENING_MANTRA_GROUPS,
    OPENING_MANTRA_TIMINGS,
    [0],
    "opening",
  ),
  ...buildMeasuredLyricTimeline(
    CHINESE_LYRIC_GROUPS,
    LYRIC_CYCLE_TIMINGS,
  ),
];
const VOCAL_PHRASE_STARTS = lyricTimeline
  .flatMap((cue) => cue.lineStarts ?? [cue.start])
  .sort((left, right) => left - right);

const stage = document.querySelector("#resonanceStage");
const canvas = document.querySelector("#resonanceCanvas");
const audio = document.querySelector("#resonanceAudio");
const listen = document.querySelector("#resonanceListen");
const listenIcon = listen.querySelector(".resonance-listen-icon");
const listenLabel = document.querySelector("#resonanceListenLabel");
const listenTime = document.querySelector("#resonanceListenTime");
const progress = document.querySelector("#resonanceProgress");
const prayer = document.querySelector("#lyricsPanel");
const lyricRule = document.querySelector("#lyricRule");
const previousLyric = document.querySelector("#previousLyric");
const currentLyric = document.querySelector("#currentLyric");
const currentLyricBase = currentLyric.querySelector(".resonance-prayer-text-base");
const currentLyricFill = currentLyric.querySelector(".resonance-prayer-text-fill");
const nextLyric = document.querySelector("#nextLyric");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let audioGraph;
let image;
let artworkLayer;
let backgroundLayer;
let animationFrame = 0;
let canvasStartTime = performance.now();
let disposed = false;
let isSeeking = false;
let audioFailed = false;
let renderedLyricKey = "";
let renderedDotIndex = -1;
let smoothedEnergy = 0;
let adaptivePeak = 0.16;

function trackDuration() {
  return Number.isFinite(audio.duration) && audio.duration > 0
    ? audio.duration
    : FALLBACK_DURATION;
}

function formatClock(seconds) {
  const value = formatTime(seconds);
  return value.split(":").length === 2 ? value.padStart(5, "0") : value;
}

function cueIndexAtTime(currentTime) {
  let cueIndex = 0;
  while (
    cueIndex + 1 < lyricTimeline.length &&
    lyricTimeline[cueIndex + 1].start <= currentTime
  ) {
    cueIndex += 1;
  }
  return cueIndex;
}

function visibleLyricState(currentTime) {
  const state = lyricStateAtTime(currentTime, lyricTimeline);
  const cueIndex = cueIndexAtTime(currentTime);
  const cue = lyricTimeline[cueIndex] ?? lyricTimeline[0];
  const lineIndex = Math.min(state.lineIndex, cue.lines.length - 1);
  const previousCue = lyricTimeline[Math.max(0, cueIndex - 1)];
  const nextCue = lyricTimeline[Math.min(lyricTimeline.length - 1, cueIndex + 1)];

  return {
    ...state,
    cue,
    cueIndex,
    lineIndex,
    current: cue.lines[lineIndex] ?? "",
    previous:
      lineIndex > 0
        ? cue.lines[lineIndex - 1]
        : previousCue === cue
          ? ""
          : previousCue.lines.at(-1) ?? "",
    next:
      lineIndex + 1 < cue.lines.length
        ? cue.lines[lineIndex + 1]
        : nextCue === cue
          ? ""
          : nextCue.lines[0] ?? "",
  };
}

function buildLyricRule() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < CHINESE_LYRIC_GROUPS.length; index += 1) {
    fragment.append(document.createElement("i"));
  }
  lyricRule.replaceChildren(fragment);
}

function updateLyricUi(currentTime = audio.currentTime) {
  const state = visibleLyricState(currentTime);
  const key = `${state.cueIndex}-${state.lineIndex}`;
  if (key !== renderedLyricKey) {
    previousLyric.textContent = state.previous;
    currentLyricBase.textContent = state.current;
    currentLyricFill.textContent = state.current;
    nextLyric.textContent = state.next;
    currentLyric.classList.remove("is-entering");
    void currentLyric.offsetWidth;
    currentLyric.classList.add("is-entering");
    renderedLyricKey = key;
  }

  stage.style.setProperty(
    "--prayer-fill",
    `${(state.lineProgress * 100).toFixed(3)}%`,
  );
  prayer.classList.toggle("is-resting", !state.active);

  const dotIndex = state.cue.section === "opening"
    ? Math.min(state.cue.groupIndex, CHINESE_LYRIC_GROUPS.length - 1)
    : state.cue.groupIndex;
  if (dotIndex !== renderedDotIndex) {
    lyricRule.querySelectorAll("i").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === dotIndex);
    });
    renderedDotIndex = dotIndex;
  }
}

function updateMediaUi() {
  const duration = trackDuration();
  const ratio = progressRatio(audio.currentTime, duration);
  const isPlaying = !audio.paused;
  progress.max = String(duration);
  if (!isSeeking) progress.value = String(audio.currentTime);
  progress.style.setProperty("--resonance-progress", `${ratio * 100}%`);
  listen.style.setProperty("--listen-progress", `${ratio * 100}%`);
  listenTime.textContent = audioFailed
    ? "加载失败，点击重试"
    : `${formatClock(audio.currentTime)} / ${formatClock(duration)}`;
  listenLabel.textContent = audioFailed
    ? "重新播放"
    : isPlaying
      ? "暂停播放"
      : "开始聆听";
  listenIcon.innerHTML = isPlaying ? PAUSE_ICON : PLAY_ICON;
  listen.setAttribute("aria-label", isPlaying ? "暂停唱诵" : "聆听唱诵");
  listen.setAttribute("aria-pressed", String(isPlaying));
  stage.classList.toggle("is-playing", isPlaying);
  updateLyricUi(audio.currentTime);
}

async function ensureAudioGraph() {
  if (audioGraph) return audioGraph;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return undefined;
  const context = new AudioContextClass();
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.86;
  const source = context.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(context.destination);
  audioGraph = {
    context,
    analyser,
    frequencyData: new Uint8Array(analyser.frequencyBinCount),
  };
  return audioGraph;
}

async function togglePlayback() {
  if (!audio.paused) {
    audio.pause();
    return;
  }

  try {
    const graph = await ensureAudioGraph();
    if (graph?.context.state === "suspended") await graph.context.resume();
    if (audioFailed) audio.load();
    audioFailed = false;
    await audio.play();
    canvasStartTime = Math.min(canvasStartTime, performance.now() - 2200);
    requestCanvasRender();
  } catch {
    audioFailed = true;
    updateMediaUi();
  }
}

function easeOutExpo(value) {
  if (value >= 1) return 1;
  return 1 - 2 ** (-10 * value);
}

function phraseStartPulse(currentTime) {
  let pulse = 0;
  for (const cue of VOCAL_PHRASE_STARTS) {
    const offset = currentTime - cue;
    if (offset < -0.08) break;
    if (offset > 0.52) continue;
    const progress = (offset + 0.08) / 0.6;
    const value = progress < 0.22
      ? progress / 0.22
      : Math.max(0, 1 - (progress - 0.22) / 0.78);
    pulse = Math.max(pulse, value);
  }
  return pulse;
}

function buildArtworkLayer(sourceImage, width, height, pixelRatio) {
  const layer = document.createElement("canvas");
  layer.width = Math.max(1, Math.round(width * pixelRatio));
  layer.height = Math.max(1, Math.round(height * pixelRatio));
  const context = layer.getContext("2d");
  if (!context) return layer;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const layout = artworkLayout(
    width,
    height,
    sourceImage.naturalWidth,
    sourceImage.naturalHeight,
  );
  context.filter = "brightness(1.08) saturate(1.1) contrast(1.1)";
  const sourceCrop = {
    x: sourceImage.naturalWidth * 0.09375,
    y: sourceImage.naturalHeight * 0.15,
    width: sourceImage.naturalWidth * 0.8125,
    height: sourceImage.naturalHeight * 0.8125,
  };
  context.drawImage(
    sourceImage,
    sourceCrop.x,
    sourceCrop.y,
    sourceCrop.width,
    sourceCrop.height,
    layout.destinationX,
    layout.destinationY,
    layout.destinationWidth,
    layout.destinationHeight,
  );
  context.filter = "none";

  context.globalCompositeOperation = "destination-in";
  const horizontalMask = context.createLinearGradient(
    layout.destinationX,
    0,
    layout.destinationX + layout.destinationWidth,
    0,
  );
  horizontalMask.addColorStop(0, "rgba(0,0,0,0)");
  horizontalMask.addColorStop(0.05, "rgba(0,0,0,0.24)");
  horizontalMask.addColorStop(0.12, "rgba(0,0,0,0.82)");
  horizontalMask.addColorStop(0.18, "rgba(0,0,0,1)");
  horizontalMask.addColorStop(0.84, "rgba(0,0,0,1)");
  horizontalMask.addColorStop(0.94, "rgba(0,0,0,0.7)");
  horizontalMask.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = horizontalMask;
  context.fillRect(0, 0, width, height);

  const verticalMask = context.createLinearGradient(0, 0, 0, height);
  verticalMask.addColorStop(0, "rgba(0,0,0,0.78)");
  verticalMask.addColorStop(0.08, "rgba(0,0,0,1)");
  verticalMask.addColorStop(0.82, "rgba(0,0,0,1)");
  verticalMask.addColorStop(1, "rgba(0,0,0,0.08)");
  context.fillStyle = verticalMask;
  context.fillRect(0, 0, width, height);
  return layer;
}

function buildBackgroundLayer(width, height) {
  const layer = document.createElement("canvas");
  layer.width = Math.max(1, Math.round(width));
  layer.height = Math.max(1, Math.round(height));
  const context = layer.getContext("2d");
  if (!context) return layer;

  context.fillStyle = "#1c1d19";
  context.fillRect(0, 0, width, height);

  const olive = context.createRadialGradient(
    width * 0.14,
    height * 0.16,
    0,
    width * 0.14,
    height * 0.16,
    Math.max(width, height) * 0.86,
  );
  olive.addColorStop(0, "rgba(91, 97, 61, 0.5)");
  olive.addColorStop(0.5, "rgba(43, 46, 32, 0.24)");
  olive.addColorStop(1, "rgba(28, 29, 25, 0)");
  context.fillStyle = olive;
  context.fillRect(0, 0, width, height);

  const warmth = context.createRadialGradient(
    width * 0.52,
    height * 0.43,
    0,
    width * 0.52,
    height * 0.43,
    Math.max(width, height) * 0.62,
  );
  warmth.addColorStop(0, "rgba(226, 165, 79, 0.28)");
  warmth.addColorStop(0.34, "rgba(112, 80, 40, 0.16)");
  warmth.addColorStop(0.72, "rgba(54, 49, 36, 0.08)");
  warmth.addColorStop(1, "rgba(28, 29, 25, 0)");
  context.fillStyle = warmth;
  context.fillRect(0, 0, width, height);

  const horizon = context.createLinearGradient(0, 0, 0, height);
  horizon.addColorStop(0, "rgba(17, 18, 15, 0.04)");
  horizon.addColorStop(0.58, "rgba(32, 31, 24, 0.03)");
  horizon.addColorStop(1, "rgba(13, 14, 12, 0.82)");
  context.fillStyle = horizon;
  context.fillRect(0, 0, width, height);
  return layer;
}

function renderCanvas(timestamp) {
  if (disposed || !image) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  const bounds = stage.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (
    canvas.width !== Math.round(width * dpr) ||
    canvas.height !== Math.round(height * dpr) ||
    !artworkLayer ||
    !backgroundLayer
  ) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    artworkLayer = buildArtworkLayer(image, width, height, dpr);
    backgroundLayer = buildBackgroundLayer(width, height);
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  const elapsed = Math.max(0, timestamp - canvasStartTime);
  const time = elapsed / 1000;
  const entrance = reducedMotion.matches
    ? 1
    : easeOutExpo(Math.min(1, elapsed / 1900));
  const isPlaying = !audio.paused;
  let audioLevel = 0;

  if (isPlaying && audioGraph) {
    audioGraph.analyser.getByteFrequencyData(audioGraph.frequencyData);
    let total = 0;
    const sampleCount = Math.min(audioGraph.frequencyData.length, 84);
    for (let index = 0; index < sampleCount; index += 1) {
      total += audioGraph.frequencyData[index];
    }
    const rawEnergy = total / sampleCount / 255;
    adaptivePeak = Math.max(rawEnergy, adaptivePeak * 0.997);
    const normalizedEnergy = Math.min(1, rawEnergy / Math.max(0.08, adaptivePeak * 0.86));
    smoothedEnergy += (normalizedEnergy - smoothedEnergy) * 0.12;
    audioLevel = smoothedEnergy;
  } else {
    smoothedEnergy += (0 - smoothedEnergy) * 0.04;
  }

  context.drawImage(backgroundLayer, 0, 0, width, height);
  const haloX = width * (0.52 + Math.sin(time * 0.11) * 0.004);
  const haloY = height * (0.43 + Math.cos(time * 0.09) * 0.004);
  const phrasePulse = isPlaying ? phraseStartPulse(audio.currentTime) : 0;
  const motionBoost = 1 + audioLevel * 0.65 + phrasePulse * 1.4;

  context.save();
  context.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 12; ring += 1) {
    const ringProgress = outwardRingProgress(ring, 12, time);
    const radius = Math.min(width, height) * (0.16 + ringProgress * 0.72) * (0.5 + entrance * 0.5);
    const segments = 80;
    context.beginPath();
    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2;
      const wave =
        Math.sin(angle * 3 + time * 0.07 + ring * 0.23) * (2.2 + ringProgress * 3.4) +
        Math.cos(angle * 5 - time * 0.045) * 1.6;
      const x = haloX + Math.cos(angle) * (radius + wave * motionBoost) * 1.08;
      const y = haloY + Math.sin(angle) * (radius + wave * motionBoost) * 0.88;
      if (segment === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    const ringVisibility = Math.sin(ringProgress * Math.PI) * (1 - ringProgress * 0.34);
    context.strokeStyle = `rgba(241, 188, 98, ${ringVisibility * (0.085 + audioLevel * 0.045)})`;
    context.lineWidth = (ring % 3 === 0 ? 1.05 : 0.52) * (1 - ringProgress * 0.38);
    context.stroke();
  }
  context.restore();

  context.save();
  context.globalAlpha = 0.18 + entrance * 0.82;
  const scale = reducedMotion.matches ? 1 : 1.055 - entrance * 0.055;
  context.translate(width * 0.5, height * 0.47);
  context.scale(scale, scale);
  context.translate(-width * 0.5, -height * 0.47);
  context.drawImage(artworkLayer, 0, 0, width, height);
  context.restore();

  if (isPlaying) {
    updateMediaUi();
  }
  if (!reducedMotion.matches || elapsed < 2100 || isPlaying) {
    animationFrame = requestAnimationFrame(renderCanvas);
  }
}

function requestCanvasRender() {
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(renderCanvas);
}

async function loadArtwork() {
  const sourceImage = new Image();
  sourceImage.decoding = "async";
  sourceImage.src = ARTWORK_URL;
  if (!sourceImage.complete) {
    await new Promise((resolve, reject) => {
      sourceImage.addEventListener("load", resolve, { once: true });
      sourceImage.addEventListener("error", reject, { once: true });
    });
  }
  try { await sourceImage.decode(); } catch {}
  image = sourceImage;
  artworkLayer = undefined;
  backgroundLayer = undefined;
  canvasStartTime = performance.now();
  requestCanvasRender();
}

function seekToPointer(event) {
  const bounds = progress.getBoundingClientRect();
  const nextTime = seekFromPointer(
    event.clientX,
    bounds.left,
    bounds.width,
    trackDuration(),
  );
  audio.currentTime = nextTime;
  progress.value = String(nextTime);
  updateMediaUi();
}

listen.addEventListener("click", () => void togglePlayback());
progress.addEventListener("input", () => {
  audio.currentTime = Number(progress.value);
  updateMediaUi();
});
progress.addEventListener("pointerdown", (event) => {
  isSeeking = true;
  progress.setPointerCapture?.(event.pointerId);
  seekToPointer(event);
});
progress.addEventListener("pointermove", (event) => {
  if (isSeeking) seekToPointer(event);
});
progress.addEventListener("pointerup", (event) => {
  if (!isSeeking) return;
  seekToPointer(event);
  isSeeking = false;
  progress.releasePointerCapture?.(event.pointerId);
});
progress.addEventListener("pointercancel", () => { isSeeking = false; });
progress.addEventListener("click", seekToPointer);

document.addEventListener("keydown", (event) => {
  const interactive = event.target.closest?.("button, input, a, textarea, select");
  if (event.code === "Space" && !interactive) {
    event.preventDefault();
    void togglePlayback();
  }
});

audio.addEventListener("loadedmetadata", updateMediaUi);
audio.addEventListener("durationchange", updateMediaUi);
audio.addEventListener("timeupdate", updateMediaUi);
audio.addEventListener("play", () => {
  audioFailed = false;
  updateMediaUi();
  requestCanvasRender();
});
audio.addEventListener("pause", updateMediaUi);
audio.addEventListener("ended", () => {
  audio.currentTime = 0;
  updateMediaUi();
});
audio.addEventListener("error", () => {
  audioFailed = true;
  updateMediaUi();
});

window.addEventListener("resize", () => {
  artworkLayer = undefined;
  backgroundLayer = undefined;
  requestCanvasRender();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(animationFrame);
  else requestCanvasRender();
});

buildLyricRule();
updateMediaUi();
void loadArtwork();

window.addEventListener("beforeunload", () => {
  disposed = true;
  cancelAnimationFrame(animationFrame);
});
