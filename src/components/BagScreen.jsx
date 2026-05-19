import React, { useState, useSyncExternalStore } from 'react'
import { Seal, PanelHead, Tag } from './common.jsx'
import { subscribe, getSnapshot, useItemFromBagAction, equipItemAction } from '../game/characterStore.js'
import { getConsumable, isQuotaOrb } from '../game/items/catalog.js'
import { getEquipByCode, EQUIP_SLOT_DEFS } from '../game/items/equipCatalog.js'
import { QUALITY, formatExtra } from '../game/items/equipQuality.js'

// ── 消耗品品质映射 ────────────────────────────────────────────────────────────
const TIER_QUALITY = { 1: 'common', 2: 'common', 3: 'rare', 4: 'epic', 5: 'legend', 6: 'epic' }

const Q_BORDER = {
  common: 'var(--ink-3)',
  rare:   '#3a6bb5',
  epic:   '#7a3aad',
  legend: '#c8860a',
  // 装备品质（用 QUALITY 里的 borderColor 直接取）
}

// ── 数据转换：消耗品 ──────────────────────────────────────────────────────────
function consumableEntryToDisplay(entry) {
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
    id: entry.itemId, n: def.name,
    glyph: def.glyph ?? def.name[0],
    qty: entry.qty, q, t: tLabel, k: effect,
    note: def.note ?? '', isEquip: false, inst: null,
    borderColor: Q_BORDER[q] ?? 'var(--ink-3)',
    nameColor: 'var(--ink)',
  }
}

// ── 数据转换：装备实例 ────────────────────────────────────────────────────────
function equipInstToDisplay(inst) {
  const baseItem = getEquipByCode(inst.baseCode)
  if (!baseItem) return null
  const qDef = QUALITY[inst.quality] ?? QUALITY.white
  const a = baseItem.base_attrs ?? {}
  const parts = []
  if (a.hurt)    parts.push(`攻${a.hurt}`)
  if (a.defense) parts.push(`防${a.defense}`)
  if (a.blood)   parts.push(`血${a.blood}`)
  if (a.magic)   parts.push(`法${a.magic}`)
  if (a.speed)   parts.push(`速${a.speed}`)
  return {
    id: inst.uid, n: baseItem.item_name,
    glyph: baseItem.item_name[0],
    qty: null, q: inst.quality, t: '装备',
    k: parts.join(' '),
    note: `Lv${baseItem.item_level} ${baseItem.item_subtype_zh}`,
    isEquip: true, inst,
    equipData: baseItem,
    borderColor: qDef.borderColor,
    nameColor: qDef.color,
  }
}

// ── 属性行（带对比 delta）────────────────────────────────────────────────────
const ATTR_KEYS = [
  { k: 'hurt',    label: '攻击' },
  { k: 'defense', label: '防御' },
  { k: 'blood',   label: '气血' },
  { k: 'magic',   label: '法力' },
  { k: 'speed',   label: '速度' },
]

function attrVal(attrs, k) {
  return Number(attrs?.[k]) || 0
}

