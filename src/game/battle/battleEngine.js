import { getSkill } from './skills.js'
import {
  elementDamageFactor,
  mantleBloodHeal,
  maybeApplyDeathChant,
  onActorTurnStart,
  resolveIncomingInnate,
  shemingDamageMul,
} from './innateCombat.js'
import {
  allySkillPoolDefault,
  buildEncounter,
  buildWorldBossEncounter,
  createAllyUnit,
  DEFAULT_MAP_ID,
  getMapById,
} from './monsters.js'
import { computeCaptureProbability, createWildPetFromFoe } from './pets.js'
import { getConsumable } from '../items/catalog.js'
import { formatLootLine, mergeLootStacks, rollBattleDrops, rollDropsForFoe } from '../items/drops.js'
import { applyConsumableToUnit } from './itemEffects.js'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

function pushLog(state, line) {
  const log = [...state.log, line].slice(-80)
  return { ...state, log }
}

/** @param {Array<{ itemId: string, qty: number }>} [extraLoot] 例如捕捉最后一只时补上已从场上移除的怪 */
function finalizeVictory(s, rng, extraLoot = []) {
  const foes = s.units.filter((u) => u.side === 'foe')
  const fromField = rollBattleDrops(foes, rng)
  const lastVictoryLoot = mergeLootStacks([...fromField, ...extraLoot])
  const lootMsg = formatLootLine(lastVictoryLoot)
  return {
    ...s,
    phase: 'end',
    outcome: 'victory',
    awaitingActorId: null,
    lastVictoryLoot,
    victoryLootNonce: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    log: [...s.log, '战斗胜利。', lootMsg].slice(-80),
  }
}

function living(state, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0)
}

function battleOutcome(state) {
  if (living(state, 'ally').length === 0) return 'defeat'
  if (living(state, 'foe').length === 0) return 'victory'
  return null
}

function effectiveSpeed(u) {
  return u.speed
}

function sortBySpeed(units) {
  return units
    .filter((u) => u.hp > 0)
    .slice()
    .sort((a, b) => effectiveSpeed(b) - effectiveSpeed(a) || a.id.localeCompare(b.id))
}

function rebuildRoundQueue(state) {
  const order = sortBySpeed(state.units)
  return { ...state, roundOrder: order.map((u) => u.id), roundIndex: 0 }
}

function patchUnit(state, id, patch) {
  const units = state.units.map((u) => (u.id === id ? { ...u, ...patch } : u))
  return { ...state, units }
}

function baseDamage(attacker, defender, skillId, rng = Math.random) {
  const sk = getSkill(skillId)
  const atkTemp = attacker.side === 'ally' ? (attacker.innateTempAtkMul ?? 1) : 1
  const defTemp = defender.side === 'ally' ? 1 + (defender.innateTempDefBonus ?? 0) : 1
  const physAtk = attacker.atk * (attacker.passiveAtkMul ?? 1) * atkTemp
  const magAtk = (attacker.mAtk ?? attacker.atk) * (attacker.passiveAtkMul ?? 1) * atkTemp
  const def = Math.max(1, defender.def * (defender.passiveDefMul ?? 1) * defTemp)
  let raw
  if (sk.kind === 'magic') {
    raw = (magAtk * 0.55 + 18) * sk.power - def * 0.35
  } else {
    raw = physAtk * sk.power - def * 0.45
  }
  const roll = 0.92 + rng() * 0.16
  raw *= elementDamageFactor(sk.element ?? null, defender.affinity ?? null)
  if (attacker.side === 'ally') raw *= shemingDamageMul(attacker, rng)
  return Math.max(1, Math.floor(raw * roll))
}

function startOfTurnHooks(state, actorId, rng) {
  const actor = getActor(state, actorId)
  if (!actor) return state
  return onActorTurnStart(state, actor, patchUnit, pushLog, rng)
}

