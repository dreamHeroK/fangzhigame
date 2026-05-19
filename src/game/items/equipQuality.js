/**
 * 装备品质系统 — 参考问道端游洗练属性机制
 *
 * 品质：白 绿 蓝 紫 橙（决定额外属性词条数量）
 * 额外属性类型：固定值（气血/法力/攻击/防御/速度）+ 百分比（气血%/法力%/攻击%/防御%）
 *               + 战斗属性（躲闪/必杀/连击）
 */

// ── 品质定义 ─────────────────────────────────────────────────────────────────
export const QUALITY = {
  white:  { key: 'white',  label: '白', color: '#8c8c8c', borderColor: 'var(--ink-3)', extraCount: 0, weight: 40 },
  green:  { key: 'green',  label: '绿', color: '#2d8a2d', borderColor: '#2d8a2d',      extraCount: 1, weight: 30 },
  blue:   { key: 'blue',   label: '蓝', color: '#2855c8', borderColor: '#2855c8',      extraCount: 2, weight: 20 },
  purple: { key: 'purple', label: '紫', color: '#8a2ab0', borderColor: '#8a2ab0',      extraCount: 3, weight: 8  },
  orange: { key: 'orange', label: '橙', color: '#c87020', borderColor: '#c87020',      extraCount: 4, weight: 2  },
}

const QUALITY_KEYS = ['white', 'green', 'blue', 'purple', 'orange']
const TOTAL_WEIGHT = QUALITY_KEYS.reduce((s, k) => s + QUALITY[k].weight, 0)

/** 按权重随机品质 */
export function rollQuality(rng = Math.random) {
  let r = rng() * TOTAL_WEIGHT
  for (const k of QUALITY_KEYS) {
    r -= QUALITY[k].weight
    if (r <= 0) return k
  }
  return 'white'
}

// ── 词条定义（共享原子定义，各槽位从中选取）────────────────────────────────
// 固定值随装备等级线性缩放；百分比/战斗系数固定范围
// 参考量级：Lv100 武器基础攻击 ≈ 4500，防御 ≈ 900
// 问道端游100级满伤害约2400；其他部位攻击词条量级较小
// 武器攻击用 wAtk 系列（量级×4），非武器部位用普通 phyAtk/magAtk
// 基础属性词条（体质/灵力/力量/敏捷/全属性）在 playerSheet 中叠加进四维再计算
const A = {
  blood:      { type: 'blood_flat',    label: '气血',  stat: 'blood',      isPct: false, minFn: L => L*4,    maxFn: L => L*16   },
  magic:      { type: 'magic_flat',    label: '法力',  stat: 'magic',      isPct: false, minFn: L => L*2,    maxFn: L => L*8    },
  phyAtk:     { type: 'phyAtk_flat',   label: '物攻',  stat: 'phyAtk',     isPct: false, minFn: L => L*1,    maxFn: L => L*5    },
  magAtk:     { type: 'magAtk_flat',   label: '法攻',  stat: 'magAtk',     isPct: false, minFn: L => L*1,    maxFn: L => L*5    },
  wPhyAtk:    { type: 'phyAtk_flat',   label: '物攻',  stat: 'phyAtk',     isPct: false, minFn: L => L*6,    maxFn: L => L*24   },
  wMagAtk:    { type: 'magAtk_flat',   label: '法攻',  stat: 'magAtk',     isPct: false, minFn: L => L*6,    maxFn: L => L*24   },
  defense:    { type: 'defense_flat',  label: '防御',  stat: 'defense',    isPct: false, minFn: L => L*1,    maxFn: L => L*4    },
  speed:      { type: 'speed_flat',    label: '速度',  stat: 'speed',      isPct: false, minFn: L => Math.max(1,Math.round(L*0.05)), maxFn: L => Math.max(2,Math.round(L*0.15)) },
  // 四维基础属性（参考端游单属性 L100≈25，全属性≈20各维）
  vitAdd:     { type: 'vit_flat',      label: '体质',  stat: 'vitAdd',     isPct: false, minFn: L => Math.max(1,Math.round(L*0.10)), maxFn: L => Math.max(2,Math.round(L*0.25)) },
  intAdd:     { type: 'int_flat',      label: '灵力',  stat: 'intAdd',     isPct: false, minFn: L => Math.max(1,Math.round(L*0.10)), maxFn: L => Math.max(2,Math.round(L*0.25)) },
  strAdd:     { type: 'str_flat',      label: '力量',  stat: 'strAdd',     isPct: false, minFn: L => Math.max(1,Math.round(L*0.10)), maxFn: L => Math.max(2,Math.round(L*0.25)) },
  agiAdd:     { type: 'agi_flat',      label: '敏捷',  stat: 'agiAdd',     isPct: false, minFn: L => Math.max(1,Math.round(L*0.10)), maxFn: L => Math.max(2,Math.round(L*0.25)) },
  allStats:   { type: 'allStats_flat', label: '全属性',stat: 'allStatsAdd',isPct: false, minFn: L => Math.max(1,Math.round(L*0.08)), maxFn: L => Math.max(2,Math.round(L*0.18)) },
  bloodPct:   { type: 'blood_pct',     label: '气血%', stat: 'bloodPct',   isPct: true,  min: 2,  max: 10 },
  magicPct:   { type: 'magic_pct',     label: '法力%', stat: 'magicPct',   isPct: true,  min: 2,  max: 10 },
  phyAtkPct:  { type: 'phyAtk_pct',    label: '物攻%', stat: 'phyAtkPct',  isPct: true,  min: 1,  max: 6  },
  magAtkPct:  { type: 'magAtk_pct',    label: '法攻%', stat: 'magAtkPct',  isPct: true,  min: 1,  max: 6  },
  defensePct: { type: 'defense_pct',   label: '防御%', stat: 'defensePct', isPct: true,  min: 1,  max: 6  },
  dodge:      { type: 'dodge_add',     label: '躲闪',  stat: 'dodgeAdd',   isPct: true,  min: 1,  max: 5  },
  crit:       { type: 'crit_add',      label: '必杀',  stat: 'critAdd',    isPct: true,  min: 1,  max: 5  },
  combo:      { type: 'combo_add',     label: '连击',  stat: 'comboAdd',   isPct: true,  min: 1,  max: 4  },
  counter:    { type: 'counter_add',   label: '反击',  stat: 'counterAdd', isPct: true,  min: 1,  max: 3  },
  piercing:   { type: 'piercing_add',  label: '破甲',  stat: 'piercing',   isPct: true,  min: 1,  max: 4  },
}

