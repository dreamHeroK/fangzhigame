/**
 * 全局角色状态 - 技能习得、装备、资源
 * useSyncExternalStore 兼容的轻量 store
 */
import { getAllSchoolSkills, canLearnSkill, maxSkillLevelForChar } from './battle/schoolSkills.js'

const STORAGE_KEY = 'wendao_char_v1'

const DEFAULT_STATE = {
  name: '天行健',
  school: '金',
  level: 50,
  tael: 248800,      // 银两
  potential: 4820,   // 潜能
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
      level: 1, master: '天行健', active: true,
      growth: { hp: 72, mp: 78, spd: 56, pAtk: 2, mAtk: 58, totalBand: [210, 300] },
      innateIds: ['bianchangmoji', 'shemingyiji'],
    },
    {
      id: 'pet2', spawnKey: 'haigui', displayName: '海龟·野生', kind: '野生',
      level: 25, master: '听雪楼', active: true,
      growth: { hp: 92, mp: 66, spd: 18, pAtk: 0, mAtk: 40, totalBand: [170, 260] },
      innateIds: ['fangweidujian'],
    },
    {
      id: 'pet3', spawnKey: 'huoya', displayName: '火鸦·宝宝', kind: '宝宝',
      level: 1, master: '焚青劫', active: true,
      growth: { hp: 60, mp: 80, spd: 62, pAtk: 0, mAtk: 65, totalBand: [210, 300] },
      innateIds: ['shiwanhuoji', 'mantianxuewu'],
    },
    {
      id: 'pet4', spawnKey: 'taojing', displayName: '桃精·野生', kind: '野生',
      level: 17, master: '一川烟', active: true,
      growth: { hp: 50, mp: 70, spd: 44, pAtk: 0, mAtk: 40, totalBand: [160, 250] },
      innateIds: ['bamiaozhuzhang'],
    },
    {
      id: 'pet5', spawnKey: 'baiyuan', displayName: '白猿·野生', kind: '野生',
      level: 22, master: '厚土君', active: true,
      growth: { hp: 78, mp: 40, spd: 28, pAtk: 72, mAtk: 0, totalBand: [170, 260] },
      innateIds: ['fanzhuanqiankun'],
    },
    {
      id: 'pet6', spawnKey: 'xuenv', displayName: '雪女·野生', kind: '野生',
      level: 75, active: false,
      growth: { hp: 90, mp: 64, spd: 60, pAtk: 0, mAtk: 62, totalBand: [230, 320] },
      innateIds: ['fangweidujian', 'siwangchanmian'],
    },
  ],
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      return { ...DEFAULT_STATE, ...saved }
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

// --- 升级费用 ---
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

export function resetToDefaults() {
  state = { ...DEFAULT_STATE }
  save(state)
  notify()
}
