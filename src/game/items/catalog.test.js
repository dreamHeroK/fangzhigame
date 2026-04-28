import { describe, expect, it } from 'vitest'
import { getConsumable, getRestoreAmount, rollRestoreAmount } from './catalog.js'

describe('catalog consumables', () => {
  it('第一味药为 min、第二味为 max（固定量）', () => {
    expect(getRestoreAmount(getConsumable('zhixuecao'))).toBe(100)
    expect(getRestoreAmount(getConsumable('yiyecao'))).toBe(200)
    expect(getRestoreAmount(getConsumable('baiguo'))).toBe(80)
    expect(getRestoreAmount(getConsumable('shedan'))).toBe(150)
    expect(getRestoreAmount(getConsumable('jinchuangyao'))).toBe(3000)
    expect(getRestoreAmount(getConsumable('fengwangmi'))).toBe(7000)
  })

  it('玲珑为满回（Infinity）', () => {
    expect(getRestoreAmount(getConsumable('xuelinglong'))).toBe(Number.POSITIVE_INFINITY)
  })

  it('rollRestoreAmount 与 getRestoreAmount 一致（兼容）', () => {
    expect(rollRestoreAmount(getConsumable('qiyelian'))).toBe(1000)
  })
})
