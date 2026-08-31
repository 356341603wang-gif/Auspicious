import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the experience omits nonessential explanatory copy", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const player = await readFile(new URL("../player.js", import.meta.url), "utf8");
  const source = `${html}\n${player}`;
  const unwantedCopy = [
    "文殊菩萨·智慧",
    "བཀྲ་ཤིས་ཤོག",
    "全知麦彭仁波切造 · 三遍念诵 · 中文颂文随播放同步",
  ];

  unwantedCopy.forEach((copy) => assert.equal(source.includes(copy), false));
  assert.match(html, /aria-label="聆听唱诵"/);
});

test("the subtitle carries the requested practice instruction", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(
    html,
    /任作何事之始，若先念诵一遍，便能顺利如愿成就，故当铭记于心。/,
  );
  assert.doesNotMatch(html, /中文颂文·三遍念诵/);
  assert.match(html, /<p><span>任作何事之始/);
  assert.match(css, /\.resonance-heading p span\s*\{/);
});

test("the page uses the same resonant layout structure as the prayer reference", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(html, /id="resonanceStage"[^>]*class="resonance-stage"/);
  assert.match(html, /class="resonance-canvas"/);
  assert.match(html, /class="resonance-heading"/);
  assert.match(html, /class="resonance-prayer/);
  assert.match(html, /id="resonanceListen"/);
  assert.match(html, /id="resonanceProgress"/);
  assert.match(html, /id="resonanceAudio"/);
  assert.doesNotMatch(html, /class="(?:intro|hero|player-dock)/);
  assert.match(css, /\.resonance-listen/);
  assert.match(css, /\.resonance-progress/);
});

test("the resonant canvas keeps the reference entrance and audio-reactive rings", async () => {
  const player = await readFile(new URL("../player.js", import.meta.url), "utf8");

  assert.match(player, /function buildArtworkLayer/);
  assert.match(player, /function buildBackgroundLayer/);
  assert.match(player, /outwardRingProgress/);
  assert.match(player, /phraseStartPulse/);
  assert.match(player, /classList\.toggle\("is-playing"/);
});