function applyStrike(state, attackerId, defenderId, skillId, rng) {
  const attacker = getActor(state, attackerId)
  const defender = getActor(state, defenderId)
  if (!attacker || !defender || defender.hp <= 0) return { state, damage: 0 }
  const raw = baseDamage(attacker, defender, skillId, rng)
  const incoming = resolveIncomingInnate(defender, skillId, raw, rng)
  let s = state
  for (const line of incoming.logs) s = pushLog(s, line)
  const dmg = incoming.damage
  s = applyDamage(s, defenderId, dmg)
  const defAft = getActor(s, defenderId)
  if (defAft && defAft.hp > 0 && defAft.side === 'ally') {
    s = maybeApplyDeathChant(s, attacker, defAft, dmg, patchUnit, rng)
  }
  const atkAft = getActor(s, attackerId)
  if (atkAft && atkAft.hp > 0 && atkAft.side === 'ally') {
    const mt = mantleBloodHeal(atkAft, dmg, rng)
    if (mt.heal > 0) {
      const nh = Math.min(atkAft.maxHp, atkAft.hp + mt.heal)
      s = patchUnit(s, attackerId, { hp: nh })
      if (mt.log) s = pushLog(s, mt.log)
    }
  }
  return { state: s, damage: dmg }
}

function applyDamage(state, targetId, amount) {
  const t = state.units.find((u) => u.id === targetId)
  if (!t || t.hp <= 0) return state
  const hp = clamp(t.hp - amount, 0, t.maxHp)
  return patchUnit(state, targetId, { hp })
}

function spendMp(state, actorId, mp) {
  const a = state.units.find((u) => u.id === actorId)
  if (!a) return state
  const mpNext = clamp(a.mp - mp, 0, a.maxMp)
  return patchUnit(state, actorId, { mp: mpNext })
}

function nextActorIndex(state) {
  let idx = state.roundIndex
  const order = state.roundOrder
  while (idx < order.length) {
    const id = order[idx]
    const u = state.units.find((x) => x.id === id)
    if (u && u.hp > 0) return idx
    idx += 1
  }
  return -1
}

function advanceRoundPointer(state) {
  let idx = state.roundIndex + 1
  const order = state.roundOrder
  while (idx < order.length) {
    const id = order[idx]
    const u = state.units.find((x) => x.id === id)
    if (u && u.hp > 0) return { ...state, roundIndex: idx }
    idx += 1
  }
  return rebuildRoundQueue({ ...state, roundIndex: 0 })
}

function pickRandomLiving(state, side, rng) {
  const pool = living(state, side)
  if (pool.length === 0) return null
  return pool[Math.floor(rng() * pool.length)]
}

function monsterChooseAction(state, monster, rng) {
  const pool = monster.skillPool.map(getSkill)
  const usable = pool.filter((s) => s.mpCost <= monster.mp && s.id !== 'normal_attack')
  const useSkill = usable.length > 0 && rng() < 0.42
  if (useSkill) {
    const sk = usable[Math.floor(rng() * usable.length)]
    return { skillId: sk.id }
  }
  return { skillId: 'normal_attack' }
}

function defaultAllyName(i) {
  const names = ['剑修·无名', '木系弟子', '水系弟子', '火系弟子', '金系弟子']
  return names[i % names.length]
}

/**
 * @param {{
 *   partySize?: number,
 *   allyStats?: object,
 *   rng?: () => number,
 *   mapId?: string,
 *   encounter?: 'wild' | 'world_boss',
 *   worldBossKey?: string,
 * }} opts
 */
