import React, { useState, useSyncExternalStore } from 'react'
import { Seal, PanelHead, SubHead, Bar } from './common.jsx'
import {
  subscribe,
  getSnapshot,
  equipItemAction,
  unequipItemAction,
} from '../game/characterStore.js'
import {
  EQUIP_SLOT_DEFS,
  getEquipByCode,
  getEquipsBySlotForSchool,
  summarizeEquip,
} from '../game/items/equipCatalog.js'
import { computeHeroDerived } from '../game/playerSheet.js'

// ── 属性色 ──────────────────────────────────────────────────────────────────
const STAT_COLOR = {
  攻: 'var(--vermilion)',
  防: '#5a6e8a',
  血: '#3a8040',
  法: '#3a5a8a',
  速: '#8a6a3a',
}

function StatBadge({ label, value }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 9,
      color: STAT_COLOR[label] ?? 'var(--ink-2)',
      background: 'rgba(243,237,224,0.7)',
      border: `1px solid ${STAT_COLOR[label] ?? 'var(--ink-4)'}`,
      borderRadius: 2, padding: '1px 5px', whiteSpace: 'nowrap',
    }}>
      {label} {value.toLocaleString()}
    </span>
  )
}

// ── 装备条目（目录列表里一行）──────────────────────────────────────────────
function CatalogRow({ item, isEquipped, onEquip, onUnequip, compareItem }) {
  const s = summarizeEquip(item)
  const a = item.base_attrs ?? {}

  // 与当前装备比较（显示 ±delta）
  const cmp = compareItem ? summarizeEquip(compareItem) : null
  const delta = (key) => {
    if (!cmp) return null
    const cur = Number(compareItem.base_attrs?.[key]) || 0
    const next = Number(a[key]) || 0
    const diff = next - cur
    if (diff === 0) return null
    return diff > 0
      ? <span style={{ color: '#3a8040', fontFamily: 'var(--font-mono)', fontSize: 8 }}>+{diff.toLocaleString()}</span>
      : <span style={{ color: 'var(--vermilion)', fontFamily: 'var(--font-mono)', fontSize: 8 }}>{diff.toLocaleString()}</span>
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px',
      borderBottom: '1px solid var(--ink-4)',
      background: isEquipped ? 'rgba(163,55,58,0.06)' : undefined,
    }}>
      {/* 等级 */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9,
        color: 'var(--ink-3)', width: 30, textAlign: 'center', flexShrink: 0,
      }}>
        Lv{item.item_level}
      </div>

      {/* 名称 + 部位 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="brush" style={{
          fontSize: 13,
          color: isEquipped ? 'var(--vermilion)' : 'var(--ink)',
        }}>
          {item.item_name}
        </span>
        <span style={{ marginLeft: 5, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-4)' }}>
          {item.item_subtype_zh}
        </span>
        {isEquipped && (
          <span style={{
            marginLeft: 5, fontFamily: 'var(--font-mono)', fontSize: 8,
            color: 'var(--vermilion)', opacity: 0.7,
          }}>● 已装备</span>
        )}
      </div>

      {/* 属性 */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 160 }}>
        {a.hurt    ? <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}><StatBadge label="攻" value={a.hurt}    />{delta('hurt')}</span>    : null}
        {a.defense ? <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}><StatBadge label="防" value={a.defense} />{delta('defense')}</span> : null}
        {a.blood   ? <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}><StatBadge label="血" value={a.blood}   />{delta('blood')}</span>   : null}
        {a.magic   ? <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}><StatBadge label="法" value={a.magic}   />{delta('magic')}</span>   : null}
        {a.speed   ? <span style={{ display: 'flex', gap: 2, alignItems: 'center' }}><StatBadge label="速" value={a.speed}   />{delta('speed')}</span>   : null}
      </div>

      {/* 操作按钮 */}
      {isEquipped ? (
        <button
          className="btn-ink btn-ink-sm"
          onClick={onUnequip}
          style={{ fontSize: 10, padding: '3px 8px', flexShrink: 0 }}
        >
          卸除
        </button>
      ) : (
        <button
          className="btn-ink btn-ink-primary btn-ink-sm"
          onClick={onEquip}
          style={{ fontSize: 10, padding: '3px 8px', flexShrink: 0 }}
        >
          装备
        </button>
      )}
    </div>
  )
}

