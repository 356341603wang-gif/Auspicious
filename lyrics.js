// Chinese wording transcribed directly from the source video supplied by the user:
// https://www.youtube.com/watch?v=basXlxiKoTA
export const OPENING_MANTRA_GROUPS = Array.from({ length: 3 }, () => [
  "嗡 桑巴 Ra 桑巴 Ra 波玛纳萨 Ra",
  "玛哈臧巴巴吽啪德娑哈",
]);

export const OPENING_MANTRA_TIMINGS = [
  { start: 0, end: 8.5 },
  { start: 8.5, end: 17 },
  { start: 17, end: 25.5 },
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
