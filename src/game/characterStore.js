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
      merged.petRoster = (merged.petRoster ?? []).map(p => {
        const a = p.allocatedAttr
        const isOldFmt = a && ('hp' in a || 'mp' in a || 'spd' in a)
        return {
          ...p,
          expIntoLevel:  p.expIntoLevel  ?? 0,
          allocatedAttr: (!a || isOldFmt) ? { ...EMPTY_ALLOC } : a,
        }
      })
      if (!Array.isArray(merged.bag)) merged.bag = []
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
export function addStatAction(stat) {
  const budget = getAttributePointBudget(state.level)
  const used = sumFour(state)
  if (used >= budget) return { ok: false, reason: '无剩余属性点' }
  if (!['vit', 'int', 'str', 'agi'].includes(stat)) return { ok: false, reason: '未知属性' }
  patch({ [stat]: (state[stat] ?? 0) + 1 })
  return { ok: true }
}

/**
 * 给指定相性加 1 点
 * @param {'Metal'|'Wood'|'Water'|'Fire'|'Earth'} elem
 * @returns {{ ok: boolean, reason?: string }}
 */
export function addAffinityAction(elem) {
  const key = 'aff' + elem
  const budget = getAffinityPointBudget(state.level)
  const used = sumAffinity(state)
  if (used >= budget) return { ok: false, reason: '无剩余相性点' }
  const cur = state[key] ?? 0
  if (cur >= AFFINITY_CAP_PER_ELEMENT) return { ok: false, reason: `${elem}相性已达上限 30` }
  patch({ [key]: cur + 1 })
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
 * @param {{ itemId: string, qty: number }[]} loot 掉落物品列表
 */
export function applyBattleRewardsAction(rewards, activePetIds = [], loot = []) {
  const { exp = 0, petExp = 0, gold = 0 } = rewards

  // ── 角色经验 ──
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

  // ── 掉落物品入背包 ──
  const newBag = mergeBagLoot(state.bag ?? [], loot)

  patch({
    level:        newLevel,
    expIntoLevel: newExpInto,
    expCur:       newExpInto,
    tael:         (state.tael ?? 0) + gold,
    petRoster:    newPetRoster,
    bag:          newBag,
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
export function addPetAttrAction(petId, attr) {
  const VALID = ['vit', 'int', 'str', 'agi']
  if (!VALID.includes(attr)) return { ok: false, reason: '未知属性' }
  const pet = state.petRoster.find(p => p.id === petId)
  if (!pet) return { ok: false, reason: '宠物不存在' }
  const total = getPetFreeAttrTotal(pet.level)
  const used  = sumPetAllocAttr(pet.allocatedAttr)
  if (used >= total) return { ok: false, reason: '无剩余属性点' }
  const newAlloc = { ...(pet.allocatedAttr ?? { vit:0,int:0,str:0,agi:0 }), [attr]: ((pet.allocatedAttr?.[attr] ?? 0) + 1) }
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
