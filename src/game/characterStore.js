/**
 * 全局角色状态 - 技能习得、装备、资源、属性加点
 * useSyncExternalStore 兼容的轻量 store
 */
import { getAllSchoolSkills, canLearnSkill, maxSkillLevelForChar } from './battle/schoolSkills.js'
import {
  getAttributePointBudget,
  getAffinityPointBudget,
  sumFour,
  sumAffinity,
  clampFourStats,
  clampAffinity,
  autoAllocateVitInt,
  AFFINITY_CAP_PER_ELEMENT,
  getFixedStatFloor,
} from './playerSheet.js'
import {
  applyExpTowardLevelUp,
  CHARACTER_MAX_LEVEL,
  applyPetExp,
  PET_MAX_LEVEL,
} from './characterLevelConfig.js'
import { getPetFreeAttrTotal, sumPetAllocAttr } from './battle/petGrowthTable.js'
import { computeHeroDerived } from './playerSheet.js'
import { getConsumable, isQuotaOrb, getRestoreAmount } from './items/catalog.js'
import { EMPTY_EQUIPPED, getEquipByCode, EQUIP_SLOT_KEYS, EQUIP_SLOT_DEFS } from './items/equipCatalog.js'

const STORAGE_KEY = 'wendao_char_v1'

const DEFAULT_STATE = {
  name: '天行健',
  school: '金',
  level: 50,
  tael: 248800,
  potential: 4820,

  // ── 四维加点（端游每级 5 点，最低 1）──
  // Lv50 budget=245，法金 build：灵力为主
  vit: 40,
  int: 155,
  str: 5,
  agi: 45,

  // ── 相性（每系 0-30，总和受等级预算限制）──
  // Lv50 budget=25 → 金系满25
  affMetal: 25,
  affWood: 0,
  affWater: 0,
  affFire: 0,
  affEarth: 0,

  // ── 资历 & 杂项 ──
  daoYears: 12,
  daoDays: 86,
  fame: 1260,
  staminaCur: 4520,
  staminaMax: 5000,
  meritRecord: 28,
  expCur: 12840,        // legacy字段保留兼容
  expIntoLevel: 12840,  // 本级已积累经验（等价于 expCur）

  /** Record<skillId, number> 已修炼等级；0 = 未习得 */
  skillLevels: {
    jin_B1: 65,
    jin_B2: 48,
    jin_B3: 28,
    jin_C1: 42,
    jin_C2: 10,
    jin_D1: 30,
  },
  /** 战斗技能槽（最多 6 个；仅 B/C 系可装备） */
  equippedSkills: ['jin_B1', 'jin_B2', 'jin_B3'],

  /**
   * 宠物列表。每项格式：
   * { id, spawnKey, displayName, kind:'宝宝'|'野生', level, master?,
   *   growth:{ hp,mp,spd,pAtk,mAtk,totalBand:[lo,hi] },
   *   innateIds: string[], active: boolean }
   */
  petRoster: [
    {
      id: 'pet1', spawnKey: 'wulong', displayName: '乌龙·宝宝', kind: '宝宝',
      level: 1, expIntoLevel: 0, master: '天行健', active: true,
      growth: { hp: 72, mp: 78, spd: 56, pAtk: 2, mAtk: 58, totalBand: [210, 300] },
      innateIds: ['bianchangmoji', 'shemingyiji'],
      allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
    },
    {
      id: 'pet2', spawnKey: 'haigui', displayName: '海龟·野生', kind: '野生',
      level: 25, expIntoLevel: 0, master: '听雪楼', active: true,
      growth: { hp: 92, mp: 66, spd: 18, pAtk: 0, mAtk: 40, totalBand: [170, 260] },
      innateIds: ['fangweidujian'],
      allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
    },
    {
      id: 'pet3', spawnKey: 'huoya', displayName: '火鸦·宝宝', kind: '宝宝',
      level: 1, expIntoLevel: 0, master: '焚青劫', active: true,
      growth: { hp: 60, mp: 80, spd: 62, pAtk: 0, mAtk: 65, totalBand: [210, 300] },
      innateIds: ['shiwanhuoji', 'mantianxuewu'],
      allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
    },
    {
      id: 'pet4', spawnKey: 'taojing', displayName: '桃精·野生', kind: '野生',
      level: 17, expIntoLevel: 0, master: '一川烟', active: true,
      growth: { hp: 50, mp: 70, spd: 44, pAtk: 0, mAtk: 40, totalBand: [160, 250] },
      innateIds: ['bamiaozhuzhang'],
      allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
    },
    {
      id: 'pet5', spawnKey: 'baiyuan', displayName: '白猿·野生', kind: '野生',
      level: 22, expIntoLevel: 0, master: '厚土君', active: true,
      growth: { hp: 78, mp: 40, spd: 28, pAtk: 72, mAtk: 0, totalBand: [170, 260] },
      innateIds: ['fanzhuanqiankun'],
      allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
    },
    {
      id: 'pet6', spawnKey: 'xuenv', displayName: '雪女·野生', kind: '野生',
      level: 75, expIntoLevel: 0, active: false,
      growth: { hp: 90, mp: 64, spd: 60, pAtk: 0, mAtk: 62, totalBand: [230, 320] },
      innateIds: ['fangweidujian', 'siwangchanmian'],
      allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
    },
  ],

  /** 背包：[{ itemId: string, qty: number }]，玲珑也以 qty 计颗数 */
  bag: [],

  /** 装备背包：[{ uid, baseCode, quality, extra }]，包含已装和未装的全部装备实例 */
  equipBag: [],

  /** 黑水晶实例背包：[{ uid, absorbedAttrs: [] }] */
  crystalBag: [],

  /** 当前气血（null = 满血）；战斗结束后写回 */
  hpCur: null,
  /** 当前法力（null = 满法）；战斗结束后写回 */
  mpCur: null,

  /** 战后自动消耗背包药品回满（优先低级药） */
  autoRestore: false,

  /** 已装备物品：slotKey → item_info_code (number) | null */
  equipped: { ...EMPTY_EQUIPPED },
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      const merged = { ...DEFAULT_STATE, ...saved }
      // 向前兼容：expCur 旧字段迁移
      if (merged.expIntoLevel == null) merged.expIntoLevel = merged.expCur ?? 0
      // 宠物缺失字段时向前兼容补零；旧五维格式（含 hp/mp/spd 键）重置为四维
      const EMPTY_ALLOC = { vit: 0, int: 0, str: 0, agi: 0 }
      const KIND_MAP = { baby: '宝宝', wild: '野生' }
      merged.petRoster = (merged.petRoster ?? []).map(p => {
        const a = p.allocatedAttr
        const isOldFmt = a && ('hp' in a || 'mp' in a || 'spd' in a)
        return {
          ...p,
          growth:        p.growth    ?? p.growthDetail,
          innateIds:     p.innateIds ?? p.innateSkillIds ?? [],
          kind:          KIND_MAP[p.kind] ?? p.kind,
          expIntoLevel:  p.expIntoLevel  ?? 0,
          allocatedAttr: (!a || isOldFmt) ? { ...EMPTY_ALLOC } : a,
        }
      })
      if (!Array.isArray(merged.bag)) merged.bag = []
      if (!Array.isArray(merged.equipBag)) merged.equipBag = []
      // 迁移：旧存档把装备存在 bag（itemId 为数字串），移到 equipBag 作兼容实例
      const migratedBag = []
      let migrSeq = 0
      for (const entry of merged.bag) {
        const code = Number(entry.itemId)
        if (Number.isInteger(code) && code > 0 && getEquipByCode(code)) {
          for (let q = 0; q < (entry.qty || 1); q++) {
            merged.equipBag.push({ uid: `migr_${code}_${Date.now()}_${migrSeq++}`, baseCode: code, quality: 'white', extra: [] })
          }
        } else {
          migratedBag.push(entry)
        }
      }
      merged.bag = migratedBag
      if (merged.hpCur === undefined) merged.hpCur = null
      if (merged.mpCur === undefined) merged.mpCur = null
      if (merged.autoRestore === undefined) merged.autoRestore = false
      if (!Array.isArray(merged.crystalBag)) merged.crystalBag = []
      // 迁移：旧存档的 bag 中可能有 heishuijing，转为 crystalBag 实例
      const newBag = []
      for (const entry of (merged.bag ?? [])) {
        if (entry.itemId === 'heishuijing') {
          for (let i = 0; i < (entry.qty ?? 1); i++)
            merged.crystalBag.push({ uid: `crystal_migr_${Date.now()}_${i}`, absorbedAttrs: [] })
        } else {
          newBag.push(entry)
        }
      }
      merged.bag = newBag
      if (!merged.equipped || typeof merged.equipped !== 'object') {
        merged.equipped = { ...EMPTY_EQUIPPED }
      } else {
        // 补齐新增槽位
        for (const k of EQUIP_SLOT_KEYS) {
          if (!(k in merged.equipped)) merged.equipped[k] = null
        }
      }
      return merged
    }
  } catch {}
  return { ...DEFAULT_STATE }
}

