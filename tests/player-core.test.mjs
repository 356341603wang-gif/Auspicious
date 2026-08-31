import assert from "node:assert/strict";
import test from "node:test";
import {
  clamp,
  createLotusGeometry,
  formatTime,
  progressRatio,
  seekFromPointer,
  shouldShowLyrics,
  visualEnergy,
} from "../player-core.js";

test("formatTime produces stable minute and hour labels", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(71.9), "1:11");
  assert.equal(formatTime(3661), "1:01:01");
  assert.equal(formatTime(Number.NaN), "0:00");
});

test("seekFromPointer makes the whole progress rail seekable", () => {
  assert.equal(seekFromPointer(150, 100, 200, 600), 150);
  assert.equal(seekFromPointer(40, 100, 200, 600), 0);
  assert.equal(seekFromPointer(340, 100, 200, 600), 600);
  assert.equal(seekFromPointer(150, 100, 0, 600), 0);
});

test("progressRatio remains bounded while metadata is loading", () => {
  assert.equal(progressRatio(120, 480), 0.25);
  assert.equal(progressRatio(5, 0), 0);
  assert.equal(progressRatio(900, 480), 1);
  assert.equal(clamp(-2, 0, 1), 0);
});

test("the opening multiplier mantra is visible before playback begins", () => {
  assert.equal(shouldShowLyrics(0, true, "opening"), true);
  assert.equal(shouldShowLyrics(0, true, "prelude"), false);
  assert.equal(shouldShowLyrics(12, true, "opening"), true);
  assert.equal(shouldShowLyrics(30, false, "prayer"), true);
});

test("createLotusGeometry returns eight evenly spaced directions", () => {
  const points = createLotusGeometry(8, 100);
  assert.equal(points.length, 8);
  assert.ok(Math.abs(points[0].x) < 1e-9);
  assert.ok(Math.abs(points[0].y + 100) < 1e-9);
  assert.ok(Math.abs(points[2].x - 100) < 1e-9);
  assert.ok(Math.abs(points[2].y) < 1e-9);
});

test("visualEnergy is silent while paused and bounded while playing", () => {
  assert.equal(visualEnergy(0.8, 0.6, 0.4, false), 0);
  assert.equal(visualEnergy(0.8, 0.6, 0.4, true), 0.62);
  assert.equal(visualEnergy(5, 5, 5, true), 1);
});
