import { describe, expect, it } from 'vitest'
import {
  addLootStacks,
  consumeInventoryRow,
  createStarterInventory,
  getQty,
  parseInventoryRowKey,
  tryConsumeOne,
} from './inventory.js'

describe('inventory', () => {
  it('starter 含药与玲珑', () => {
    const inv = createStarterInventory()
    expect(getQty(inv, 'zhixuecao')).toBeGreaterThan(0)
    expect(getQty(inv, 'xuelinglong')).toBe(1)
    expect(Array.isArray(inv.xuelinglong)).toBe(true)
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

  it('玲珑不可叠：tryConsumeOne 不处理', () => {
    const inv = createStarterInventory()
    expect(tryConsumeOne(inv, 'xuelinglong')).toBeNull()
  })

  it('玲珑扣额度：部分使用后仍占一格', () => {
    const inv = createStarterInventory()
    const parsed = parseInventoryRowKey('xuelinglong#0')
    const next = consumeInventoryRow(inv, parsed, { hpRestored: 2000, mpRestored: 0 })
    expect(next).not.toBeNull()
    expect(getQty(next, 'xuelinglong')).toBe(1)
    expect(next.xuelinglong[0].remaining).toBe(20_000_000 - 2000)
  })

  it('玲珑额度归零则消失', () => {
    let inv = createStarterInventory()
    const p = parseInventoryRowKey('xuelinglong#0')
    inv = consumeInventoryRow(inv, p, { hpRestored: 20_000_000, mpRestored: 0 })
    expect(getQty(inv, 'xuelinglong')).toBe(0)
  })

  it('addLootStacks 玲珑按颗追加', () => {
    let inv = createStarterInventory()
    inv = addLootStacks(inv, [{ itemId: 'xuelinglong', qty: 2 }])
    expect(getQty(inv, 'xuelinglong')).toBe(3)
  })
})
