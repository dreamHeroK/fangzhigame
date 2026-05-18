import { expRequiredToNextLevel, petExpRequiredToNextLevel } from '../characterLevelConfig.js'
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

export const STATUS_LABELS = { poison: '中毒', freeze: '冰冻', sleep: '昏睡', confuse: '混乱', forget: '遗忘' }
const STATUS_EXPIRE_MSG = {
  poison:  '中毒已解除。',
  freeze:  '解冻，可以行动。',
  sleep:   '苏醒过来。',
  confuse:  '恢复神智，不再混乱。',
  forget:  '恢复记忆，可以施法。',
}

/**
 * 端游经验计算：每只怪 ≈ 0.2% 同级升级经验，宠物 ≈ 0.2% 宠物升级经验。
 * 100 场同级战（5 怪/场）≈ 升一级，与端游节奏一致。
 */
function calcVictoryRewards(foes, rng) {
  let exp    = 0
  let petExp = 0
  let gold   = 0
  for (const f of foes) {
    const L = Math.max(1, f.level)
    exp    += Math.max(10, Math.floor(expRequiredToNextLevel(L) * 0.002))
    petExp += Math.max(5,  Math.floor(petExpRequiredToNextLevel(L) * 0.002))
    gold   += Math.floor(L * (2 + rng() * 3))
  }
  return { exp, petExp, gold }
}

