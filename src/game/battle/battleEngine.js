import { expRequiredToNextLevel, petExpRequiredToNextLevel } from '../characterLevelConfig.js'
import { daoRewardMultiplier, daoStatusHitBonus, daoStatusResistBonus } from './daoStandard.js'
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
import { formatLootLine, mergeLootStacks, rollBattleDrops, rollBattleEquipDrops, rollDropsForFoe } from '../items/drops.js'
import { getEquipByCode } from '../items/equipCatalog.js'
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
 * 道行：每只怪约 L×0.04 天；潜能：每只怪约 L×0.15 点。
 */
function calcVictoryRewards(foes, rng) {
  let exp    = 0
  let petExp = 0
  let gold   = 0
  let daoDays   = 0
  let potential = 0
  for (const f of foes) {
    const L = Math.max(1, f.level)
    const bm = f.isFieldBoss ? 3 : 1
    exp    += Math.max(10, Math.floor(expRequiredToNextLevel(L) * 0.002 * bm))
    petExp += Math.max(5,  Math.floor(petExpRequiredToNextLevel(L) * 0.002 * bm))
    gold   += Math.floor(L * (2 + rng() * 3) * bm)
    daoDays   += Math.max(1, Math.round(L * 0.04 * bm))
    potential += Math.max(2, Math.round(L * 0.15 * bm))
  }
  return { exp, petExp, gold, daoDays, potential }
}

