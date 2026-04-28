/**
 * 宠物/怪物成长资质（端游风：总成长 + 血/法/速/物攻/法攻五项）
 * 数值区间来自你提供的表；OCR 噪声已按相邻档校正。未收录的 spawnKey 走 DEFAULT。
 */

/** @typedef {{ total: [number, number], hp: [number, number], mp: [number, number], spd: [number, number], pAtk: [number, number], mAtk: [number, number], ghost?: boolean }} PetGrowthRow */

/** @type {PetGrowthRow} */
const DEFAULT_ROW = {
  total: [200, 290],
  hp: [55, 75],
  mp: [45, 65],
  spd: [45, 55],
  pAtk: [0, 25],
  mAtk: [35, 55],
}

/** @type {Record<string, PetGrowthRow>} */
export const PET_GROWTH_BY_KEY = {
  qingwa: { total: [135, 225], hp: [50, 70], mp: [50, 70], spd: [25, 35], pAtk: [-10, 10], mAtk: [20, 40] },
  songshu: { total: [135, 225], hp: [40, 60], mp: [25, 45], spd: [35, 45], pAtk: [45, 65], mAtk: [-10, 10] },
  tuzi: { total: [140, 230], hp: [55, 75], mp: [50, 70], spd: [25, 35], pAtk: [-10, 10], mAtk: [20, 40] },
  she: { total: [140, 230], hp: [40, 60], mp: [30, 50], spd: [35, 45], pAtk: [45, 65], mAtk: [-10, 10] },
  houzi: { total: [150, 240], hp: [40, 60], mp: [30, 50], spd: [40, 50], pAtk: [50, 70], mAtk: [-10, 10] },
  shanmao: { total: [150, 240], hp: [45, 65], mp: [40, 60], spd: [35, 45], pAtk: [-10, 10], mAtk: [40, 60] },
  yegou: { total: [150, 240], hp: [45, 65], mp: [30, 50], spd: [35, 45], pAtk: [50, 70], mAtk: [-10, 10] },
  huli_guandao: { total: [150, 240], hp: [40, 60], mp: [40, 60], spd: [40, 50], pAtk: [-10, 10], mAtk: [40, 60] },
  taojing: { total: [160, 250], hp: [40, 60], mp: [60, 80], spd: [40, 50], pAtk: [-10, 10], mAtk: [30, 50] },
  liugui: { total: [160, 250], hp: [40, 60], mp: [60, 80], spd: [40, 50], pAtk: [-10, 10], mAtk: [30, 50] },
  baiyuan: { total: [170, 260], hp: [65, 85], mp: [30, 50], spd: [25, 35], pAtk: [60, 80], mAtk: [-10, 10] },
  ying: { total: [170, 260], hp: [35, 55], mp: [60, 80], spd: [45, 55], pAtk: [-10, 10], mAtk: [40, 60] },
  ying_bh: { total: [170, 260], hp: [35, 55], mp: [60, 80], spd: [45, 55], pAtk: [-10, 10], mAtk: [40, 60] },
  haigui: { total: [170, 260], hp: [80, 100], mp: [55, 75], spd: [15, 25], pAtk: [-10, 10], mAtk: [30, 50] },
  bianfu: { total: [175, 265], hp: [40, 60], mp: [65, 85], spd: [40, 50], pAtk: [-10, 10], mAtk: [40, 60] },
  mang: { total: [185, 275], hp: [55, 75], mp: [60, 80], spd: [40, 50], pAtk: [-10, 10], mAtk: [40, 60] },
  jiangshi: { total: [185, 275], hp: [65, 85], mp: [30, 50], spd: [40, 50], pAtk: [60, 80], mAtk: [-10, 10] },
  guihuoying: { total: [190, 280], hp: [40, 60], mp: [65, 85], spd: [55, 65], pAtk: [-10, 10], mAtk: [40, 60] },
  lang_slp: { total: [190, 280], hp: [55, 75], mp: [30, 50], spd: [50, 60], pAtk: [65, 85], mAtk: [-10, 10] },
  lang_wp: { total: [190, 280], hp: [55, 75], mp: [30, 50], spd: [50, 60], pAtk: [65, 85], mAtk: [-10, 10] },
  laohu: { total: [190, 280], hp: [75, 95], mp: [30, 50], spd: [30, 40], pAtk: [65, 85], mAtk: [-10, 10] },
  laohu_wp: { total: [190, 280], hp: [75, 95], mp: [30, 50], spd: [30, 40], pAtk: [65, 85], mAtk: [-10, 10] },
  huayao: { total: [200, 290], hp: [55, 75], mp: [60, 80], spd: [50, 60], pAtk: [-10, 10], mAtk: [45, 65] },
  yuren: { total: [200, 290], hp: [55, 75], mp: [65, 85], spd: [45, 55], pAtk: [-10, 10], mAtk: [45, 65] },
  dilieshou: { total: [205, 295], hp: [65, 85], mp: [60, 80], spd: [45, 55], pAtk: [-10, 10], mAtk: [45, 65] },
  jintoutuo: { total: [205, 295], hp: [60, 80], mp: [30, 50], spd: [45, 55], pAtk: [80, 100], mAtk: [-10, 10] },
  wulong: { total: [210, 300], hp: [60, 80], mp: [65, 85], spd: [50, 60], pAtk: [-10, 10], mAtk: [45, 65] },
  yanlong: { total: [210, 300], hp: [60, 80], mp: [65, 85], spd: [50, 60], pAtk: [-10, 10], mAtk: [45, 65] },
  binglong: { total: [210, 300], hp: [60, 80], mp: [65, 85], spd: [50, 60], pAtk: [-10, 10], mAtk: [45, 65] },
  qinglong: { total: [210, 300], hp: [60, 80], mp: [65, 85], spd: [50, 60], pAtk: [-10, 10], mAtk: [45, 65] },
  huanglong: { total: [210, 300], hp: [60, 80], mp: [65, 85], spd: [50, 60], pAtk: [-10, 10], mAtk: [45, 65] },
  huoya: { total: [210, 300], hp: [50, 70], mp: [65, 85], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  juxi: { total: [215, 305], hp: [90, 110], mp: [65, 85], spd: [25, 35], pAtk: [0, 20], mAtk: [35, 55] },
  shimo: { total: [215, 305], hp: [85, 105], mp: [30, 50], spd: [35, 45], pAtk: [75, 95], mAtk: [-10, 10] },
  quhun: { total: [220, 310], hp: [65, 85], mp: [65, 85], spd: [50, 60], pAtk: [-10, 10], mAtk: [50, 70] },
  yuangui: { total: [220, 310], hp: [65, 85], mp: [65, 85], spd: [50, 60], pAtk: [-10, 10], mAtk: [50, 70] },
  fengyi: { total: [225, 315], hp: [80, 100], mp: [30, 50], spd: [45, 55], pAtk: [80, 100], mAtk: [-10, 10] },
  dianjing: { total: [230, 320], hp: [75, 95], mp: [50, 70], spd: [65, 75], pAtk: [-10, 10], mAtk: [50, 70] },
  qingyi: { total: [225, 315], hp: [60, 80], mp: [70, 90], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  yushou: { total: [230, 320], hp: [80, 100], mp: [55, 75], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  huangyi: { total: [225, 315], hp: [60, 80], mp: [70, 90], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  fengguai: { total: [230, 320], hp: [75, 95], mp: [50, 70], spd: [60, 70], pAtk: [-10, 10], mAtk: [55, 75] },
  hongyi: { total: [225, 315], hp: [60, 80], mp: [70, 90], spd: [60, 80], pAtk: [-10, 10], mAtk: [50, 70] },
  hongyao: { total: [230, 320], hp: [70, 90], mp: [30, 50], spd: [60, 70], pAtk: [80, 100], mAtk: [-10, 10] },
  ziyi: { total: [225, 315], hp: [60, 80], mp: [70, 90], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  xuenv: { total: [230, 320], hp: [80, 100], mp: [55, 75], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  lanyi: { total: [225, 315], hp: [60, 80], mp: [70, 90], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  yunshou: { total: [230, 320], hp: [90, 110], mp: [30, 50], spd: [40, 50], pAtk: [80, 100], mAtk: [-10, 10] },
  baiyi: { total: [225, 315], hp: [70, 90], mp: [30, 50], spd: [55, 65], pAtk: [80, 100], mAtk: [-10, 10] },
  leiguai: { total: [230, 320], hp: [75, 95], mp: [45, 65], spd: [60, 70], pAtk: [-10, 10], mAtk: [60, 80] },
  shiniuyao: { total: [235, 325], hp: [75, 95], mp: [75, 95], spd: [45, 55], pAtk: [-10, 10], mAtk: [50, 70] },
  kulou_zhanjiang: { total: [235, 325], hp: [65, 85], mp: [70, 90], spd: [60, 70], pAtk: [-10, 10], mAtk: [50, 70] },
  huoguangshu: { total: [235, 325], hp: [75, 95], mp: [55, 75], spd: [60, 70], pAtk: [-10, 10], mAtk: [55, 75] },
  ziyan: { total: [235, 325], hp: [70, 90], mp: [60, 80], spd: [55, 65], pAtk: [-10, 10], mAtk: [60, 80] },
  lanmaojushou: { total: [235, 325], hp: [65, 85], mp: [75, 95], spd: [55, 65], pAtk: [-10, 10], mAtk: [50, 70] },
  tanglangguai: { total: [235, 325], hp: [65, 85], mp: [30, 50], spd: [60, 70], pAtk: [90, 110], mAtk: [-10, 10] },
  santouquanan: { total: [240, 330], hp: [80, 100], mp: [30, 50], spd: [65, 75], pAtk: [75, 95], mAtk: [-10, 10] },
  shixuejuren: { total: [240, 330], hp: [65, 85], mp: [70, 90], spd: [60, 70], pAtk: [-10, 10], mAtk: [55, 75] },
  lianmo: { total: [245, 335], hp: [65, 85], mp: [75, 95], spd: [65, 75], pAtk: [-10, 10], mAtk: [50, 70] },
  hanbingguai: { total: [245, 335], hp: [75, 95], mp: [80, 100], spd: [45, 55], pAtk: [-10, 10], mAtk: [55, 75] },
  xiabing: { total: [245, 335], hp: [70, 90], mp: [75, 95], spd: [60, 70], pAtk: [-10, 10], mAtk: [50, 70] },
  xiejiang: { total: [245, 335], hp: [80, 100], mp: [30, 50], spd: [55, 65], pAtk: [90, 110], mAtk: [-10, 10] },
  bingjinglonglinshou: { total: [250, 340], hp: [90, 110], mp: [55, 75], spd: [55, 65], pAtk: [-10, 10], mAtk: [60, 80] },
  jinchiyuan: { total: [250, 340], hp: [80, 100], mp: [45, 65], spd: [70, 80], pAtk: [-10, 10], mAtk: [65, 85] },
  xuehu: { total: [250, 340], hp: [90, 110], mp: [50, 70], spd: [70, 80], pAtk: [-10, 10], mAtk: [50, 70] },
  jianhun: { total: [250, 340], hp: [80, 100], mp: [30, 50], spd: [70, 80], pAtk: [80, 100], mAtk: [-10, 10] },
  zhengshou: { total: [255, 345], hp: [90, 110], mp: [30, 50], spd: [50, 60], pAtk: [95, 115], mAtk: [-10, 10] },
  diexian: { total: [255, 345], hp: [85, 105], mp: [50, 70], spd: [65, 75], pAtk: [-10, 10], mAtk: [65, 85] },
  bangji: { total: [255, 345], hp: [95, 115], mp: [55, 75], spd: [55, 65], pAtk: [-10, 10], mAtk: [60, 80] },
  shuimoshen: { total: [255, 345], hp: [90, 110], mp: [45, 65], spd: [60, 70], pAtk: [-10, 10], mAtk: [70, 90] },
  jinjiexie: { total: [260, 350], hp: [90, 110], mp: [50, 70], spd: [75, 85], pAtk: [-10, 10], mAtk: [55, 75] },
  doumoxi: { total: [260, 350], hp: [100, 120], mp: [50, 70], spd: [55, 65], pAtk: [-10, 10], mAtk: [65, 85] },
  huasheshou: { total: [260, 350], hp: [95, 115], mp: [50, 70], spd: [70, 80], pAtk: [-10, 10], mAtk: [60, 80] },
  huling: { total: [260, 350], hp: [90, 110], mp: [50, 70], spd: [70, 80], pAtk: [-10, 10], mAtk: [60, 80] },
  zhenshuiguai: { total: [255, 345], hp: [90, 110], mp: [45, 65], spd: [60, 70], pAtk: [-10, 10], mAtk: [65, 85] },
  qiutangxianzi: { total: [255, 345], hp: [85, 105], mp: [55, 75], spd: [55, 65], pAtk: [-10, 10], mAtk: [62, 82] },
  keyao: { total: [255, 345], hp: [92, 112], mp: [50, 70], spd: [58, 68], pAtk: [-10, 10], mAtk: [60, 80] },
  fuling: { total: [255, 345], hp: [60, 80], mp: [70, 90], spd: [55, 65], pAtk: [-10, 10], mAtk: [52, 72] },

  // 鬼宠（表中为固定档，按总成长=五项和录入）
  ghost_lianyu_xuemoa: { ghost: true, total: [320, 320], hp: [110, 110], mp: [70, 70], spd: [65, 65], pAtk: [10, 10], mAtk: [65, 65] },
  ghost_lianyu_kuangmo: { ghost: true, total: [320, 320], hp: [100, 100], mp: [50, 50], spd: [60, 60], pAtk: [100, 100], mAtk: [10, 10] },
  ghost_lianyu_lingmo: { ghost: true, total: [320, 320], hp: [100, 100], mp: [70, 70], spd: [65, 65], pAtk: [10, 10], mAtk: [75, 75] },
  ghost_lianyu_fengmo: { ghost: true, total: [320, 320], hp: [100, 100], mp: [70, 70], spd: [75, 75], pAtk: [10, 10], mAtk: [65, 65] },
  ghost_xueao: { ghost: true, total: [330, 330], hp: [115, 115], mp: [70, 70], spd: [65, 65], pAtk: [10, 10], mAtk: [70, 70] },
  ghost_li_ao: { ghost: true, total: [330, 330], hp: [100, 100], mp: [50, 50], spd: [60, 60], pAtk: [110, 110], mAtk: [10, 10] },
  ghost_ling_ao: { ghost: true, total: [330, 330], hp: [100, 100], mp: [70, 70], spd: [65, 65], pAtk: [10, 10], mAtk: [85, 85] },
  ghost_feng_ao: { ghost: true, total: [330, 330], hp: [100, 100], mp: [70, 70], spd: [80, 80], pAtk: [10, 10], mAtk: [70, 70] },
  ghost_xuemei: { ghost: true, total: [345, 345], hp: [120, 120], mp: [75, 75], spd: [70, 70], pAtk: [10, 10], mAtk: [70, 70] },
  ghost_meihun: { ghost: true, total: [345, 345], hp: [100, 100], mp: [50, 50], spd: [70, 70], pAtk: [115, 115], mAtk: [10, 10] },
  ghost_meiling: { ghost: true, total: [345, 345], hp: [105, 105], mp: [70, 70], spd: [70, 70], pAtk: [10, 10], mAtk: [90, 90] },
  ghost_guimei: { ghost: true, total: [345, 345], hp: [105, 105], mp: [70, 70], spd: [85, 85], pAtk: [10, 10], mAtk: [75, 75] },
  ghost_yinyang_xueshi: { ghost: true, total: [355, 355], hp: [125, 125], mp: [70, 70], spd: [75, 75], pAtk: [10, 10], mAtk: [75, 75] },
  ghost_yinyang_kuangshi: { ghost: true, total: [355, 355], hp: [105, 105], mp: [50, 50], spd: [70, 70], pAtk: [120, 120], mAtk: [10, 10] },
  ghost_yinyang_moshi: { ghost: true, total: [355, 355], hp: [105, 105], mp: [70, 70], spd: [75, 75], pAtk: [10, 10], mAtk: [95, 95] },
  ghost_yinyang_qishi: { ghost: true, total: [355, 355], hp: [110, 110], mp: [70, 70], spd: [90, 90], pAtk: [10, 10], mAtk: [75, 75] },
}

const KEY_ALIASES = {
  huli: 'huli_guandao',
}

/**
 * @param {string} spawnKey
 * @returns {PetGrowthRow}
 */
export function getPetGrowthConfig(spawnKey) {
  const k = KEY_ALIASES[spawnKey] ?? spawnKey
  return PET_GROWTH_BY_KEY[k] ?? DEFAULT_ROW
}

function rollClosed(rng, lo, hi) {
  if (lo > hi) [lo, hi] = [hi, lo]
  return lo + Math.floor(rng() * (hi - lo + 1))
}

/**
 * @returns {{ hp: number, mp: number, spd: number, pAtk: number, mAtk: number, totalBand: [number, number], ghost?: boolean }}
 */
export function rollPetGrowthDetail(spawnKey, rng = Math.random) {
  const c = getPetGrowthConfig(spawnKey)
  const detail = {
    hp: rollClosed(rng, c.hp[0], c.hp[1]),
    mp: rollClosed(rng, c.mp[0], c.mp[1]),
    spd: rollClosed(rng, c.spd[0], c.spd[1]),
    pAtk: rollClosed(rng, c.pAtk[0], c.pAtk[1]),
    mAtk: rollClosed(rng, c.mAtk[0], c.mAtk[1]),
    totalBand: [...c.total],
    ghost: Boolean(c.ghost),
  }
  return detail
}

/**
 * 由成长档与等级换算六维（文字版近似，非端游逐点公式）
 * @param {number} level
 * @param {ReturnType<typeof rollPetGrowthDetail>} g
 * @param {{ baby?: boolean }} opts
 */
export function computeStatsFromGrowth(level, g, opts = {}) {
  const L = Math.max(1, level)
  const baby = Boolean(opts.baby)
  const pa = g.pAtk + 12
  if (baby) {
    return {
      maxHp: Math.max(18, Math.round(20 + g.hp * 0.48)),
      maxMp: Math.max(12, Math.round(12 + g.mp * 0.42)),
      atk: Math.max(4, Math.round(5 + pa * 0.11 + g.mAtk * 0.07)),
      def: Math.max(3, Math.round(3 + g.hp * 0.055 + Math.max(0, g.pAtk) * 0.04)),
      speed: Math.max(4, Math.round(4 + g.spd * 0.17)),
      mAtk: Math.max(2, Math.round(2 + g.mAtk * 0.09)),
    }
  }
  return {
    maxHp: Math.max(22, Math.round(26 + g.hp * L * 0.5 + g.pAtk * L * 0.018)),
    maxMp: Math.max(14, Math.round(16 + g.mp * L * 0.46)),
    atk: Math.max(5, Math.round(7 + pa * L * 0.12 + g.mAtk * L * 0.052)),
    def: Math.max(4, Math.round(4 + g.hp * L * 0.052 + Math.max(0, g.pAtk) * L * 0.032)),
    speed: Math.max(5, Math.round(5 + g.spd * L * 0.185)),
    mAtk: Math.max(3, Math.round(3 + g.mAtk * L * 0.09)),
  }
}

/** 五项成长之和（物攻按表可为负，求和时与总成长对照用） */
export function sumGrowthParts(g) {
  return g.hp + g.mp + g.spd + g.pAtk + g.mAtk
}
