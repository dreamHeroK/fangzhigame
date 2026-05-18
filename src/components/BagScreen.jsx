import React, { useState } from 'react'
import { Seal, PanelHead, Tag } from './common.jsx'

const MOCK_ITEMS = [
  { id: 'qiyelian', n: '七叶莲', qty: 23, q: 'common', t: 'T2', k: 'HP +1,000', glyph: '莲', note: 'Lv30-60 中期补血药，单口回复 1,000 气血。携带轻便，常作为群秒期主药。' },
  { id: 'qisehua',  n: '七色花', qty: 8,  q: 'common', t: 'T2', k: 'HP +1,500', glyph: '花', note: '单口回复 1,500 气血，药效略优于七叶莲，产自花海秘境。' },
  { id: 'buqidan',  n: '补气丹', qty: 17, q: 'common', t: 'T2', k: 'MP +1,200', glyph: '丹', note: '回复 1,200 法力，中期施法者常用随身补给。' },
  { id: 'yunxiang', n: '云香精', qty: 6,  q: 'common', t: 'T2', k: 'MP +1,500', glyph: '香', note: '回复 1,500 法力，效果优于补气丹，从云雾仙境采集提炼。' },
  { id: 'jinchuang',n: '金创药', qty: 4,  q: 'rare',   t: 'T3', k: 'HP +3,000', glyph: '药', note: '高效补血药，回复 3,000 气血，稀有品，适合高难副本备用。' },
  { id: 'huishen',  n: '回神丹', qty: 3,  q: 'rare',   t: 'T3', k: 'MP +2,500', glyph: '神', note: '稀有法力药，回复 2,500 法力，施法量大时效率显著。' },
  { id: 'xueling',  n: '血玲珑', q: 'epic',   t: '玲珑', k: '补满·12.84M/20M', glyph: '血', note: '极品气血玲珑，补满气血上限。额度独立，已用 12.84M / 上限 20M。' },
  { id: 'faling',   n: '法玲珑', q: 'epic',   t: '玲珑', k: '补满·18.42M/20M', glyph: '法', note: '极品法力玲珑，补满法力上限。额度独立，已用 18.42M / 上限 20M。' },
  { id: 'zhixue',   n: '止血草', qty: 32, q: 'common', t: 'T1', k: 'HP +100',   glyph: '草', note: '入门级补血草药，回复 100 气血，低级区域常见。' },
  { id: 'baiguo',   n: '白果',   qty: 28, q: 'common', t: 'T1', k: 'MP +80',    glyph: '果', note: '入门级法力恢复，回复 80 法力，树林中随手可采。' },
  { id: 'yiyecao',  n: '一叶草', qty: 11, q: 'common', t: 'T1', k: 'HP +200',   glyph: '叶', note: '回复 200 气血，效果略优于止血草，生于溪边。' },
  { id: 'shedan',   n: '蛇胆',   qty: 5,  q: 'common', t: 'T1', k: 'MP +150',   glyph: '胆', note: '从蛇类怪物掉落，回复 150 法力，略有腥气。' },
  { id: 'shuxin',   n: '舒心丸', qty: 2,  q: 'rare',   t: 'T3', k: 'MP +3,000', glyph: '舒', note: '稀有高效法药，单口回复 3,000 法力，产自仙门秘方。' },
  { id: 'renshen',  n: '人参',   qty: 1,  q: 'epic',   t: 'T4', k: 'HP +10,000',glyph: '参', note: '珍贵灵药，回复 10,000 气血，百年以上老参，入口即化。' },
  { id: 'skbook',   n: '技书残页',qty: 18,q: 'rare',   t: '材', k: '升技消耗',  glyph: '书', note: '用于提升技能修炼等级，18 张可提升一阶，来源：怪物掉落。' },
  { id: 'shumen',   n: '蜀山令牌',qty: 1, q: 'legend', t: '任', k: '任务道具',  glyph: '令', note: '蜀山派主线任务道具，不可丢弃。持有此牌可入蜀山秘境。' },
]

const MEDICINE_TIERS = new Set(['T1', 'T2', 'T3', 'T4'])

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
  const [activeTab, setActiveTab]   = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [tooltip, setTooltip]       = useState(null) // { item, left, top }

  const filtered = MOCK_ITEMS.filter(TAB_FILTERS[activeTab])
  const slots = buildSlots(filtered)
  const tabs = tabLabel(MOCK_ITEMS)

  function handleMouseEnter(e, item) {
    const r = e.currentTarget.getBoundingClientRect()
    const TW = 234
    const TH = 148
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
            负重 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>{MOCK_ITEMS.length}</span> / {PAGE_SIZE} 格
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

        {/* Grid — fills remaining height */}
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
                key={it.id}
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
                  boxShadow: selectedId === it.id
                    ? '0 0 0 2px rgba(163,55,58,0.2)'
                    : undefined,
                }}
                onClick={() => setSelectedId(it.id === selectedId ? null : it.id)}
                onMouseEnter={(e) => handleMouseEnter(e, it)}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* 品质 / 类型标签 */}
                <div style={{
                  position: 'absolute', top: 2, left: 3,
                  fontFamily: 'var(--font-mono)', fontSize: 7,
                  color: 'var(--ink-4)', lineHeight: 1,
                }}>
                  {it.t}
                </div>
                {/* 数量 */}
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

      {/* Hover tooltip — fixed overlay, pointer-events:none */}
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
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div
              className={'slot q-' + tooltip.item.q}
              style={{
                width: 44, height: 44, flexShrink: 0,
                flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 1,
              }}
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
          {/* Effect */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: '#3a5a8a', marginBottom: 5,
          }}>
            {tooltip.item.k}
          </div>
          {/* Description */}
          {tooltip.item.note && (
            <div style={{
              fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.65,
              borderTop: '1px dashed var(--ink-4)', paddingTop: 6,
            }}>
              {tooltip.item.note}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