/** @param {Array<{ itemId: string, qty: number }>} [extraLoot] 例如捕捉最后一只时补上已从场上移除的怪 */
function finalizeVictory(s, rng, extraLoot = []) {
  const foes = s.units.filter((u) => u.side === 'foe')
  const fromField = rollBattleDrops(foes, rng)
  const lastVictoryLoot = mergeLootStacks([...fromField, ...extraLoot])
  const lastEquipDrops = rollBattleEquipDrops(foes, rng)
  let { exp, petExp, gold, daoDays, potential } = calcVictoryRewards(foes, rng)

  // 刷道战斗：不发经验，道行按当前道行年数计算
  if (s.isShuadao) {
    const daoYears = Math.max(1, s.charDaoYears ?? 1)
    exp    = 0
    petExp = 0
    daoDays = foes.reduce((sum, f) => {
      const bm = f.key === 'shuadao_boss' ? 3 : 1
      return sum + Math.max(1, Math.round(daoYears * 0.15 * bm))
    }, 0)
  }

  // 道行奖励衰减：玩家道行超出本级标准后递减
  const playerUnit = s.units.find(u => u.side === 'ally' && u.kind !== 'pet')
  const daoMul = daoRewardMultiplier(playerUnit?.daoExcessRatio ?? 0)
  if (daoMul < 1) {
    daoDays = Math.max(1, Math.round(daoDays * daoMul))
  }

  const lastVictoryLootNamed = lastVictoryLoot.map(l => ({
    ...l, name: getConsumable(l.itemId)?.name ?? l.itemId,
  }))
  const lootMsg = formatLootLine(lastVictoryLoot)
  const equipMsg = lastEquipDrops.length
    ? `装备：${lastEquipDrops.map(e => { const it = getEquipByCode(e.baseCode); return `${it?.item_name ?? '?'}(Lv${it?.item_level ?? '?'})` }).join('、')}`
    : ''
  const rewardLines = [
    '— — — — — — — — — —',
    '战斗胜利。',
    ...(s.isShuadao
      ? [`银两 +${gold.toLocaleString()}　道行 +${daoDays}天　潜能 +${potential}`]
      : [
          `人物经验 +${exp.toLocaleString()}　宠物经验 +${petExp.toLocaleString()}`,
          `银两 +${gold.toLocaleString()}　道行 +${daoDays}天　潜能 +${potential}`,
        ]
    ),
    lootMsg,
    ...(equipMsg ? [equipMsg] : []),
  ]
  return {
    ...s,
    phase: 'end',
    outcome: 'victory',
    awaitingActorId: null,
    lastVictoryLoot: lastVictoryLootNamed,
    lastEquipDrops,
    victoryRewards: { exp, petExp, gold, daoDays, potential },
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
  // 破甲：降低目标有效防御（上限 30%）
  const pierceMul = attacker.side === 'ally' && (attacker.piercingPct ?? 0) > 0
    ? 1 - Math.min(0.30, attacker.piercingPct / 100)
    : 1
  const def = Math.max(1, defender.def * (defender.passiveDefMul ?? 1) * defTemp * pierceMul)
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
  let rate = tier >= 4
    ? 0.88
    : Math.max(0.12, Math.min(0.92, 0.55 + skillLevel * 0.0025 - levelDiff * 0.025))

  // 道行加成：施法方道行超标 → 命中率提升；受击方道行超标 → 命中率降低
  if (caster?.side === 'ally') {
    rate = Math.min(0.96, rate + daoStatusHitBonus(caster.daoExcessRatio ?? 0))
  }
  if (target?.side === 'ally') {
    rate *= (1 - daoStatusResistBonus(target.daoExcessRatio ?? 0))
  }

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

// ── 规划→执行 战斗系统 ────────────────────────────────────────────────────

function makeDefeat(state) {
  return {
    ...state,
    phase: 'end',
    outcome: 'defeat',
    awaitingActorId: null,
    defeatNonce: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    log: [...state.log, '— — — — — — — — — —', '我方溃败。'].slice(-80),
  }
}

/** 进入规划阶段：让玩家依次为所有存活己方单位选择行动 */
function startPlanningPhase(state) {
  const outcome = battleOutcome(state)
  if (outcome === 'victory') return finalizeVictory(state, Math.random)
  if (outcome === 'defeat')  return makeDefeat(state)

  const planningQueue = state.units
    .filter(u => u.side === 'ally' && u.hp > 0)
    .map(u => u.id)
  const roundOrder = sortBySpeed(state.units).map(u => u.id)
  return {
    ...state,
    phase: 'planning',
    awaitingActorId: planningQueue[0] ?? null,
    planningQueue,
    pendingAllyActions: {},
    roundOrder,
    roundIndex: 0,
  }
}

/** 存入一个己方行动计划，若全员已规划则进入逐步执行阶段 */
function advancePlanning(state, submittedId, plan, rng) {
  const pending = { ...(state.pendingAllyActions ?? {}), [submittedId]: plan }
  const remaining = (state.planningQueue ?? []).filter(id => !pending[id])
  if (remaining.length > 0) {
    return { ...state, pendingAllyActions: pending, awaitingActorId: remaining[0] }
  }
  return startExecutionPhase({ ...state, pendingAllyActions: pending }, rng)
}

/** 进入执行阶段：按速度生成队列，等待 React 侧逐步推进 */
function startExecutionPhase(state, rng) {
  const outcome = battleOutcome(state)
  if (outcome === 'victory') return finalizeVictory(state, rng)
  if (outcome === 'defeat')  return makeDefeat(state)
  const executionQueue = sortBySpeed(state.units).map(u => u.id)
  return {
    ...state,
    phase: 'executing',
    awaitingActorId: null,
    executionQueue,
    executionIndex: 0,
  }
}

/** 执行单个己方单位的技能攻击（含遗忘/MP不足降级为普攻、目标死亡自动改判） */
function executeAllySkill(state, actor, skill, targetIds, rng) {
  const hasForget = actor.statusEffects?.some(e => e.type === 'forget')
  let effectiveSkill = (hasForget && skill.id !== 'normal_attack') ? getSkill('normal_attack') : skill
  if (actor.mp < effectiveSkill.mpCost) effectiveSkill = getSkill('normal_attack')

  let s = spendMp(state, actor.id, effectiveSkill.mpCost)

  let validTargets = (targetIds ?? [])
    .map(id => getActor(s, id))
    .filter(t => t && t.hp > 0)
  if (validTargets.length === 0) {
    const firstFoe = living(s, 'foe')[0]
    if (!firstFoe) return s
    validTargets = [firstFoe]
  }

  const hits = []
  for (const tgt of validTargets) {
    const res = applyStrike(s, actor.id, tgt.id, effectiveSkill.id, rng)
    s = res.state
    hits.push({ name: getActor(s, tgt.id)?.name ?? tgt.name, damage: res.damage, id: tgt.id })
  }

  const forceNote = hasForget && skill.id !== 'normal_attack' ? '（遗忘·强制普攻）' : ''
  const mpNote    = effectiveSkill.mpCost > 0 ? `（耗 MP ${effectiveSkill.mpCost}）` : ''
  const totalDmg  = hits.reduce((a, h) => a + h.damage, 0)
  if (totalDmg > 0) {
    const hitDesc = hits.length === 1
      ? `${hits[0].name} 受到 ${hits[0].damage} 点伤害`
      : `${hits.map(h => h.name).join('、')} 各受 ${hits.map(h => h.damage).join('、')} 点伤害（合计 ${totalDmg}）`
    s = pushLog(s, `${actor.name}${forceNote} 使用【${effectiveSkill.name}】${mpNote} → ${hitDesc}。`)
  } else {
    s = pushLog(s, `${actor.name}${forceNote} 对 ${hits.map(h => h.name).join('、')} 施放【${effectiveSkill.name}】${mpNote}。`)
  }
  if (effectiveSkill.statusEffect) {
    for (const hit of hits) {
      const tgtNow = getActor(s, hit.id)
      if (tgtNow && tgtNow.hp > 0) s = tryApplyStatus(s, actor.id, hit.id, effectiveSkill, rng)
    }
  }
  return s
}

/** 回合执行：所有单位按速度排序依次行动，己方使用预规划动作，敌方 AI 自动选择 */
function executeRound(state, rng) {
  const executionOrder = sortBySpeed(state.units)
  let s = { ...state, awaitingActorId: null }

  for (const unitSnap of executionOrder) {
    const preOut = battleOutcome(s)
    if (preOut === 'victory') return finalizeVictory(s, rng)
    if (preOut === 'defeat')  return makeDefeat(s)

    const u = getActor(s, unitSnap.id)
    if (!u || u.hp <= 0) continue

    if (u.side === 'ally') {
      s = startOfTurnHooks(s, u.id, rng)
      const uA = getActor(s, u.id)
      if (!uA || uA.hp <= 0) continue
      const { state: s2, skipTurn, actRandomly } = processStatusTick(s, u.id, rng)
      s = s2
      const uA2 = getActor(s, u.id)
      if (!uA2 || uA2.hp <= 0) continue
      if (skipTurn) continue
      if (actRandomly) { s = executeConfusedTurn(s, uA2, rng); continue }

      const plan = state.pendingAllyActions?.[u.id]
      if (!plan || plan.kind === 'noop') continue
      const skill = getSkill(plan.skillId, uA2.skillLevels?.[plan.skillId] ?? 0)
      s = executeAllySkill(s, uA2, skill, plan.targetIds, rng)
    } else {
      const u2 = getActor(s, unitSnap.id)
      if (!u2 || u2.hp <= 0) continue
      s = executeFoeTurn(s, u2, rng)
    }
  }

  const out = battleOutcome(s)
  if (out === 'victory') return finalizeVictory(s, rng)
  if (out === 'defeat')  return makeDefeat(s)
  return startPlanningPhase({ ...s, roundNum: (state.roundNum ?? 1) + 1 })
}

/**
 * 推进执行队列中的下一个单位行动（由 React 侧定时调用）。
 * - 已阵亡单位：直接跳过，不暂停
 * - noop 计划（道具/捕捉）：跳过，不暂停
 * - 状态导致跳过回合 / 混乱 / 正常行动：执行后返回，由调用方决定何时调下一步
 * - 队列耗尽：自动进入下一回合规划阶段
 */
export function executeNextStep(state, rng = Math.random) {
  if (state.phase !== 'executing') return state
  const queue = state.executionQueue ?? []
  let s = state
  let idx = state.executionIndex ?? 0

  while (idx < queue.length) {
    const preOut = battleOutcome(s)
    if (preOut === 'victory') return finalizeVictory(s, rng)
    if (preOut === 'defeat')  return makeDefeat(s)

    const unitId = queue[idx]
    const u = getActor(s, unitId)
    if (!u || u.hp <= 0) { idx++; continue }  // 已阵亡，跳过

    if (u.side === 'ally') {
      s = startOfTurnHooks(s, u.id, rng)
      const uA = getActor(s, u.id)
      if (!uA || uA.hp <= 0) { idx++; continue }
      const { state: s2, skipTurn, actRandomly } = processStatusTick(s, u.id, rng)
      s = s2
      const uA2 = getActor(s, u.id)
      if (!uA2 || uA2.hp <= 0) { idx++; continue }
      if (skipTurn)   { idx++; break }  // 显示状态消息后停顿
      if (actRandomly){ s = executeConfusedTurn(s, uA2, rng); idx++; break }
      const plan = state.pendingAllyActions?.[u.id]
      if (!plan || plan.kind === 'noop') { idx++; continue }  // 道具/捕捉已在规划阶段处理
      const skill = getSkill(plan.skillId, uA2.skillLevels?.[plan.skillId] ?? 0)
      s = executeAllySkill(s, uA2, skill, plan.targetIds, rng)
      idx++; break
    } else {
      s = executeFoeTurn(s, u, rng)
      idx++; break
    }
  }

  const postOut = battleOutcome(s)
  if (postOut === 'victory') return finalizeVictory(s, rng)
  if (postOut === 'defeat')  return makeDefeat(s)
  if (idx >= queue.length) {
    return startPlanningPhase({ ...s, roundNum: (state.roundNum ?? 1) + 1 })
  }
  return { ...s, executionIndex: idx }
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
      : opts.customFoes?.length > 0
        ? opts.customFoes
        : buildEncounter(partySize, { rng, scale: opts.foeScale ?? 1, mapId })
  const isBossFight    = bossFoes.length > 0
  const isCustomFight  = !isBossFight && opts.customFoes?.length > 0
  const fieldBossUnit = foes.find(f => f.isFieldBoss)
  const babyUnit      = foes.find(f => f.isBabyMonster)
  const specialNote   = fieldBossUnit ? `　★首领「${fieldBossUnit.name}」出没！` : babyUnit ? `　☆发现宝宝「${babyUnit.name}」！` : ''
  const open = opts.customOpeningMsg
    ? opts.customOpeningMsg
    : isBossFight
      ? `【${foes[0].worldBossMapName ?? foes[0].mapName ?? '世界BOSS'}】挑战「${foes[0].name}」Lv${foes[0].level}：我方 ${partySize} 人（首领战固定 1 只）。`
      : wantsBoss
        ? `【${map.name}】世界 BOSS 键无效，已回退为野怪。我方 ${partySize} 人，敌方 ${foes.length} 只（[${partySize}×, ${partySize}×2]）。`
        : `【${map.name}】遭遇战：我方 ${partySize} 人，敌方 ${foes.length} 只。${specialNote}`
  const units = [...allies, ...foes]
  let state = {
    units,
    log: [open],
    phase: 'planning',
    awaitingActorId: null,
    roundOrder: [],
    roundIndex: 0,
    roundNum: 1,
    pendingAllyActions: {},
    planningQueue: [],
    isShuadao:    isCustomFight,
    charDaoYears: opts.charDaoYears ?? 1,
    mapId:        mapId,
  }
  state = startPlanningPhase(state)
  return state
}

export function tickUntilInputOrEnd(state, rng = Math.random) {
  let s = state
  for (let guard = 0; guard < 400; guard++) {
    const out = battleOutcome(s)
    if (out) {
      if (out === 'victory') return finalizeVictory(s, rng)
      return { ...s, phase: 'end', outcome: out, awaitingActorId: null,
        defeatNonce: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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
  // 道具立即生效，该单位本回合行动视为 noop
  const s = advancePlanning(applied.state, actorId, { kind: 'noop' }, rng)
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

  const skill = getSkill(skillId)
  if (!actor.skillPool.includes(skill.id)) return state
  if (actor.mp < skill.mpCost) return state

  const ids = targetIds?.length > 0 ? targetIds : targetId ? [targetId] : []
  if (ids.length === 0) return state

  // 存储该单位的规划动作；若全员已规划则触发回合执行
  return advancePlanning(state, actorId, { skillId, targetIds: ids }, rng)
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
    s = advancePlanning(s, actorId, { kind: 'noop' }, rng)
    return { state: s, pet: null }
  }

  const p = computeCaptureProbability(foe)
  if (rng() < p) {
    const pet = createWildPetFromFoe(foe, rng)
    const newUnits = state.units.filter((u) => u.id !== foe.id)
    let s = pushLog({ ...state, units: newUnits },
      `${actor.name} 捕捉成功！获得「${pet.displayName}」。当次成功率 ${(p * 100).toFixed(0)}%。`)
    if (living(s, 'foe').length === 0) {
      const captureLoot = rollDropsForFoe(foe, rng)
      s = finalizeVictory(s, rng, captureLoot)
      return { state: s, pet }
    }
    s = advancePlanning(s, actorId, { kind: 'noop' }, rng)
    return { state: s, pet }
  }

  let s = pushLog(state, `${actor.name} 捕捉失败。当次成功率 ${(p * 100).toFixed(0)}%。`)
  s = advancePlanning(s, actorId, { kind: 'noop' }, rng)
  return { state: s, pet: null }
}

export { rollFoeCount } from './monsters.js'
