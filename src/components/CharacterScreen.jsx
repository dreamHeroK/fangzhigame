import React, { useState, useEffect, useSyncExternalStore } from 'react'
import { Seal, Placeholder, CornerDeco, PanelHead, SubHead, Cell, Tag, useLongPress } from './common.jsx'
import {
  subscribe, getSnapshot,
  addStatToCharAction, addAffinityToCharAction, autoAllocateToCharAction, resetAllocToCharAction,
  equipItemForChar, unequipItemForChar,
  createCharacterAction, switchCharacterAction, deleteCharacterAction,
} from '../game/characterStore.js'
import {
  computeHeroDerived,
  getAttributePointBudget,
  getAffinityPointBudget,
  sumFour,
  sumAffinity,
  AFFINITY_CAP_PER_ELEMENT,
  getEffectiveAttributeRates,
} from '../game/playerSheet.js'
import { expRequiredToNextLevel } from '../game/characterLevelConfig.js'
import { EQUIP_SLOT_DEFS, getEquipByCode } from '../game/items/equipCatalog.js'
import { QUALITY } from '../game/items/equipQuality.js'

// ── 装备槽布局（左4右4，首饰独占一行）────────────────────────────────────
const LEFT_SLOTS  = ['weapon', 'hat', 'cloth', 'shoe']
const RIGHT_SLOTS = ['belt', 'lingbao', 'bracelet1', 'bracelet2']
const BOTTOM_SLOTS = ['necklace', 'pendant']

/**
 * slotKey      - 槽位 key
 * equippedUid  - equipped[slotKey]（uid 字符串或 null）
 * equipBag     - 共享装备背包实例数组
 * allEquippedUids - Set<uid> 所有角色已装备的 uid（用于过滤候选）
 * charId       - 操作目标角色 id
 */
