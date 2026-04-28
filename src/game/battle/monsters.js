import { DEFAULT_MAP_ID, getMapById, getWorldBossByKey } from './wendaoMapsConfig.js'
import { getMonsterProfile } from './monsterProfiles.js'

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

/** 由等级推导六维（文字版平衡用，非官方数值） */
export function deriveStatsFromLevel(level, { isBoss = false } = {}) {
  const L = Math.max(1, level)
  const B = isBoss ? 2.75 : 1
  return {
    level: L,
    hp: Math.round((52 + L * 20.5) * B),
    mp: Math.round((28 + L * 5.2) * (isBoss ? 1.45 : 1)),
    atk: Math.round((10 + L * 2.05) * (isBoss ? 1.22 : 1)),
    def: Math.round((5 + L * 0.82) * (isBoss ? 1.18 : 1)),
    speed: Math.round((8 + L * 0.6) * (isBoss ? 0.94 : 1)),
  }
}

/**
 * 根据标签/名称推断技能池（问道风格技能 id，见 skills.js）
 * @param {{ tags?: string[], name?: string, level?: number }} spawn
 */
export function inferSkillPool(spawn, isBoss = false) {
  const tags = new Set(spawn.tags ?? [])
  const pool = new Set(['normal_attack'])
  const add = (...ids) => ids.forEach((id) => pool.add(id))

  if (tags.has('world_boss') || isBoss) {
    add('liehuo', 'leiji', 'lipojun', 'shuiyan', 'bingdong')
  }
  if (tags.has('undead')) add('shidu', 'gutu')
  if (tags.has('ghost')) add('yaofeng', 'bingdong', 'shidu')
  if (tags.has('aquatic')) add('shuiyan', 'bingdong')
  if (tags.has('dragon')) add('liehuo', 'leiji', 'shuiyan')
  if (tags.has('fire')) add('liehuo')
  if (tags.has('ice')) add('bingdong', 'shuiyan')
  if (tags.has('thunder') || tags.has('metal')) add('leiji')
  if (tags.has('wood') || tags.has('spirit')) add('yaofeng', 'duci')
  if (tags.has('venom') || tags.has('insect')) add('duci')
  if (tags.has('beast') && !tags.has('dragon')) add('shixin', 'chuangji')
  if (tags.has('bird')) add('liehuo', 'yaofeng')
  if (tags.has('demon')) add('liehuo', 'duci', 'lipojun')
  if (tags.has('fox')) add('yaofeng', 'duci')
  if (tags.has('wind')) add('yaofeng', 'duci')
  if (tags.has('dark')) add('shidu', 'yaofeng')
  if (tags.has('humanoid') && spawn.level >= 60) add('lipojun', 'leiji')
  if (spawn.level >= 45 && !tags.has('beast')) add('bingdong')
  if (spawn.level >= 70) add('lipojun')

  return [...pool]
}

/**
 * @param {{ key: string, name: string, level: number, tags?: string[], skillPool?: string[] }} spawn
 */
export function spawnFromWendaoSpawn(spawn, options = {}) {
  const { scale = 1, isBoss = false } = options
  const stats = deriveStatsFromLevel(spawn.level, { isBoss })
  const prof = getMonsterProfile(spawn.key)
  const skillPool =
    spawn.skillPool?.length > 0 ? [...spawn.skillPool] : inferSkillPool(spawn, isBoss)
  const template = {
    key: spawn.key,
    name: spawn.name,
    level: spawn.level,
    hp: stats.hp,
    mp: stats.mp,
    atk: stats.atk,
    def: stats.def,
    speed: Math.max(1, stats.speed),
    skillPool,
    affinity: prof.affinity,
  }
  return spawnMonster(template, scale)
}

export function spawnMonster(template, scale = 1) {
  const s = Math.max(0.85, Math.min(1.35, scale))
  return {
    id: uid('foe'),
    side: 'foe',
    templateKey: template.key,
    name: template.name,
    level: template.level,
    maxHp: Math.round(template.hp * s),
    hp: Math.round(template.hp * s),
    maxMp: Math.round(template.mp * s),
    mp: Math.round(template.mp * s),
    atk: Math.round(template.atk * s),
    def: Math.round(template.def * s),
    speed: Math.round(template.speed * s),
    skillPool: [...template.skillPool],
    affinity: template.affinity ?? null,
  }
}

/** 世界 BOSS 单场一只，属性按首领倍率 */
export function spawnWorldBossUnit(bossKey, scale = 1) {
  const boss = getWorldBossByKey(bossKey)
  if (!boss) return null
  const spawn = {
    key: boss.key,
    name: boss.name,
    level: boss.level,
    tags: ['world_boss', 'boss'],
  }
  const unit = spawnFromWendaoSpawn(spawn, { scale, isBoss: true })
  return {
    ...unit,
    isWorldBoss: true,
    worldBossPartyMin: boss.partyMin,
    worldBossMapName: boss.mapName,
    worldBossNotes: boss.notes,
  }
}

/** 队伍人数 n → 普通野怪数量 ∈ [n, 2n] */
export function rollFoeCount(partySize, rng = Math.random) {
  const n = Math.max(1, partySize)
  const min = n
  const max = n * 2
  return min + Math.floor(rng() * (max - min + 1))
}

/**
 * @param {number} partySize
 * @param {{ rng?: () => number, scale?: number, mapId?: string }} options
 */
export function buildEncounter(partySize, options = {}) {
  const { rng = Math.random, scale = 1, mapId = DEFAULT_MAP_ID } = options
  const map = getMapById(mapId)
  const count = rollFoeCount(partySize, rng)
  const foes = []
  for (let k = 0; k < count; k++) {
    const spawn = map.spawns[Math.floor(rng() * map.spawns.length)]
    const unit = spawnFromWendaoSpawn(spawn, { scale, rng })
    foes.push({
      ...unit,
      mapId: map.id,
      mapName: map.name,
      spawnKey: spawn.key,
      isWorldBoss: false,
    })
  }
  return foes
}

/** 仅世界 BOSS：固定 1 只（不受 [n,2n] 规则约束） */
export function buildWorldBossEncounter(bossKey, options = {}) {
  const { scale = 1 } = options
  const boss = spawnWorldBossUnit(bossKey, scale)
  if (!boss) return []
  const b = getWorldBossByKey(bossKey)
  return [
    {
      ...boss,
      mapId: b?.mapId ?? null,
      mapName: b?.mapName ?? '世界BOSS',
      spawnKey: bossKey,
    },
  ]
}

export function allySkillPoolDefault() {
  return ['normal_attack', 'liehuo', 'bingdong', 'lipojun', 'leiji']
}

export function createAllyUnit(name, stats, skillIds) {
  return {
    id: uid('ally'),
    side: 'ally',
    templateKey: 'player',
    name,
    level: stats.level ?? 10,
    /** 本级经验条（与 `level` 成对，见 characterLevelConfig） */
    expIntoLevel: stats.expIntoLevel ?? 0,
    maxHp: stats.maxHp,
    hp: stats.maxHp,
    maxMp: stats.maxMp,
    mp: stats.maxMp,
    atk: stats.atk,
    mAtk: stats.mAtk ?? stats.atk,
    def: stats.def,
    speed: stats.speed,
    skillPool: skillIds ?? allySkillPoolDefault(),
  }
}

export { DEFAULT_MAP_ID, getMapById, listMapSummaries, suggestMapIdForLevel } from './wendaoMapsConfig.js'
export { WENDAO_MAPS, WENDAO_WORLD_BOSSES } from './wendaoMapsConfig.js'