// ── 各槽位词条池（参考问道端游部位分化设计）────────────────────────────────
// 武器：伤害输出型
// 帽子：防御全能型
// 衣服：生存防御型
// 鞋子：速度敏捷型
// 腰带：气血生存型
// 法宝：法术攻击型
// 手镯：综合战斗型
// 项链：法术资源型
// 玉佩：百分比加成型（对应端游相性/强度加成）
// 参考问道端游实际部位属性分布（搜索整理）：
// 武器：伤害/相性/连击%/反击%/必杀%/破甲
// 帽子：气血/法力/防御/连击次数(combo)/反击次数(counter)
// 衣服：气血/防御/法力/抗异常(dodge)/反震率(counter)
// 鞋子：速度/防御/闪避/连击次数/反击次数
// 腰带：气血/防御（生存型）
// 法宝：法攻/法力/相性(magAtkPct)
// 手镯：伤害/相性（综合伤害型）
// 项链：法力/相性（法术资源型）
// 玉佩：气血/相性（气血百分比型）
const SLOT_POOLS = {
  weapon:   [A.wPhyAtk, A.wMagAtk, A.phyAtkPct, A.magAtkPct, A.crit, A.combo, A.counter, A.piercing],
  hat:      [A.blood,  A.magic,  A.defense,  A.vitAdd,   A.allStats, A.bloodPct,  A.defensePct, A.combo, A.counter],
  cloth:    [A.blood,  A.defense, A.vitAdd,  A.allStats, A.bloodPct, A.defensePct, A.magic,  A.counter, A.dodge],
  shoe:     [A.speed,  A.dodge,  A.defense, A.agiAdd,   A.allStats, A.combo,     A.counter],
  belt:     [A.blood,  A.bloodPct, A.defense, A.vitAdd,  A.defensePct, A.counter],
  lingbao:  [A.magAtk, A.magic,  A.intAdd,  A.magAtkPct, A.magicPct, A.crit,   A.combo],
  bracelet: [A.phyAtk, A.magAtk, A.strAdd,  A.intAdd,   A.phyAtkPct, A.magAtkPct, A.crit],
  necklace: [A.magic,  A.magAtk, A.intAdd,  A.magicPct,  A.magAtkPct],
  pendant:  [A.blood,  A.vitAdd, A.bloodPct, A.magicPct, A.defensePct, A.phyAtkPct, A.magAtkPct, A.dodge],
  default:  [A.blood, A.magic, A.phyAtk, A.magAtk, A.defense, A.speed,
             A.bloodPct, A.magicPct, A.phyAtkPct, A.magAtkPct, A.defensePct,
             A.dodge, A.crit, A.combo, A.counter, A.piercing],
}

