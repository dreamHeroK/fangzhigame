import { getConsumable, getRestoreAmount, isQuotaOrb } from '../items/catalog.js'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * 战斗内对单位使用消耗品（不扣背包，由外层扣）
 * @param {object | undefined} opts 玲珑必须传本次精确回复量；普通药不传。
 * @returns {{ state: object, ok: boolean, message?: string, hpDelta: number, mpDelta: number }}
 */
export function applyConsumableToUnit(state, targetId, itemId, patchUnit, pushLog, opts) {
  const target = state.units.find((u) => u.id === targetId)
  const def = getConsumable(itemId)
  if (!target || target.side !== 'ally' || target.hp <= 0 || !def) {
    return { state, ok: false, hpDelta: 0, mpDelta: 0 }
  }

  const hp0 = target.hp
  const mp0 = target.mp
  let hp = hp0
  let mp = mp0
  let msg = ''

  if (isQuotaOrb(def)) {
    if (def.kind === 'hp') {
      const add = opts && typeof opts.restoreHp === 'number' ? Math.max(0, Math.floor(opts.restoreHp)) : -1
      if (add <= 0) return { state, ok: false, hpDelta: 0, mpDelta: 0 }
      hp = clamp(hp0 + add, 0, target.maxHp)
      const got = hp - hp0
      msg = `${target.name} 使用【${def.name}】，恢复 ${got} 点气血（扣除玲珑额度 ${got}）。`
    } else {
      const add = opts && typeof opts.restoreMp === 'number' ? Math.max(0, Math.floor(opts.restoreMp)) : -1
      if (add <= 0) return { state, ok: false, hpDelta: 0, mpDelta: 0 }
      mp = clamp(mp0 + add, 0, target.maxMp)
      const got = mp - mp0
      msg = `${target.name} 使用【${def.name}】，恢复 ${got} 点法力（扣除玲珑额度 ${got}）。`
    }
  } else if (def.kind === 'hp') {
    const amt = getRestoreAmount(def)
    hp = clamp(hp0 + amt, 0, target.maxHp)
    msg = `${target.name} 使用【${def.name}】，恢复 ${hp - hp0} 点气血。`
  } else {
    const amt = getRestoreAmount(def)
    mp = clamp(mp0 + amt, 0, target.maxMp)
    msg = `${target.name} 使用【${def.name}】，恢复 ${mp - mp0} 点法力。`
  }

  let s = patchUnit(state, targetId, { hp, mp })
  s = pushLog(s, msg)
  return { state: s, ok: true, message: msg, hpDelta: hp - hp0, mpDelta: mp - mp0 }
}
