import React, { useState, useSyncExternalStore } from 'react'
import { Seal, PanelHead, Tag } from './common.jsx'
import { subscribe, getSnapshot } from '../game/characterStore.js'
import { getConsumable, isQuotaOrb, LINGLONG_DEFAULT_QUOTA } from '../game/items/catalog.js'

// 按 tier 映射品质样式
const TIER_QUALITY = { 1: 'common', 2: 'common', 3: 'rare', 4: 'epic', 5: 'legend', 6: 'epic' }

/** 将背包条目转换为 UI 显示格式 */
function bagEntryToDisplay(entry) {
  const def = getConsumable(entry.itemId)
  if (!def) return null
  const isOrb = isQuotaOrb(def)
  const tier  = def.tier ?? 6
  const q     = TIER_QUALITY[tier] ?? 'common'
  const tLabel = isOrb ? '玲珑' : `T${tier}`
  const effect = def.kind === 'hp'
    ? (isOrb ? '补满气血' : `HP +${def.amount.toLocaleString()}`)
    : (isOrb ? '补满法力' : `MP +${def.amount.toLocaleString()}`)
  return {
    id:    entry.itemId,
    n:     def.name,
    glyph: def.glyph ?? def.name[0],
    qty:   entry.qty,
    q,
    t:     tLabel,
    k:     effect,
    note:  def.note ?? '',
  }
}

const MEDICINE_TIERS = new Set(['T1', 'T2', 'T3', 'T4', 'T5'])

const TAB_FILTERS = [
  () => true,
  (it) => MEDICINE_TIERS.has(it.t),
  (it) => it.t === '玲珑',
  (it) => it.t === '材',
  (it) => it.t === '任',
]

function tabLabel(items) {
  const counts = TAB_FILTERS.map(fn => items.filter(fn).length)
  return [
    `全部 ${counts[0]}`,
    `丹药 ${counts[1]}`,
    `玲珑 ${counts[2]}`,
    `材料 ${counts[3]}`,
    `任务 ${counts[4]}`,
  ]
}

const COLS = 10
const ROWS = 5
const PAGE_SIZE = COLS * ROWS

const Q_BORDER = {
  common: 'var(--ink-3)',
  rare:   '#3a6bb5',
  epic:   '#7a3aad',
  legend: '#c8860a',
}

function buildSlots(items) {
  const arr = [...items]
  while (arr.length < PAGE_SIZE) arr.push(null)
  return arr.slice(0, PAGE_SIZE)
}

export default function BagScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [activeTab, setActiveTab]   = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [tooltip, setTooltip]       = useState(null)

  // 将 store 中的 bag 条目转为 UI 显示格式（过滤无效 ID）
  const allItems = (char.bag ?? []).map(bagEntryToDisplay).filter(Boolean)

  const filtered = allItems.filter(TAB_FILTERS[activeTab])
  const slots = buildSlots(filtered)
  const tabs = tabLabel(allItems)

  function handleMouseEnter(e, item) {
    const r = e.currentTarget.getBoundingClientRect()
    const TW = 234, TH = 148
    let left = r.left
    let top  = r.top - TH - 6
    if (left + TW > window.innerWidth - 6) left = window.innerWidth - TW - 6
    if (left < 6) left = 6
    if (top  < 6) top  = r.bottom + 6
    setTooltip({ item, left, top })
  }

  return (
    <div className="paper-bg" style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden', fontFamily: 'var(--font-body)',
    }}>
      <PanelHead
        title="行 装 · 锦囊"
        sub="INVENTORY"
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            负重 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>{allItems.length}</span> / {PAGE_SIZE} 格
          </span>
        }
      />

      <div style={{
        position: 'absolute', inset: '60px 14px 14px 14px',
        display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        {/* Tabs */}
        <div className="tab-list" style={{ flexShrink: 0 }}>
          {tabs.map((t, i) => (
            <div
              key={t}
              className={'tab' + (i === activeTab ? ' active' : '')}
              onClick={() => { setActiveTab(i); setSelectedId(null) }}
              style={{ padding: '3px 12px', fontSize: 11, cursor: 'pointer' }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          gap: 4,
          minHeight: 0,
        }}>
          {slots.map((it, i) =>
            it ? (
              <div
                key={it.id + '_' + i}
                className={'slot q-' + it.q}
                style={{
                  padding: '3px 3px 4px',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  background: selectedId === it.id ? '#fff8ea' : undefined,
                  borderColor: selectedId === it.id ? 'var(--vermilion)' : undefined,
                  boxShadow: selectedId === it.id ? '0 0 0 2px rgba(163,55,58,0.2)' : undefined,
                }}
                onClick={() => setSelectedId(it.id === selectedId ? null : it.id)}
                onMouseEnter={(e) => handleMouseEnter(e, it)}
                onMouseLeave={() => setTooltip(null)}
              >
                <div style={{
                  position: 'absolute', top: 2, left: 3,
                  fontFamily: 'var(--font-mono)', fontSize: 7,
                  color: 'var(--ink-4)', lineHeight: 1,
                }}>
                  {it.t}
                </div>
                {it.qty != null && (
                  <span className="slot-count">×{it.qty}</span>
                )}
                <Seal size={18} round style={{ flexShrink: 0 }}>{it.glyph}</Seal>
                <span className="brush" style={{
                  fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.1,
                  textAlign: 'center', maxWidth: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {it.n}
                </span>
              </div>
            ) : (
              <div
                key={i}
                className="slot slot-empty"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}
              />
            )
          )}
        </div>

        {/* 空背包提示 */}
        {allItems.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-brush)', fontSize: 15, color: 'var(--ink-4)' }}>
              囊中空空，出门打怪去
            </span>
          </div>
        )}

        {/* Pagination */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          paddingTop: 8, borderTop: '1px solid var(--ink-4)',
        }}>
          <button className="btn-ink btn-ink-sm">上一页</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--ink-2)', minWidth: 70, textAlign: 'center' }}>
            1 / 1
          </span>
          <button className="btn-ink btn-ink-sm">下一页</button>
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.left,
          top:  tooltip.top,
          width: 234,
          zIndex: 9999,
          pointerEvents: 'none',
          background: 'rgba(243,237,224,0.97)',
          border: `1px solid ${Q_BORDER[tooltip.item.q] ?? 'var(--ink-3)'}`,
          borderRadius: 3,
          boxShadow: '0 4px 18px rgba(40,30,20,0.24)',
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              className={'slot q-' + tooltip.item.q}
              style={{ width: 44, height: 44, flexShrink: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}
            >
              <Seal size={24} round>{tooltip.item.glyph}</Seal>
            </div>
            <div>
              <div className="brush" style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.2 }}>
                {tooltip.item.n}
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 3 }}>
                <Tag tone="gold">{tooltip.item.t}</Tag>
                {tooltip.item.qty != null && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                    ×{tooltip.item.qty}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3a5a8a', marginBottom: 5 }}>
            {tooltip.item.k}
          </div>
          {tooltip.item.note && (
            <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.65, borderTop: '1px dashed var(--ink-4)', paddingTop: 6 }}>
              {tooltip.item.note}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
