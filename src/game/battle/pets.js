import { getMonsterProfile, rollInnateIds } from './monsterProfiles.js'
import {
  computeStatsFromGrowth,
  rollPetGrowthDetail,
  sumGrowthParts,
} from './petGrowthTable.js'
import { WENDAO_MAPS } from './wendaoMapsConfig.js'
import { getPetByKey } from '../petCatalog.js'
import { applyTianShuBaseStats, calcPetSpiritMax } from './tianShu.js'

function spawnLabel(key) {
  for (const m of WENDAO_MAPS) {
    const sp = m.spawns.find((x) => x.key === key)
    if (sp) return sp.name
  }
  return key
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 血量越低成功率越高；HP% ≤ 30% 时达到上限（文字版参数）
 * @param {{ hp: number, maxHp: number, isWorldBoss?: boolean }} foe
 * @param {{ pMin?: number, pMax?: number, hpBreakpoint?: number }} opts
 */
export function computeCaptureProbability(foe, opts = {}) {
  if (foe.isWorldBoss) return 0
  // 宝宝：高基础捕捉率，血量低时几乎必抓
  const pMin = opts.pMin ?? (foe.isBabyMonster ? 0.30 : 0.04)
  const pMax = opts.pMax ?? (foe.isBabyMonster ? 0.90 : 0.55)
  const bp = opts.hpBreakpoint ?? 0.3
  const r = foe.hp / Math.max(1, foe.maxHp)
  if (r <= bp) return pMax
  return pMin + ((pMax - pMin) * (1 - r)) / (1 - bp)
}

/** 野生宠物：与怪同级；六维由成长表掷骰 + 等级公式；天生单独掷 */
export function createWildPetFromFoe(foe, rng = Math.random) {
  const key = foe.templateKey ?? foe.spawnKey ?? 'qingwa'
  const prof = getMonsterProfile(key)
  const innateSkillIds = rollInnateIds(prof.innatePool, { rng, isBoss: false })
  const L = Math.max(1, foe.level)
  // 宝宝捕获：精英品质掷骰（在区间高 60% 段内），并标记 kind 为宝宝
  const isCaptureBaby = !!foe.isBabyMonster
  const growthDetail = rollPetGrowthDetail(key, rng, isCaptureBaby ? { qualityBoost: 'elite' } : {})
  const st = computeStatsFromGrowth(L, growthDetail, { baby: isCaptureBaby })
  const baseName = foe.name.replace(/（宝宝）$/, '')
  return {
    id: uid('pet'),
    kind: isCaptureBaby ? 'baby' : 'wild',
    displayName: isCaptureBaby ? `宝宝·${baseName}` : `${foe.name}（野生）`,
    spawnKey: key,
    level: L,
    affinity: prof.affinity,
    growthDetail,
    growthSum: sumGrowthParts(growthDetail),
    growthBand: growthDetail.totalBand,
    ...(isCaptureBaby ? { babyPotential: Number((1.1 + rng() * 0.1).toFixed(3)) } : {}),
    innateSkillIds,
    innateEnabledIds: [],
    maxHp: st.maxHp,
    maxMp: st.maxMp,
    atk: st.atk,
    def: st.def,
    speed: st.speed,
    mAtk: st.mAtk,
    notes: isCaptureBaby
      ? '宝宝捕获：精英品质成长，宝宝系数，可出战升级。'
      : '战斗中怪物无天生；成长资质见 growthDetail。宠物可勾选启用天生（后续出战）。',
  }
}

/** 任务奖励宝宝：精英品质掷骰，带天生技能，active=false 直接入仓库 */
export function createQuestBabyPet(spawnKey) {
  const prof      = getMonsterProfile(spawnKey)
  const innateIds = rollInnateIds(prof.innatePool, { rng: Math.random, isBoss: false })
  const growth    = rollPetGrowthDetail(spawnKey, Math.random, { qualityBoost: 'elite' })
  const catalog   = getPetByKey(spawnKey)
  return {
    id:            uid('qpet'),
    kind:          '宝宝',
    displayName:   `${catalog?.name ?? spawnKey}·宝宝`,
    spawnKey,
    level:         1,
    expIntoLevel:  0,
    affinity:      prof.affinity,
    growth,
    innateIds,
    active:        false,
    allocatedAttr: { vit: 0, int: 0, str: 0, agi: 0 },
  }
}

const SCHOOL_SLUG = { 金: 'jin', 木: 'mu', 水: 'shui', 火: 'huo', 土: 'tu' }

/** 按宠物等级和相性生成技能池（B系攻击为主） */
function buildPetSkillPool(level, affinity) {
  const pool = ['normal_attack']
  const slug = SCHOOL_SLUG[affinity]
  if (!slug) return pool
  if (level >= 10)  pool.push(`${slug}_B1`)
  if (level >= 19)  pool.push(`${slug}_B2`)
  if (level >= 38)  pool.push(`${slug}_B3`)
  if (level >= 60)  pool.push(`${slug}_B4`)
  if (level >= 100) pool.push(`${slug}_B5`)
  return pool
}

/**
 * 把宠物 roster 条目转换为战斗单位（side: 'ally'）
 * @param {{ id, spawnKey, displayName, kind, level, growth, innateIds }} pet
 */
export function createPetAllyUnit(pet) {
  const isBaby = pet.kind === '宝宝'
  const g = pet.growth ?? pet.growthDetail
  const baseStats = computeStatsFromGrowth(pet.level, g, { baby: isBaby, allocatedAttr: pet.allocatedAttr })
  const stats = applyTianShuBaseStats(baseStats, pet.tianShu)
  const spiritMax = calcPetSpiritMax(pet.tianShu)
  const catalog = getPetByKey(pet.spawnKey)
  const affinity = catalog?.affinity ?? null
  const skillPool = buildPetSkillPool(pet.level, affinity)
  return {
    id: `petunit_${pet.id}`,
    side: 'ally',
    kind: 'pet',
    templateKey: pet.spawnKey,
    name: pet.displayName,
    level: pet.level,
    maxHp: stats.maxHp,
    hp: pet.hpCur != null ? Math.min(pet.hpCur, stats.maxHp) : stats.maxHp,
    maxMp: stats.maxMp,
    mp: pet.mpCur != null ? Math.min(pet.mpCur, stats.maxMp) : stats.maxMp,
    atk: stats.atk,
    mAtk: stats.mAtk,
    def: stats.def,
    speed: stats.speed,
    skillPool,
    skillLevels: {},
    affinity,
    innateSkillIds: pet.innateIds ?? [],
    tianShu: pet.tianShu ?? [],
    spiritMax,
    spiritCur: spiritMax,
  }
}

/** 宝宝：1 级；高成长表掷档 + 宝宝初始公式；天生单独掷 */
export function createMonsterBaby(spawnKey, rng = Math.random) {
  const prof = getMonsterProfile(spawnKey)
  const innateSkillIds = rollInnateIds(prof.innatePool, { rng, isBoss: false })
  const growthDetail = rollPetGrowthDetail(spawnKey, rng)
  const st = computeStatsFromGrowth(1, growthDetail, { baby: true })
  return {
    id: uid('pet'),
    kind: 'baby',
    displayName: `宝宝·${spawnLabel(spawnKey)}`,
    spawnKey,
    level: 1,
    affinity: prof.affinity,
    growthDetail,
    growthSum: sumGrowthParts(growthDetail),
    growthBand: growthDetail.totalBand,
    babyPotential: Number((1.1 + rng() * 0.1).toFixed(3)),
    innateSkillIds,
    innateEnabledIds: [],
    maxHp: st.maxHp,
    maxMp: st.maxMp,
    atk: st.atk,
    def: st.def,
    speed: st.speed,
    mAtk: st.mAtk,
    notes: '宝宝仅 1 级初始档，成长区间按物种表掷取；野生宠与怪同级按表成长换算。',
  }
}
