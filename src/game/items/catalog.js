/**
 * 消耗品配置：按等级段推荐血药 / 法药及血玲珑、法玲珑。
 * 每档两种药：第一个固定为区间下限、第二个固定为区间上限（不随机）。
 */

/** @typedef {'hp' | 'mp'} RestoreKind */
/** @typedef {{ id: string, name: string, kind: RestoreKind, amount: number, tier: number, levelMin: number, levelMax: number, note?: string }} PotionDef */
/** @typedef {{ id: string, name: string, kind: RestoreKind, mode: 'full', tier?: number, note?: string }} SpecialOrbDef */

/** 等级段 1–30：新手期（表列 100–200 / 80–150 → 第一味 min、第二味 max） */
const T1_HP = [
  { id: 'zhixuecao', name: '止血草', amount: 100 },
  { id: 'yiyecao', name: '一叶草', amount: 200 },
]
const T1_MP = [
  { id: 'baiguo', name: '白果', amount: 80 },
  { id: 'shedan', name: '蛇胆', amount: 150 },
]

/** 30–60 */
const T2_HP = [
  { id: 'qiyelian', name: '七叶莲', amount: 1000 },
  { id: 'qisehua', name: '七色花', amount: 1500 },
]
const T2_MP = [
  { id: 'buqidan', name: '补气丹', amount: 1200 },
  { id: 'yunxiangjing', name: '云香精', amount: 1500 },
]

/** 60–90 */
const T3_HP = [
  { id: 'jinchuangyao', name: '金创药', amount: 3000 },
  { id: 'fengwangmi', name: '蜂王蜜', amount: 7000 },
]
const T3_MP = [
  { id: 'huishendan', name: '回神丹', amount: 2500 },
  { id: 'shuxinwan', name: '舒心丸', amount: 3000 },
]

/** 90–120 */
const T4_HP = [
  { id: 'renshen', name: '人参', amount: 10000 },
  { id: 'lurong', name: '鹿茸', amount: 12000 },
]
const T4_MP = [
  { id: 'lianpengzi', name: '莲蓬子', amount: 10000 },
  { id: 'bitao', name: '碧桃', amount: 15000 },
]

/** 120+ */
const T5_HP = [
  { id: 'longxian', name: '龙涎', amount: 15000 },
  { id: 'zhuguo', name: '朱果', amount: 20000 },
]
const T5_MP = [
  { id: 'julingdan', name: '聚灵丹', amount: 15000 },
  { id: 'hugujiu', name: '虎骨酒', amount: 25000 },
]

function potionRows(tier, levelMin, levelMax, hpArr, mpArr, note) {
  /** @type {Record<string, PotionDef>} */
  const out = {}
  for (const row of hpArr) {
    out[row.id] = {
      id: row.id,
      name: row.name,
      kind: 'hp',
      amount: row.amount,
      tier,
      levelMin,
      levelMax,
      note,
    }
  }
  for (const row of mpArr) {
    out[row.id] = {
      id: row.id,
      name: row.name,
      kind: 'mp',
      amount: row.amount,
      tier,
      levelMin,
      levelMax,
      note,
    }
  }
  return out
}

/** @type {Record<string, PotionDef | SpecialOrbDef>} */
export const CONSUMABLE_BY_ID = {
  ...potionRows(1, 1, 30, T1_HP, T1_MP, '新手期，药店最便宜的药即可'),
  ...potionRows(2, 30, 60, T2_HP, T2_MP, '群秒期，单口药尽量回满一次技能耗蓝'),
  ...potionRows(3, 60, 90, T3_HP, T3_MP, '修山、十绝阵主力期，三级药性价比最高'),
  ...potionRows(4, 90, 120, T4_HP, T4_MP, '高难度任务，大药防被秒'),
  ...potionRows(5, 120, 999, T5_HP, T5_MP, '后期主力药'),
  xuelinglong: {
    id: 'xuelinglong',
    name: '血玲珑',
    kind: 'hp',
    mode: 'full',
    tier: 6,
    note: '瞬间回满当前气血',
  },
  falinglong: {
    id: 'falinglong',
    name: '法玲珑',
    kind: 'mp',
    mode: 'full',
    tier: 6,
    note: '瞬间回满当前法力',
  },
}

/** 按怪物等级取掉落池 tier 1–5 */
export function tierFromMonsterLevel(level) {
  const L = Math.max(1, level)
  if (L < 30) return 1
  if (L < 60) return 2
  if (L < 90) return 3
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

export function isFullRestoreOrb(def) {
  return def && 'mode' in def && def.mode === 'full'
}

/**
 * 固定恢复量：普通药为配置的 amount；玲珑为满血/满蓝（用 Infinity 表示由战斗逻辑封顶）。
 * @param {PotionDef | SpecialOrbDef} def
 */
export function getRestoreAmount(def) {
  if (!def) return 0
  if ('mode' in def && def.mode === 'full') return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor(/** @type {PotionDef} */ (def).amount))
}

/** @deprecated 使用 getRestoreAmount（已不再随机） */
export function rollRestoreAmount(def, _rng) {
  return getRestoreAmount(def)
}