export function createBattle(opts = {}) {
  const rng = opts.rng ?? Math.random
  const partySize = clamp(opts.partySize ?? 2, 1, 5)
  const mapId = opts.mapId ?? DEFAULT_MAP_ID
  const map = getMapById(mapId)
  const allies = []
  for (let i = 0; i < partySize; i++) {
    allies.push(
      createAllyUnit(
        opts.allyNames?.[i] ?? defaultAllyName(i),
        opts.allyStats ?? {
          level: 12,
          maxHp: 320,
          maxMp: 120,
          atk: 42,
          def: 18,
          speed: 17 + i,
        },
        opts.allySkills ?? allySkillPoolDefault()
      )
    )
  }
  const wantsBoss = opts.encounter === 'world_boss' && opts.worldBossKey
  const bossFoes = wantsBoss
    ? buildWorldBossEncounter(opts.worldBossKey, { scale: opts.foeScale ?? 1 })
    : []
  let foes =
    bossFoes.length > 0
      ? bossFoes
      : buildEncounter(partySize, { rng, scale: opts.foeScale ?? 1, mapId })
  const isBossFight = bossFoes.length > 0
  const open = isBossFight
    ? `【${foes[0].worldBossMapName ?? foes[0].mapName ?? '世界BOSS'}】挑战「${foes[0].name}」Lv${foes[0].level}：我方 ${partySize} 人（首领战固定 1 只）。`
    : wantsBoss
      ? `【${map.name}】世界 BOSS 键无效，已回退为野怪。我方 ${partySize} 人，敌方 ${foes.length} 只（[${partySize}×, ${partySize}×2]）。`
      : `【${map.name}】遭遇战：我方 ${partySize} 人，敌方 ${foes.length} 只（野怪数在 [${partySize}×, ${partySize}×2] 内随机）。`
  const units = [...allies, ...foes]
  let state = {
    units,
    log: [open],
    phase: 'running',
    awaitingActorId: null,
    roundOrder: [],
    roundIndex: 0,
  }
  state = rebuildRoundQueue(state)
  state = tickUntilInputOrEnd(state, rng)
  return state
}

export function tickUntilInputOrEnd(state, rng = Math.random) {
  let s = state
  for (let guard = 0; guard < 400; guard++) {
    const out = battleOutcome(s)
    if (out) {
      if (out === 'victory') return finalizeVictory(s, rng)
      const msg = '我方溃败。'
      return { ...s, phase: 'end', outcome: out, awaitingActorId: null, log: [...s.log, msg].slice(-80) }
    }
    const idx = nextActorIndex(s)
    if (idx < 0) {
      s = rebuildRoundQueue(s)
      continue
    }
    const actorId = s.roundOrder[idx]
    const actor = s.units.find((u) => u.id === actorId)
    if (!actor || actor.hp <= 0) {
      s = { ...s, roundIndex: idx + 1 }
      continue
    }
    if (actor.side === 'ally') {
      s = startOfTurnHooks({ ...s, roundIndex: idx }, actor.id, rng)
      const a = getActor(s, actorId)
      if (!a || a.hp <= 0) {
        s = { ...s, roundIndex: idx + 1 }
        continue
      }
      return { ...s, awaitingActorId: a.id, roundIndex: idx }
    }
    s = executeFoeTurn({ ...s, roundIndex: idx }, actor, rng)
    s = advanceRoundPointer(s)
  }
  return { ...s, phase: 'end', outcome: 'defeat', log: [...s.log, '战斗异常中断。'] }
}

function executeFoeTurn(state, monster, rng) {
  let s = startOfTurnHooks(state, monster.id, rng)
  const m = getActor(s, monster.id)
  if (!m || m.hp <= 0) return s
  const choice = monsterChooseAction(s, m, rng)
  const skill = getSkill(choice.skillId)
  const target = pickRandomLiving(s, 'ally', rng)
  if (!target) return s
  if (skill.mpCost > 0) s = spendMp(s, m.id, skill.mpCost)
  const res = applyStrike(s, m.id, target.id, skill.id, rng)
  s = res.state
  const dmg = res.damage
  const tgt = getActor(s, target.id)
  const mpNote = skill.mpCost > 0 ? `（耗 MP ${skill.mpCost}）` : ''
  s = pushLog(
    s,
    `${m.name} 使用【${skill.name}】${mpNote} → ${tgt?.name ?? target.name} 受到 ${dmg} 点伤害。`
  )
  return s
}

export function getActor(state, id) {
  return state.units.find((u) => u.id === id)
}

export function getLegalTargets(state, side) {
  return state.units.filter((u) => u.side === side && u.hp > 0)
}

/**
 * 本回合使用背包药品（不扣背包，由 UI 在成功后扣减）。
 * @returns {{ state: typeof state, ok: boolean }}
 */
