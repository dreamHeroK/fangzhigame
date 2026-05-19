/**
 * 装备目录 — 基于公式生成数据（208 条，Lv1-150）
 * 提供槽位定义、目录查询、装备加成计算。
 */
import rawCatalog from '../data/qibaoEquipCatalog.json'

// ── 武器五行映射 ────────────────────────────────────────────────────────────
export const SCHOOL_WEAPON = {
  '金': '枪', '木': '爪', '水': '剑', '火': '扇', '土': '锤',
}

const WEAPON_SUBTYPES = new Set([
  '枪','剑','弓','刀','爪','锤','扇','双戟','号角','拳套','羽刃','软鞭','鼓',
])

// ── 槽位定义 ────────────────────────────────────────────────────────────────
/**
 * @typedef {{ key: string, name: string, glyph: string, filter: (e: object) => boolean }} SlotDef
 */
export const EQUIP_SLOT_DEFS = /** @type {SlotDef[]} */ ([
  { key: 'weapon',    name: '武器',  glyph: '武', filter: (e) => WEAPON_SUBTYPES.has(e.item_subtype_zh) },
  { key: 'hat',       name: '帽子',  glyph: '冠', filter: (e) => e.item_type_id === 202 },
  { key: 'cloth',     name: '衣服',  glyph: '袍', filter: (e) => e.item_type_id === 203 },
  { key: 'shoe',      name: '鞋子',  glyph: '履', filter: (e) => e.item_type_id === 204 },
  { key: 'belt',      name: '腰带',  glyph: '带', filter: (e) => e.item_type_id === 208 },
  { key: 'lingbao',   name: '法宝',  glyph: '宝', filter: (e) => e.item_type_id === 205 },
  { key: 'bracelet1', name: '手镯一', glyph: '镯', filter: (e) => e.item_subtype_zh === '手镯' },
  { key: 'bracelet2', name: '手镯二', glyph: '镯', filter: (e) => e.item_subtype_zh === '手镯' },
  { key: 'necklace',  name: '项链',  glyph: '链', filter: (e) => e.item_subtype_zh === '项链' },
  { key: 'pendant',   name: '玉佩',  glyph: '佩', filter: (e) => e.item_subtype_zh === '玉佩' },
])

export const EQUIP_SLOT_KEYS = EQUIP_SLOT_DEFS.map(s => s.key)

/** 空装备槽初始值 */
export const EMPTY_EQUIPPED = Object.fromEntries(EQUIP_SLOT_KEYS.map(k => [k, null]))

// ── 目录索引 ────────────────────────────────────────────────────────────────
/** @type {Map<number, object>} */
const CATALOG_BY_CODE = new Map(rawCatalog.map(e => [e.item_info_code, e]))

/** 按 item_info_code 查单条 */
export function getEquipByCode(code) {
  return CATALOG_BY_CODE.get(Number(code)) ?? null
}

/** 按槽位 key 取全部匹配条目（已按 item_level 升序） */
export function getEquipsBySlot(slotKey) {
  const def = EQUIP_SLOT_DEFS.find(s => s.key === slotKey)
  if (!def) return []
  return rawCatalog.filter(def.filter).sort((a, b) => a.item_level - b.item_level)
}

/** 全目录（用于掉落池查询） */
export { rawCatalog as EQUIP_CATALOG }

/** 按槽位 key 取全部条目，武器槽优先返回本系武器 */
export function getEquipsBySlotForSchool(slotKey, school) {
  const items = getEquipsBySlot(slotKey)
  if (slotKey !== 'weapon' || !school) return items
  const preferred = SCHOOL_WEAPON[school]
  if (!preferred) return items
  const mine = items.filter(e => e.item_subtype_zh === preferred)
  const rest = items.filter(e => e.item_subtype_zh !== preferred)
  return [...mine, ...rest]
}

// ── 实例查找工具 ─────────────────────────────────────────────────────────────
/**
 * 从 equipBag 建立 uid → instance 索引。
 * 向后兼容：若 uid 是数字（老存档 baseCode），返回伪实例。
 */
function buildInstMap(equipBag) {
  const m = new Map()
  for (const inst of (equipBag ?? [])) m.set(inst.uid, inst)
  return m
}

/**
 * 根据 equippedMap 和 equipBag 取出所有已装备实例。
 * 向后兼容：若 slotValue 是数字，视为 baseCode（无 extra）。
 */
export function getEquippedInstances(equippedMap, equipBag) {
  if (!equippedMap) return []
  const instMap = buildInstMap(equipBag)
  const out = []
  for (const v of Object.values(equippedMap)) {
    if (!v) continue
    if (typeof v === 'number') {
      // 老存档兼容：直接包装
      out.push({ uid: `compat_${v}`, baseCode: v, quality: 'white', extra: [] })
    } else {
      const inst = instMap.get(v)
      if (inst) out.push(inst)
    }
  }
  return out
}

/** 从单个槽位值（uid 或 baseCode）取 catalog 条目 */
export function resolveSlotItem(slotValue, equipBag) {
  if (!slotValue) return null
  if (typeof slotValue === 'number') return CATALOG_BY_CODE.get(slotValue) ?? null
  const instMap = buildInstMap(equipBag)
  const inst = instMap.get(slotValue)
  if (!inst) return null
  return CATALOG_BY_CODE.get(inst.baseCode) ?? null
}

// ── 加成计算 ─────────────────────────────────────────────────────────────────
/**
 * 汇总基础属性加成（来自 catalog base_attrs）。
 * 支持新格式（equippedMap 存 uid + equipBag 存实例）与旧格式（equippedMap 存 baseCode）。
 * @param {Record<string, string|number|null>} equippedMap
 * @param {Array} [equipBag]
 */
export function getEquipBonuses(equippedMap, equipBag) {
  let hurt = 0, defense = 0, blood = 0, magic = 0, speed = 0
  if (!equippedMap) return { hurt, defense, blood, magic, speed }
  const instMap = buildInstMap(equipBag)
  for (const v of Object.values(equippedMap)) {
    if (!v) continue
    let baseCode
    if (typeof v === 'number') {
      baseCode = v
    } else {
      baseCode = instMap.get(v)?.baseCode
    }
    if (!baseCode) continue
    const item = CATALOG_BY_CODE.get(Number(baseCode))
    if (!item?.base_attrs) continue
    const a = item.base_attrs
    hurt    += Number(a.hurt)    || 0
    defense += Number(a.defense) || 0
    blood   += Number(a.blood)   || 0
    magic   += Number(a.magic)   || 0
    speed   += Number(a.speed)   || 0
  }
  return { hurt, defense, blood, magic, speed }
}

/**
 * 单件装备的属性摘要（用于 UI 展示）。
 * @param {object} item catalog 条目
 */
export function summarizeEquip(item) {
  if (!item) return null
  const a = item.base_attrs ?? {}
  const parts = []
  if (a.hurt)    parts.push(`攻 ${a.hurt}`)
  if (a.defense) parts.push(`防 ${a.defense}`)
  if (a.blood)   parts.push(`血 ${a.blood}`)
  if (a.magic)   parts.push(`法 ${a.magic}`)
  if (a.speed)   parts.push(`速 ${a.speed}`)
  return {
    code:     item.item_info_code,
    name:     item.item_name,
    level:    item.item_level,
    subtype:  item.item_subtype_zh,
    statsStr: parts.join('  '),
    parts,
    base_attrs: a,
  }
}
