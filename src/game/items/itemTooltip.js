import { getRestoreAmount, isQuotaOrb } from './catalog.js'

function fmtNum(n) {
  return Number(n ?? 0).toLocaleString('zh-CN')
}

/**
 * 悬浮弹窗结构化文案（玲珑 num 为剩余额度；叠放品 num 为持有量）
 * @param {{ def: object, stackable: boolean, qty: number, remaining?: number }} row
 * @returns {{ name: string, type: string, desc: string, num: string } | null}
 */
export function buildItemTooltipParts(row) {
  const { def, stackable, qty, remaining } = row
  if (!def) return null

  if (isQuotaOrb(def)) {
    const kind = def.kind === 'hp' ? '气血' : '法力'
    const desc = [
      `额度为 0 时该颗玲珑消失。`,
    ]
      .filter(Boolean)
      .join('\n')
    return {
      name: def.name,
      type: `玲珑 · ${kind}类（不可叠加 · 每颗一格）`,
      desc,
      num: `剩余额度：${fmtNum(remaining)}`,
    }
  }

  const amt = getRestoreAmount(def)
  const kind = def.kind === 'hp' ? '气血' : '法力'
  const desc = [
    `每次使用回复 ${fmtNum(amt)} 点${kind}。`,
  ]
    .filter(Boolean)
    .join('\n')
  return {
    name: def.name,
    type: def.kind === 'hp' ? '可叠加 · 气血药' : '可叠加 · 法力药',
    desc,
    num: `持有：${fmtNum(qty)}`,
  }
}

/** @param {{ def: object, stackable: boolean, qty: number, remaining?: number }} row */
export function buildInventoryRowTooltip(row) {
  const p = buildItemTooltipParts(row)
  if (!p) return ''
  return [p.name, p.type, p.desc, p.num].join('\n')
}
