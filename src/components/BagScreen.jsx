import React, { useState, useSyncExternalStore } from 'react'
import { Seal, PanelHead, Tag } from './common.jsx'
import { subscribe, getSnapshot, useItemFromBagAction, equipItemAction,
  sellEquipAction, batchSellEquipAction, absorbToCrystalAction,
  sellBagItemAction, getBagItemSellPrice,
  EQUIP_SELL_PRICE } from '../game/characterStore.js'
import { getConsumable, isQuotaOrb } from '../game/items/catalog.js'
import { getEquipByCode, EQUIP_SLOT_DEFS } from '../game/items/equipCatalog.js'
import { QUALITY, formatExtra, isExtraMax } from '../game/items/equipQuality.js'

// ── 消耗品品质映射 ────────────────────────────────────────────────────────────
const TIER_QUALITY = { 1: 'common', 2: 'common', 3: 'rare', 4: 'epic', 5: 'legend', 6: 'epic' }
const Q_BORDER = { common: 'var(--ink-3)', rare: '#3a6bb5', epic: '#7a3aad', legend: '#c8860a' }

// ── 数据转换：消耗品 ──────────────────────────────────────────────────────────
function consumableEntryToDisplay(entry) {
  const def = getConsumable(entry.itemId)
  if (!def) return null
  const isOrb  = isQuotaOrb(def)
  const tier   = def.tier ?? 6
  const q      = TIER_QUALITY[tier] ?? 'common'
  const tLabel = def.kind === 'special' ? '特殊' : def.kind === 'material' ? '材料' : isOrb ? '玲珑' : `T${tier}`
  const effect = def.kind === 'special'
    ? (def.note ?? '特殊道具')
    : def.kind === 'material'
      ? (def.note ?? '材料')
      : def.kind === 'hp'
        ? (isOrb ? '补满气血' : `HP +${def.amount.toLocaleString()}`)
        : (isOrb ? '补满法力' : `MP +${def.amount.toLocaleString()}`)
  const sellPrice = getBagItemSellPrice(entry.itemId)
  return {
    id: entry.itemId, n: def.name,
    glyph: def.glyph ?? def.name[0],
    qty: entry.qty, q, t: tLabel, k: effect,
    note: def.note ?? '', isEquip: false, inst: null,
    borderColor: def.kind === 'special' ? '#6a3d8a' : (Q_BORDER[q] ?? 'var(--ink-3)'),
    nameColor:   def.kind === 'special' ? '#6a3d8a' : 'var(--ink)',
    canUse:  def.kind === 'hp' || def.kind === 'mp',
    canSell: sellPrice != null,
    sellPrice,
  }
}

// ── 数据转换：黑水晶实例 ──────────────────────────────────────────────────────
function crystalToDisplay(crystal) {
  const cnt = crystal.absorbedAttrs?.length ?? 0
  return {
    id: `crystal_${crystal.uid}`, crystalUid: crystal.uid,
    n: cnt ? `黑水晶 (${cnt}条)` : '黑水晶',
    glyph: '黑', qty: null, q: 'epic', t: '水晶',
    k: cnt ? crystal.absorbedAttrs.map(a => formatExtra(a)).join(' · ') : '暂无吸附属性',
    note: '可在背包中对装备吸取属性；在锻造界面可熔炼入装备（上限6条）。',
    borderColor: '#6a3d8a', nameColor: '#6a3d8a',
    isEquip: false, isCrystal: true, inst: null,
    absorbedAttrs: crystal.absorbedAttrs ?? [],
    canUse: false, canSell: false,
  }
}

// ── 数据转换：装备实例 ────────────────────────────────────────────────────────
function equipInstToDisplay(inst) {
  const baseItem = getEquipByCode(inst.baseCode)
  if (!baseItem) return null
  const qDef  = QUALITY[inst.quality] ?? QUALITY.white
  const a     = baseItem.base_attrs ?? {}
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
    isEquip: true, inst, equipData: baseItem,
    borderColor: qDef.borderColor, nameColor: qDef.color,
    canUse: false, canSell: true, sellPrice: EQUIP_SELL_PRICE[inst.quality] ?? 100,
  }
}

// ── 属性对比行 ────────────────────────────────────────────────────────────────
const ATTR_KEYS = [
  { k: 'hurt', label: '攻击' }, { k: 'defense', label: '防御' },
  { k: 'blood', label: '气血' }, { k: 'magic', label: '法力' }, { k: 'speed', label: '速度' },
]
function attrVal(attrs, k) { return Number(attrs?.[k]) || 0 }

