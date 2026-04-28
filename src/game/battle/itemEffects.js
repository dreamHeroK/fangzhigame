import { getConsumable, getRestoreAmount, isFullRestoreOrb } from '../items/catalog.js'

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n))
}

/**
 * 战斗内对单位使用消耗品（不扣背包，由外层扣）
 * @returns {{ state: object, ok: boolean, message?: string }}
 */
export function applyConsumableToUnit(state, targetId, itemId, patchUnit, pushLog) {
  const target = state.units.find((u) => u.id === targetId)
  const def = getConsumable(itemId)
  if (!target || target.side !== 'ally' || target.hp <= 0 || !def) {
    return { state, ok: false }
  }

  const hp0 = target.hp
  const mp0 = target.mp
  let hp = hp0
  let mp = mp0
  let msg = ''

  if (isFullRestoreOrb(def)) {
    if (def.kind === 'hp') {
      hp = target.maxHp
      msg = `${target.name} 使用【${def.name}】，气血回满。`
    } else {
      mp = target.maxMp
      msg = `${target.name} 使用【${def.name}】，法力回满。`
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
  return { state: s, ok: true, message: msg }
}
