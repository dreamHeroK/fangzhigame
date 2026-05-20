import React, { useState, useSyncExternalStore } from 'react'
import { Seal, PanelHead, CornerDeco } from './common.jsx'
import {
  subscribe, getSnapshot,
  forgeEquipAction, smeltEquipAction,
  FORGE_MAX_LEVEL, FORGE_SUCCESS_RATES, FORGE_PITY_STEPS,
  forgeCost, MAX_EXTRA_ATTRS,
  EQUIP_SELL_PRICE, FORGE_STONE_ID,
} from '../game/characterStore.js'
import { getEquipByCode, FORGE_BONUS_PER_LEVEL, forgeBonusPct } from '../game/items/equipCatalog.js'
import { QUALITY, formatExtra, isExtraMax } from '../game/items/equipQuality.js'

// ── 装备选择列 ────────────────────────────────────────────────────────────────
function EquipRow({ inst, selected, onClick }) {
  const base = getEquipByCode(inst.baseCode)
  if (!base) return null
  const qDef = QUALITY[inst.quality] ?? QUALITY.white
  const fl = inst.forgeLevel ?? 0
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        cursor: 'pointer',
        background: selected ? '#fff8ea' : 'rgba(243,237,224,0.7)',
        border: `1px solid ${selected ? 'var(--vermilion)' : qDef.borderColor}`,
        marginBottom: 4,
      }}
    >
      <div style={{
        width: 32, height: 32, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${qDef.borderColor}`,
      }}>
        <Seal size={16} round style={{ background: qDef.color }}>{base.item_name[0]}</Seal>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="brush" style={{ fontSize: 12, color: qDef.color }}>{base.item_name}</span>
          {fl > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold-2)', fontWeight: 700 }}>+{fl}</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
          Lv{base.item_level} · {base.item_subtype_zh} · 额外{inst.extra?.length ?? 0}/{MAX_EXTRA_ATTRS}条
        </div>
      </div>
    </div>
  )
}

// ── 水晶选择行 ────────────────────────────────────────────────────────────────
function CrystalRow({ crystal, selected, onClick }) {
  const cnt = crystal.absorbedAttrs?.length ?? 0
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
        cursor: 'pointer',
        background: selected ? '#f4eeff' : 'rgba(243,237,224,0.7)',
        border: `1px solid ${selected ? '#6a3d8a' : '#9a7ab8'}`,
        marginBottom: 4,
      }}
    >
      <Seal size={28} round style={{ background: '#6a3d8a', flexShrink: 0 }}>黑</Seal>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6a3d8a' }}>
          黑水晶 {cnt > 0 ? `(${cnt} 条属性)` : '(空)'}
        </div>
        {cnt > 0 && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: 2 }}>
            {crystal.absorbedAttrs.map(a => formatExtra(a)).join(' · ')}
          </div>
        )}
      </div>
    </div>
  )
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function ForgeScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [tab, setTab]           = useState('forge')   // 'forge' | 'smelt'
  const [selEquipUid, setSelEq] = useState(null)
  const [selCrystalUid, setSelC]= useState(null)
  const [msg, setMsg]           = useState(null)

  function showMsg(text, ok = true) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 2800)
  }

  const equippedUids = new Set(Object.values(char.equipped ?? {}).filter(v => typeof v === 'string'))
  const _seenUids = new Set()
  const allEquip = (char.equipBag ?? []).filter(i => {
    if (!getEquipByCode(i.baseCode)) return false
    if (_seenUids.has(i.uid)) return false
    _seenUids.add(i.uid)
    return true
  })
  const equippedInst   = allEquip.filter(i =>  equippedUids.has(i.uid))
  const unequippedInst = allEquip.filter(i => !equippedUids.has(i.uid))

  const selInst   = selEquipUid ? allEquip.find(i => i.uid === selEquipUid) : null
  const selBase   = selInst ? getEquipByCode(selInst.baseCode) : null
  const selQDef   = selInst ? (QUALITY[selInst.quality] ?? QUALITY.white) : null
  const selForge  = selInst?.forgeLevel ?? 0
  const selExtra  = selInst?.extra ?? []
  const nextCost   = selInst ? forgeCost(selForge) : 0
  const stoneQty   = (char.bag ?? []).find(e => e.itemId === FORGE_STONE_ID)?.qty ?? 0
  const selPity    = selInst?.forgePity ?? 0
  const isGuarante = selPity >= 100
  const successRate = selForge < FORGE_MAX_LEVEL ? (FORGE_SUCCESS_RATES[selForge] ?? 15) : 0
  const canForge   = selInst && selForge < FORGE_MAX_LEVEL && (char.tael ?? 0) >= nextCost && stoneQty >= 1

  const selCrystal = selCrystalUid ? (char.crystalBag ?? []).find(c => c.uid === selCrystalUid) : null
  const canSmelt   = selInst && selCrystal && (selCrystal.absorbedAttrs?.length ?? 0) > 0
                  && (selExtra.length < MAX_EXTRA_ATTRS)

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="锻 造 坊" sub="FORGE"
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            银两 <span style={{ color: 'var(--gold-2)', fontWeight: 700 }}>{(char.tael ?? 0).toLocaleString()}</span>
          </span>
        }
      />

      <div style={{ position: 'absolute', inset: '60px 14px 14px 14px', display: 'flex', gap: 10 }}>

        {/* 左：装备列表 */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>已装备</div>
          <div style={{ overflow: 'auto', maxHeight: '45%' }}>
            {equippedInst.map(i => (
              <EquipRow key={i.uid} inst={i} selected={selEquipUid === i.uid} onClick={() => setSelEq(i.uid === selEquipUid ? null : i.uid)} />
            ))}
            {equippedInst.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>无</div>}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>背包中</div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {unequippedInst.map(i => (
              <EquipRow key={i.uid} inst={i} selected={selEquipUid === i.uid} onClick={() => setSelEq(i.uid === selEquipUid ? null : i.uid)} />
            ))}
            {unequippedInst.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>无</div>}
          </div>
        </div>

        {/* 右：操作面板 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>

          {/* Tab 切换 */}
          <div className="tab-list" style={{ flexShrink: 0 }}>
            {[['forge', '强化'], ['smelt', '熔炼']].map(([id, label]) => (
              <div key={id} className={'tab' + (tab === id ? ' active' : '')}
                style={{ padding: '3px 18px', fontSize: 12, cursor: 'pointer' }}
                onClick={() => setTab(id)}>
                {label}
              </div>
            ))}
          </div>

          {/* 消息 */}
          {msg && (
            <div style={{
              padding: '5px 12px', flexShrink: 0,
              background: msg.ok ? 'rgba(45,138,45,0.12)' : 'rgba(163,55,58,0.12)',
              border: `1px solid ${msg.ok ? 'var(--bamboo)' : 'var(--vermilion)'}`,
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: msg.ok ? 'var(--bamboo)' : 'var(--vermilion)',
            }}>
              {msg.text}
            </div>
          )}

          {!selInst ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-brush)', fontSize: 14, color: 'var(--ink-4)' }}>
              ← 选择左侧装备
            </div>
          ) : tab === 'forge' ? (
            /* ── 强化面板 ── */
            <div className="paper-bg" style={{ flex: 1, padding: 14, border: '1px solid var(--ink-4)', position: 'relative', overflow: 'auto' }}>
              <CornerDeco />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                <span className="brush" style={{ fontSize: 16, color: selQDef.color }}>{selBase.item_name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-2)', fontWeight: 700 }}>
                  {selForge > 0 ? `+${selForge}` : '未强化'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                  / +{FORGE_MAX_LEVEL} 上限
                </span>
              </div>

              {/* 强化等级进度条 */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 14, alignItems: 'flex-end' }}>
                {Array.from({ length: FORGE_MAX_LEVEL }, (_, i) => {
                  const filled = i < selForge
                  const isCur  = i === selForge - 1
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 8,
                        color: filled ? 'var(--gold-2)' : 'var(--ink-4)',
                        fontWeight: isCur ? 700 : 400,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{
                        width: '100%',
                        height: isCur ? 20 : filled ? 16 : 10,
                        borderRadius: 3,
                        background: filled
                          ? `linear-gradient(180deg, #ffe080 0%, var(--gold-2) 60%, #b07800 100%)`
                          : 'var(--ink-4)',
                        boxShadow: filled ? '0 0 6px rgba(200,160,0,0.55)' : 'none',
                        transition: 'height 0.15s',
                      }} />
                    </div>
                  )
                })}
              </div>

              {/* 成功率 + 保底进度 */}
              {selForge < FORGE_MAX_LEVEL && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    <span style={{ color: 'var(--ink-3)' }}>强化成功率</span>
                    <span style={{
                      color: isGuarante ? '#c87020' : successRate >= 60 ? 'var(--bamboo)' : successRate >= 35 ? 'var(--gold-2)' : 'var(--vermilion)',
                      fontWeight: 700, fontSize: 14,
                    }}>
                      {isGuarante ? '100% 必中' : `${successRate}%`}
                    </span>
                    <span style={{ color: 'var(--ink-3)', fontSize: 10 }}>
                      本级 +{FORGE_BONUS_PER_LEVEL[selForge] ?? 0}%　累计 +{forgeBonusPct(selForge)}% → +{forgeBonusPct(selForge + 1)}%
                    </span>
                  </div>
                  {/* 保底进度条 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                      保底进度
                    </span>
                    <div style={{ flex: 1, height: 10, background: 'var(--ink-4)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%',
                        width: `${selPity}%`,
                        background: isGuarante
                          ? 'linear-gradient(90deg, #c87020, #ff6a00)'
                          : `linear-gradient(90deg, #6a3d8a, #9a5adc)`,
                        boxShadow: isGuarante ? '0 0 8px rgba(200,112,32,0.7)' : '0 0 5px rgba(106,61,138,0.5)',
                        transition: 'width 0.3s',
                        borderRadius: 5,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
                      color: isGuarante ? '#c87020' : '#6a3d8a',
                    }}>
                      {selPity}%{isGuarante ? ' 必中！' : ` (失败+${FORGE_PITY_STEPS[selForge] ?? 2}%)`}
                    </span>
                  </div>
                </div>
              )}

              {/* 额外词条列表 */}
              {selExtra.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>
                    额外属性 {selExtra.length}/{MAX_EXTRA_ATTRS}
                  </div>
                  {selExtra.map((ex, i) => {
                    const max = isExtraMax(ex)
                    const suf = ex.isPct ? '%' : ''
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, marginBottom: 2 }}>
                        <span style={{ color: selQDef.color }}>{ex.label} +{ex.value}{suf}</span>
                        {ex.lo != null && <span style={{ color: 'var(--ink-4)', fontSize: 9 }}>[{ex.lo}{suf}~{ex.hi}{suf}]</span>}
                        {max && <span style={{ color: '#c87020', fontSize: 9, fontWeight: 700 }}>满</span>}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* 强化按钮 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {selForge < FORGE_MAX_LEVEL ? (
                  <>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      强化至 <span style={{ color: 'var(--gold-2)', fontWeight: 700 }}>+{selForge + 1}</span>
                      {' '}需 <span style={{ color: 'var(--vermilion)' }}>{nextCost.toLocaleString()} 银两</span>
                      {' '}+ <span style={{ color: '#6a3d8a' }}>强化石 ×1</span>
                      <span style={{ color: 'var(--ink-3)', marginLeft: 6 }}>（持有 {stoneQty}）</span>
                    </div>
                    <button
                      className="btn-ink btn-ink-primary"
                      disabled={!canForge}
                      style={isGuarante ? { background: '#c87020', borderColor: '#c87020' } : {}}
                      onClick={() => {
                        const res = forgeEquipAction(selEquipUid)
                        if (!res.ok) { showMsg(res.reason ?? '强化失败', false); return }
                        if (res.success) showMsg(`强化成功！${selBase.item_name} 提升至 +${res.forgeLevel}`)
                        else showMsg(`强化失败…保底进度 ${res.pity}%，再接再厉`, false)
                      }}
                    >
                      {isGuarante ? '强化（必中）' : '强化'}
                    </button>
                    {(char.tael ?? 0) < nextCost && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--vermilion)' }}>银两不足</span>
                    )}
                    {stoneQty < 1 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--vermilion)' }}>强化石不足</span>
                    )}
                  </>
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-2)' }}>
                    已达满级 +{FORGE_MAX_LEVEL}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* ── 熔炼面板 ── */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
              {/* 目标装备信息 */}
              <div className="paper-bg" style={{ padding: 10, border: `1px solid ${selQDef.borderColor}`, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span className="brush" style={{ fontSize: 14, color: selQDef.color }}>{selBase.item_name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                    额外属性 {selExtra.length}/{MAX_EXTRA_ATTRS}条
                    {selExtra.length >= MAX_EXTRA_ATTRS && (
                      <span style={{ color: 'var(--vermilion)', marginLeft: 6 }}>已满，无法熔炼</span>
                    )}
                  </span>
                </div>
                {selExtra.map((ex, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: selQDef.color, marginBottom: 1 }}>
                    {formatExtra(ex)}{isExtraMax(ex) ? ' 满' : ''}
                  </div>
                ))}
              </div>

              {/* 黑水晶列表 */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', flexShrink: 0 }}>
                选择黑水晶（{(char.crystalBag ?? []).length} 颗）
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                {(char.crystalBag ?? []).length === 0 ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', padding: 8 }}>
                    没有黑水晶，请前往商城购买
                  </div>
                ) : (
                  (char.crystalBag ?? []).map(c => (
                    <CrystalRow
                      key={c.uid} crystal={c}
                      selected={selCrystalUid === c.uid}
                      onClick={() => setSelC(c.uid === selCrystalUid ? null : c.uid)}
                    />
                  ))
                )}
              </div>

              {/* 熔炼按钮 */}
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <button
                  className="btn-ink btn-ink-primary"
                  disabled={!canSmelt}
                  style={canSmelt ? { background: '#6a3d8a', borderColor: '#6a3d8a' } : {}}
                  onClick={() => {
                    const res = smeltEquipAction(selEquipUid, selCrystalUid)
                    if (res.ok) {
                      showMsg(`熔炼成功！注入 ${res.added} 条属性`)
                      setSelC(null)
                    } else {
                      showMsg(res.reason ?? '熔炼失败', false)
                    }
                  }}
                >
                  熔 炼
                </button>
                {!selCrystal && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>请选择水晶</span>}
                {selCrystal && !selCrystal.absorbedAttrs?.length && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--vermilion)' }}>水晶上没有属性</span>
                )}
                {selExtra.length >= MAX_EXTRA_ATTRS && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--vermilion)' }}>
                    该装备额外属性已达上限
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
