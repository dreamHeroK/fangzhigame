/**
 * 宠物天书系统 — 问道端游还原
 *
 * 11种触发型天书，三品质（白/蓝/金），灵气机制。
 * 每本天书给宠物 +6000 灵气，技能触发时消耗灵气；
 * 灵气耗尽则天书技能失效（仅 尽忠 为纯被动）。
 */

// ── 品质 ──────────────────────────────────────────────────────────────────────

export const TIANSHU_QUALITY = {
  white: { key: 'white', name: '白',  color: '#888888',  baseAttrCount: 0, triggerBonus: 0 },
  blue:  { key: 'blue',  name: '蓝',  color: '#4a88cc',  baseAttrCount: 3, triggerBonus: 0.05 },
  gold:  { key: 'gold',  name: '金',  color: '#c8a020',  baseAttrCount: 5, triggerBonus: 0.10 },
}

export const TIANSHU_SPIRIT_PER_BOOK = 6000
export const TIANSHU_SPIRIT_MAX      = 30000
export const TIANSHU_MAX_SLOTS       = 3

// ── 天书定义 ─────────────────────────────────────────────────────────────────

/**
 * trigger 字段：
 *   'on_physical_hit'  – 宠物发出物理攻击命中后
 *   'on_magic_hit'     – 宠物发出法术攻击命中后
 *   'on_hit_taken'     – 宠物被攻击命中时
 *   'passive'          – 持续生效，无触发判断
 */
export const TIANSHU_DEFS = [
  {
    id: 'ts_mogu',
    name: '魔引',
    glyph: '魔',
    trigger: 'on_physical_hit',
    triggerDesc: '物理攻击触发',
    desc: '物理攻击命中后：消耗自身法力，附加额外法术伤害',
    spiritCost: 1500,
    triggerChance: 0.35,
    statFocus: 'physical',
    effect: { type: 'extra_magic_dmg', mAtkRatio: 0.45 },
  },
  {
    id: 'ts_kuangbao',
    name: '狂暴',
    glyph: '狂',
    trigger: 'on_physical_hit',
    triggerDesc: '物理攻击触发',
    desc: '物理攻击命中后：对目标及随机一个敌人造成溅射伤害',
    spiritCost: 2000,
    triggerChance: 0.30,
    statFocus: 'physical',
    effect: { type: 'splash_dmg', primaryRatio: 0.55 },
  },
  {
    id: 'ts_lieyian',
    name: '烈炎',
    glyph: '炎',
    trigger: 'on_physical_hit',
    triggerDesc: '物理攻击触发',
    desc: '物理攻击命中后：附加相性属性法术伤害',
    spiritCost: 1200,
    triggerChance: 0.40,
    statFocus: 'physical',
    effect: { type: 'elemental_dmg', mAtkRatio: 0.35 },
  },
  {
    id: 'ts_potian',
    name: '破天',
    glyph: '破',
    trigger: 'on_physical_hit',
    triggerDesc: '物理攻击触发',
    desc: '物理攻击命中后：无视目标 40% 防御（破甲）',
    spiritCost: 1800,
    triggerChance: 0.35,
    statFocus: 'physical',
    effect: { type: 'armor_pen', penRatio: 0.40 },
  },
  {
    id: 'ts_fanji',
    name: '反击',
    glyph: '反',
    trigger: 'on_hit_taken',
    triggerDesc: '被攻击触发',
    desc: '被攻击命中时：立即物理反击，造成 60% 物攻伤害',
    spiritCost: 1500,
    triggerChance: 0.35,
    statFocus: 'tank',
    effect: { type: 'counter_atk', atkRatio: 0.60 },
  },
  {
    id: 'ts_nuji',
    name: '怒击',
    glyph: '怒',
    trigger: 'on_magic_hit',
    triggerDesc: '法术攻击触发',
    desc: '法术攻击命中后：本次伤害额外提升 30%（增幅叠加）',
    spiritCost: 1000,
    triggerChance: 0.40,
    statFocus: 'magic',
    effect: { type: 'dmg_amp', ratio: 0.30 },
  },
  {
    id: 'ts_jiangmozhan',
    name: '降魔斩',
    glyph: '降',
    trigger: 'on_magic_hit',
    triggerDesc: '法术攻击触发',
    desc: '法术攻击命中后：附加一次无视相性克制的法术伤害',
    spiritCost: 1800,
    triggerChance: 0.30,
    statFocus: 'magic',
    effect: { type: 'neutral_magic_dmg', mAtkRatio: 0.50 },
  },
  {
    id: 'ts_xiuluoshu',
    name: '修罗术',
    glyph: '罗',
    trigger: 'on_magic_hit',
    triggerDesc: '法术攻击触发',
    desc: '法术攻击命中后：有概率追加一次普通攻击（连击）',
    spiritCost: 2000,
    triggerChance: 0.30,
    statFocus: 'magic',
    effect: { type: 'bonus_normal_attack', chance: 0.50 },
  },
  {
    id: 'ts_yunti',
    name: '云体',
    glyph: '云',
    trigger: 'on_hit_taken',
    triggerDesc: '防御触发',
    desc: '被攻击时：有概率使本次伤害降低 35%',
    spiritCost: 1500,
    triggerChance: 0.40,
    statFocus: 'tank',
    effect: { type: 'dmg_reduce', ratio: 0.35 },
  },
  {
    id: 'ts_xianfeng',
    name: '仙风',
    glyph: '仙',
    trigger: 'on_hit_taken',
    triggerDesc: '防御触发',
    desc: '被攻击时：减少 25% 受到伤害；气血归零时有 20% 概率以 1 点复活',
    spiritCost: 2500,
    triggerChance: 0.35,
    statFocus: 'tank',
    effect: { type: 'xianfeng', dmgReduceRatio: 0.25, reviveChance: 0.20 },
  },
  {
    id: 'ts_jinzhong',
    name: '尽忠',
    glyph: '忠',
    trigger: 'passive',
    triggerDesc: '持续生效',
    desc: '持续：宠物战斗中每回合自动恢复 500 灵气，并小幅提升气血上限',
    spiritCost: 0,
    triggerChance: 1,
    statFocus: 'tank',
    effect: { type: 'spirit_regen', amount: 500, hpBonusRatio: 0.03 },
  },
]

