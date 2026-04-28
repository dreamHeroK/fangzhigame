import { getSkill } from './skills.js'
import { innateName } from './monsterProfiles.js'

function unitById(state, id) {
  return state.units.find((u) => u.id === id)
}

/** 天生技能带来的临时攻防、速度：每回合开始时衰减 */
export function decayInnateTempBuffs(state, actorId, patchUnit) {
  const u = unitById(state, actorId)
  if (!u) return state
  const patch = {}
  if (u.innateTempDefTurns != null) {
    const t = u.innateTempDefTurns - 1
    if (t > 0) {
      patch.innateTempDefTurns = t
    } else {
      patch.innateTempDefTurns = undefined
      patch.innateTempDefBonus = undefined
    }
  }
  if (u.innateTempAtkTurns != null) {
    const t = u.innateTempAtkTurns - 1
    if (t > 0) {
      patch.innateTempAtkTurns = t
    } else {
      patch.innateTempAtkTurns = undefined
      patch.innateTempAtkMul = undefined
    }
  }
  if (u.innateTempSpeedTurns != null) {
    const t = u.innateTempSpeedTurns - 1
    if (t > 0) {
      patch.innateTempSpeedTurns = t
    } else {
      patch.innateTempSpeedTurns = undefined
      patch.innateTempSpeedMul = undefined
    }
  }
  if (Object.keys(patch).length === 0) return state
  return patchUnit(state, actorId, patch)
}

/** 五行相克：攻方元素克守方相性 → 增伤；守方相性克攻方元素 → 减伤 */
const BEATS = { 金: '木', 木: '土', 土: '水', 水: '火', 火: '金' }

export function elementDamageFactor(attackElement, defenderAffinity) {
  if (!attackElement || !defenderAffinity) return 1
  if (attackElement === defenderAffinity) return 0.9
  if (BEATS[attackElement] === defenderAffinity) return 1.18
  if (BEATS[defenderAffinity] === attackElement) return 0.88
  return 1
}

/**
 * 受击结算：神龙罩/乾坤罩/如意圈/翻转乾坤/鞭长莫及/神圣之光
 * @returns {{ damage: number, logs: string[] }}
 */
export function resolveIncomingInnate(defender, skillId, rawDamage, rng = Math.random) {
  if (defender.side === 'foe') return { damage: rawDamage, logs: [] }
  const sk = getSkill(skillId)
  const isMagic = sk.kind === 'magic'
  const isPhysical = sk.kind === 'physical'
  let d = rawDamage
  const logs = []
  const ids = defender.innateSkillIds ?? []

  if (ids.includes('bianchangmoji') && isPhysical && rng() < 0.85) {
    d *= 0.92
    if (rng() < 0.25) logs.push(`${defender.name}【鞭长莫及】略卸物理劲道。`)
  }

  if (ids.includes('shenlongzhao') && isMagic && rng() < 0.22) {
    const before = d
    d = Math.max(1, Math.floor(d * 0.48))
    logs.push(`${defender.name}【神龙罩】挡下大量法术伤害（${before}→${d}）。`)
  }

  if (ids.includes('qiankunzhao') && isPhysical && rng() < 0.2) {
    const before = d
    d = Math.max(1, Math.floor(d * 0.52))
    logs.push(`${defender.name}【乾坤罩】化解部分物理伤害（${before}→${d}）。`)
  }

  if (ids.includes('ruyiquan') && rng() < 0.14) {
    const before = d
    d = Math.max(1, Math.floor(d * 0.66))
    logs.push(`${defender.name}【如意圈】卸去一段伤害（${before}→${d}）。`)
  }

  if (ids.includes('fanzhuanqiankun') && rng() < 0.12) {
    const before = d
    d = Math.max(1, Math.floor(d * 0.55))
    logs.push(`${defender.name}【翻转乾坤】扭转气机，伤害大减（${before}→${d}）。`)
  }

  if (ids.includes('shenshengzenguang') && rng() < 0.14) {
    const before = d
    d = Math.max(1, Math.floor(d * 0.88))
    logs.push(`${defender.name}【神圣之光】灵光护体（${before}→${d}）。`)
  }

  return { damage: Math.max(1, Math.floor(d)), logs }
}

/** 漫天血舞：造成伤害后吸血 */
export function mantleBloodHeal(attacker, dealt, rng = Math.random) {
  if (attacker.side === 'foe') return { heal: 0, log: null }
  const ids = attacker.innateSkillIds ?? []
  if (!ids.includes('mantianxuewu')) return { heal: 0, log: null }
  if (rng() > 0.38) return { heal: 0, log: null }
  const heal = Math.max(1, Math.floor(dealt * 0.18))
  return { heal, log: `${attacker.name}【漫天血舞】汲取 ${heal} 点生命。` }
}

/** 舍命一击：低血增伤（出手方） */
export function shemingDamageMul(attacker, rng) {
  rng = rng ?? Math.random
  if (attacker.side === 'foe') return 1
  const ids = attacker.innateSkillIds ?? []
  if (!ids.includes('shemingyiji')) return 1
  const ratio = attacker.hp / Math.max(1, attacker.maxHp)
  if (ratio > 0.38) return 1
  if (rng() < 0.65) return 1.16
  return 1.22
}

/** 死亡缠绵：受击概率上 DOT */
export function maybeApplyDeathChant(state, attacker, defender, dealt, patchUnit, rng = Math.random) {
  if (defender.side === 'foe') return state
  const ids = defender.innateSkillIds ?? []
  if (!ids.includes('siwangchanmian')) return state
  if (defender.hp <= 0) return state
  if (rng() > 0.2) return state
  const dotDmg = Math.max(2, Math.floor(dealt * 0.14))
  const dotTurns = 2
  return patchUnit(state, defender.id, { dotDmg, dotTurns })
}

/** 回合开始时：临时天生 buff 衰减 + DOT + 拔苗助长被动 */
export function onActorTurnStart(state, actor, patchUnit, pushLog, rng = Math.random) {
  let s = decayInnateTempBuffs(state, actor.id, patchUnit)
  const actorNow = unitById(s, actor.id)
  if (!actorNow || actorNow.hp <= 0) return s

  if (actorNow.dotTurns && actorNow.dotDmg) {
    const dmg = actorNow.dotDmg
    const hp = Math.max(0, actorNow.hp - dmg)
    const turns = actorNow.dotTurns - 1
    s = patchUnit(s, actor.id, {
      hp,
      dotTurns: turns > 0 ? turns : undefined,
      dotDmg: turns > 0 ? actorNow.dotDmg : undefined,
    })
    s = pushLog(s, `${actorNow.name} 受【死亡缠绵】折磨，失去 ${dmg} 点生命。`)
  }

  const cur = unitById(s, actor.id)
  const ids = cur?.innateSkillIds ?? []
  if (cur && cur.side === 'ally' && cur.hp > 0 && ids.includes('bamiaozhuzhang') && rng() < 0.55) {
    const heal = Math.max(1, Math.floor(cur.maxHp * 0.035))
    const hp = Math.min(cur.maxHp, cur.hp + heal)
    s = patchUnit(s, actor.id, { hp })
    s = pushLog(s, `${cur.name}【拔苗助长】回复 ${heal} 点生命。`)
  }

  return s
}

export function formatInnateList(ids) {
  if (!ids?.length) return '无'
  return ids.map((id) => `【${innateName(id)}】`).join('')
}
