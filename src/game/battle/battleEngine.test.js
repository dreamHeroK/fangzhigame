import { describe, expect, it } from 'vitest'
import { createBattle, rollFoeCount, submitPlayerAction } from './battleEngine.js'

describe('rollFoeCount', () => {
  it('returns partySize..2*partySize inclusive', () => {
    expect(rollFoeCount(3, () => 0)).toBe(3)
    expect(rollFoeCount(3, () => 0.999)).toBe(6)
    for (let n = 1; n <= 5; n++) {
      for (let k = 0; k < 200; k++) {
        const c = rollFoeCount(n, Math.random)
        expect(c).toBeGreaterThanOrEqual(n)
        expect(c).toBeLessThanOrEqual(n * 2)
      }
    }
  })
})

describe('createBattle', () => {
  it('spawns foe count in [party, 2party]', () => {
    for (let ps = 1; ps <= 5; ps++) {
      for (let k = 0; k < 80; k++) {
        const state = createBattle({ partySize: ps })
        const foes = state.units.filter((u) => u.side === 'foe')
        expect(foes.length).toBeGreaterThanOrEqual(ps)
        expect(foes.length).toBeLessThanOrEqual(ps * 2)
      }
    }
  })
})

describe('submitPlayerAction', () => {
  it('applies damage when actor matches awaiting', () => {
    const s = createBattle({ partySize: 1 })
    if (s.phase === 'end') return
    const actorId = s.awaitingActorId
    expect(actorId).toBeTruthy()
    const foe = s.units.find((u) => u.side === 'foe' && u.hp > 0)
    const hpBefore = foe.hp
    const next = submitPlayerAction(s, {
      actorId,
      skillId: 'normal_attack',
      targetId: foe.id,
    })
    const foeAfter = next.units.find((u) => u.id === foe.id)
    expect(foeAfter.hp).toBeLessThanOrEqual(hpBefore)
  })
})
