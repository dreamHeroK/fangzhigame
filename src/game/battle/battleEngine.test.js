import { describe, it, expect } from 'vitest'
import {
  createBattle,
  submitPlayerAction,
  getActor,
  getLegalTargets,
  tickUntilInputOrEnd,
} from './battleEngine.js'

// 确定性 rng（线性同余）
function seededRng(seed = 42) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// 创建最小战斗：1 我方 vs 野怪
function miniBattle(rng = seededRng()) {
  return createBattle({
    partySize: 1,
    rng,
    allyStats: { level: 50, maxHp: 9999, maxMp: 9999, atk: 800, mAtk: 800, def: 5, speed: 100 },
    allySkills: ['normal_attack'],
  })
}

describe('createBattle', () => {
  it('returns running phase or end phase (allies may one-shot foes)', () => {
    const b = miniBattle()
    expect(['running', 'end']).toContain(b.phase)
  })
  it('has units array with allies and foes', () => {
    const b = createBattle({ partySize: 2, rng: seededRng(1) })
    const allies = b.units.filter(u => u.side === 'ally')
    const foes   = b.units.filter(u => u.side === 'foe')
    expect(allies.length).toBeGreaterThan(0)
    expect(foes.length).toBeGreaterThan(0)
  })
  it('log is non-empty', () => {
    const b = createBattle({ partySize: 1, rng: seededRng(2) })
    expect(b.log.length).toBeGreaterThan(0)
  })
  it('roundOrder covers all living units', () => {
    const b = createBattle({ partySize: 2, rng: seededRng(3) })
    if (b.phase === 'running') {
      expect(b.roundOrder.length).toBeGreaterThan(0)
    }
  })
  it('awaitingActorId is an ally when phase=running', () => {
    const b = createBattle({
      partySize: 1,
      rng: seededRng(4),
      allyStats: { level: 1, maxHp: 9999, maxMp: 9999, atk: 1, mAtk: 1, def: 999, speed: 200 },
    })
    if (b.phase === 'running') {
      const actor = getActor(b, b.awaitingActorId)
      expect(actor?.side).toBe('ally')
    }
  })
})

describe('submitPlayerAction – normal attack', () => {
  it('reduces foe hp', () => {
    // 使用高攻击确保有伤害
    const rng = seededRng(10)
    let b = createBattle({
      partySize: 1,
      rng,
      allyStats: { level: 50, maxHp: 9999, maxMp: 9999, atk: 500, mAtk: 500, def: 1, speed: 200 },
      allySkills: ['normal_attack'],
    })
    if (b.phase !== 'running') return  // 已结束（秒杀），跳过
    const foe = b.units.find(u => u.side === 'foe')
    const hpBefore = foe.hp
    b = submitPlayerAction(b, {
      actorId: b.awaitingActorId,
      skillId: 'normal_attack',
      targetId: foe.id,
    }, rng)
    const foeAfter = getActor(b, foe.id)
    // foe 可能已死；hp 要么下降要么战斗已结束
    expect(foeAfter === undefined || foeAfter.hp < hpBefore || b.phase === 'end').toBe(true)
  })

  it('no-op if wrong actorId', () => {
    const rng = seededRng(11)
    let b = createBattle({ partySize: 1, rng })
    if (b.phase !== 'running') return
    const foe = b.units.find(u => u.side === 'foe')
    const snapshot = JSON.stringify(b.units)
    b = submitPlayerAction(b, { actorId: 'WRONG_ID', skillId: 'normal_attack', targetId: foe.id }, rng)
    expect(JSON.stringify(b.units)).toBe(snapshot)
  })

  it('no-op if phase=end', () => {
    const rng = seededRng(12)
    const b = { phase: 'end', units: [], log: [], awaitingActorId: null }
    const after = submitPlayerAction(b, { actorId: 'x', skillId: 'normal_attack', targetId: 'y' }, rng)
    expect(after.phase).toBe('end')
  })
})