function AttrCompareRow({ label, bagVal, eqVal }) {
  const delta = bagVal - eqVal
  if (bagVal === 0 && eqVal === 0) return null
  const color = delta > 0 ? '#2a7a2a' : delta < 0 ? '#a33' : 'var(--ink-3)'
  return (
    <div style={{ display: 'flex', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
      <span style={{ width: 32, color: 'var(--ink-3)' }}>{label}</span>
      <span style={{ width: 46, color: 'var(--ink)' }}>{bagVal || '—'}</span>
      <span style={{ width: 46, color: 'var(--ink-2)' }}>{eqVal || '—'}</span>
      {delta !== 0 && <span style={{ color, fontWeight: 600 }}>{delta > 0 ? `+${delta}` : delta}</span>}
    </div>
  )
}

function mergeExtraRows(bagExtra, eqExtra) {
  const order = []; const seen = new Set()
  for (const ex of [...bagExtra, ...eqExtra])
    if (!seen.has(ex.stat)) { seen.add(ex.stat); order.push({ stat: ex.stat, label: ex.label }) }
  return order.map(({ stat, label }) => ({
    label,
    bag: bagExtra.find(e => e.stat === stat) ?? null,
    eq:  eqExtra.find(e => e.stat === stat)  ?? null,
  }))
}

const ExtraVal = ({ ex, color }) => {
  if (!ex) return <span style={{ color: 'var(--ink-4)' }}>—</span>
  const max = isExtraMax(ex)
  return (
    <span style={{ color }}>
      +{ex.value}{ex.isPct ? '%' : ''}
      {max && <span style={{ color: '#c87020', fontSize: 8, marginLeft: 2, fontWeight: 700 }}>满</span>}
    </span>
  )
}
const ExtraRangeRow = ({ ex, color }) => {
  const max = isExtraMax(ex); const suf = ex.isPct ? '%' : ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 1 }}>
      <span style={{ color, minWidth: 80 }}>{ex.label} +{ex.value}{suf}</span>
      {ex.lo != null && <span style={{ color: 'var(--ink-4)', fontSize: 9 }}>[{ex.lo}{suf}~{ex.hi}{suf}]</span>}
      {max && <span style={{ color: '#c87020', fontSize: 9, fontWeight: 700 }}>满</span>}
    </div>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function EquipTooltip({ item, equipped, equipBag }) {
  const equip = item.equipData; const inst = item.inst
  const a = equip.base_attrs ?? {}; const qDef = QUALITY[inst?.quality ?? 'white']
  const matchSlots = EQUIP_SLOT_DEFS.filter(s => s.filter(equip))
  const instMap = new Map((equipBag ?? []).map(i => [i.uid, i]))
  let compareItem = null, compareInst = null, compareSlotName = ''
  for (const slot of matchSlots) {
    const uid = equipped[slot.key]; if (!uid) continue
    let baseCode = null
    if (typeof uid === 'string') { const ci = instMap.get(uid); baseCode = ci?.baseCode; compareInst = ci ?? null }
    else if (typeof uid === 'number') { baseCode = uid }
    if (baseCode) { const ci = getEquipByCode(baseCode); if (ci) { compareItem = ci; compareSlotName = slot.name; break } }
  }
  const ca = compareItem?.base_attrs ?? {}
  return (
    <div style={{
      background: 'rgba(243,237,224,0.98)', border: `1px solid ${qDef.borderColor}`,
      borderRadius: 3, boxShadow: '0 4px 18px rgba(40,30,20,0.26)',
      padding: '10px 12px', fontFamily: 'var(--font-body)',
      minWidth: compareItem ? 300 : 200, maxWidth: 340,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6, borderBottom: '1px solid var(--ink-4)', paddingBottom: 6 }}>
        <span className="brush" style={{ fontSize: 15, color: qDef.color }}>{equip.item_name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: qDef.color, opacity: 0.8 }}>[{qDef.label}]</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
          Lv{equip.item_level} · {equip.item_subtype_zh}
          {(inst?.forgeLevel ?? 0) > 0 && <span style={{ color: 'var(--gold-2)', marginLeft: 4, fontWeight: 700 }}>+{inst.forgeLevel}</span>}
        </span>
      </div>
      {compareItem ? (
        <>
          <div style={{ display: 'flex', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', marginBottom: 4 }}>
            <span style={{ width: 32 }} />
            <span style={{ width: 46, color: '#3a6bb5' }}>背包中</span>
            <span style={{ width: 46, color: 'var(--ink-3)' }}>{compareSlotName}(已)</span>
            <span>差值</span>
          </div>
          {ATTR_KEYS.map(({ k, label }) => (
            <AttrCompareRow key={k} label={label} bagVal={attrVal(a, k)} eqVal={attrVal(ca, k)} />
          ))}
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
                  <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                    <span style={{ width: 36, color: 'var(--ink-3)' }}>{row.label}</span>
                    <span style={{ width: 72 }}><ExtraVal ex={row.bag} color={qDef.color} /></span>
                    <span><ExtraVal ex={row.eq} color={eqQDef.color} /></span>
                  </div>
                ))}
              </div>
            )
          })()}
        </>
      ) : (
        <>
          {ATTR_KEYS.map(({ k, label }) => {
            const v = attrVal(a, k); if (!v) return null
            return (
              <div key={k} style={{ display: 'flex', fontSize: 10, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                <span style={{ width: 32, color: 'var(--ink-3)' }}>{label}</span>
                <span style={{ color: 'var(--ink)' }}>{v}</span>
              </div>
            )
          })}
          {!compareItem && inst?.extra?.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px dashed var(--ink-4)', paddingTop: 6 }}>
              <div style={{ fontSize: 9, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>额外属性</div>
              {inst.extra.map((ex, i) => <ExtraRangeRow key={i} ex={ex} color={qDef.color} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ConsumableTooltip({ item }) {
  return (
    <div style={{
      background: 'rgba(243,237,224,0.97)', border: `1px solid ${item.borderColor}`,
      borderRadius: 3, boxShadow: '0 4px 18px rgba(40,30,20,0.24)',
      padding: '10px 12px', fontFamily: 'var(--font-body)', width: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div className={'slot q-' + item.q} style={{ width: 44, height: 44, flexShrink: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <Seal size={24} round>{item.glyph}</Seal>
        </div>
        <div>
          <div className="brush" style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.2 }}>{item.n}</div>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 3 }}>
            <Tag tone="gold">{item.t}</Tag>
            {item.qty != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>×{item.qty}</span>}
          </div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3a5a8a', marginBottom: 5 }}>{item.k}</div>
      {item.note && <div style={{ fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.65, borderTop: '1px dashed var(--ink-4)', paddingTop: 6 }}>{item.note}</div>}
    </div>
  )
}

// ── 右侧动作面板 ──────────────────────────────────────────────────────────────
const QUALITY_ORDER = ['white', 'green', 'blue', 'purple', 'orange']

function ActionPanel({ selItem, equipped, equipBag, crystalMode, setCrystalMode, setSelectedId, activeTab, showMsg }) {
  const equippedUids = new Set(Object.values(equipped).filter(v => typeof v === 'string'))

  // 批量出售（装备标签页）
  const batchSellBlock = activeTab === 3 ? (() => {
    const unequipped = (equipBag ?? []).filter(i => !equippedUids.has(i.uid))
    const counts = {}
    for (const i of unequipped) counts[i.quality] = (counts[i.quality] ?? 0) + 1
    const rows = QUALITY_ORDER.filter(q => counts[q])
    if (!rows.length) return null
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6 }}>批量出售装备</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {rows.map(q => {
            const qDef = QUALITY[q]; const cnt = counts[q]
            const total = (EQUIP_SELL_PRICE[q] ?? 100) * cnt
            return (
              <button key={q} className="btn-ink btn-ink-sm"
                style={{ color: qDef.color, borderColor: qDef.borderColor, fontSize: 10, textAlign: 'left' }}
                onClick={() => {
                  const res = batchSellEquipAction([q])
                  if (res.ok && res.count > 0)
                    showMsg(`出售 ${res.count} 件${qDef.label}装，获得 ${res.tael.toLocaleString()} 银两`)
                }}>
                {qDef.label} ×{cnt}　{total.toLocaleString()} 银
              </button>
            )
          })}
        </div>
      </div>
    )
  })() : null

  // 水晶吸取模式
  if (crystalMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6a3d8a', lineHeight: 1.7 }}>
          点击左侧装备（紫边框）吸取一条随机额外属性，存储到黑水晶上。
        </div>
        <button className="btn-ink btn-ink-sm" onClick={() => setCrystalMode(null)}>取消吸取</button>
      </div>
    )
  }

  // 未选中物品
  if (!selItem) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {batchSellBlock}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', textAlign: 'center', marginTop: 8 }}>
          点击物品查看详情
        </div>
      </div>
    )
  }

  // ── 装备 ──
  if (selItem.isEquip) {
    const instMap = new Map((equipBag ?? []).map(i => [i.uid, i]))
    const matchSlots = EQUIP_SLOT_DEFS.filter(s => s.filter(selItem.equipData))
    const isEquipped = equippedUids.has(selItem.inst?.uid)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ borderBottom: '1px solid var(--ink-4)', paddingBottom: 8, marginBottom: 2 }}>
          <div className="brush" style={{ fontSize: 14, color: selItem.nameColor }}>{selItem.n}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>
            {selItem.note}
            {(selItem.inst?.forgeLevel ?? 0) > 0 && <span style={{ color: 'var(--gold-2)', marginLeft: 6, fontWeight: 700 }}>+{selItem.inst.forgeLevel}</span>}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 2 }}>装备到槽位：</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {matchSlots.map(slot => {
            const uid = equipped[slot.key]
            let curItem = null
            if (typeof uid === 'string') { const ci = instMap.get(uid); curItem = ci ? getEquipByCode(ci.baseCode) : null }
            else if (typeof uid === 'number') curItem = getEquipByCode(uid)
            return (
              <button key={slot.key} className="btn-ink btn-ink-primary btn-ink-sm"
                style={{ textAlign: 'left', fontSize: 10 }}
                onClick={() => { equipItemAction(slot.key, selItem.inst.uid); setSelectedId(null) }}>
                {slot.name}{curItem ? `（替换 ${curItem.item_name}）` : ''}
              </button>
            )
          })}
        </div>
        {!isEquipped && (
          <button className="btn-ink btn-ink-sm"
            style={{ color: 'var(--gold-2)', borderColor: 'var(--gold-2)', marginTop: 4 }}
            onClick={() => {
              const res = sellEquipAction(selItem.inst.uid)
              if (res.ok) { showMsg(`出售成功，获得 ${res.tael.toLocaleString()} 银两`); setSelectedId(null) }
              else showMsg(res.reason ?? '出售失败', false)
            }}>
            出售　{selItem.sellPrice?.toLocaleString()} 银
          </button>
        )}
        {isEquipped && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>已装备，如需出售请先卸除</div>
        )}
        <button className="btn-ink btn-ink-sm" onClick={() => setSelectedId(null)}>取消</button>
        {batchSellBlock && <div style={{ marginTop: 8, borderTop: '1px dashed var(--ink-4)', paddingTop: 8 }}>{batchSellBlock}</div>}
      </div>
    )
  }

  // ── 黑水晶 ──
  if (selItem.isCrystal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ borderBottom: '1px solid var(--ink-4)', paddingBottom: 8 }}>
          <div className="brush" style={{ fontSize: 14, color: '#6a3d8a' }}>{selItem.n}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>
            {selItem.absorbedAttrs.length > 0 ? selItem.k : '暂无属性'}
          </div>
        </div>
        <button className="btn-ink btn-ink-primary btn-ink-sm"
          style={{ background: '#6a3d8a', borderColor: '#6a3d8a', color: '#fff' }}
          onClick={() => { setCrystalMode(selItem.crystalUid); setSelectedId(null) }}>
          吸取装备属性
        </button>
        <button className="btn-ink btn-ink-sm" onClick={() => setSelectedId(null)}>取消</button>
      </div>
    )
  }

  // ── 消耗品 / 材料 ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ borderBottom: '1px solid var(--ink-4)', paddingBottom: 8 }}>
        <div className="brush" style={{ fontSize: 14, color: selItem.nameColor }}>{selItem.n}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>
          {selItem.t}　持有 ×{selItem.qty}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3a5a8a', marginTop: 4 }}>{selItem.k}</div>
      </div>
      {selItem.canUse && (
        <button className="btn-ink btn-ink-primary btn-ink-sm"
          onClick={() => {
            const res = useItemFromBagAction(selItem.id)
            if (!res.ok) showMsg(res.reason ?? '使用失败', false)
            else if (selItem.qty <= 1) setSelectedId(null)
          }}>
          使 用
        </button>
      )}
      {selItem.canSell && (
        <>
          <button className="btn-ink btn-ink-sm"
            style={{ color: 'var(--gold-2)', borderColor: 'var(--gold-2)' }}
            onClick={() => {
              const res = sellBagItemAction(selItem.id, 1)
              if (res.ok) showMsg(`出售 1 件，获得 ${res.tael.toLocaleString()} 银两`)
              else showMsg(res.reason ?? '出售失败', false)
            }}>
            出售 ×1　{selItem.sellPrice?.toLocaleString()} 银
          </button>
          {selItem.qty > 1 && (
            <button className="btn-ink btn-ink-sm"
              style={{ color: 'var(--gold-2)', borderColor: 'var(--gold-2)' }}
              onClick={() => {
                const res = sellBagItemAction(selItem.id, selItem.qty)
                if (res.ok) { showMsg(`出售 ${selItem.qty} 件，获得 ${res.tael.toLocaleString()} 银两`); setSelectedId(null) }
                else showMsg(res.reason ?? '出售失败', false)
              }}>
              出售全部 ×{selItem.qty}　{(selItem.sellPrice * selItem.qty).toLocaleString()} 银
            </button>
          )}
        </>
      )}
      {!selItem.canSell && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)' }}>不可出售</div>
      )}
      <button className="btn-ink btn-ink-sm" onClick={() => setSelectedId(null)}>取消</button>
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
  (it) => it.t === '材料' || it.t === '特殊' || it.t === '水晶',
]
function tabLabel(items) {
  const c = TAB_FILTERS.map(fn => items.filter(fn).length)
  return [`全部 ${c[0]}`, `丹药 ${c[1]}`, `玲珑 ${c[2]}`, `装备 ${c[3]}`, `其他 ${c[4]}`]
}

