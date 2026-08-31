// Chinese wording transcribed directly from the source video supplied by the user:
// https://www.youtube.com/watch?v=basXlxiKoTA
export const OPENING_MANTRA_GROUPS = Array.from({ length: 3 }, () => [
  "嗡 桑巴 Ra 桑巴 Ra 波玛纳萨 Ra",
  "玛哈臧巴巴吽啪德娑哈",
]);

export const OPENING_MANTRA_TIMINGS = [
  { start: 0, end: 8.5, lineStarts: [0, 6.15] },
  { start: 8.5, end: 17, lineStarts: [8.5, 14.65] },
  { start: 17, end: 26.36, lineStarts: [17, 23.15] },
];

export const CHINESE_LYRIC_GROUPS = [
  [
    "嗡",
    "现有清净自性任运成",
    "安住十方吉祥刹土中",
    "诸佛正法僧伽圣者众",
    "顶礼一切愿我等吉祥",
  ],
  [
    "灯王佛及贤勇义成佛",
    "慈严德佛善名胜德佛",
    "一切义持广大名称佛",
    "如须弥山圣力名德佛",
  ],
  [
    "垂念一切有情名德佛",
    "遂愿威力吉祥名称佛",
    "仅闻名号增德增吉祥",
    "吉祥八大善逝敬顶礼",
  ],
  [
    "文殊童子具德金刚手",
    "圣观自在怙主慈氏尊",
    "地藏菩萨及以除盖障",
    "虚空藏与胜圣普贤尊",
  ],
  [
    "青莲金刚白莲那伽树",
    "如意宝珠宝剑日月轮",
    "持善标帜吉祥殊胜德",
    "八大菩萨勇士敬顶礼",
  ],
  [
    "殊胜宝伞吉祥黄金鱼",
    "如意宝瓶悦意妙莲花",
    "悦音海螺圆满吉祥结",
    "不朽胜幢自在金轮宝",
  ],
  [
    "殊胜标帜八胜吉祥宝",
    "供养十方佛陀圣尊女",
    "仅念等性慧命增吉祥",
    "八大吉祥天女敬顶礼",
  ],
  [
    "大梵大自在天遍入天",
    "千目帝释持国天王",
    "增长天王龙王广目天",
    "多闻天王各持天宝物",
  ],
  [
    "轮三叉戟短枪金刚杵",
    "琵琶宝剑宝塔胜宝幢",
    "三界增上善妙与吉祥",
    "世间八大护法敬顶礼",
  ],
  [
    "我等如今所作诸事业",
    "一切障难恼害悉消泯",
    "顺缘增长所愿如意成",
    "祈愿吉祥如意悉圆满",
  ],
];

// The first recitation's ten on-screen lyric changes, measured against the
// 7:18 source video. Later recitations reuse the same measured cadence.
export const LYRIC_GROUP_TIMINGS = [
  { start: 25.5, end: 41.0 },
  { start: 41.0, end: 54.5 },
  { start: 54.5, end: 68.5 },
  { start: 68.5, end: 81.5 },
  { start: 81.5, end: 95.5 },
  { start: 95.5, end: 106.5 },
  { start: 106.5, end: 117.5 },
  { start: 117.5, end: 127.5 },
  { start: 127.5, end: 144.5 },
  { start: 144.5, end: 157.4 },
];

export const LYRIC_CYCLE_OFFSETS = [0, 137.88, 275.24];

// Measured against the supplied 7:18 recording. Each group carries the
// actual vocal entrance of every displayed line; the three recitations are
// timed independently so small performance differences do not accumulate.
export const LYRIC_CYCLE_TIMINGS = [
  [
    { start: 26, end: 40.92, lineStarts: [26, 26.36, 30.24, 33.84, 37.4] },
    { start: 40.92, end: 54.68, lineStarts: [40.92, 44.4, 47.8, 51.28] },
    { start: 54.68, end: 67.76, lineStarts: [54.68, 58.12, 61.52, 64.92] },
    { start: 67.76, end: 81.56, lineStarts: [67.76, 71.64, 74.96, 78.32] },
    { start: 81.56, end: 94.4, lineStarts: [81.56, 84.88, 88.24, 91.56] },
    { start: 94.4, end: 108.34, lineStarts: [94.4, 98.28, 101.64, 105.02] },
    { start: 108.34, end: 120.72, lineStarts: [108.34, 111.62, 114.84, 118.22] },
    { start: 120.72, end: 134.22, lineStarts: [120.72, 124.74, 128.02, 131.34] },
    { start: 134.22, end: 147.58, lineStarts: [134.22, 137.86, 141.12, 144.34] },
    { start: 147.58, end: 163.34, lineStarts: [147.58, 150.86, 154.06, 157.38] },
  ],
  [
    { start: 163.34, end: 178.78, lineStarts: [163.34, 163.7, 167.96, 171.66, 175.22] },
    { start: 178.78, end: 192.52, lineStarts: [178.78, 182.22, 185.68, 189.12] },
    { start: 192.52, end: 206.16, lineStarts: [192.52, 195.96, 198.84, 202.82] },
    { start: 206.16, end: 219.46, lineStarts: [206.16, 209.5, 212.84, 216.2] },
    { start: 219.46, end: 232.84, lineStarts: [219.46, 222.76, 226.16, 229.48] },
    { start: 232.84, end: 246.02, lineStarts: [232.84, 236.16, 239.52, 242.84] },
    { start: 246.02, end: 258.84, lineStarts: [246.02, 249.48, 252.72, 256] },
    { start: 258.84, end: 271.96, lineStarts: [258.84, 262.48, 265.8, 269.12] },
    { start: 271.96, end: 285.4, lineStarts: [271.96, 275.68, 278.8, 282.2] },
    { start: 285.4, end: 300, lineStarts: [285.4, 288.7, 292, 295.3] },
  ],
  [
    { start: 300, end: 316.08, lineStarts: [300, 300.36, 305.32, 308.92, 312.44] },
    { start: 316.08, end: 329.88, lineStarts: [316.08, 319.56, 323, 326.48] },
    { start: 329.88, end: 343.36, lineStarts: [329.88, 333.32, 336.2, 340.12] },
    { start: 343.36, end: 356.56, lineStarts: [343.36, 346.72, 350, 353.36] },
    { start: 356.56, end: 369.92, lineStarts: [356.56, 359.92, 363.28, 366.56] },
    { start: 369.92, end: 382.88, lineStarts: [369.92, 373.28, 376.64, 379.52] },
    { start: 382.88, end: 396, lineStarts: [382.88, 386.16, 389.3, 393] },
    { start: 396, end: 408.32, lineStarts: [396, 399.5, 403, 406] },
    { start: 408.32, end: 422.76, lineStarts: [408.32, 412, 415, 419] },
    { start: 422.76, end: 438.079, lineStarts: [422.76, 426.08, 429.28, 432.56] },
  ],
];