// ── 主界面 ─────────────────────────────────────────────────────────────────
export default function EquipScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [activeSlot, setActiveSlot] = useState('weapon')
  const [levelFilter, setLevelFilter] = useState('')

  const equipped = char.equipped ?? {}
  const d = computeHeroDerived(char.level, char)

  // 当前槽位目录条目（按等级降序）
  const slotItems = getEquipsBySlotForSchool(activeSlot, char.school)
    .filter(item => {
      if (!levelFilter) return true
      const n = parseInt(levelFilter, 10)
      return !Number.isNaN(n) ? item.item_level <= n : true
    })
    .slice()
    .sort((a, b) => b.item_level - a.item_level)

  const equippedCode = equipped[activeSlot] ?? null
  const equippedItem = equippedCode ? getEquipByCode(equippedCode) : null

  return (
    <div className="paper-bg" style={{
      width: '100%', height: '100%', position: 'relative',
      overflow: 'hidden', fontFamily: 'var(--font-body)',
    }}>
      <PanelHead
        title="装 备 · 行 头"
        sub="EQUIPMENT"
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
            {char.name} · Lv{char.level} · {char.school}系
          </span>
        }
      />

      <div style={{
        position: 'absolute', inset: '60px 0 0 0',
        display: 'flex',
      }}>

        {/* ── 左栏：槽位 + 综合加成 ── */}
        <div style={{
          width: 220, flexShrink: 0,
          borderRight: '1px solid var(--ink-4)',
          display: 'flex', flexDirection: 'column',
          padding: '12px 0',
          overflowY: 'auto',
        }}>
          <div style={{ padding: '0 14px 8px', borderBottom: '1px solid var(--ink-4)', marginBottom: 8 }}>
            <SubHead title="部位" sub="SLOTS" />
          </div>

          {EQUIP_SLOT_DEFS.map(slot => {
            const code = equipped[slot.key] ?? null
            const item = code ? getEquipByCode(code) : null
            const isActive = activeSlot === slot.key
            return (
              <button
                key={slot.key}
                onClick={() => setActiveSlot(slot.key)}
                className={'btn-ink' + (isActive ? ' btn-ink-primary' : '')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  margin: '2px 10px', padding: '7px 10px',
                  textAlign: 'left',
                  background: isActive ? undefined : item ? 'rgba(163,55,58,0.04)' : undefined,
                }}
              >
                <Seal size={26} round style={{ flexShrink: 0, fontSize: 11 }}>
                  {slot.glyph}
                </Seal>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-display)', color: isActive ? 'var(--paper)' : 'var(--ink-2)' }}>
                    {slot.name}
                  </div>
                  <div className="brush" style={{
                    fontSize: 12, lineHeight: 1.1,
                    color: isActive ? 'rgba(243,237,224,0.85)' : item ? 'var(--ink)' : 'var(--ink-4)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item ? item.item_name : '— 空 —'}
                  </div>
                </div>
              </button>
            )
          })}

          {/* 装备综合加成 */}
          <div style={{ margin: '12px 10px 0', padding: '10px', border: '1px solid var(--ink-4)', borderRadius: 3, background: 'rgba(243,237,224,0.5)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: 1 }}>
              装备加成汇总
            </div>
            {[
              { label: '攻击', value: d.equipBonus.hurt,    color: 'var(--vermilion)' },
              { label: '防御', value: d.equipBonus.defense,  color: '#5a6e8a' },
              { label: '气血', value: d.equipBonus.blood,    color: '#3a8040' },
              { label: '法力', value: d.equipBonus.magic,    color: '#3a5a8a' },
              { label: '速度', value: d.equipBonus.speed,    color: '#8a6a3a' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: value > 0 ? color : 'var(--ink-4)', fontWeight: value > 0 ? 600 : 'normal' }}>
                  {value > 0 ? `+${value.toLocaleString()}` : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* 战斗属性面板预览 */}
          <div style={{ margin: '8px 10px 0', padding: '10px', border: '1px solid var(--ink-4)', borderRadius: 3, background: 'rgba(243,237,224,0.5)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 6, letterSpacing: 1 }}>
              当前面板
            </div>
            {[
              { label: '气血', value: d.maxHp },
              { label: '法力', value: d.maxMp },
              { label: '物攻', value: d.phyDmg },
              { label: '法攻', value: d.magDmg },
              { label: '防御', value: d.def },
              { label: '速度', value: d.speed },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink)', fontWeight: 600 }}>
                  {value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 右栏：目录列表 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* 工具栏 */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid var(--ink-4)',
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <SubHead
              title={EQUIP_SLOT_DEFS.find(s => s.key === activeSlot)?.name ?? ''}
              sub={`${slotItems.length} 件`}
            />
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
              等级 ≤
            </span>
            <input
              type="number"
              placeholder="不限"
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value)}
              style={{
                width: 60, fontFamily: 'var(--font-mono)', fontSize: 11,
                border: '1px solid var(--ink-4)', borderRadius: 3,
                padding: '3px 6px', background: 'var(--paper)',
                color: 'var(--ink)',
              }}
            />
            {levelFilter && (
              <button className="btn-ink btn-ink-sm" onClick={() => setLevelFilter('')} style={{ fontSize: 10 }}>
                清除
              </button>
            )}
          </div>

          {/* 当前已装备提示 */}
          {equippedItem && (
            <div style={{
              padding: '8px 16px', borderBottom: '1px dashed var(--ink-4)',
              background: 'rgba(163,55,58,0.04)',
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 1 }}>
                当前
              </span>
              <span className="brush" style={{ fontSize: 13, color: 'var(--vermilion)' }}>
                {equippedItem.item_name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
                Lv{equippedItem.item_level}
              </span>
              <div style={{ flex: 1 }} />
              <button
                className="btn-ink btn-ink-sm"
                onClick={() => unequipItemAction(activeSlot)}
                style={{ fontSize: 10, padding: '3px 8px' }}
              >
                卸除
              </button>
            </div>
          )}

          {/* 目录滚动列表 */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {slotItems.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-brush)', fontSize: 15, color: 'var(--ink-4)' }}>
                  此槽无匹配装备
                </span>
              </div>
            ) : (
              slotItems.map(item => (
                <CatalogRow
                  key={item.item_info_code}
                  item={item}
                  isEquipped={equippedCode === item.item_info_code}
                  compareItem={equippedItem && equippedItem.item_info_code !== item.item_info_code ? equippedItem : null}
                  onEquip={() => equipItemAction(activeSlot, item.item_info_code)}
                  onUnequip={() => unequipItemAction(activeSlot)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
