import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLyricTimeline,
  buildMeasuredLyricTimeline,
  lyricStateAtTime,
} from "../player-core.js";
import {
  CHINESE_LYRIC_GROUPS,
  LYRIC_CYCLE_TIMINGS,
  LYRIC_CYCLE_OFFSETS,
  LYRIC_GROUP_TIMINGS,
  OPENING_MANTRA_GROUPS,
  OPENING_MANTRA_TIMINGS,
} from "../lyrics.js";

test("the source video's three opening multiplier mantras precede the prayer", () => {
  assert.equal(OPENING_MANTRA_GROUPS.length, 3);
  assert.deepEqual(OPENING_MANTRA_GROUPS[0], [
    "嗡 桑巴 Ra 桑巴 Ra 波玛纳萨 Ra",
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
  assert.equal(lyricStateAtTime(3.8, timeline).lineIndex, 0);
  assert.equal(lyricStateAtTime(4.1, timeline).lineIndex, 0);
  assert.equal(lyricStateAtTime(7.0, timeline).lineIndex, 1);
  assert.equal(lyricStateAtTime(9.6, timeline).groupIndex, 0);
  assert.equal(lyricStateAtTime(9.8, timeline).groupIndex, 1);
  assert.equal(lyricStateAtTime(17, timeline).groupIndex, 2);

  for (let groupIndex = 0; groupIndex < timeline.length; groupIndex += 1) {
    const cue = timeline[groupIndex];
    assert.equal(cue.characterStarts.length, cue.lines.length);
    for (let lineIndex = 0; lineIndex < cue.lines.length; lineIndex += 1) {
      assert.equal(
        cue.characterStarts[lineIndex].length,
        Array.from(cue.lines[lineIndex]).length,
      );
    }
  }
});

test("the Chinese lyrics match the ten groups shown in the source video", () => {
  assert.equal(CHINESE_LYRIC_GROUPS.length, 10);
  assert.equal(CHINESE_LYRIC_GROUPS.flat().length, 41);
  assert.deepEqual(CHINESE_LYRIC_GROUPS[0], [
    "嗡",
    "现有清净自性任运成",
    "安住十方吉祥刹土中",
    "诸佛正法僧伽贤圣众",
    "顶礼一切愿我等吉祥",
  ]);
  assert.deepEqual(CHINESE_LYRIC_GROUPS.at(-1), [
    "我等如今所作诸事业",
    "一切障难恼害悉消泯",
    "顺缘增长所愿如意成",
    "祈愿吉祥如意悉圆满",
  ]);
  assert.equal(CHINESE_LYRIC_GROUPS[0][3], "诸佛正法僧伽贤圣众");
  assert.equal(CHINESE_LYRIC_GROUPS[6][1], "供养十方佛陀圣嬉女");
  assert.equal(CHINESE_LYRIC_GROUPS[7][1], "千目帝释与持国天王");
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

test("lyric state follows measured line starts instead of equal slices", () => {
  const timeline = [
    {
      cycle: 1,
      groupIndex: 0,
      lines: ["第一句", "第二句", "第三句"],
      section: "prayer",
      start: 10,
      end: 20,
      lineStarts: [10, 11.5, 17],
    },
  ];

  assert.equal(lyricStateAtTime(11.4, timeline).lineIndex, 0);
  assert.equal(lyricStateAtTime(11.6, timeline).lineIndex, 1);
  assert.equal(lyricStateAtTime(17.2, timeline).lineIndex, 2);
  assert.ok(lyricStateAtTime(11.6, timeline).lineProgress < 0.1);
});

test("karaoke progress finishes at the sung line ending instead of stretching through the breath", () => {
  const timeline = [
    {
      cycle: 1,
      groupIndex: 0,
      lines: ["第一句", "第二句"],
      section: "prayer",
      start: 10,
      end: 20,
      lineStarts: [10, 15],
      lineEnds: [12, 18],
    },
  ];

  assert.equal(lyricStateAtTime(14, timeline).lineIndex, 0);
  assert.equal(lyricStateAtTime(14, timeline).lineProgress, 1);
  assert.equal(lyricStateAtTime(16.5, timeline).lineIndex, 1);
  assert.equal(lyricStateAtTime(16.5, timeline).lineProgress, 0.5);
});

test("karaoke progress follows measured character attacks instead of sweeping a line uniformly", () => {
  const timeline = [
    {
      cycle: 1,
      groupIndex: 0,
      lines: ["第一二三"],
      section: "prayer",
      start: 10,
      end: 14,
      lineStarts: [10],
      lineEnds: [14],
      characterStarts: [[10, 11.5, 11.75, 13.5]],
    },
  ];

  const state = lyricStateAtTime(11, timeline);

  assert.equal(state.lineIndex, 0);
  assert.ok(Math.abs(state.lineProgress - 1 / 6) < 0.001);
  assert.notEqual(state.lineProgress, 0.25);
});

test("repeated lyric sections offset measured line endings with their starts", () => {
  const timeline = buildLyricTimeline(
    [["第一句", "第二句"]],
    [{ start: 0, end: 5, lineStarts: [0, 2], lineEnds: [1.5, 4.5] }],
    [10],
  );

  assert.deepEqual(timeline[0].lineStarts, [10, 12]);
  assert.deepEqual(timeline[0].lineEnds, [11.5, 14.5]);
});

test("the measured three-cycle timeline follows the recorded vocal entrances", () => {
  const timeline = buildMeasuredLyricTimeline(
    CHINESE_LYRIC_GROUPS,
    LYRIC_CYCLE_TIMINGS,
  );

  assert.equal(timeline.length, 30);
  assert.deepEqual(
    [
      lyricStateAtTime(30.6, timeline),
      lyricStateAtTime(168.3, timeline),
      lyricStateAtTime(305.7, timeline),
      lyricStateAtTime(433, timeline),
    ].map(({ cycle, groupIndex, lineIndex }) => [cycle, groupIndex, lineIndex]),
    [
      [1, 0, 2],
      [2, 0, 2],
      [3, 0, 2],
      [3, 9, 3],
    ],
  );
});

test("every sung Chinese character has an acoustic attack time in all three recitations", () => {
  for (const cycle of LYRIC_CYCLE_TIMINGS) {
    for (let groupIndex = 0; groupIndex < cycle.length; groupIndex += 1) {
      const timing = cycle[groupIndex];
      const lines = CHINESE_LYRIC_GROUPS[groupIndex];
      assert.equal(timing.characterStarts.length, lines.length);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        assert.equal(
          timing.characterStarts[lineIndex].length,
          Array.from(lines[lineIndex]).length,
        );
      }
    }
  }
});

test("the visible highlight follows the vocal onsets in 文殊童子具德金刚手", () => {
  const timeline = buildMeasuredLyricTimeline(
    CHINESE_LYRIC_GROUPS,
    LYRIC_CYCLE_TIMINGS,
  );

  const duringFourthSyllable = lyricStateAtTime(69.4, timeline);

  assert.equal(duringFourthSyllable.cycle, 1);
  assert.equal(duringFourthSyllable.groupIndex, 3);
  assert.equal(duringFourthSyllable.lineIndex, 0);
  assert.ok(duringFourthSyllable.lineProgress > 0.33);
  assert.ok(duringFourthSyllable.lineProgress < 0.36);
});

test("the visible highlight follows the Tibetan cadence in 遂愿威力吉祥名称佛", () => {
  const timeline = buildMeasuredLyricTimeline(
    CHINESE_LYRIC_GROUPS,
    LYRIC_CYCLE_TIMINGS,
  );

  const afterTheEighthSyllableStarts = lyricStateAtTime(60.7, timeline);

  assert.equal(CHINESE_LYRIC_GROUPS[2][1], "遂愿威力吉祥名称佛");
  assert.equal(afterTheEighthSyllableStarts.cycle, 1);
  assert.equal(afterTheEighthSyllableStarts.groupIndex, 2);
  assert.equal(afterTheEighthSyllableStarts.lineIndex, 1);
  assert.ok(afterTheEighthSyllableStarts.lineProgress > 0.75);
  assert.ok(afterTheEighthSyllableStarts.lineProgress < 0.82);
});

test("the first recitation advances on the MP3 vocal entrances rather than the old visual cuts", () => {
  const timeline = buildMeasuredLyricTimeline(
    CHINESE_LYRIC_GROUPS,
    LYRIC_CYCLE_TIMINGS,
  );

  const beforeSecondBuddha = lyricStateAtTime(44.0, timeline);
  const secondBuddha = lyricStateAtTime(44.2, timeline);

  assert.deepEqual(
    [beforeSecondBuddha.groupIndex, beforeSecondBuddha.lineIndex],
    [1, 0],
  );
  assert.equal(beforeSecondBuddha.lineProgress, 1);
  assert.deepEqual(
    [secondBuddha.groupIndex, secondBuddha.lineIndex],
    [1, 1],
  );
});