/** @param {Array<{ itemId: string, qty: number }>} [extraLoot] 例如捕捉最后一只时补上已从场上移除的怪 */
function finalizeVictory(s, rng, extraLoot = []) {
  const foes = s.units.filter((u) => u.side === 'foe')
  const fromField = rollBattleDrops(foes, rng)
  const lastVictoryLoot = mergeLootStacks([...fromField, ...extraLoot])
  const { exp, petExp, gold } = calcVictoryRewards(foes, rng)
  // 给每条 loot 附上可读名称，方便 UI 直接渲染
  const lastVictoryLootNamed = lastVictoryLoot.map(l => ({
    ...l, name: getConsumable(l.itemId)?.name ?? l.itemId,
  }))
  const lootMsg = formatLootLine(lastVictoryLoot)
  const rewardLines = [
    '— — — — — — — — — —',
    '战斗胜利。',
    `人物经验 +${exp.toLocaleString()}　宠物经验 +${petExp.toLocaleString()}`,
    `银两 +${gold.toLocaleString()}`,
    lootMsg,
  ]
  return {
    ...s,
    phase: 'end',
    outcome: 'victory',
    awaitingActorId: null,
    lastVictoryLoot: lastVictoryLootNamed,
    victoryRewards: { exp, petExp, gold },
    victoryLootNonce: `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    log: [...s.log, ...rewardLines].slice(-80),
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
  const skillLevel = attacker.skillLevels?.[skillId] ?? 0
  const sk = getSkill(skillId, skillLevel)
  if (sk.power <= 0) return 0  // 障碍/控制技能：不造成直接伤害
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
  // 冰冻：无敌，攻击无效
  if (defender.statusEffects?.some(e => e.type === 'freeze')) return { state, damage: 0 }
  let s = state
  // 昏睡：受击即苏醒
  if (defender.statusEffects?.some(e => e.type === 'sleep')) {
    s = patchUnit(s, defenderId, { statusEffects: defender.statusEffects.filter(e => e.type !== 'sleep') })
    s = pushLog(s, `${defender.name} 受击惊醒！`)
  }
  const raw = baseDamage(attacker, defender, skillId, rng)
  if (raw === 0) return { state: s, damage: 0 }  // 控制技能：接触但无伤害
  const incoming = resolveIncomingInnate(defender, skillId, raw, rng)
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

// ── 状态效果辅助 ──────────────────────────────────────────────────────────

function addStatusEffect(state, targetId, effect) {
  const t = getActor(state, targetId)
  if (!t || t.hp <= 0) return state
  const effects = (t.statusEffects ?? []).filter(e => e.type !== effect.type)
  return patchUnit(state, targetId, { statusEffects: [...effects, effect] })
}

/** 按命中率决定是否施加状态；tier≥4 命中率极高（强控） */
function tryApplyStatus(state, casterId, targetId, skill, rng) {
  const { statusEffect } = skill
  if (!statusEffect) return state
  const caster = getActor(state, casterId)
  const target = getActor(state, targetId)
  if (!target || target.hp <= 0) return state
  // 冰冻目标已处于封锁状态，不再叠加其他控制
  if (target.statusEffects?.some(e => e.type === 'freeze')) return state
  const skillLevel = caster?.skillLevels?.[skill.id] ?? 0
  const levelDiff = Math.max(0, (target.level ?? 1) - (caster?.level ?? 1))
  const tier = skill.tier ?? 1
  const rate = tier >= 4
    ? 0.88
    : Math.max(0.12, Math.min(0.92, 0.55 + skillLevel * 0.0025 - levelDiff * 0.025))
  if (rng() > rate) return pushLog(state, `【${STATUS_LABELS[statusEffect.type]}】未能命中 ${target.name}。`)
  const s = addStatusEffect(state, targetId, { ...statusEffect })
  return pushLog(s, `${target.name} 陷入【${STATUS_LABELS[statusEffect.type]}】（${statusEffect.duration}回合）！`)
}

/** 每回合开始时处理状态效果，返回 { state, skipTurn, actRandomly } */
function processStatusTick(state, actorId, rng) {
  const actor = getActor(state, actorId)
  if (!actor?.statusEffects?.length) return { state, skipTurn: false, actRandomly: false }
  let s = state
  let skipTurn = false
  let actRandomly = false
  const remaining = []
  for (const eff of actor.statusEffects) {
    if (eff.type === 'poison') {
      const dmg = Math.max(1, Math.round(actor.maxHp * (eff.tickPct ?? 0.05)))
      s = applyDamage(s, actorId, dmg)
      s = pushLog(s, `${actor.name} 中毒发作，流失 ${dmg} 气血。`)
    } else if (eff.type === 'freeze') {
      skipTurn = true
      s = pushLog(s, `${actor.name} 被冰封，无法行动。`)
    } else if (eff.type === 'sleep') {
      skipTurn = true
      s = pushLog(s, `${actor.name} 昏睡中，无法行动。`)
    } else if (eff.type === 'confuse') {
      actRandomly = true
      s = pushLog(s, `${actor.name} 神志混乱！`)
    }
    // forget: 不跳过回合，仅限制技能，在行动时处理
    const newDur = eff.duration - 1
    if (newDur > 0) remaining.push({ ...eff, duration: newDur })
    else {
      const msg = STATUS_EXPIRE_MSG[eff.type]
      if (msg) s = pushLog(s, `${actor.name} ${msg}`)
    }
  }
  s = patchUnit(s, actorId, { statusEffects: remaining })
  return { state: s, skipTurn, actRandomly }
}

/** 混乱状态：随机攻击任意存活单位（包括友军） */
function executeConfusedTurn(state, actor, rng) {
  const allLiving = state.units.filter(u => u.hp > 0 && u.id !== actor.id)
  if (!allLiving.length) return state
  const target = allLiving[Math.floor(rng() * allLiving.length)]
  const res = applyStrike(state, actor.id, target.id, 'normal_attack', rng)
  return pushLog(res.state, `${actor.name} 神志混乱，随机攻击了 ${target.name}，造成 ${res.damage} 伤害！`)
}

// ── 普通辅助 ──────────────────────────────────────────────────────────────

function pickRandomLiving(state, side, rng) {
  const pool = living(state, side)
  if (pool.length === 0) return null
  return pool[Math.floor(rng() * pool.length)]
}

function monsterChooseAction(state, monster, rng) {
  // 遗忘状态：只能普通攻击
  if (monster.statusEffects?.some(e => e.type === 'forget')) return { skillId: 'normal_attack' }
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
  const mapId = opts.mapId ?? DEFAULT_MAP_ID
  const map = getMapById(mapId)

  // 支持直接传入预构建单位（玩家+宠物场景）
  let allies
  if (opts.allyUnits?.length > 0) {
    allies = [...opts.allyUnits]
  } else {
    const n = clamp(opts.partySize ?? 2, 1, 5)
    allies = []
    for (let i = 0; i < n; i++) {
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
  }
  const partySize = clamp(allies.length, 1, 5)
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
      return { ...s, phase: 'end', outcome: out, awaitingActorId: null,
        log: [...s.log, '— — — — — — — — — —', '我方溃败。'].slice(-80) }
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
      let a = getActor(s, actorId)
      if (!a || a.hp <= 0) { s = { ...s, roundIndex: idx + 1 }; continue }
      const { state: s2, skipTurn, actRandomly } = processStatusTick(s, actorId, rng)
      s = s2
      a = getActor(s, actorId)
      if (!a || a.hp <= 0) { s = { ...s, roundIndex: idx + 1 }; continue }
      if (skipTurn) { s = advanceRoundPointer(s); continue }
      if (actRandomly) { s = executeConfusedTurn(s, a, rng); s = advanceRoundPointer(s); continue }
      return { ...s, awaitingActorId: a.id, roundIndex: idx }
    }
    s = executeFoeTurn({ ...s, roundIndex: idx }, actor, rng)
    s = advanceRoundPointer(s)
  }
  return { ...s, phase: 'end', outcome: 'defeat', log: [...s.log, '战斗异常中断。'] }
}

function executeFoeTurn(state, monster, rng) {
  let s = startOfTurnHooks(state, monster.id, rng)
  let m = getActor(s, monster.id)
  if (!m || m.hp <= 0) return s
  const { state: s2, skipTurn, actRandomly } = processStatusTick(s, monster.id, rng)
  s = s2
  m = getActor(s, monster.id)
  if (!m || m.hp <= 0) return s
  if (skipTurn) return s
  if (actRandomly) return executeConfusedTurn(s, m, rng)
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
  if (dmg > 0) {
    s = pushLog(s, `${m.name} 使用【${skill.name}】${mpNote} → ${tgt?.name ?? target.name} 受到 ${dmg} 点伤害。`)
  } else {
    s = pushLog(s, `${m.name} 对 ${tgt?.name ?? target.name} 施放【${skill.name}】${mpNote}。`)
  }
  if (skill.statusEffect) {
    const tgtNow = getActor(s, target.id)
    if (tgtNow && tgtNow.hp > 0) s = tryApplyStatus(s, m.id, target.id, skill, rng)
  }
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
export function submitUseConsumable(
  state,
  { actorId, targetId, itemId, restoreHp, restoreMp },
  rng = Math.random
) {
  if (state.phase === 'end') return { state, ok: false, hpDelta: 0, mpDelta: 0 }
  if (state.awaitingActorId !== actorId) return { state, ok: false, hpDelta: 0, mpDelta: 0 }
  const actor = getActor(state, actorId)
  const target = getActor(state, targetId)
  if (!actor || actor.side !== 'ally' || !target || target.side !== 'ally' || target.hp <= 0) {
    return { state, ok: false, hpDelta: 0, mpDelta: 0 }
  }
  if (!getConsumable(itemId)) return { state, ok: false, hpDelta: 0, mpDelta: 0 }

  const opts =
    restoreHp != null ? { restoreHp } : restoreMp != null ? { restoreMp } : /** @type {undefined} */ (undefined)
  const applied = applyConsumableToUnit(state, targetId, itemId, patchUnit, pushLog, opts)
  if (!applied.ok) return { state, ok: false, hpDelta: 0, mpDelta: 0 }
  let s = { ...applied.state, awaitingActorId: null }
  s = advanceRoundPointer(s)
  s = tickUntilInputOrEnd(s, rng)
  return { state: s, ok: true, hpDelta: applied.hpDelta, mpDelta: applied.mpDelta }
}

/**
 * 玩家回合：对一个或多个目标施放技能（含普通攻击）
 * targetIds 优先；targetId 为兼容旧调用的单目标回退。
 */
export function submitPlayerAction(state, { actorId, skillId, targetId, targetIds }, rng = Math.random) {
  if (state.phase === 'end') return state
  if (state.awaitingActorId !== actorId) return state
  const actor = getActor(state, actorId)
  if (!actor || actor.side !== 'ally') return state

  // 遗忘：无法使用消耗灵力的技能，强制普通攻击
  const hasForget = actor.statusEffects?.some(e => e.type === 'forget')
  const effectiveSkillId = hasForget && skillId !== 'normal_attack' ? 'normal_attack' : skillId
  const skill = getSkill(effectiveSkillId)

  if (!actor.skillPool.includes(skill.id)) return state
  if (actor.mp < skill.mpCost) return state

  // 解析目标列表：优先 targetIds，否则退回 targetId 单体
  const ids = targetIds?.length > 0 ? targetIds : targetId ? [targetId] : []
  const validTargets = ids.map((id) => getActor(state, id)).filter((t) => t && t.hp > 0)
  if (validTargets.length === 0) return state

  let s = spendMp(state, actor.id, skill.mpCost)
  const hits = []
  for (const tgt of validTargets) {
    const res = applyStrike(s, actor.id, tgt.id, skill.id, rng)
    s = res.state
    hits.push({ name: getActor(s, tgt.id)?.name ?? tgt.name, damage: res.damage, id: tgt.id })
  }

  const forceNote = hasForget && skillId !== 'normal_attack' ? '（遗忘·强制普攻）' : ''
  const mpNote = skill.mpCost > 0 ? `（耗 MP ${skill.mpCost}）` : ''
  const totalDmg = hits.reduce((a, h) => a + h.damage, 0)
  if (totalDmg > 0) {
    const hitDesc = hits.length === 1
      ? `${hits[0].name} 受到 ${hits[0].damage} 点伤害`
      : `${hits.map((h) => h.name).join('、')} 各受 ${hits.map((h) => h.damage).join('、')} 点伤害（合计 ${totalDmg}）`
    s = pushLog(s, `${actor.name}${forceNote} 使用【${skill.name}】${mpNote} → ${hitDesc}。`)
  } else {
    const targetNames = hits.map(h => h.name).join('、')
    s = pushLog(s, `${actor.name}${forceNote} 对 ${targetNames} 施放【${skill.name}】${mpNote}。`)
  }

  // 障碍技能：尝试对存活目标施加状态效果
  if (skill.statusEffect) {
    for (const hit of hits) {
      const tgtNow = getActor(s, hit.id)
      if (tgtNow && tgtNow.hp > 0) s = tryApplyStatus(s, actor.id, hit.id, skill, rng)
    }
  }

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