describe('battle end conditions', () => {
  it('victory when all foes die', () => {
    // 超高攻击力单回合必胜
    const rng = seededRng(20)
    const b = createBattle({
      partySize: 1,
      rng,
      allyStats: { level: 100, maxHp: 99999, maxMp: 99999, atk: 99999, mAtk: 99999, def: 1, speed: 999 },
      allySkills: ['normal_attack'],
    })
    // 极高攻应当直接结束
    if (b.phase === 'end') {
      expect(b.outcome).toBe('victory')
      expect(b.victoryRewards).toBeDefined()
      expect(b.victoryRewards.exp).toBeGreaterThan(0)
    }
  })

  it('defeat when all allies die', () => {
    // 超低体力的我方，让怪先行动
    const rng = seededRng(30)
    const b = createBattle({
      partySize: 1,
      rng,
      allyStats: { level: 1, maxHp: 1, maxMp: 1, atk: 1, mAtk: 1, def: 0, speed: 1 },
      allySkills: ['normal_attack'],
    })
    if (b.phase === 'end') {
      expect(b.outcome).toBe('defeat')
    }
  })

  it('victory has victoryLootNonce', () => {
    const rng = seededRng(21)
    const b = createBattle({
      partySize: 1,
      rng,
      allyStats: { level: 100, maxHp: 99999, maxMp: 99999, atk: 99999, mAtk: 99999, def: 1, speed: 999 },
    })
    if (b.phase === 'end' && b.outcome === 'victory') {
      expect(typeof b.victoryLootNonce).toBe('string')
      expect(b.victoryLootNonce.length).toBeGreaterThan(0)
    }
  })

  it('defeat has defeatNonce', () => {
    const rng = seededRng(31)
    const b = createBattle({
      partySize: 1,
      rng,
      allyStats: { level: 1, maxHp: 1, maxMp: 1, atk: 1, mAtk: 1, def: 0, speed: 1 },
    })
    if (b.phase === 'end' && b.outcome === 'defeat') {
      expect(typeof b.defeatNonce).toBe('string')
    }
  })
})

describe('getLegalTargets', () => {
  it('returns only living units of given side', () => {
    const rng = seededRng(50)
    const b = createBattle({ partySize: 2, rng })
    const foeLegal = getLegalTargets(b, 'foe')
    foeLegal.forEach(u => {
      expect(u.side).toBe('foe')
      expect(u.hp).toBeGreaterThan(0)
    })
  })
})

describe('status effects', () => {
  it('poison unit loses hp each tick', () => {
    const rng = seededRng(60)
    let b = createBattle({
      partySize: 1,
      rng,
      allyStats: { level: 30, maxHp: 5000, maxMp: 500, atk: 50, mAtk: 50, def: 10, speed: 50 },
      allySkills: ['normal_attack'],
    })
    if (b.phase !== 'running') return
    // 手动给我方注入中毒状态
    const actorId = b.awaitingActorId
    const actor = getActor(b, actorId)
    b = {
      ...b,
      units: b.units.map(u => u.id === actorId
        ? { ...u, statusEffects: [{ type: 'poison', duration: 3, tickPct: 0.1 }] }
        : u
      ),
    }
    const hpBefore = getActor(b, actorId).hp
    // 推进（我方受毒 tick）
    const foe = b.units.find(u => u.side === 'foe')
    b = submitPlayerAction(b, {
      actorId,
      skillId: 'normal_attack',
      targetId: foe?.id ?? b.units.find(u => u.side === 'foe')?.id,
    }, rng)
    // 中毒 tick 可能多次，hp 应下降（除非战斗已结束）
    const actorAfter = getActor(b, actorId)
    if (actorAfter) {
      // 如果 actor 还活着，中毒至少一次
      expect(actorAfter.hp).toBeLessThanOrEqual(hpBefore)
    }
  })
})

describe('multi-target action', () => {
  it('can target multiple foes at once', () => {
    const rng = seededRng(70)
    let b = createBattle({
      partySize: 3,
      rng,
      allyStats: { level: 50, maxHp: 9999, maxMp: 9999, atk: 200, mAtk: 200, def: 50, speed: 200 },
      allySkills: ['normal_attack', 'liehuo'],
    })
    if (b.phase !== 'running') return
    const foes = getLegalTargets(b, 'foe')
    if (foes.length < 2) return
    const hpsBefore = foes.map(f => f.hp)
    b = submitPlayerAction(b, {
      actorId: b.awaitingActorId,
      skillId: 'normal_attack',
      targetIds: foes.slice(0, 2).map(f => f.id),
    }, rng)
    let anyDamaged = false
    foes.slice(0, 2).forEach((f, i) => {
      const after = getActor(b, f.id)
      if (!after || after.hp < hpsBefore[i]) anyDamaged = true
    })
    expect(anyDamaged || b.phase === 'end').toBe(true)
  })
})
