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
    "聆听",
  ];

  unwantedCopy.forEach((copy) => assert.equal(source.includes(copy), false));
  assert.match(html, /aria-label="播放音频"/);
});

test("the opening uses the restrained horizontal artwork reveal", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(html, /class="intro-reveal"/);
  assert.match(html, /class="intro-artwork"/);
  assert.doesNotMatch(html, /intro-(?:dust|mandala|rays|seed|aura)/);
  assert.match(css, /clip-path:\s*inset\(48% 0 48% 0 round 180px\)/);
  assert.match(css, /@keyframes intro-artwork-reveal/);
});