function AttrCompareRow({ label, bagVal, eqVal }) {
  const delta = bagVal - eqVal
  const show  = bagVal > 0 || eqVal > 0
  if (!show) return null
  const color = delta > 0 ? '#2a7a2a' : delta < 0 ? '#a33' : 'var(--ink-3)'
  return (
    <div style={{ display: 'flex', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
      <span style={{ width: 32, color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ width: 52, color: 'var(--ink)' }}>{bagVal || '—'}</span>
      <span style={{ width: 52, color: 'var(--ink-2)' }}>{eqVal || '—'}</span>
      {delta !== 0 && <span style={{ color, fontWeight: 600 }}>{delta > 0 ? `+${delta}` : delta}</span>}
      {delta === 0 && bagVal > 0 && <span style={{ color: 'var(--ink-4)' }}>—</span>}
    </div>
  )
}

/** 合并两件装备的额外词条，按 stat 对齐，返回行数组 */
function mergeExtraRows(bagExtra, eqExtra) {
  const order = []
  const seen  = new Set()
  for (const ex of [...bagExtra, ...eqExtra]) {
    if (!seen.has(ex.stat)) { seen.add(ex.stat); order.push({ stat: ex.stat, label: ex.label }) }
  }
  return order.map(({ stat, label }) => {
    const b = bagExtra.find(e => e.stat === stat)
    const e = eqExtra.find(e => e.stat === stat)
    return { label, bagText: b ? `+${b.value}${b.isPct ? '%' : ''}` : null, eqText: e ? `+${e.value}${e.isPct ? '%' : ''}` : null }
  })
}

// ── 装备 Tooltip（含品质 + 额外词条 + 对比）───────────────────────────────────
function EquipTooltip({ item, equipped, equipBag }) {
  const equip = item.equipData
  const inst  = item.inst
  const a = equip.base_attrs ?? {}
  const qDef = QUALITY[inst?.quality ?? 'white']

  // 找出适配槽位，并查找已装备对比件
  const matchSlots = EQUIP_SLOT_DEFS.filter(s => s.filter(equip))
  const instMap = new Map((equipBag ?? []).map(i => [i.uid, i]))

  let compareItem = null
  let compareInst = null
  let compareSlotName = ''
  for (const slot of matchSlots) {
    const uid = equipped[slot.key]
    if (!uid) continue
    let baseCode = null
    if (typeof uid === 'string') {
      const ci = instMap.get(uid)
      baseCode = ci?.baseCode
      compareInst = ci ?? null
    } else if (typeof uid === 'number') {
      baseCode = uid
    }
    if (baseCode) {
      const ci = getEquipByCode(baseCode)
      if (ci) { compareItem = ci; compareSlotName = slot.name; break }
    }
  }

  const ca = compareItem?.base_attrs ?? {}

  return (
    <div style={{
      background: 'rgba(243,237,224,0.98)',
      border: `1px solid ${qDef.borderColor}`,
      borderRadius: 3,
      boxShadow: '0 4px 18px rgba(40,30,20,0.26)',
      padding: '10px 12px',
      fontFamily: 'var(--font-body)',
      minWidth: compareItem ? 300 : 200,
    }}>
      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, borderBottom: '1px solid var(--ink-4)', paddingBottom: 6 }}>
        <span className="brush" style={{ fontSize: 15, color: qDef.color }}>{equip.item_name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: qDef.color, opacity: 0.8 }}>[{qDef.label}]</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
          Lv{equip.item_level} · {equip.item_subtype_zh}
        </span>
      </div>

      {/* 属性对比 */}
      {compareItem ? (
        <>
          <div style={{ display: 'flex', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', marginBottom: 4 }}>
            <span style={{ width: 32 }} />
            <span style={{ width: 52, color: '#3a6bb5' }}>背包中</span>
            <span style={{ width: 52, color: 'var(--ink-3)' }}>{compareSlotName}(已)</span>
            <span>差值</span>
          </div>
          {ATTR_KEYS.map(({ k, label }) => (
            <AttrCompareRow key={k} label={label} bagVal={attrVal(a, k)} eqVal={attrVal(ca, k)} />
          ))}
          {compareInst && compareInst.quality !== 'white' && (
            <div style={{ marginTop: 4, fontSize: 9, color: QUALITY[compareInst.quality]?.color, fontFamily: 'var(--font-mono)' }}>
              已装品质：{QUALITY[compareInst.quality]?.label}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', borderTop: '1px dashed var(--ink-4)', paddingTop: 5 }}>
            对比：{compareItem.item_name} Lv{compareItem.item_level}
          </div>
          {(() => {
            const rows = mergeExtraRows(inst?.extra ?? [], compareInst?.extra ?? [])
            if (!rows.length) return null
            const eqQDef = QUALITY[compareInst?.quality ?? 'white']
            return (
              <div style={{ marginTop: 8, borderTop: '1px dashed var(--ink-4)', paddingTop: 6 }}>
                <div style={{ display: 'flex', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', marginBottom: 3 }}>
                  <span style={{ width: 36 }}>词条</span>
                  <span style={{ width: 72, color: '#3a6bb5' }}>背包中</span>
                  <span style={{ color: 'var(--ink-3)' }}>已装</span>
                </div>
                {rows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                    <span style={{ width: 36, color: 'var(--ink-3)' }}>{row.label}</span>
                    <span style={{ width: 72, color: row.bagText ? qDef.color : 'var(--ink-4)' }}>{row.bagText ?? '—'}</span>
                    <span style={{ color: row.eqText ? eqQDef.color : 'var(--ink-4)' }}>{row.eqText ?? '—'}</span>
                  </div>
                ))}
              </div>
            )
          })()}
        </>
      ) : (
        <>
          {ATTR_KEYS.map(({ k, label }) => {
            const v = attrVal(a, k)
            if (!v) return null
            return (
              <div key={k} style={{ display: 'flex', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                <span style={{ width: 32, color: 'var(--ink-3)' }}>{label}</span>
                <span style={{ color: 'var(--ink)' }}>{v}</span>
              </div>
            )
          })}
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
            {matchSlots.map(s => s.name).join('/')} 槽位无已装备
          </div>
        </>
      )}

      {/* 额外词条（无对比时显示；有对比时已内嵌在对比块中） */}
      {!compareItem && inst?.extra?.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px dashed var(--ink-4)', paddingTop: 6 }}>
          <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>额外属性</div>
          {inst.extra.map((ex, i) => (
            <div key={i} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: qDef.color, marginBottom: 1 }}>
              {formatExtra(ex)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 普通 Tooltip（消耗品）────────────────────────────────────────────────────
function ConsumableTooltip({ item }) {
  return (
    <div style={{
      background: 'rgba(243,237,224,0.97)',
      border: `1px solid ${item.borderColor}`,
      borderRadius: 3,
      boxShadow: '0 4px 18px rgba(40,30,20,0.24)',
      padding: '10px 12px',
      fontFamily: 'var(--font-body)',
      width: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div className={'slot q-' + item.q}
          style={{ width: 44, height: 44, flexShrink: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Seal size={24} round>{item.glyph}</Seal>
        </div>
        <div>
          <div className="brush" style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.2 }}>{item.n}</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 3 }}>
            <Tag tone="gold">{item.t}</Tag>
            {item.qty != null && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>×{item.qty}</span>
            )}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3a5a8a', marginBottom: 5 }}>{item.k}</div>
      {item.note && (
        <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.65, borderTop: '1px dashed var(--ink-4)', paddingTop: 6 }}>
          {item.note}
        </div>
      )}
    </div>
  )
}

// ── 装备动作栏（选中装备件时显示）────────────────────────────────────────────
function EquipActionBar({ sel, equipped, equipBag, onDone }) {
  const equip = sel.equipData
  const matchSlots = EQUIP_SLOT_DEFS.filter(s => s.filter(equip))
  const instMap = new Map((equipBag ?? []).map(i => [i.uid, i]))

  if (matchSlots.length === 0) return null

  return (
    <div style={{
      flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      padding: '6px 10px', borderTop: '1px solid var(--ink-4)',
      background: 'rgba(243,237,224,0.6)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <span className="brush" style={{ fontSize: 13, color: sel.nameColor }}>{sel.n}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>{sel.note}</span>
      </div>
      {matchSlots.map(slot => {
        const uid = equipped[slot.key]
        let curItem = null
        if (typeof uid === 'string') {
          const ci = instMap.get(uid)
          curItem = ci ? getEquipByCode(ci.baseCode) : null
        } else if (typeof uid === 'number') {
          curItem = getEquipByCode(uid)
        }
        return (
          <button
            key={slot.key}
            className="btn-ink btn-ink-primary btn-ink-sm"
            onClick={() => {
              equipItemAction(slot.key, sel.inst.uid)
              onDone()
            }}
          >
            装备至{slot.name}
            {curItem ? ` (替换${curItem.item_name})` : ''}
          </button>
        )
      })}
      <button className="btn-ink btn-ink-sm" onClick={onDone}>取消</button>
    </div>
  )
}

// ── Tab 定义 ─────────────────────────────────────────────────────────────────
const MEDICINE_TIERS = new Set(['T1', 'T2', 'T3', 'T4', 'T5'])

const TAB_FILTERS = [
  () => true,
  (it) => MEDICINE_TIERS.has(it.t),
  (it) => it.t === '玲珑',
  (it) => it.isEquip,
  (it) => it.t === '材' || it.t === '任',
]

function tabLabel(items) {
  const counts = TAB_FILTERS.map(fn => items.filter(fn).length)
  return [
    `全部 ${counts[0]}`, `丹药 ${counts[1]}`,
    `玲珑 ${counts[2]}`, `装备 ${counts[3]}`, `其他 ${counts[4]}`,
  ]
}

const COLS = 10
const ROWS = 5
const PAGE_SIZE = COLS * ROWS

function buildSlots(items) {
  const arr = [...items]
  while (arr.length < PAGE_SIZE) arr.push(null)
  return arr.slice(0, PAGE_SIZE)
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function BagScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [activeTab, setActiveTab]   = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [tooltip, setTooltip]       = useState(null)  // { item, left, top }
  const [page, setPage]             = useState(0)

  const equipped = char.equipped ?? {}

  // 已装备的 uid 集合（用于过滤背包视图中的"未装"列表）
  const equippedUids = new Set(Object.values(equipped).filter(v => typeof v === 'string'))

  // 消耗品条目
  const consumableItems = (char.bag ?? []).map(consumableEntryToDisplay).filter(Boolean)

  // 装备背包条目（只显示未装备在槽上的实例）
  const equipItems = (char.equipBag ?? [])
    .filter(inst => !equippedUids.has(inst.uid))
    .map(equipInstToDisplay)
    .filter(Boolean)

  const allItems   = [...consumableItems, ...equipItems]
  const filtered   = allItems.filter(TAB_FILTERS[activeTab])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages - 1)
  const pageItems  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const slots      = buildSlots(pageItems)
  const tabs       = tabLabel(allItems)

  function handleMouseEnter(e, item) {
    const r = e.currentTarget.getBoundingClientRect()
    const isEquip = item.isEquip
    const TW = isEquip ? 320 : 210
    const TH = isEquip ? 200 : 148
    let left = r.right + 8
    let top  = r.top
    if (left + TW > window.innerWidth - 6) left = r.left - TW - 8
    if (left < 6) left = 6
    if (top + TH > window.innerHeight - 6) top = window.innerHeight - TH - 6
    if (top < 6) top = 6
    setTooltip({ item, left, top })
  }

  const selItem = selectedId ? allItems.find(it => it.id === selectedId) : null

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
            共 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>{filtered.length}</span> 件 · 第 {safePage + 1}/{totalPages} 页
          </span>
        }
      />

      <div style={{ position: 'absolute', inset: '60px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {/* Tabs */}
        <div className="tab-list" style={{ flexShrink: 0 }}>
          {tabs.map((t, i) => (
            <div
              key={i}
              className={'tab' + (i === activeTab ? ' active' : '')}
              onClick={() => { setActiveTab(i); setSelectedId(null); setPage(0) }}
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
                style={{
                  padding: '3px 3px 4px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 1,
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  border: `1px solid ${selectedId === it.id ? 'var(--vermilion)' : it.borderColor}`,
                  background: selectedId === it.id ? '#fff8ea' : 'var(--paper)',
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
                  fontSize: 10, color: it.nameColor, lineHeight: 1.1,
                  textAlign: 'center', maxWidth: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {it.n}
                </span>
              </div>
            ) : (
              <div key={i} className="slot slot-empty"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }} />
            )
          )}
        </div>

        {allItems.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-brush)', fontSize: 15, color: 'var(--ink-4)' }}>
              囊中空空，出门打怪去
            </span>
          </div>
        )}

        {/* 选中物品动作栏 */}
        {selItem && selItem.isEquip ? (
          <EquipActionBar
            sel={selItem}
            equipped={equipped}
            equipBag={char.equipBag ?? []}
            onDone={() => setSelectedId(null)}
          />
        ) : selItem ? (
          <div style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 10px', borderTop: '1px solid var(--ink-4)',
            background: 'rgba(243,237,224,0.6)',
          }}>
            <span className="brush" style={{ fontSize: 13, color: 'var(--ink)' }}>{selItem.n}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>×{selItem.qty}</span>
            <div style={{ flex: 1 }} />
            {(MEDICINE_TIERS.has(selItem.t) || selItem.t === '玲珑') && (
              <button
                className="btn-ink btn-ink-primary btn-ink-sm"
                onClick={() => {
                  const res = useItemFromBagAction(selItem.id)
                  if (res.ok && selItem.qty <= 1) setSelectedId(null)
                }}
              >
                使 用
              </button>
            )}
            <button className="btn-ink btn-ink-sm" onClick={() => setSelectedId(null)}>取消选择</button>
          </div>
        ) : null}

        {/* 分页 */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          paddingTop: 8, borderTop: '1px solid var(--ink-4)',
        }}>
          <button
            className="btn-ink btn-ink-sm"
            disabled={safePage === 0}
            onClick={() => setPage(p => p - 1)}
            style={{ opacity: safePage === 0 ? 0.4 : 1 }}
          >上一页</button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--ink-2)', minWidth: 70, textAlign: 'center' }}>
            {safePage + 1} / {totalPages}
          </span>
          <button
            className="btn-ink btn-ink-sm"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            style={{ opacity: safePage >= totalPages - 1 ? 0.4 : 1 }}
          >下一页</button>
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.left,
          top:  tooltip.top,
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {tooltip.item.isEquip ? (
            <EquipTooltip item={tooltip.item} equipped={equipped} equipBag={char.equipBag ?? []} />
          ) : (
            <ConsumableTooltip item={tooltip.item} />
          )}
        </div>
      )}
    </div>
  )
}