const WEAPON_SUBTYPES = new Set([
  '枪','剑','弓','刀','爪','锤','扇','双戟','号角','拳套','羽刃','软鞭','鼓',
])

/** 根据装备 catalog 条目推断槽位 key */
function resolveSlot(baseItem) {
  if (!baseItem) return 'default'
  const sub = baseItem.item_subtype_zh ?? ''
  const tid = baseItem.item_type_id ?? 0
  if (WEAPON_SUBTYPES.has(sub)) return 'weapon'
  if (tid === 202) return 'hat'
  if (tid === 203) return 'cloth'
  if (tid === 204) return 'shoe'
  if (tid === 208) return 'belt'
  if (tid === 205) return 'lingbao'
  if (sub === '手镯') return 'bracelet'
  if (sub === '项链') return 'necklace'
  if (sub === '玉佩') return 'pendant'
  return 'default'
}

/**
 * 对指定品质和装备等级滚动额外属性词条列表。
 * baseItem 用于确定槽位词条池；省略时使用全池。
 * @returns {{ type, label, stat, isPct, value }[]}
 */
export function rollExtraAttrs(quality, itemLevel, rng = Math.random, baseItem = null) {
  const Q = QUALITY[quality]
  if (!Q || Q.extraCount === 0) return []

  const slot = resolveSlot(baseItem)
  const pool = [...(SLOT_POOLS[slot] ?? SLOT_POOLS.default)]
  const picked = []
  const usedStats = new Set()

  while (picked.length < Q.extraCount && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length)
    const attr = pool.splice(idx, 1)[0]
    if (usedStats.has(attr.stat)) continue
    usedStats.add(attr.stat)

    let lo, hi
    if (attr.minFn) {
      lo = attr.minFn(itemLevel)
      hi = attr.maxFn(itemLevel)
    } else {
      lo = attr.min
      hi = attr.max
    }
    const value = lo + Math.floor(rng() * (hi - lo + 1))
    picked.push({ type: attr.type, label: attr.label, stat: attr.stat, isPct: attr.isPct, value })
  }
  return picked
}

// ── 实例生成 ──────────────────────────────────────────────────────────────────
let _seq = 0

/**
 * 从目录条目生成一个带品质和额外属性的装备实例。
 * @param {object} baseItem  catalog 条目
 * @returns {{ uid, baseCode, quality, extra }}
 */
export function generateEquipInstance(baseItem, rng = Math.random) {
  const quality = rollQuality(rng)
  const extra   = rollExtraAttrs(quality, baseItem.item_level, rng, baseItem)
  const uid = `eq_${Date.now()}_${_seq++}_${Math.random().toString(36).slice(2, 6)}`
  return { uid, baseCode: baseItem.item_info_code, quality, extra }
}

// ── 加成汇总 ──────────────────────────────────────────────────────────────────
/**
 * 把已装备实例列表的额外属性汇总为加成对象。
 * @param {{ extra: Array }[]} instances
 * @returns {{ blood, magic, hurt, defense, speed,
 *             bloodPct, magicPct, hurtPct, defensePct,
 *             dodgeAdd, critAdd, comboAdd, counterAdd }}
 */
export function compileExtraBonuses(instances) {
  const out = {
    // 固定值
    blood: 0, magic: 0, defense: 0, speed: 0,
    phyAtk: 0, magAtk: 0,
    hurt: 0,          // 旧存档兼容（原 hurt_flat）
    // 四维基础属性（叠加后在 playerSheet 中放大）
    vitAdd: 0, intAdd: 0, strAdd: 0, agiAdd: 0,
    // 百分比
    bloodPct: 0, magicPct: 0, defensePct: 0,
    phyAtkPct: 0, magAtkPct: 0,
    hurtPct: 0,       // 旧存档兼容（原 hurt_pct）
    // 战斗系数
    dodgeAdd: 0, critAdd: 0, comboAdd: 0, counterAdd: 0,
    piercing: 0,
  }
  for (const inst of instances) {
    for (const ex of (inst?.extra ?? [])) {
      if (ex.stat === 'allStatsAdd') {
        out.vitAdd += ex.value
        out.intAdd += ex.value
        out.strAdd += ex.value
        out.agiAdd += ex.value
      } else if (ex.stat in out) {
        out[ex.stat] += ex.value
      }
    }
  }
  return out
}

// ── 格式化显示 ────────────────────────────────────────────────────────────────
export function formatExtra(ex) {
  return `${ex.label} +${ex.value}${ex.isPct ? '%' : ''}`
}