function save(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

let state = load()
const listeners = new Set()

function notify() {
  listeners.forEach((fn) => fn())
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getSnapshot() {
  return state
}

function patch(updates) {
  state = { ...state, ...updates }
  save(state)
  notify()
}

// ── 属性加点 ────────────────────────────────────────────────────────────────

/**
 * 给指定四维属性加 1 点（消耗自由点）
 * @param {'vit'|'int'|'str'|'agi'} stat
 * @returns {{ ok: boolean, reason?: string }}
 */
export function addStatAction(stat, count = 1) {
  const budget = getAttributePointBudget(state.level)
  const used = sumFour(state)
  if (used >= budget) return { ok: false, reason: '无剩余属性点' }
  if (!['vit', 'int', 'str', 'agi'].includes(stat)) return { ok: false, reason: '未知属性' }
  const actual = Math.min(count, budget - used)
  patch({ [stat]: (state[stat] ?? 0) + actual })
  return { ok: true }
}

/**
 * 给指定相性加 1 点
 * @param {'Metal'|'Wood'|'Water'|'Fire'|'Earth'} elem
 * @returns {{ ok: boolean, reason?: string }}
 */
export function addAffinityAction(elem, count = 1) {
  const key = 'aff' + elem
  const budget = getAffinityPointBudget(state.level)
  const used = sumAffinity(state)
  if (used >= budget) return { ok: false, reason: '无剩余相性点' }
  const cur = state[key] ?? 0
  if (cur >= AFFINITY_CAP_PER_ELEMENT) return { ok: false, reason: `${elem}相性已达上限 30` }
  const actual = Math.min(count, budget - used, AFFINITY_CAP_PER_ELEMENT - cur)
  patch({ [key]: cur + actual })
  return { ok: true }
}

/** 自动分配：剩余自由点按 3体:2灵 分配 */
export function autoAllocateAction() {
  const next = autoAllocateVitInt(state, state.level)
  patch({ vit: next.vit, int: next.int, str: next.str, agi: next.agi })
}

/** 重置四维加点：各回归等级下限，释放自由点 */
export function resetAllocAction() {
  const floor = getFixedStatFloor(state.level)
  patch({ vit: floor, int: floor, str: floor, agi: floor })
}

// ── 技能习得 ────────────────────────────────────────────────────────────────

const TIER_GOLD = [480, 560, 720, 880, 1080]
const TIER_POT  = [180, 220, 320, 420, 560]

/**
 * 习得 / 升级一级技能
 * @returns {{ ok: boolean, reason?: string }}
 */
export function learnSkillAction(skillId) {
  const sk = getAllSchoolSkills().find((s) => s.id === skillId)
  if (!sk) return { ok: false, reason: '未知技能' }
  if (sk.school !== state.school) return { ok: false, reason: '非本系技能' }

  const maxLv = maxSkillLevelForChar(state.level)
  const curLv = state.skillLevels[skillId] ?? 0
  if (curLv >= maxLv) return { ok: false, reason: '已达等级上限' }

  const { ok, reason } = canLearnSkill(state.level, state.skillLevels, skillId)
  if (!ok) return { ok: false, reason }

  const gold = TIER_GOLD[sk.tier - 1] ?? 480
  const pot  = TIER_POT[sk.tier - 1]  ?? 180
  if (state.tael < gold) return { ok: false, reason: `银两不足（需 ${gold.toLocaleString()}）` }
  if (state.potential < pot)  return { ok: false, reason: `潜能不足（需 ${pot}）` }

  patch({
    skillLevels: { ...state.skillLevels, [skillId]: curLv + 1 },
    tael: state.tael - gold,
    potential: state.potential - pot,
  })
  return { ok: true }
}

/**
 * 装备 / 卸除战斗技能（仅 B/C 支持）
 * @returns {{ ok: boolean, equipped: boolean, reason?: string }}
 */
export function equipSkillAction(skillId) {
  const sk = getAllSchoolSkills().find((s) => s.id === skillId)
  if (!sk) return { ok: false, equipped: false, reason: '未知技能' }
  if (sk.branch === 'D') return { ok: false, equipped: false, reason: 'D辅助为被动，不可装备' }
  if ((state.skillLevels[skillId] ?? 0) === 0) return { ok: false, equipped: false, reason: '尚未习得' }

  const already = state.equippedSkills.includes(skillId)
  if (already) {
    patch({ equippedSkills: state.equippedSkills.filter((id) => id !== skillId) })
    return { ok: true, equipped: false }
  }
  if (state.equippedSkills.length >= 6) return { ok: false, equipped: false, reason: '技能槽已满（最多6个）' }
  patch({ equippedSkills: [...state.equippedSkills, skillId] })
  return { ok: true, equipped: true }
}

/**
 * 战斗胜利后落账奖励：角色经验、宠物经验（按参战宠物均分）、银两、掉落物品。
 * @param {{ exp: number, petExp: number, gold: number }} rewards
 * @param {string[]} activePetIds 参战宠物 id 列表
 * @param {{ itemId: string, qty: number }[]} loot 药品掉落列表
 * @param {object[]} equipLoot 装备掉落列表（catalog 条目）
 * @param {number|null} remainingHp
 * @param {number|null} remainingMp
 */
export function applyBattleRewardsAction(rewards, activePetIds = [], loot = [], equipLoot = [], remainingHp = null, remainingMp = null) {
  const { exp = 0, petExp = 0, gold = 0 } = rewards

  // ── 角色经验 ──
  const oldLevel = state.level
  const charResult = applyExpTowardLevelUp(state.level, state.expIntoLevel ?? state.expCur ?? 0, exp)
  const newLevel       = Math.min(CHARACTER_MAX_LEVEL, charResult.newLevel)
  const newExpInto     = newLevel >= CHARACTER_MAX_LEVEL ? 0 : charResult.expIntoLevel

  // ── 宠物经验（仅参战宠物，平均分配 petExp） ──
  const petIds = new Set(activePetIds)
  const petCount = Math.max(1, petIds.size)
  const petExpEach = Math.floor(petExp / petCount)
  const newPetRoster = state.petRoster.map(p => {
    if (!petIds.has(p.id) || p.level >= PET_MAX_LEVEL) return p
    const r = applyPetExp(p.level, p.expIntoLevel ?? 0, petExpEach)
    return { ...p, level: r.level, expIntoLevel: r.expIntoLevel }
  })

  // ── 掉落物品入背包（药品进 bag，装备实例进 equipBag）──
  const newBag = mergeBagLoot(state.bag ?? [], loot)
  const newEquipBag = [...(state.equipBag ?? []), ...(equipLoot ?? [])]

  // ── HP/MP 持久化（升级则补满；否则保留战后剩余并按需自动回满） ──
  const leveled = newLevel > oldLevel
  let finalHp  = leveled ? null : remainingHp
  let finalMp  = leveled ? null : remainingMp
  let finalBag = newBag

  if (!leveled && state.autoRestore) {
    const d = computeHeroDerived(newLevel, state)
    const res = autoRestoreWithPotions(finalHp, finalMp, d.maxHp, d.maxMp, newBag)
    finalHp  = res.newHpCur
    finalMp  = res.newMpCur
    finalBag = res.newBag
  }

  patch({
    level:        newLevel,
    expIntoLevel: newExpInto,
    expCur:       newExpInto,
    tael:         (state.tael ?? 0) + gold,
    petRoster:    newPetRoster,
    bag:          finalBag,
    equipBag:     newEquipBag,
    hpCur:        finalHp,
    mpCur:        finalMp,
  })
}

/** 将 loot 合并入现有背包（同 itemId 叠加数量） */
function mergeBagLoot(bag, loot) {
  if (!loot?.length) return bag
  const result = bag.map(s => ({ ...s }))
  for (const { itemId, qty } of loot) {
    if (!qty || qty <= 0) continue
    const idx = result.findIndex(s => s.itemId === itemId)
    if (idx >= 0) result[idx].qty += qty
    else result.push({ itemId, qty })
  }
  return result
}

/**
 * 用背包药品将 HP/MP 回满，优先消耗低 tier 药品（玲珑最后用）。
 * @returns {{ newHpCur: number|null, newMpCur: number|null, newBag: Array }}
 */
function autoRestoreWithPotions(hpCur, mpCur, maxHp, maxMp, bag) {
  let hp = hpCur ?? maxHp
  let mp = mpCur ?? maxMp
  if (hp >= maxHp && mp >= maxMp) return { newHpCur: null, newMpCur: null, newBag: bag }

  // qty 工作副本（itemId → qty）
  const qtyMap = {}
  for (const e of bag) qtyMap[e.itemId] = e.qty

  function restoreKind(kind, curVal, maxVal) {
    if (curVal >= maxVal) return curVal
    // 按 tier 升序排序（玲珑 tier=100 最后）
    const potions = Object.entries(qtyMap)
      .map(([itemId, qty]) => ({ itemId, qty, def: getConsumable(itemId) }))
      .filter(({ def, qty }) => def && def.kind === kind && qty > 0)
      .sort((a, b) => {
        const ta = isQuotaOrb(a.def) ? 100 : (a.def.tier ?? 99)
        const tb = isQuotaOrb(b.def) ? 100 : (b.def.tier ?? 99)
        return ta - tb
      })
    for (const { itemId, def } of potions) {
      if (curVal >= maxVal) break
      if ((qtyMap[itemId] ?? 0) <= 0) continue
      if (isQuotaOrb(def)) {
        curVal = maxVal
        qtyMap[itemId]--
        break
      }
      const amount = getRestoreAmount(def)
      const needed = Math.ceil((maxVal - curVal) / amount)
      const useCount = Math.min(needed, qtyMap[itemId])
      curVal = Math.min(maxVal, curVal + amount * useCount)
      qtyMap[itemId] -= useCount
    }
    return curVal
  }

  hp = restoreKind('hp', hp, maxHp)
  mp = restoreKind('mp', mp, maxMp)

  const newBag = bag.map(e => ({ ...e, qty: qtyMap[e.itemId] ?? 0 })).filter(e => e.qty > 0)
  return {
    newHpCur: hp >= maxHp ? null : hp,
    newMpCur: mp >= maxMp ? null : mp,
    newBag,
  }
}

// ── 宠物上阵 / 休息 ─────────────────────────────────────────────────────────

const ACTIVE_PET_LIMIT = 5

/**
 * 设置指定宠物的出战状态。
 * @param {string} petId
 * @param {boolean} active true=上阵 false=休息
 * @returns {{ ok: boolean, reason?: string }}
 */
export function setPetActiveAction(petId, active) {
  const pet = state.petRoster.find(p => p.id === petId)
  if (!pet) return { ok: false, reason: '宠物不存在' }
  if (pet.active === active) return { ok: false, reason: active ? '已在上阵中' : '已在仓库中' }
  if (active) {
    const cur = state.petRoster.filter(p => p.active).length
    if (cur >= ACTIVE_PET_LIMIT) return { ok: false, reason: `上阵已满（最多 ${ACTIVE_PET_LIMIT} 只）` }
  }
  patch({ petRoster: state.petRoster.map(p => p.id === petId ? { ...p, active } : p) })
  return { ok: true }
}

/**
 * 给指定宠物分配 1 点属性（消耗自由点）。
 * @param {string} petId
 * @param {'vit'|'int'|'str'|'agi'} attr
 * @returns {{ ok: boolean, reason?: string }}
 */
export function addPetAttrAction(petId, attr, count = 1) {
  const VALID = ['vit', 'int', 'str', 'agi']
  if (!VALID.includes(attr)) return { ok: false, reason: '未知属性' }
  const pet = state.petRoster.find(p => p.id === petId)
  if (!pet) return { ok: false, reason: '宠物不存在' }
  const total = getPetFreeAttrTotal(pet.level)
  const used  = sumPetAllocAttr(pet.allocatedAttr)
  if (used >= total) return { ok: false, reason: '无剩余属性点' }
  const actual = Math.min(count, total - used)
  const newAlloc = { ...(pet.allocatedAttr ?? { vit:0,int:0,str:0,agi:0 }), [attr]: ((pet.allocatedAttr?.[attr] ?? 0) + actual) }
  patch({ petRoster: state.petRoster.map(p => p.id === petId ? { ...p, allocatedAttr: newAlloc } : p) })
  return { ok: true }
}

/**
 * 重置指定宠物的属性加点（全部归零，释放自由点）。
 * @param {string} petId
 * @returns {{ ok: boolean }}
 */
export function resetPetAttrAction(petId) {
  const pet = state.petRoster.find(p => p.id === petId)
  if (!pet) return { ok: false, reason: '宠物不存在' }
  patch({ petRoster: state.petRoster.map(p =>
    p.id === petId ? { ...p, allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 } } : p
  )})
  return { ok: true }
}

/**
 * 将捕捉到的宠物加入仓库（未上阵）。
 * @param {object} pet  来自 createWildPetFromFoe 的宠物对象
 * @returns {{ ok: boolean }}
 */
export function addCapturedPetAction(pet) {
  if (!pet?.id) return { ok: false }
  const roster = state.petRoster ?? []
  if (roster.some(p => p.id === pet.id)) return { ok: false }
  // 规范化字段名：createWildPetFromFoe 用的是引擎内部命名，仓库统一用 PetsScreen 期望的格式
  const kindMap = { baby: '宝宝', wild: '野生' }
  const entry = {
    ...pet,
    growth:    pet.growth    ?? pet.growthDetail,
    innateIds: pet.innateIds ?? pet.innateSkillIds ?? [],
    kind:      kindMap[pet.kind] ?? pet.kind,
    active: false,
    expIntoLevel: 0,
    allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
    equippedSkills: [],
    skillLevels: {},
  }
  patch({ petRoster: [...roster, entry] })
  return { ok: true }
}

/**
 * 战斗败北后写回气血（HP=1，MP=0）；若开启自动回满则消耗药品补全。
 */
export function saveBattleEndAction(hpCur, mpCur) {
  if (state.autoRestore) {
    const d = computeHeroDerived(state.level, state)
    const res = autoRestoreWithPotions(hpCur ?? null, mpCur ?? null, d.maxHp, d.maxMp, state.bag ?? [])
    patch({ hpCur: res.newHpCur, mpCur: res.newMpCur, bag: res.newBag })
  } else {
    patch({ hpCur: hpCur ?? null, mpCur: mpCur ?? null })
  }
}

/** 切换战后自动回满开关。 */
export function toggleAutoRestoreAction() {
  patch({ autoRestore: !state.autoRestore })
}

/**
 * 从背包扣减 1 个物品（战斗中使用后调用）。
 * @param {string} itemId
 * @returns {{ ok: boolean }}
 */
export function deductBagItemAction(itemId) {
  const bag = state.bag ?? []
  const idx = bag.findIndex(s => s.itemId === itemId)
  if (idx < 0) return { ok: false }
  const entry = bag[idx]
  const newBag = entry.qty <= 1
    ? bag.filter((_, i) => i !== idx)
    : bag.map((s, i) => i === idx ? { ...s, qty: s.qty - 1 } : s)
  patch({ bag: newBag })
  return { ok: true }
}

/**
 * 在背包界面（非战斗中）使用消耗品恢复气血/法力。
 * @param {string} itemId
 * @returns {{ ok: boolean, reason?: string, hpDelta?: number, mpDelta?: number }}
 */
export function useItemFromBagAction(itemId) {
  const def = getConsumable(itemId)
  if (!def) return { ok: false, reason: '未知物品' }
  const bag = state.bag ?? []
  const idx = bag.findIndex(s => s.itemId === itemId)
  if (idx < 0) return { ok: false, reason: '背包中没有此物品' }

  const d = computeHeroDerived(state.level, state)
  const maxHp = d.maxHp
  const maxMp = d.maxMp
  const curHp = state.hpCur ?? maxHp
  const curMp = state.mpCur ?? maxMp

  let newHp = curHp
  let newMp = curMp

  if (isQuotaOrb(def)) {
    if (def.kind === 'hp') {
      if (curHp >= maxHp) return { ok: false, reason: '气血已满' }
      newHp = maxHp
    } else {
      if (curMp >= maxMp) return { ok: false, reason: '法力已满' }
      newMp = maxMp
    }
  } else {
    const amount = getRestoreAmount(def)
    if (def.kind === 'hp') {
      if (curHp >= maxHp) return { ok: false, reason: '气血已满' }
      newHp = Math.min(maxHp, curHp + amount)
    } else {
      if (curMp >= maxMp) return { ok: false, reason: '法力已满' }
      newMp = Math.min(maxMp, curMp + amount)
    }
  }

  const entry = bag[idx]
  const newBag = entry.qty <= 1
    ? bag.filter((_, i) => i !== idx)
    : bag.map((s, i) => i === idx ? { ...s, qty: s.qty - 1 } : s)

  patch({
    hpCur: newHp >= maxHp ? null : newHp,
    mpCur: newMp >= maxMp ? null : newMp,
    bag: newBag,
  })
  return { ok: true, hpDelta: newHp - curHp, mpDelta: newMp - curMp }
}

/**
 * 将 equipBag 中的实例（uid）装备到指定槽位。
 * equipBag 保存全部实例（已装/未装），equipped 仅标记哪个 uid 在哪个槽。
 * @param {string} slotKey
 * @param {string} uid  装备实例 uid
 * @returns {{ ok: boolean, reason?: string }}
 */
export function equipItemAction(slotKey, uid) {
  if (!EQUIP_SLOT_KEYS.includes(slotKey)) return { ok: false, reason: '未知槽位' }
  const inst = (state.equipBag ?? []).find(i => i.uid === uid)
  if (!inst) return { ok: false, reason: '装备背包中没有此实例' }
  const item = getEquipByCode(inst.baseCode)
  if (!item) return { ok: false, reason: '未知装备' }
  const slotDef = EQUIP_SLOT_DEFS.find(s => s.key === slotKey)
  if (!slotDef?.filter(item)) return { ok: false, reason: '该装备不适合此槽位' }
  patch({ equipped: { ...(state.equipped ?? EMPTY_EQUIPPED), [slotKey]: uid } })
  return { ok: true }
}

/**
 * 卸除指定槽位装备（实例仍留在 equipBag，仅清空槽位标记）。
 * @param {string} slotKey
 * @returns {{ ok: boolean }}
 */
export function unequipItemAction(slotKey) {
  if (!EQUIP_SLOT_KEYS.includes(slotKey)) return { ok: false, reason: '未知槽位' }
  const oldUid = (state.equipped ?? {})[slotKey]
  if (!oldUid) return { ok: false, reason: '该槽位未装备任何物品' }
  patch({ equipped: { ...(state.equipped ?? EMPTY_EQUIPPED), [slotKey]: null } })
  return { ok: true }
}

// ── 装备出售 ──────────────────────────────────────────────────────────────────
export const EQUIP_SELL_PRICE = {
  white: 100, green: 600, blue: 3000, purple: 15000, orange: 60000,
}

/**
 * 出售单件装备（不可出售已装备在槽位的物品）。
 * @param {string} uid
 * @returns {{ ok: boolean, reason?: string, tael?: number }}
 */
export function sellEquipAction(uid) {
  const equippedUids = new Set(Object.values(state.equipped ?? {}).filter(v => typeof v === 'string'))
  if (equippedUids.has(uid)) return { ok: false, reason: '已装备的物品需先卸下' }
  const inst = (state.equipBag ?? []).find(i => i.uid === uid)
  if (!inst) return { ok: false, reason: '未找到该装备' }
  const price = EQUIP_SELL_PRICE[inst.quality] ?? 100
  patch({
    equipBag: state.equipBag.filter(i => i.uid !== uid),
    tael: (state.tael ?? 0) + price,
  })
  return { ok: true, tael: price }
}

/**
 * 批量出售指定品质的所有未装备装备。
 * @param {string[]} qualities  如 ['white','green']
 * @returns {{ ok: boolean, count: number, tael: number }}
 */
export function batchSellEquipAction(qualities) {
  const qSet = new Set(qualities)
  const equippedUids = new Set(Object.values(state.equipped ?? {}).filter(v => typeof v === 'string'))
  const toSell = (state.equipBag ?? []).filter(i => !equippedUids.has(i.uid) && qSet.has(i.quality))
  if (!toSell.length) return { ok: true, count: 0, tael: 0 }
  const earned = toSell.reduce((s, i) => s + (EQUIP_SELL_PRICE[i.quality] ?? 100), 0)
  const sellUids = new Set(toSell.map(i => i.uid))
  patch({
    equipBag: state.equipBag.filter(i => !sellUids.has(i.uid)),
    tael: (state.tael ?? 0) + earned,
  })
  return { ok: true, count: toSell.length, tael: earned }
}

// ── 商城购买 ──────────────────────────────────────────────────────────────────
/**
 * 购买商城道具（普通消耗品 / 黑水晶）。
 * @param {string} itemId
 * @param {number} qty
 * @returns {{ ok: boolean, reason?: string }}
 */
export function buyShopItemAction(itemId, qty = 1) {
  const SHOP_PRICES = {
    xiao_huanhun: 120, xiao_juling: 100,
    zhong_huanhun: 800, zhong_juling: 700,
    da_huanhun: 2500, da_juling: 2200,
    heishuijing: 999999,
    qianghuashi: 3000,
  }
  const price = SHOP_PRICES[itemId]
  if (price == null) return { ok: false, reason: '该商品不存在' }
  const total = price * qty
  if ((state.tael ?? 0) < total) return { ok: false, reason: `银两不足（需 ${total.toLocaleString()}）` }
  if (itemId === 'heishuijing') {
    // 黑水晶是独立实例，存入 crystalBag
    const newCrystals = Array.from({ length: qty }, (_, i) => ({
      uid: `crystal_${Date.now()}_${_crystalSeq++}_${i}`,
      absorbedAttrs: [],
    }))
    patch({ crystalBag: [...(state.crystalBag ?? []), ...newCrystals], tael: (state.tael ?? 0) - total })
    return { ok: true }
  }
  const bag = [...(state.bag ?? [])]
  const idx = bag.findIndex(e => e.itemId === itemId)
  if (idx >= 0) bag[idx] = { ...bag[idx], qty: bag[idx].qty + qty }
  else bag.push({ itemId, qty })
  patch({ bag, tael: (state.tael ?? 0) - total })
  return { ok: true }
}

// ── 背包物品出售 ──────────────────────────────────────────────────────────────
/** tier → 出售单价 */
const BAG_SELL_BY_TIER = { 1: 50, 2: 250, 3: 600, 4: 1200, 5: 2500 }
const BAG_SELL_OVERRIDES = { qianghuashi: 1500 }

/**
 * 返回背包物品单件出售价，null 表示不可出售（特殊道具 / 任务物品 / 黑水晶）。
 */
export function getBagItemSellPrice(itemId) {
  if (BAG_SELL_OVERRIDES[itemId] != null) return BAG_SELL_OVERRIDES[itemId]
  const def = getConsumable(itemId)
  if (!def) return null
  if (def.kind === 'special' || def.kind === 'quest') return null
  return BAG_SELL_BY_TIER[def.tier] ?? null
}

/**
 * 出售背包中指定物品（qty 件）。
 */
export function sellBagItemAction(itemId, qty = 1) {
  const price = getBagItemSellPrice(itemId)
  if (price == null) return { ok: false, reason: '该物品不可出售' }
  const entry = (state.bag ?? []).find(e => e.itemId === itemId)
  if (!entry || entry.qty < qty) return { ok: false, reason: '背包中数量不足' }
  const earned = price * qty
  const newBag = state.bag
    .map(e => e.itemId === itemId ? { ...e, qty: e.qty - qty } : e)
    .filter(e => e.qty > 0)
  patch({ bag: newBag, tael: (state.tael ?? 0) + earned })
  return { ok: true, tael: earned }
}

// ── 黑水晶：吸取 / 锻造熔炼 ──────────────────────────────────────────────────
export const MAX_EXTRA_ATTRS = 6

let _crystalSeq = 0
/**
 * 用黑水晶吸取目标装备的一条随机额外属性，存储到水晶上。
 * @param {string} crystalUid
 * @param {string} equipUid
 */
export function absorbToCrystalAction(crystalUid, equipUid) {
  const crystal = (state.crystalBag ?? []).find(c => c.uid === crystalUid)
  if (!crystal) return { ok: false, reason: '未找到黑水晶' }
  const inst = (state.equipBag ?? []).find(i => i.uid === equipUid)
  if (!inst) return { ok: false, reason: '未找到该装备' }
  if (!inst.extra?.length) return { ok: false, reason: '该装备没有额外属性可吸取' }

  const idx = Math.floor(Math.random() * inst.extra.length)
  const absorbed = inst.extra[idx]

  patch({
    crystalBag: state.crystalBag.map(c =>
      c.uid === crystalUid ? { ...c, absorbedAttrs: [...(c.absorbedAttrs ?? []), absorbed] } : c
    ),
    equipBag: state.equipBag.map(i =>
      i.uid === equipUid ? { ...i, extra: i.extra.filter((_, j) => j !== idx) } : i
    ),
  })
  return { ok: true, absorbed }
}

/**
 * 熔炼：将黑水晶上的所有属性注入目标装备，消耗水晶。
 * 装备额外属性上限 MAX_EXTRA_ATTRS 条，超过则拒绝。
 * @param {string} equipUid
 * @param {string} crystalUid
 */
export function smeltEquipAction(equipUid, crystalUid) {
  const crystal = (state.crystalBag ?? []).find(c => c.uid === crystalUid)
  if (!crystal) return { ok: false, reason: '未找到黑水晶' }
  if (!crystal.absorbedAttrs?.length) return { ok: false, reason: '黑水晶上没有属性' }
  const inst = (state.equipBag ?? []).find(i => i.uid === equipUid)
  if (!inst) return { ok: false, reason: '未找到该装备' }
  const curCount = inst.extra?.length ?? 0
  if (curCount >= MAX_EXTRA_ATTRS) return { ok: false, reason: `额外属性已达上限（${MAX_EXTRA_ATTRS} 条）` }
  const toAdd = crystal.absorbedAttrs.slice(0, MAX_EXTRA_ATTRS - curCount)

  patch({
    equipBag: state.equipBag.map(i =>
      i.uid === equipUid ? { ...i, extra: [...(i.extra ?? []), ...toAdd] } : i
    ),
    crystalBag: state.crystalBag.filter(c => c.uid !== crystalUid),
  })
  return { ok: true, added: toAdd.length }
}

// ── 锻造强化 ──────────────────────────────────────────────────────────────────
export const FORGE_MAX_LEVEL = 12
export const FORGE_STONE_ID  = 'qianghuashi'

/** 各级强化基础成功率（%），索引 i = 从 +i 强化到 +(i+1) */
export const FORGE_SUCCESS_RATES = [100, 100, 100, 85, 78, 30, 18, 10, 6, 4, 2, 1]

/** 各级强化失败时累积的保底进度（%），索引 i = 从 +i 强化到 +(i+1) */
export const FORGE_PITY_STEPS = [15, 15, 15, 15, 12, 5, 4, 3, 3, 2, 2, 2]

/** 第 N 级强化费用（银两） */
export function forgeCost(currentLevel) {
  return 500 * (currentLevel + 1) * (currentLevel + 1)
}

/**
 * 对装备进行一次强化，消耗银两 + 强化石。
 * 成功：forgeLevel +1，保底归零。
 * 失败：forgeLevel 不变，保底 +FORGE_PITY_STEP；保底达 100 时下次必中。
 */
export function forgeEquipAction(uid) {
  const inst = (state.equipBag ?? []).find(i => i.uid === uid)
  if (!inst) return { ok: false, reason: '未找到该装备' }
  const cur = inst.forgeLevel ?? 0
  if (cur >= FORGE_MAX_LEVEL) return { ok: false, reason: `强化已达上限 +${FORGE_MAX_LEVEL}` }
  const cost = forgeCost(cur)
  if ((state.tael ?? 0) < cost) return { ok: false, reason: `银两不足（需 ${cost.toLocaleString()}）` }
  const stoneEntry = (state.bag ?? []).find(e => e.itemId === FORGE_STONE_ID)
  if (!stoneEntry || stoneEntry.qty < 1) return { ok: false, reason: '强化石不足（需 1 颗）' }

  const pity = inst.forgePity ?? 0
  const guaranteed = pity >= 100
  const rate = FORGE_SUCCESS_RATES[cur] ?? 15
  const success = guaranteed || Math.random() * 100 < rate
  const pityStep = FORGE_PITY_STEPS[cur] ?? 2
  const newPity  = success ? 0 : Math.min(100, pity + pityStep)

  const newBag = state.bag
    .map(e => e.itemId === FORGE_STONE_ID ? { ...e, qty: e.qty - 1 } : e)
    .filter(e => e.qty > 0)

  patch({
    equipBag: state.equipBag.map(i =>
      i.uid === uid ? { ...i, forgeLevel: success ? cur + 1 : cur, forgePity: newPity } : i
    ),
    tael: (state.tael ?? 0) - cost,
    bag: newBag,
  })
  return { ok: true, success, forgeLevel: success ? cur + 1 : cur, pity: newPity, guaranteed }
}

/**
 * 从存档对象覆写当前状态（读档用）。
 */
export function loadFromObject(charState) {
  if (!charState || typeof charState !== 'object') return
  state = { ...DEFAULT_STATE, ...charState }
  save(state)
  notify()
}

export function resetToDefaults() {
  state = { ...DEFAULT_STATE }
  save(state)
  notify()
}
