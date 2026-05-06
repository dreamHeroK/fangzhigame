import { createPortal } from 'react-dom'

/**
 * @param {{ tip: null | { left: number, top: number, name: string, type: string, desc: string, num: string } }} props
 */
export function ItemTooltipLayer({ tip }) {
  if (!tip) return null
  const { left, top, name, type, desc, num } = tip
  return createPortal(
    <div className="item-tooltip item-tooltip--visible" style={{ left, top }} role="tooltip">
      <div className="name">{name}</div>
      <div className="type">{type}</div>
      <div className="desc">{desc}</div>
      <div className="num">{num}</div>
    </div>,
    document.body
  )
}
