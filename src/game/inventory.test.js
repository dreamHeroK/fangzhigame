import { describe, expect, it } from 'vitest'
import { addLootStacks, createStarterInventory, getQty, tryConsumeOne } from './inventory.js'

describe('inventory', () => {
  it('starter 含药与玲珑', () => {
    const inv = createStarterInventory()
    expect(getQty(inv, 'zhixuecao')).toBeGreaterThan(0)
    expect(getQty(inv, 'xuelinglong')).toBe(1)
  })

  it('addLootStacks 合并数量', () => {
    let inv = createStarterInventory()
    inv = addLootStacks(inv, [{ itemId: 'zhixuecao', qty: 2 }])
    expect(getQty(inv, 'zhixuecao')).toBe(5)
  })

  it('tryConsumeOne 扣减', () => {
    const inv = createStarterInventory()
    const next = tryConsumeOne(inv, 'baiguo')
    expect(next).not.toBeNull()
    expect(getQty(next, 'baiguo')).toBe(2)
  })
})
