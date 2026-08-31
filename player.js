import {
  buildLyricTimeline,
  buildMeasuredLyricTimeline,
  createLotusGeometry,
  formatTime,
  lyricStateAtTime,
  progressRatio,
  seekFromPointer,
  shouldShowLyrics,
  visualEnergy,
} from "./player-core.js?v=4";
import {
  CHINESE_LYRIC_GROUPS,
  LYRIC_CYCLE_TIMINGS,
  OPENING_MANTRA_GROUPS,
  OPENING_MANTRA_TIMINGS,
} from "./lyrics.js?v=4";

const FALLBACK_DURATION = 438.079;
const root = document.documentElement;
const intro = document.querySelector("#intro");
const audio = document.querySelector("#audio");
const canvas = document.querySelector("#ambientCanvas");
const context = canvas.getContext("2d", { alpha: true });
const visualStage = document.querySelector("#visualStage");
const playButton = document.querySelector("#playButton");
const muteButton = document.querySelector("#muteButton");
const retryButton = document.querySelector("#retryButton");
const progress = document.querySelector("#progress");
const currentTimeLabel = document.querySelector("#currentTime");
const durationLabel = document.querySelector("#duration");
const statusMessage = document.querySelector("#statusMessage");
const lyricCycle = document.querySelector("#lyricCycle");
const lyricLines = document.querySelector("#lyricLines");
const lyricHint = document.querySelector("#lyricHint");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
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

let audioContext;
let analyser;
let frequencyData;
let animationFrame = 0;
let isVisible = !document.hidden;
let lastFrame = 0;
let isSeeking = false;
let renderedLyricGroup = -1;
let renderedLyricCycle = -1;
let renderedLyricLine = -1;
let renderedLyricSection = "";
let activeLyricElement;

const particles = Array.from({ length: 120 }, (_, index) => ({
  angle: (index * 2.3999632297) % (Math.PI * 2),
  orbit: 0.22 + ((index * 37) % 100) / 100 * 0.42,
  drift: 0.000025 + ((index * 19) % 13) * 0.000002,
  size: 0.45 + ((index * 23) % 10) / 10 * 1.25,
  phase: ((index * 29) % 100) / 100 * Math.PI * 2,
  opacity: 0.08 + ((index * 31) % 100) / 100 * 0.22,
}));

function trackDuration() {
  return Number.isFinite(audio.duration) && audio.duration > 0
    ? audio.duration
    : FALLBACK_DURATION;
}

function renderLyricGroup(state) {
  if (
    state.groupIndex === renderedLyricGroup &&
    state.cycle === renderedLyricCycle &&
    state.phase === renderedLyricSection
  ) {
    return;
  }

  const lines = state.phase === "opening"
    ? OPENING_MANTRA_GROUPS[state.groupIndex]
    : CHINESE_LYRIC_GROUPS[state.groupIndex];
  const fragment = document.createDocumentFragment();
  lines.forEach((line) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = line;
    fragment.append(paragraph);
  });
  lyricLines.replaceChildren(fragment);
  renderedLyricGroup = state.groupIndex;
  renderedLyricCycle = state.cycle;
  renderedLyricSection = state.phase;
  renderedLyricLine = -1;
  activeLyricElement = undefined;
}

function updateLyricState() {
  const state = lyricStateAtTime(audio.currentTime, lyricTimeline);
  renderLyricGroup(state);

  const showLyrics = shouldShowLyrics(
    audio.currentTime,
    audio.paused,
    state.phase,
  );
  root.dataset.lyricsVisible = String(showLyrics);
  root.dataset.lyricsPhase = state.phase;

  if (state.phase === "opening") {
    lyricCycle.textContent = `加倍咒 · ${state.groupIndex + 1} / 3`;
    lyricHint.textContent = "三遍后进入八圣吉祥颂正文";
  } else if (state.phase === "prelude") {
    lyricCycle.textContent = "音乐引子";
    lyricHint.textContent = "正文即将开始";
  } else if (state.phase === "interlude") {
    lyricCycle.textContent = `第 ${state.cycle} 遍`;
    lyricHint.textContent = "稍息 · 下一遍即将开始";
  } else if (state.phase === "outro") {
    lyricCycle.textContent = "三遍圆满";
    lyricHint.textContent = "吉祥圆满";
  } else {
    lyricCycle.textContent = `第 ${state.cycle} 遍`;
    lyricHint.textContent = `${state.groupIndex + 1} / ${CHINESE_LYRIC_GROUPS.length}`;
  }

  const paragraphs = lyricLines.querySelectorAll("p");
  if (state.active && renderedLyricLine !== state.lineIndex) {
    paragraphs.forEach((paragraph, index) => {
      paragraph.classList.toggle("is-active", index === state.lineIndex);
      paragraph.classList.toggle("is-past", index < state.lineIndex);
    });
    renderedLyricLine = state.lineIndex;
    activeLyricElement = paragraphs[state.lineIndex];
  } else if (!state.active && renderedLyricLine !== -1) {
    paragraphs.forEach((paragraph) => paragraph.classList.remove("is-active"));
    renderedLyricLine = -1;
    activeLyricElement = undefined;
  }

  activeLyricElement?.style.setProperty(
    "--line-progress",
    `${(state.lineProgress * 100).toFixed(2)}%`,
  );
}