export const TIANSHU_BY_ID = Object.fromEntries(TIANSHU_DEFS.map((d) => [d.id, d]))

// ── 品质品质统计生成 ─────────────────────────────────────────────────────────

const STAT_POOL = {
  physical: [
    { key: 'atk',    label: '物攻', roll: () => 80 + Math.floor(Math.random() * 120) },
    { key: 'speed',  label: '速度', roll: () => 25 + Math.floor(Math.random() * 55)  },
    { key: 'def',    label: '防御', roll: () => 40 + Math.floor(Math.random() * 80)  },
    { key: 'maxHp',  label: '气血', roll: () => 400 + Math.floor(Math.random() * 600) },
  ],
  magic: [
    { key: 'mAtk',   label: '法攻', roll: () => 80 + Math.floor(Math.random() * 120) },
    { key: 'maxMp',  label: '法力', roll: () => 300 + Math.floor(Math.random() * 500) },
    { key: 'speed',  label: '速度', roll: () => 20 + Math.floor(Math.random() * 50)  },
    { key: 'maxHp',  label: '气血', roll: () => 300 + Math.floor(Math.random() * 500) },
  ],
  tank: [
    { key: 'maxHp',  label: '气血', roll: () => 600 + Math.floor(Math.random() * 1000) },
    { key: 'def',    label: '防御', roll: () => 60 + Math.floor(Math.random() * 100)  },
    { key: 'maxMp',  label: '法力', roll: () => 200 + Math.floor(Math.random() * 400) },
    { key: 'atk',   label: '物攻', roll: () => 40 + Math.floor(Math.random() * 80)   },
  ],
}

/** 为指定品质生成基础属性列表（gold质量属性值更高） */
export function rollTianShuBaseStats(typeId, quality, rng = Math.random) {
  const def = TIANSHU_BY_ID[typeId]
  const q   = TIANSHU_QUALITY[quality]
  if (!def || !q || q.baseAttrCount === 0) return []
  const pool = [...(STAT_POOL[def.statFocus] ?? STAT_POOL.physical)]
  const mul  = quality === 'gold' ? 1.5 : 1.0
  const picks = []
  const chosen = new Set()
  while (picks.length < q.baseAttrCount && pool.length > chosen.size) {
    const idx = Math.floor(rng() * pool.length)
    if (chosen.has(idx)) continue
    chosen.add(idx)
    const entry = pool[idx]
    picks.push({ key: entry.key, label: entry.label, value: Math.round(entry.roll() * mul) })
  }
  return picks
}

/**
 * 从背包中开出一本天书实例
 * @param {string} typeId   – 天书类型 ID（如 ts_mogu）
 * @param {string} [forceQuality] – 'white'|'blue'|'gold'（不填则随机）
 */
export function openTianShuBook(typeId, forceQuality, rng = Math.random) {
  const quality = forceQuality ?? rollQuality(rng)
  const baseStats = rollTianShuBaseStats(typeId, quality, rng)
  return { type: typeId, quality, baseStats }
}

function rollQuality(rng) {
  const r = rng()
  if (r < 0.50) return 'white'
  if (r < 0.85) return 'blue'
  return 'gold'
}

// ── 属性加成（基础属性叠加到 stats 上） ──────────────────────────────────────

/** 将所有已装备天书的基础属性叠加到 stats */
export function applyTianShuBaseStats(baseStats, tianShuList) {
  if (!tianShuList || tianShuList.length === 0) return baseStats
  const result = { ...baseStats }
  for (const ts of tianShuList) {
    for (const attr of ts.baseStats ?? []) {
      if (result[attr.key] != null) result[attr.key] += attr.value
    }
  }
  return result
}

/** 计算宠物当前灵气上限 */
export function calcPetSpiritMax(tianShuList) {
  return Math.min(TIANSHU_SPIRIT_MAX, (tianShuList?.length ?? 0) * TIANSHU_SPIRIT_PER_BOOK)
}