export function submitUseConsumable(state, { actorId, targetId, itemId }, rng = Math.random) {
  if (state.phase === 'end') return { state, ok: false }
  if (state.awaitingActorId !== actorId) return { state, ok: false }
  const actor = getActor(state, actorId)
  const target = getActor(state, targetId)
  if (!actor || actor.side !== 'ally' || !target || target.side !== 'ally' || target.hp <= 0) {
    return { state, ok: false }
  }
  if (!getConsumable(itemId)) return { state, ok: false }

  const applied = applyConsumableToUnit(state, targetId, itemId, patchUnit, pushLog)
  if (!applied.ok) return { state, ok: false }
  let s = { ...applied.state, awaitingActorId: null }
  s = advanceRoundPointer(s)
  s = tickUntilInputOrEnd(s, rng)
  return { state: s, ok: true }
}

/**
 * 玩家回合：对单个目标施放技能（含普通攻击）
 */
export function submitPlayerAction(state, { actorId, skillId, targetId }, rng = Math.random) {
  if (state.phase === 'end') return state
  if (state.awaitingActorId !== actorId) return state
  const actor = getActor(state, actorId)
  const target = getActor(state, targetId)
  if (!actor || actor.side !== 'ally' || !target || target.hp <= 0) return state
  const skill = getSkill(skillId)
  if (!actor.skillPool.includes(skill.id)) return state
  if (actor.mp < skill.mpCost) return state

  let s = spendMp(state, actor.id, skill.mpCost)
  const res = applyStrike(s, actor.id, target.id, skill.id, rng)
  s = res.state
  const dmg = res.damage
  const tgt = getActor(s, target.id)
  const mpNote = skill.mpCost > 0 ? `（耗 MP ${skill.mpCost}）` : ''
  s = pushLog(
    s,
    `${actor.name} 使用【${skill.name}】${mpNote} → ${tgt?.name ?? target.name} 受到 ${dmg} 点伤害。`
  )
  s = { ...s, awaitingActorId: null }
  s = advanceRoundPointer(s)
  s = tickUntilInputOrEnd(s, rng)
  return s
}

/**
 * 消耗本回合行动尝试捕捉；成功则从战场移除该怪并获得野生宠物（天生仅记录在宠物上）。
 * @returns {{ state: typeof state, pet: object | null }}
 */
export function submitCapture(state, { actorId, foeId }, rng = Math.random) {
  if (state.phase === 'end') return { state, pet: null }
  if (state.awaitingActorId !== actorId) return { state, pet: null }
  const actor = getActor(state, actorId)
  const foe = getActor(state, foeId)
  if (!actor || actor.side !== 'ally' || !foe || foe.side !== 'foe' || foe.hp <= 0) {
    return { state, pet: null }
  }

  if (foe.isWorldBoss) {
    let s = pushLog(state, `${actor.name} 尝试捕捉，世界 BOSS 无法收服。`)
    s = { ...s, awaitingActorId: null }
    s = advanceRoundPointer(s)
    s = tickUntilInputOrEnd(s, rng)
    return { state: s, pet: null }
  }

  const p = computeCaptureProbability(foe)
  if (rng() < p) {
    const pet = createWildPetFromFoe(foe, rng)
    const newUnits = state.units.filter((u) => u.id !== foe.id)
    let s = { ...state, units: newUnits, awaitingActorId: null }
    s = pushLog(
      s,
      `${actor.name} 捕捉成功！获得「${pet.displayName}」。当次成功率 ${(p * 100).toFixed(0)}%。`
    )
    if (living(s, 'foe').length === 0) {
      const captureLoot = rollDropsForFoe(foe, rng)
      s = finalizeVictory(s, rng, captureLoot)
      return { state: s, pet }
    }
    s = rebuildRoundQueue(s)
    s = advanceRoundPointer(s)
    s = tickUntilInputOrEnd(s, rng)
    return { state: s, pet }
  }

  let s = pushLog(state, `${actor.name} 捕捉失败。当次成功率 ${(p * 100).toFixed(0)}%。`)
  s = { ...s, awaitingActorId: null }
  s = advanceRoundPointer(s)
  s = tickUntilInputOrEnd(s, rng)
  return { state: s, pet: null }
}

export { rollFoeCount } from './monsters.js'