function updateMediaState() {
  const duration = trackDuration();
  const ratio = progressRatio(audio.currentTime, duration);
  progress.max = String(duration);
  progress.value = String(audio.currentTime);
  root.style.setProperty("--progress", `${ratio * 100}%`);
  currentTimeLabel.textContent = formatTime(audio.currentTime);
  durationLabel.textContent = formatTime(duration);

  const isPlaying = !audio.paused;
  root.dataset.playing = String(isPlaying);
  playButton.setAttribute("aria-label", isPlaying ? "暂停音频" : "播放音频");
  updateLyricState();
}

async function ensureAudioGraph() {
  if (audioContext || reducedMotion.matches) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext = new AudioContextClass();
  const source = audioContext.createMediaElementSource(audio);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.88;
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  frequencyData = new Uint8Array(analyser.frequencyBinCount);
}

async function togglePlayback() {
  if (!audio.paused) {
    audio.pause();
    return;
  }

  try {
    await ensureAudioGraph();
    if (audioContext?.state === "suspended") await audioContext.resume();
  } catch {
    analyser = undefined;
    frequencyData = undefined;
  }

  try {
    await audio.play();
    statusMessage.textContent = "";
    retryButton.hidden = true;
  } catch {
    statusMessage.textContent = "";
  }
}

function updateMuteState() {
  const muted = audio.muted || audio.volume === 0;
  muteButton.setAttribute("aria-pressed", String(muted));
  muteButton.setAttribute("aria-label", muted ? "取消静音" : "静音");
}

function averageBand(start, end) {
  if (!frequencyData) return 0;
  let sum = 0;
  const safeEnd = Math.min(end, frequencyData.length);
  for (let index = start; index < safeEnd; index += 1) {
    sum += frequencyData[index];
  }
  return safeEnd > start ? sum / (safeEnd - start) / 255 : 0;
}

function resizeCanvas() {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(window.innerWidth * scale));
  const height = Math.max(1, Math.round(window.innerHeight * scale));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(scale, 0, 0, scale, 0, 0);
}

function drawPetal(centerX, centerY, radius, angle, energy, timestamp) {
  const breathe = Math.sin(timestamp * 0.00042 + angle * 2) * 3;
  const inner = radius * 0.72;
  const outer = radius + breathe + energy * 14;
  const spread = 0.14 + energy * 0.025;
  const startX = centerX + Math.cos(angle) * inner;
  const startY = centerY + Math.sin(angle) * inner;
  const tipX = centerX + Math.cos(angle) * outer;
  const tipY = centerY + Math.sin(angle) * outer;

  context.beginPath();
  context.moveTo(startX, startY);
  context.quadraticCurveTo(
    centerX + Math.cos(angle - spread) * radius * 0.92,
    centerY + Math.sin(angle - spread) * radius * 0.92,
    tipX,
    tipY,
  );
  context.quadraticCurveTo(
    centerX + Math.cos(angle + spread) * radius * 0.92,
    centerY + Math.sin(angle + spread) * radius * 0.92,
    startX,
    startY,
  );
  context.strokeStyle = `rgba(192, 142, 58, ${0.11 + energy * 0.27})`;
  context.lineWidth = 0.75 + energy * 0.7;
  context.stroke();
}