function EquipSlotBtn({ slotKey, equippedUid, equipBag, allEquippedUids, charId }) {
  const [open, setOpen] = useState(false)
  const def = EQUIP_SLOT_DEFS.find(s => s.key === slotKey)

  // 解析当前槽位已装备的实例和 catalog 条目
  let equippedInst = null
  let equippedItem = null
  if (typeof equippedUid === 'string') {
    equippedInst = equipBag.find(i => i.uid === equippedUid) ?? null
    if (equippedInst) equippedItem = getEquipByCode(equippedInst.baseCode)
  } else if (typeof equippedUid === 'number') {
    equippedItem = getEquipByCode(equippedUid)  // 旧存档兼容
  }

  const q = equippedInst ? QUALITY[equippedInst.quality] : null
  const borderColor = q?.borderColor ?? (equippedItem ? '#3a6bb5' : 'var(--ink-3)')
  const nameColor   = q?.color ?? (equippedItem ? 'var(--ink)' : 'var(--ink-4)')

  // 候选列表：未被任何角色装备的实例中符合此槽位的，按等级降序
  const candidates = equipBag
    .filter(inst => !allEquippedUids.has(inst.uid) || inst.uid === equippedUid)
    .map(inst => ({ inst, item: getEquipByCode(inst.baseCode) }))
    .filter(({ item }) => item && def?.filter(item))
    .sort((a, b) => b.item.item_level - a.item.item_level)

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          height: 58, padding: '3px 5px', display: 'flex', flexDirection: 'column', gap: 1,
          border: `1px solid ${borderColor}`,
          background: equippedItem ? 'rgba(58,107,181,0.07)' : 'var(--paper)',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
          {def?.name}
        </div>
        <div className="brush" style={{
          fontSize: 11, lineHeight: 1.2, color: nameColor,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {equippedItem ? equippedItem.item_name : '未配'}
        </div>
        {equippedItem && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span>Lv{equippedItem.item_level}{q && q.key !== 'white' ? ` [${q.label}]` : ''}</span>
            {(equippedInst?.forgeLevel ?? 0) > 0 && (
              <span style={{ color: 'var(--gold-2)', fontWeight: 700, fontSize: 9 }}>
                +{equippedInst.forgeLevel}
              </span>
            )}
          </div>
        )}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 50,
          background: 'var(--paper-dark)', border: '1px solid var(--ink-2)',
          minWidth: 170, maxHeight: 220, overflowY: 'auto', boxShadow: '2px 4px 12px rgba(0,0,0,0.25)',
        }}>
          {equippedItem && (
            <div
              onClick={() => { unequipItemForChar(slotKey, charId); setOpen(false) }}
              style={{ padding: '5px 8px', cursor: 'pointer', color: 'var(--vermilion)', fontSize: 11, borderBottom: '1px solid var(--ink-3)', fontFamily: 'var(--font-mono)' }}
            >
              卸除
            </div>
          )}
          {candidates.length === 0 && (
            <div style={{ padding: '5px 8px', fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
              背包中无可用装备
            </div>
          )}
          {candidates.map(({ inst, item: it }) => {
            const cq = QUALITY[inst.quality]
            return (
              <div
                key={inst.uid}
                onClick={() => { equipItemForChar(slotKey, inst.uid, charId); setOpen(false) }}
                style={{
                  padding: '4px 8px', cursor: 'pointer', fontSize: 11,
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                  background: inst.uid === equippedUid ? 'rgba(58,107,181,0.12)' : 'transparent',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <span style={{ color: cq?.color ?? 'var(--ink)' }}>{it.item_name}</span>
                {cq?.key !== 'white' && <span style={{ fontSize: 9, marginLeft: 3, color: cq?.color, opacity: 0.8 }}>[{cq?.label}]</span>}
                <span style={{ color: 'var(--ink-3)', marginLeft: 4 }}>Lv{it.item_level}</span>
                {(inst.forgeLevel ?? 0) > 0 && <span style={{ color: 'var(--gold-2)', fontWeight: 700, marginLeft: 3 }}>+{inst.forgeLevel}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const Grid5 = ({ children, cols = 5 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, border: '1px solid var(--ink-3)', background: 'var(--paper)' }}>
    {children}
  </div>
)

const SectionBox = ({ title, sub, children, style = {} }) => (
  <div style={style}>
    <SubHead title={title} sub={sub} />
    {children}
  </div>
)

const PlusBtn = ({ onAdd, disabled }) => {
  const handlers = useLongPress(onAdd, { disabled })
  return (
    <button
      className="cell-plus"
      {...handlers}
      disabled={disabled}
      style={{ opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      ＋
    </button>
  )
}

const AllocCell = ({ label, value, sub, accent, onAdd, canAdd }) => (
  <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="cell-k">{label}</span>
      <span className="cell-v" style={accent ? { color: accent } : null}>{value}</span>
      <PlusBtn onAdd={onAdd} disabled={!canAdd} />
    </div>
    <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', lineHeight: 1.35 }}>{sub}</span>
  </div>
)

const SCHOOLS = ['金', '木', '水', '火', '土']

export default function CharacterScreen() {
  const s = useSyncExternalStore(subscribe, getSnapshot)

  // ── 多角色：哪个角色的装备正在被查看/编辑 ──
  const [viewCharId, setViewCharId] = useState(null)   // null = 跟随 activeCharId
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSchool, setNewSchool] = useState('金')

  // 当出战角色切换时，重置 view 到新出战角色
  useEffect(() => { setViewCharId(null) }, [s.activeCharId])

  const effectiveViewId = viewCharId ?? s.activeCharId
  const isViewingActive = effectiveViewId === s.activeCharId
  const viewChar = isViewingActive
    ? s
    : (s.otherChars ?? []).find(c => c.id === effectiveViewId) ?? s

  // 所有角色列表（含出战角色）
  const allChars = [
    { id: s.activeCharId, name: s.name, school: s.school, level: s.level, isActive: true },
    ...(s.otherChars ?? []).map(c => ({
      id: c.id, name: c.name, school: c.school, level: c.level, isActive: false,
    })),
  ]

  // 全角色已装备 uid 集合（防止同一件装备装到两个角色）
  const allEquippedUids = new Set([
    ...Object.values(s.equipped ?? {}).filter(v => typeof v === 'string'),
    ...(s.otherChars ?? []).flatMap(c =>
      Object.values(c.equipped ?? {}).filter(v => typeof v === 'string')
    ),
  ])

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const res = createCharacterAction(trimmed, newSchool)
    if (res.ok) { setCreating(false); setNewName('') }
  }

  const level = s.level

  // 查看角色的派生数据
  const viewLevel = viewChar.level
  const d = computeHeroDerived(level, s)
  const dv = isViewingActive ? d : computeHeroDerived(viewLevel, viewChar)
  const viewExpMax = expRequiredToNextLevel(viewLevel)
  const viewExpCur = viewChar.expIntoLevel ?? viewChar.expCur ?? 0
  const viewExpPct = viewExpMax > 0 ? Math.min(100, (viewExpCur / viewExpMax) * 100) : 0
  const vr = dv.rates ?? getEffectiveAttributeRates(viewChar)

  // 右侧面板基于查看角色（viewChar）计算属性点/相性点预算
  const viewBudget4 = getAttributePointBudget(viewLevel)
  const viewUsedFour = sumFour(viewChar)
  const rem4 = viewBudget4 - viewUsedFour
  const freeAllocated = Math.max(0, viewUsedFour - 4 * viewLevel)
  const freeBudget = Math.max(0, (viewLevel - 1) * 4)

  const viewBudgetAff = getAffinityPointBudget(viewLevel)
  const viewUsedAff = sumAffinity(viewChar)
  const remAff = viewBudgetAff - viewUsedAff

  const canAddStat = rem4 > 0
  const affData = [
    { k: '金相性', key: 'Metal', v: viewChar.affMetal ?? 0, school: '金' },
    { k: '木相性', key: 'Wood',  v: viewChar.affWood  ?? 0, school: '木' },
    { k: '水相性', key: 'Water', v: viewChar.affWater  ?? 0, school: '水' },
    { k: '火相性', key: 'Fire',  v: viewChar.affFire   ?? 0, school: '火' },
    { k: '土相性', key: 'Earth', v: viewChar.affEarth  ?? 0, school: '土' },
  ]

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead
        title="角 色 · 属 性"
        sub="CHARACTER · ATTRIBUTES"
        right={`【${s.name}】Lv.${level} · 法${s.school}`}
      />

      <div style={{ position: 'absolute', inset: '58px 20px 56px 20px', display: 'flex', gap: 12 }}>
        {/* 左：立绘 + 装备 */}
        <div className="paper-dark scroll-frame" style={{ width: 360, padding: 18, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CornerDeco />

          {/* ── 多角色切换条 ── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {allChars.map(c => (
              <button
                key={c.id}
                onClick={() => setViewCharId(c.id === s.activeCharId ? null : c.id)}
                style={{
                  padding: '2px 7px', fontSize: 10, cursor: 'pointer', border: '1px solid',
                  borderColor: c.isActive ? 'var(--gold-2)' : 'var(--ink-3)',
                  background: effectiveViewId === c.id ? (c.isActive ? 'var(--gold-2)' : 'var(--ink-3)') : 'var(--paper)',
                  color: effectiveViewId === c.id ? 'var(--paper)' : (c.isActive ? 'var(--gold-2)' : 'var(--ink-3)'),
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {c.isActive ? '★' : '○'} {c.name} {c.level}级
              </button>
            ))}
            {allChars.length < 5 && !creating && (
              <button
                onClick={() => setCreating(true)}
                style={{ padding: '2px 7px', fontSize: 10, cursor: 'pointer', background: 'var(--paper)', border: '1px dashed var(--ink-3)', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}
              >
                + 新角色
              </button>
            )}
          </div>

          {/* 创建角色表单 */}
          {creating && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', padding: '6px 8px', background: 'var(--paper)', border: '1px solid var(--ink-3)' }}>
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="角色名（最多10字）" maxLength={10}
                autoFocus
                style={{ width: 110, padding: '2px 6px', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--paper-dark)', border: '1px solid var(--ink-3)', color: 'var(--ink)' }}
              />
              <select
                value={newSchool} onChange={e => setNewSchool(e.target.value)}
                style={{ fontSize: 11, padding: '2px 4px', fontFamily: 'var(--font-mono)', background: 'var(--paper-dark)', border: '1px solid var(--ink-3)', color: 'var(--ink)' }}
              >
                {SCHOOLS.map(sch => <option key={sch} value={sch}>{sch}系</option>)}
              </select>
              <button className="btn-ink btn-ink-sm btn-ink-primary" onClick={handleCreate}>确认</button>
              <button className="btn-ink btn-ink-sm" onClick={() => { setCreating(false); setNewName('') }}>取消</button>
            </div>
          )}

          {/* 非出战角色操作按钮 */}
          {!isViewingActive && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn-ink btn-ink-sm btn-ink-primary"
                onClick={() => { switchCharacterAction(effectiveViewId); setViewCharId(null) }}
              >
                切换出战
              </button>
              <button
                className="btn-ink btn-ink-sm"
                style={{ color: 'var(--vermilion)' }}
                onClick={() => {
                  if (window.confirm(`确认删除角色「${viewChar.name}」？此操作不可撤销。`)) {
                    deleteCharacterAction(effectiveViewId)
                    setViewCharId(null)
                  }
                }}
              >
                删除角色
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', alignSelf: 'center' }}>
                正在查看：{viewChar.name}
              </span>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <div className="brush" style={{ fontSize: 26, color: 'var(--ink)', letterSpacing: '0.16em', lineHeight: 1 }}>{viewChar.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: 1.5 }}>
              蜀山 · 法{viewChar.school} · LV {viewChar.level} · {isViewingActive ? '（出战中）' : '（仓库）'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 5 }}>
              <Tag tone="vermilion">白衣卿相</Tag>
              <Tag tone="gold">降魔大将</Tag>
            </div>
          </div>

          {/* 经验条（显示查看角色的经验） */}
          <div style={{ padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginBottom: 2 }}>
              <span>经验</span>
              <span>{viewExpCur.toLocaleString()} / {viewExpMax.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, background: 'var(--paper-3)', border: '1px solid var(--ink-3)', overflow: 'hidden' }}>
              <div style={{ width: viewExpPct + '%', height: '100%', background: 'var(--bamboo)', backgroundImage: 'linear-gradient(90deg, var(--bamboo), var(--gold-2))' }} />
            </div>
          </div>

          {/* 装备区：左4 + 中（立绘占位） + 右4，下方项链/玉佩 */}
          <div style={{ display: 'flex', gap: 6, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 82 }}>
              {LEFT_SLOTS.map(k => (
                <EquipSlotBtn key={k} slotKey={k} equippedUid={viewChar.equipped?.[k]} equipBag={s.equipBag ?? []} allEquippedUids={allEquippedUids} charId={effectiveViewId} />
              ))}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Placeholder label="CHARACTER" sub="角色立绘" style={{ position: 'absolute', inset: 0, borderStyle: 'solid' }} />
              <div style={{ position: 'absolute', top: 6, right: 6 }}>
                <Seal size={32} round school={viewChar.school}>{viewChar.school}</Seal>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 82 }}>
              {RIGHT_SLOTS.map(k => (
                <EquipSlotBtn key={k} slotKey={k} equippedUid={viewChar.equipped?.[k]} equipBag={s.equipBag ?? []} allEquippedUids={allEquippedUids} charId={effectiveViewId} />
              ))}
            </div>
          </div>
          {/* 下排：项链 + 玉佩 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {BOTTOM_SLOTS.map(k => (
              <EquipSlotBtn key={k} slotKey={k} equippedUid={viewChar.equipped?.[k]} equipBag={s.equipBag ?? []} allEquippedUids={allEquippedUids} charId={effectiveViewId} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'var(--paper)', border: '1px solid var(--ink-3)' }}>
            <Seal size={32}>战</Seal>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 1.5 }}>战力 COMBAT</div>
              <div className="brush" style={{ fontSize: 22, color: 'var(--vermilion)', lineHeight: 1 }}>
                {Math.round(dv.maxHp * 0.5 + dv.magDmg * 2.5 + dv.def * 1.5 + dv.speed * 0.8).toLocaleString()}
              </div>
            </div>
            <span style={{ flex: 1 }} />
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
              <div>道行 {viewChar.daoYears}年{viewChar.daoDays}天</div>
              <div style={{ color: 'var(--bamboo)', marginTop: 2 }}>战绩 {viewChar.meritRecord}</div>
            </div>
          </div>
        </div>

        {/* 右：属性区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'auto' }}>
          <SectionBox title="基础状态" sub="DERIVED · 衍生战力">
            <Grid5>
              <Cell label="气血" value={dv.maxHp.toLocaleString()} accent="var(--vermilion)" />
              <Cell label="法力" value={dv.maxMp.toLocaleString()} accent="#3a5a8a" />
              <Cell label="物伤" value={dv.phyDmg} />
              <Cell label="法伤" value={dv.magDmg.toLocaleString()} accent="var(--gold-2)" />
              <Cell label="防御" value={dv.def} />
              <Cell label="速度" value={dv.speed} />
              <Cell label="准确" value={dv.acc} />
              <Cell label="躲闪" value={dv.dodgePct + '%'} />
              <Cell label="必杀" value={dv.critPct + '%'} />
              <Cell label="连击" value={dv.comboPct + '%'} />
              <Cell label="反震" value={dv.reflectPct + '%'} />
              <Cell label="反击" value={dv.counterPct + '%'} />
              <Cell label="强克金" value={Math.round(dv.strongMetal * 10) / 10 + '%'} />
              <Cell label="强克木" value={Math.round(dv.strongWood * 10) / 10 + '%'} accent="var(--bamboo)" />
              <Cell label="强克水" value={Math.round(dv.strongWater * 10) / 10 + '%'} />
              <Cell label="强克火" value={Math.round(dv.strongFire * 10) / 10 + '%'} />
              <Cell label="强克土" value={Math.round(dv.strongEarth * 10) / 10 + '%'} />
            </Grid5>
          </SectionBox>

          <SectionBox title="核心状态" sub="CORE">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', padding: '4px 4px', fontSize: 12 }}>
              <span><span style={{ color: 'var(--ink-3)' }}>道行</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{viewChar.daoYears}年{viewChar.daoDays}天</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>潜能</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-2)', fontWeight: 600 }}>{(viewChar.potential ?? 0).toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>声望</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{(viewChar.fame ?? 0).toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>体力</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{(viewChar.staminaCur ?? 0).toLocaleString()}/{(viewChar.staminaMax ?? 0).toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>银两</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{s.tael.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>战绩</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{viewChar.meritRecord ?? 0}</span></span>
            </div>
          </SectionBox>

          <SectionBox title="自由属性点" sub={`ALLOCATION · 自由 ${freeAllocated}/${freeBudget} · 底盘各+${viewLevel} · 剩余 ${rem4}`}>
            <Grid5>
              <AllocCell
                label="体质" value={viewChar.vit ?? 0}
                sub={`体质→气血 ${vr.hpPerVit.toFixed(2)}，防御 ${vr.defPerVit.toFixed(2)}`}
                onAdd={(n) => addStatToCharAction('vit', effectiveViewId, n)} canAdd={canAddStat}
              />
              <AllocCell
                label="灵力" value={viewChar.int ?? 0}
                sub={`灵力→法伤 ${vr.magPerInt.toFixed(2)}，法力 ${vr.mpPerInt.toFixed(2)}`}
                accent="var(--gold-2)"
                onAdd={(n) => addStatToCharAction('int', effectiveViewId, n)} canAdd={canAddStat}
              />
              <AllocCell
                label="力量" value={viewChar.str ?? 0}
                sub={`力量→物伤 ${vr.phyPerStr.toFixed(2)}，命中 ${vr.accPerStr}`}
                onAdd={(n) => addStatToCharAction('str', effectiveViewId, n)} canAdd={canAddStat}
              />
              <AllocCell
                label="敏捷" value={viewChar.agi ?? 0}
                sub={`敏捷→速度 ${vr.spdPerAgi.toFixed(2)}`}
                onAdd={(n) => addStatToCharAction('agi', effectiveViewId, n)} canAdd={canAddStat}
              />
              <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch', background: 'linear-gradient(180deg, var(--paper) 0%, #fff8ea 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="cell-k">剩余点数</span>
                  <span className="brush" style={{ fontSize: 22, color: rem4 > 0 ? 'var(--vermilion)' : 'var(--ink-3)', lineHeight: 1 }}>{rem4}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  相性剩余 {remAff}
                </div>
              </div>
            </Grid5>
          </SectionBox>

          <SectionBox title="相性加成" sub={`AFFINITY · 剩余 ${remAff} · 每系上限 ${AFFINITY_CAP_PER_ELEMENT}`}>
            <Grid5>
              {affData.map((a) => (
                <div key={a.k} className="cell" style={{ alignItems: 'center' }}>
                  <Seal size={18} round school={a.school}>{a.school}</Seal>
                  <span className="cell-k" style={{ marginLeft: 4 }}>{a.k}</span>
                  <span className="cell-v" style={{ color: a.v >= AFFINITY_CAP_PER_ELEMENT ? 'var(--gold-2)' : 'var(--ink)' }}>{a.v}/{AFFINITY_CAP_PER_ELEMENT}</span>
                  {a.v < AFFINITY_CAP_PER_ELEMENT
                    ? <PlusBtn onAdd={(n) => addAffinityToCharAction(a.key, effectiveViewId, n)} disabled={remAff <= 0} />
                    : <span style={{ marginLeft: 4, fontFamily: 'var(--font-brush)', fontSize: 11, color: 'var(--gold-2)' }}>满</span>}
                </div>
              ))}
              <Cell label="金·法伤/灵" value={vr.magPerInt.toFixed(2)} />
              <Cell label="木·气血/体" value={vr.hpPerVit.toFixed(2)} />
              <Cell label="水·防御/体" value={vr.defPerVit.toFixed(2)} />
              <Cell label="火·速度/敏" value={vr.spdPerAgi.toFixed(2)} />
              <Cell label="土·物伤/力" value={vr.phyPerStr.toFixed(2)} />
              <Cell label="木·法力/灵" value={vr.mpPerInt.toFixed(2)} />
              <Cell label="命中/力" value={vr.accPerStr} />
            </Grid5>
          </SectionBox>

          <div style={{ display: 'flex', gap: 10 }}>
            <SectionBox title="五系法术抗性" sub="MAGIC RESISTANCE" style={{ flex: 1 }}>
              <Grid5>
                <Cell label="抗金" value={Math.round(dv.resJin * 10) / 10 + '%'} />
                <Cell label="抗木" value={Math.round(dv.resMu * 10) / 10 + '%'} accent="var(--bamboo)" />
                <Cell label="抗水" value={Math.round(dv.resShui * 10) / 10 + '%'} />
                <Cell label="抗火" value={Math.round(dv.resHuo * 10) / 10 + '%'} accent="var(--vermilion)" />
                <Cell label="抗土" value={Math.round(dv.resTu * 10) / 10 + '%'} />
              </Grid5>
            </SectionBox>
            <SectionBox title="障碍抗性" sub="STATUS RESISTANCE" style={{ flex: 1 }}>
              <Grid5>
                <Cell label="抗遗忘" value={Math.round(dv.resYi * 10) / 10 + '%'} accent="var(--gold-2)" />
                <Cell label="抗冰冻" value={Math.round(dv.resBing * 10) / 10 + '%'} />
                <Cell label="抗中毒" value={Math.round(dv.resDu * 10) / 10 + '%'} />
                <Cell label="抗昏睡" value={Math.round(dv.resShuiMian * 10) / 10 + '%'} />
                <Cell label="抗混乱" value={Math.round(dv.resHunLuan * 10) / 10 + '%'} />
              </Grid5>
            </SectionBox>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', left: 20, right: 20, bottom: 14,
        display: 'flex', gap: 8, alignItems: 'center',
        background: 'var(--paper-2)', border: '1px solid var(--gold-2)',
        padding: '8px 12px',
      }}>
        <button className="btn-ink btn-ink-sm" onClick={() => autoAllocateToCharAction(effectiveViewId)} disabled={rem4 <= 0} style={{ opacity: rem4 > 0 ? 1 : 0.45 }}>
          [1] 自动分配 · 3体2灵
        </button>
        <button className="btn-ink btn-ink-sm btn-ink-primary" disabled={rem4 <= 0} style={{ opacity: rem4 > 0 ? 1 : 0.45 }}>
          [2] 手动加点
        </button>
        <button className="btn-ink btn-ink-sm" onClick={() => resetAllocToCharAction(effectiveViewId)}>
          [3] 重置加点
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          四维剩余 <span style={{ color: rem4 > 0 ? 'var(--vermilion)' : 'var(--ink-4)', fontWeight: 700 }}>{rem4}</span>
          {' · '}相性剩余 <span style={{ color: remAff > 0 ? 'var(--vermilion)' : 'var(--ink-4)', fontWeight: 700 }}>{remAff}</span>
        </span>
      </div>
    </div>
  )
}
