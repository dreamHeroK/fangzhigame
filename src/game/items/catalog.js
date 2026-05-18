/**
 * 消耗品配置：问道端游还魂丹 / 聚灵丹系列 + 血玲珑 / 法玲珑。
 * 五个等级段（T1-T5），每段血药 / 法药各两种；玲珑不计 tier。
 */

/** @typedef {'hp' | 'mp'} RestoreKind */
/** @typedef {{ id: string, name: string, glyph: string, kind: RestoreKind, amount: number, tier: number, levelMin: number, levelMax: number, note?: string }} PotionDef */
/** 玲珑：每颗独立额度；使用时补满目标（实际回复 = min(缺失量, 剩余额度)）。 */
/** @typedef {{ id: string, name: string, glyph: string, kind: RestoreKind, mode: 'quota', tier?: number, note?: string }} QuotaOrbDef */

/** 新获得的一颗玲珑的初始额度 */
export const LINGLONG_DEFAULT_QUOTA = 20_000_000

export const QUOTA_ORB_IDS = /** @type {const} */ (['xuelinglong', 'falinglong'])

export function isQuotaOrbItemId(id) {
  return QUOTA_ORB_IDS.includes(/** @type {(typeof QUOTA_ORB_IDS)[number]} */ (id))
}

// ── T1（1-30 级）：新手期 ───────────────────────────────────────────────────
const T1_HP = [
  { id: 'xiao_huanhun', name: '小还魂丹', glyph: '小', amount: 300 },
  { id: 'huanhun',      name: '还魂丹',   glyph: '还', amount: 600 },
]
const T1_MP = [
  { id: 'xiao_juling', name: '小聚灵丹', glyph: '小', amount: 200 },
  { id: 'juling',      name: '聚灵丹',   glyph: '聚', amount: 400 },
]

// ── T2（30-60 级）：群秒期 ──────────────────────────────────────────────────
const T2_HP = [
  { id: 'zhong_huanhun',    name: '中还魂丹',   glyph: '中', amount: 1500 },
  { id: 'shangpin_huanhun', name: '上品还魂丹', glyph: '上', amount: 3000 },
]
const T2_MP = [
  { id: 'zhong_juling',    name: '中聚灵丹',   glyph: '中', amount: 1000 },
  { id: 'shangpin_juling', name: '上品聚灵丹', glyph: '上', amount: 2000 },
]

// ── T3（60-90 级）：修山主力期 ─────────────────────────────────────────────
const T3_HP = [
  { id: 'da_huanhun',   name: '大还魂丹',   glyph: '大', amount: 6000 },
  { id: 'jipin_huanhun',name: '极品还魂丹', glyph: '极', amount: 12000 },
]
const T3_MP = [
  { id: 'da_juling',    name: '大聚灵丹',   glyph: '大', amount: 4000 },
  { id: 'jipin_juling', name: '极品聚灵丹', glyph: '极', amount: 8000 },
]

// ── T4（90-120 级）：高难度任务 ────────────────────────────────────────────
const T4_HP = [
  { id: 'chaoji_huanhun', name: '超级还魂丹', glyph: '超', amount: 20000 },
  { id: 'teji_huanhun',   name: '特级还魂丹', glyph: '特', amount: 35000 },
]
const T4_MP = [
  { id: 'chaoji_juling', name: '超级聚灵丹', glyph: '超', amount: 15000 },
  { id: 'teji_juling',   name: '特级聚灵丹', glyph: '特', amount: 25000 },
]

// ── T5（120+ 级）：后期主力 ────────────────────────────────────────────────
const T5_HP = [
  { id: 'zizun_huanhun',  name: '至尊还魂丹', glyph: '尊', amount: 60000 },
  { id: 'xianpin_huanhun',name: '仙品还魂丹', glyph: '仙', amount: 100000 },
]
const T5_MP = [
  { id: 'zizun_juling',   name: '至尊聚灵丹', glyph: '尊', amount: 40000 },
  { id: 'xianpin_juling', name: '仙品聚灵丹', glyph: '仙', amount: 70000 },
]

function potionRows(tier, levelMin, levelMax, hpArr, mpArr, note) {
  /** @type {Record<string, PotionDef>} */
  const out = {}
  for (const row of hpArr) {
    out[row.id] = { id: row.id, name: row.name, glyph: row.glyph, kind: 'hp', amount: row.amount, tier, levelMin, levelMax, note }
  }
  for (const row of mpArr) {
    out[row.id] = { id: row.id, name: row.name, glyph: row.glyph, kind: 'mp', amount: row.amount, tier, levelMin, levelMax, note }
  }
  return out
}

/** @type {Record<string, PotionDef | QuotaOrbDef>} */
export const CONSUMABLE_BY_ID = {
  ...potionRows(1, 1,  30,  T1_HP, T1_MP, '新手期，药店常备，入门级补给'),
  ...potionRows(2, 30, 60,  T2_HP, T2_MP, '群秒期，单口药尽量回满一次技能耗蓝'),
  ...potionRows(3, 60, 90,  T3_HP, T3_MP, '修山、十绝阵主力期，三级药性价比最高'),
  ...potionRows(4, 90, 120, T4_HP, T4_MP, '高难度任务，大药防被秒'),
  ...potionRows(5, 120, 999, T5_HP, T5_MP, '后期主力药，血量高时需大量备存'),
  xuelinglong: {
    id: 'xuelinglong', name: '血玲珑', glyph: '血', kind: 'hp', mode: 'quota', tier: 6,
    note: '不可叠加，每颗独立额度与一格；每次使用可将气血补满，实际回复不超过缺失量与当前额度，扣等额额度。',
  },
  falinglong: {
    id: 'falinglong', name: '法玲珑', glyph: '法', kind: 'mp', mode: 'quota', tier: 6,
    note: '不可叠加，每颗独立额度与一格；每次使用可将法力补满，实际回复不超过缺失量与当前额度，扣等额额度。',
  },
}

/** 按怪物等级取掉落池 tier 1–5 */
export function tierFromMonsterLevel(level) {
  const L = Math.max(1, level)
  if (L < 30)  return 1
  if (L < 60)  return 2
  if (L < 90)  return 3
  if (L < 120) return 4
  return 5
}

export function potionIdsForTier(tier) {
  const t = Math.min(5, Math.max(1, tier))
  return Object.values(CONSUMABLE_BY_ID)
    .filter((x) => 'tier' in x && x.tier === t)
    .map((x) => x.id)
}

export function getConsumable(id) {
  return CONSUMABLE_BY_ID[id] ?? null
}

/** @param {PotionDef | QuotaOrbDef | null | undefined} def */
export function isQuotaOrb(def) {
  return !!(def && typeof def === 'object' && 'mode' in def && def.mode === 'quota')
}

/**
 * 固定恢复量：普通药为配置的 amount；玲珑表示「至多补满」。
 * @param {PotionDef | QuotaOrbDef | null | undefined} def
 */
export function getRestoreAmount(def) {
  if (!def) return 0
  if (isQuotaOrb(def)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor(/** @type {PotionDef} */ (def).amount))
}

/** @deprecated 使用 getRestoreAmount */
export function rollRestoreAmount(def, _rng) {
  return getRestoreAmount(def)
}