function drawAmbient(timestamp) {
  if (!isVisible) return;

  const mobile = window.innerWidth <= 760;
  if (mobile && timestamp - lastFrame < 32) {
    animationFrame = requestAnimationFrame(drawAmbient);
    return;
  }
  lastFrame = timestamp;
  updateLyricState();
  resizeCanvas();

  const width = window.innerWidth;
  const height = window.innerHeight;
  const centerX = mobile ? width * 0.5 : width * 0.61;
  const centerY = mobile ? height * 0.54 : height * 0.49;
  const radius = Math.min(width, height) * (mobile ? 0.37 : 0.42);

  let low = 0;
  let mid = 0;
  let high = 0;
  if (analyser && !audio.paused && !reducedMotion.matches) {
    analyser.getByteFrequencyData(frequencyData);
    low = averageBand(0, 12);
    mid = averageBand(12, 40);
    high = averageBand(40, 86);
  }
  const energy = visualEnergy(low, mid, high, !audio.paused);
  root.style.setProperty("--energy", energy.toFixed(3));

  context.clearRect(0, 0, width, height);
  context.lineCap = "round";

  const lotus = createLotusGeometry(8, radius);
  lotus.forEach((point) => {
    drawPetal(centerX, centerY, radius, point.angle, energy, timestamp);
  });

  const ringCount = 4;
  for (let index = 0; index < ringCount; index += 1) {
    const drift = Math.sin(timestamp * 0.0002 + index) * 4;
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      radius * (0.82 + index * 0.085) + drift + energy * 8,
      timestamp * 0.000025 * (index % 2 ? -1 : 1),
      Math.PI * (1.15 + index * 0.14),
    );
    context.strokeStyle = `rgba(212, 184, 149, ${0.045 + index * 0.013 + energy * 0.12})`;
    context.lineWidth = 0.7;
    context.stroke();
  }

  const visibleParticles = mobile ? 58 : particles.length;
  for (let index = 0; index < visibleParticles; index += 1) {
    const particle = particles[index];
    const angle = particle.angle + timestamp * particle.drift;
    const pulse = Math.sin(timestamp * 0.00048 + particle.phase);
    const x = centerX + Math.cos(angle) * width * particle.orbit;
    const y = centerY + Math.sin(angle) * height * particle.orbit * 0.72 + pulse * 8;
    const size = particle.size + energy * (index % 5 === 0 ? 1.6 : 0.45);
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fillStyle = `rgba(232, 220, 199, ${particle.opacity + energy * 0.18})`;
    context.fill();
  }

  animationFrame = requestAnimationFrame(drawAmbient);
}

function startAnimation() {
  cancelAnimationFrame(animationFrame);
  if (isVisible) animationFrame = requestAnimationFrame(drawAmbient);
}

function updateParallax(event) {
  if (reducedMotion.matches || event.pointerType === "touch") return;
  const x = event.clientX / window.innerWidth - 0.5;
  const y = event.clientY / window.innerHeight - 0.5;
  root.style.setProperty("--image-x", `${x * 7}px`);
  root.style.setProperty("--image-y", `${y * 5}px`);
  root.style.setProperty("--orbit-x", `${x * -10}px`);
  root.style.setProperty("--orbit-y", `${y * -8}px`);
}

function resetParallax() {
  root.style.setProperty("--image-x", "0px");
  root.style.setProperty("--image-y", "0px");
  root.style.setProperty("--orbit-x", "0px");
  root.style.setProperty("--orbit-y", "0px");
}

playButton.addEventListener("click", togglePlayback);

muteButton.addEventListener("click", () => {
  audio.muted = !audio.muted;
  updateMuteState();
});

progress.addEventListener("input", () => {
  audio.currentTime = Number(progress.value);
  updateMediaState();
});

progress.addEventListener("change", () => {
  audio.currentTime = Number(progress.value);
  updateMediaState();
});

function seekToPointer(event) {
  const rect = progress.getBoundingClientRect();
  audio.currentTime = seekFromPointer(
    event.clientX,
    rect.left,
    rect.width,
    trackDuration(),
  );
  updateMediaState();
}

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

progress.addEventListener("pointercancel", () => {
  isSeeking = false;
});

retryButton.addEventListener("click", async () => {
  retryButton.hidden = true;
  statusMessage.textContent = "正在重新加载";
  audio.load();
  await togglePlayback();
});

document.addEventListener("pointermove", updateParallax, { passive: true });
document.addEventListener("pointerleave", resetParallax);

document.addEventListener("keydown", (event) => {
  const interactive = event.target.closest("button, input, a");
  if (event.code === "Space" && !interactive) {
    event.preventDefault();
    void togglePlayback();
  }
  if (event.key === "ArrowLeft" && !interactive) {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
    updateMediaState();
  }
  if (event.key === "ArrowRight" && !interactive) {
    audio.currentTime = Math.min(trackDuration(), audio.currentTime + 5);
    updateMediaState();
  }
});

audio.addEventListener("loadedmetadata", () => {
  root.dataset.audioReady = "true";
  statusMessage.textContent = "";
  updateMediaState();
});
audio.addEventListener("durationchange", updateMediaState);
audio.addEventListener("timeupdate", updateMediaState);
audio.addEventListener("play", updateMediaState);
audio.addEventListener("pause", updateMediaState);
audio.addEventListener("ended", () => {
  statusMessage.textContent = "播放完成";
  updateMediaState();
});
audio.addEventListener("volumechange", updateMuteState);
audio.addEventListener("error", () => {
  root.dataset.audioReady = "false";
  statusMessage.textContent = "音频加载失败";
  retryButton.hidden = false;
});

visualStage.querySelector("img").addEventListener("error", () => {
  root.dataset.imageReady = "false";
});

document.addEventListener("visibilitychange", () => {
  isVisible = !document.hidden;
  if (isVisible) startAnimation();
  else cancelAnimationFrame(animationFrame);
});

setTimeout(() => intro?.classList.add("is-finished"), 2500);

updateMediaState();
updateMuteState();
startAnimation();
