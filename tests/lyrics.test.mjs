import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLyricTimeline,
  lyricStateAtTime,
} from "../player-core.js";
import {
  CHINESE_LYRIC_GROUPS,
  LYRIC_CYCLE_OFFSETS,
  LYRIC_GROUP_TIMINGS,
  OPENING_MANTRA_GROUPS,
  OPENING_MANTRA_TIMINGS,
} from "../lyrics.js";

test("the source video's three opening multiplier mantras precede the prayer", () => {
  assert.equal(OPENING_MANTRA_GROUPS.length, 3);
  assert.deepEqual(OPENING_MANTRA_GROUPS[0], [
    "嗡 桑巴囸 桑巴囸 波玛纳萨囸",
    "玛哈臧巴巴吽啪德娑哈",
  ]);
  assert.deepEqual(OPENING_MANTRA_GROUPS[1], OPENING_MANTRA_GROUPS[0]);
  assert.deepEqual(OPENING_MANTRA_GROUPS[2], OPENING_MANTRA_GROUPS[0]);

  const timeline = buildLyricTimeline(
    OPENING_MANTRA_GROUPS,
    OPENING_MANTRA_TIMINGS,
    [0],
    "opening",
  );
  assert.equal(timeline.length, 3);
  assert.equal(lyricStateAtTime(1, timeline).phase, "opening");
  assert.equal(lyricStateAtTime(9, timeline).groupIndex, 1);
  assert.equal(lyricStateAtTime(18, timeline).groupIndex, 2);
});

test("the Chinese lyrics match the ten groups shown in the source video", () => {
  assert.equal(CHINESE_LYRIC_GROUPS.length, 10);
  assert.equal(CHINESE_LYRIC_GROUPS.flat().length, 41);
  assert.deepEqual(CHINESE_LYRIC_GROUPS[0], [
    "嗡",
    "现有清净自性任运成",
    "安住十方吉祥刹土中",
    "诸佛正法僧伽圣者众",
    "顶礼一切愿我等吉祥",
  ]);
  assert.deepEqual(CHINESE_LYRIC_GROUPS.at(-1), [
    "我等如今所作诸事业",
    "一切障难恼害悉消泯",
    "顺缘增长所愿如意成",
    "祈愿吉祥如意悉圆满",
  ]);
});

test("the ten source-video groups expand across all three recitations", () => {
  const timeline = buildLyricTimeline(
    CHINESE_LYRIC_GROUPS,
    LYRIC_GROUP_TIMINGS,
    LYRIC_CYCLE_OFFSETS,
  );

  assert.equal(timeline.length, 30);
  assert.equal(timeline[0].cycle, 1);
  assert.equal(timeline[10].cycle, 2);
  assert.equal(timeline[20].cycle, 3);
  assert.equal(timeline[10].start, timeline[0].start + LYRIC_CYCLE_OFFSETS[1]);
});

test("lyric state follows seeking, line progress, rests, and the three cycles", () => {
  const timeline = buildLyricTimeline(
    CHINESE_LYRIC_GROUPS,
    LYRIC_GROUP_TIMINGS,
    LYRIC_CYCLE_OFFSETS,
  );

  assert.deepEqual(lyricStateAtTime(0, timeline), {
    active: false,
    cycle: 1,
    groupIndex: 0,
    lineIndex: 0,
    lineProgress: 0,
    phase: "prelude",
  });

  const first = lyricStateAtTime(26, timeline);
  assert.equal(first.active, true);
  assert.equal(first.cycle, 1);
  assert.equal(first.groupIndex, 0);

  const second = lyricStateAtTime(164, timeline);
  assert.equal(second.active, true);
  assert.equal(second.cycle, 2);
  assert.equal(second.groupIndex, 0);

  const third = lyricStateAtTime(302, timeline);
  assert.equal(third.active, true);
  assert.equal(third.cycle, 3);
  assert.equal(third.groupIndex, 0);

  const middleOfGroup = lyricStateAtTime(48, timeline);
  assert.equal(middleOfGroup.groupIndex, 1);
  assert.ok(middleOfGroup.lineProgress >= 0);
  assert.ok(middleOfGroup.lineProgress <= 1);

  assert.equal(lyricStateAtTime(160, timeline).phase, "interlude");
  assert.equal(lyricStateAtTime(437, timeline).phase, "outro");
});