const COLS = 9
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
  const [activeTab, setActiveTab]     = useState(0)
  const [selectedId, setSelectedId]   = useState(null)
  const [tooltip, setTooltip]         = useState(null)
  const [page, setPage]               = useState(0)
  const [msg, setMsg]                 = useState(null)
  const [crystalMode, setCrystalMode] = useState(null)

  const equipped = char.equipped ?? {}

  function showMsg(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 2800)
  }

  const equippedUids   = new Set(Object.values(equipped).filter(v => typeof v === 'string'))
  const consumableItems = (char.bag ?? []).map(consumableEntryToDisplay).filter(Boolean)
  const crystalItems    = (char.crystalBag ?? []).map(crystalToDisplay)
  const equipItems      = (char.equipBag ?? [])
    .filter(inst => !equippedUids.has(inst.uid))
    .map(equipInstToDisplay).filter(Boolean)

  const allItems   = [...consumableItems, ...crystalItems, ...equipItems]
  const filtered   = allItems.filter(TAB_FILTERS[activeTab])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages - 1)
  const pageItems  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)
  const slots      = buildSlots(pageItems)
  const tabs       = tabLabel(allItems)

  function handleMouseEnter(e, item) {
    const r  = e.currentTarget.getBoundingClientRect()
    const TW = item.isEquip ? 340 : 220
    // 先贴右侧；右侧放不下则贴左侧
    const left = (r.right + 8 + TW < window.innerWidth - 6)
      ? r.right + 8
      : Math.max(6, r.left - TW - 8)
    // 顶部与格子对齐，底部溢出时上移，但不超出屏幕顶部
    const top = Math.max(6, Math.min(r.top, window.innerHeight - 6 - 320))
    setTooltip({ item, left, top })
  }

  const selItem = selectedId ? allItems.find(it => it.id === selectedId) : null

  return (
    <div className="paper-bg" style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden', fontFamily: 'var(--font-body)',
    }}>
      <PanelHead title="行 装 · 锦囊" sub="INVENTORY"
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            共 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>{filtered.length}</span> 件
          </span>
        }
      />

      <div style={{ position: 'absolute', inset: '60px 14px 14px 14px', display: 'flex', gap: 10 }}>

        {/* ── 左：格栅区 ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Tabs */}
          <div className="tab-list" style={{ flexShrink: 0 }}>
            {tabs.map((t, i) => (
              <div key={i} className={'tab' + (i === activeTab ? ' active' : '')}
                onClick={() => { setActiveTab(i); setSelectedId(null); setPage(0) }}
                style={{ padding: '3px 10px', fontSize: 11, cursor: 'pointer' }}>
                {t}
              </div>
            ))}
          </div>

          {/* 消息提示 */}
          {msg && (
            <div style={{
              flexShrink: 0, padding: '4px 10px',
              background: msg.ok ? 'rgba(45,138,45,0.12)' : 'rgba(163,55,58,0.12)',
              border: `1px solid ${msg.ok ? 'var(--bamboo)' : 'var(--vermilion)'}`,
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: msg.ok ? 'var(--bamboo)' : 'var(--vermilion)',
            }}>{msg.text}</div>
          )}

          {/* Grid */}
          <div style={{
            flex: 1, minHeight: 0, overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
            gap: 4,
          }}>
            {slots.map((it, i) =>
              it ? (
                <div key={it.id + '_' + i} style={{
                  padding: '3px 3px 4px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 1,
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  minHeight: 0, minWidth: 0,
                  border: `1px solid ${
                    selectedId === it.id ? 'var(--vermilion)'
                    : crystalMode && it.isEquip && it.inst?.extra?.length ? '#6a3d8a'
                    : it.borderColor}`,
                  background: selectedId === it.id ? '#fff8ea' : 'var(--paper)',
                  boxShadow: selectedId === it.id ? '0 0 0 2px rgba(163,55,58,0.2)' : undefined,
                }}
                  onClick={() => {
                    if (crystalMode && it.isEquip && it.inst) {
                      const res = absorbToCrystalAction(crystalMode, it.inst.uid)
                      if (res.ok) {
                        const ex = res.absorbed
                        showMsg(`已吸取「${ex.label} +${ex.value}${ex.isPct ? '%' : ''}」`)
                      } else {
                        showMsg(res.reason ?? '吸取失败', false)
                      }
                      setCrystalMode(null); setSelectedId(null); return
                    }
                    setSelectedId(it.id === selectedId ? null : it.id)
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, it)}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div style={{ position: 'absolute', top: 2, left: 3, fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--ink-4)', lineHeight: 1 }}>
                    {it.t}
                  </div>
                  {it.qty != null && <span className="slot-count">×{it.qty}</span>}
                  <Seal size={18} round style={{ flexShrink: 0 }}>{it.glyph}</Seal>
                  <span className="brush" style={{
                    fontSize: 10, color: it.nameColor, lineHeight: 1.1,
                    textAlign: 'center', maxWidth: '100%',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{it.n}</span>
                </div>
              ) : (
                <div key={i} className="slot slot-empty"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, minHeight: 0 }} />
              )
            )}
          </div>

          {allItems.length === 0 && (
            <div style={{ position: 'absolute', inset: '80px 220px 40px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontFamily: 'var(--font-brush)', fontSize: 15, color: 'var(--ink-4)' }}>囊中空空，出门打怪去</span>
            </div>
          )}

          {/* 分页 */}
          <div style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
            paddingTop: 6, borderTop: '1px solid var(--ink-4)',
          }}>
            <button className="btn-ink btn-ink-sm" disabled={safePage === 0}
              onClick={() => setPage(p => p - 1)} style={{ opacity: safePage === 0 ? 0.4 : 1 }}>
              上一页
            </button>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--ink-2)', minWidth: 60, textAlign: 'center' }}>
              {safePage + 1} / {totalPages}
            </span>
            <button className="btn-ink btn-ink-sm" disabled={safePage >= totalPages - 1}
              onClick={() => setPage(p => p + 1)} style={{ opacity: safePage >= totalPages - 1 ? 0.4 : 1 }}>
              下一页
            </button>
          </div>
        </div>

        {/* ── 右：动作面板 ── */}
        <div style={{
          width: 180, flexShrink: 0,
          background: 'rgba(243,237,224,0.7)',
          border: '1px solid var(--ink-4)',
          padding: '10px 10px',
          overflow: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', marginBottom: 8, letterSpacing: 1 }}>
            {crystalMode ? '吸取模式' : selItem ? '物品操作' : '背包操作'}
          </div>
          <ActionPanel
            selItem={selItem}
            equipped={equipped}
            equipBag={char.equipBag ?? []}
            crystalMode={crystalMode}
            setCrystalMode={setCrystalMode}
            setSelectedId={setSelectedId}
            activeTab={activeTab}
            showMsg={showMsg}
          />
        </div>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.left, top: tooltip.top, zIndex: 9999, pointerEvents: 'none', maxHeight: '80vh', overflowY: 'auto' }}>
          {tooltip.item.isEquip
            ? <EquipTooltip item={tooltip.item} equipped={equipped} equipBag={char.equipBag ?? []} />
            : <ConsumableTooltip item={tooltip.item} />
          }
        </div>
      )}
    </div>
  )
}
