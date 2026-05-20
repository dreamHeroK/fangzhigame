import React, { useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react'
import { Seal, Placeholder, Bar, Taiji, InkMountain, SubHead } from './common.jsx'
import {
  createBattle,
  submitPlayerAction,
  submitCapture,
  submitUseConsumable,
  executeNextStep,
  getActor,
  STATUS_LABELS,
} from '../game/battle/battleEngine.js'
import { getSkill } from '../game/battle/skills.js'
import { suggestMapIdForLevel } from '../game/battle/wendaoMapsConfig.js'
import {
  subscribe as charSubscribe,
  getSnapshot as charSnapshot,
  applyBattleRewardsAction,
  applyExpToOtherCharsAction,
  saveBattleEndAction,
  saveOtherCharsDefeatAction,
  deductBagItemAction,
  toggleAutoRestoreAction,
  addCapturedPetAction,
  clearPendingShuadaoAction,
  progressBattleQuestAction,
} from '../game/characterStore.js'
import { dbReady } from '../game/db/sqliteDb.js'
import { recordBattle, loadSkillMemory, saveSkillEntry } from '../game/db/saveManager.js'
import { computeHeroDerived } from '../game/playerSheet.js'
import { createAllyUnit } from '../game/battle/monsters.js'
import { buildShuadaoFoes, shuadaoOpeningMsg } from '../game/battle/shuadaoEncounter.js'
import { SHUADAO_TYPES } from '../game/shuadao.js'
import { calcDaoExcessRatio } from '../game/battle/daoStandard.js'
import { createPetAllyUnit } from '../game/battle/pets.js'
import { getConsumable } from '../game/items/catalog.js'
import { getEquipByCode } from '../game/items/equipCatalog.js'
import { QUALITY } from '../game/items/equipQuality.js'

/** 根据角色快照数据构建一个战斗单位（角色类型） */
function buildCharUnit(c, shared) {
  // 非出战角色缺少共享字段，补入 equipBag 以正确计算装备加成
  const sheet = c.equipBag != null ? c : { ...c, equipBag: shared.equipBag ?? [] }
  const d = computeHeroDerived(c.level, sheet)
  const learned = (c.equippedSkills ?? []).filter(id => (c.skillLevels?.[id] ?? 0) > 0)
  const skillPool = ['normal_attack', ...learned]
  return createAllyUnit(c.name, {
    level:          c.level,
    maxHp:          d.maxHp,
    hpCur:          c.hpCur,
    maxMp:          d.maxMp,
    mpCur:          c.mpCur,
    atk:            d.phyDmg,
    mAtk:           d.magDmg,
    def:            d.def,
    speed:          d.speed,
    piercingPct:    d.piercingPct ?? 0,
    skillLevels:    c.skillLevels ?? {},
    daoExcessRatio: calcDaoExcessRatio(c.level, c.daoYears ?? 0, c.daoDays ?? 0),
    charId:         c.id,  // 标记角色 id，战后回写 HP/MP 时使用
  }, skillPool)
}

function makeNewBattle() {
  const char = charSnapshot()
  const mapId = char.currentMapId ?? suggestMapIdForLevel(char.level)

  // 所有角色（出战 + 仓库中）均参战，出战角色排首位
  const allCharData = [
    { ...char, id: char.activeCharId },           // 出战角色（id 字段已在 state 中）
    ...(char.otherChars ?? []),
  ]
  const charUnits = allCharData.map(c => buildCharUnit(c, char))

  // 共享宠物，最多 5 只出战
  const activePets = (char.petRoster ?? []).filter(p => p.active).slice(0, 5)
  const petUnits = activePets.map(createPetAllyUnit)

  return createBattle({ allyUnits: [...charUnits, ...petUnits], mapId })
}

const allyPos = [
  // 0-2: 角色（后排，最多 3 人）
  { x: 7,  y: 44, scale: 0.75 },
  { x: 19, y: 44, scale: 0.75 },
  { x: 31, y: 44, scale: 0.75 },
  // 3-7: 宠物（前排，最多 5 只）
  { x: 5,  y: 84, scale: 0.85 },
  { x: 14, y: 84, scale: 0.85 },
  { x: 23, y: 84, scale: 0.85 },
  { x: 32, y: 84, scale: 0.85 },
  { x: 41, y: 84, scale: 0.85 },
  // 8-9: 溢出备用
  { x: 11, y: 62, scale: 0.78 },
  { x: 22, y: 62, scale: 0.78 },
]
const enemyPos = [
  { x: 56, y: 82, scale: 1.00 },
  { x: 65, y: 82, scale: 1.00 },
  { x: 74, y: 84, scale: 1.18 },
  { x: 83, y: 82, scale: 1.00 },
  { x: 92, y: 82, scale: 1.00 },
  { x: 58, y: 58, scale: 0.78 },
  { x: 66, y: 58, scale: 0.78 },
  { x: 74, y: 56, scale: 0.85 },
  { x: 82, y: 58, scale: 0.78 },
  { x: 90, y: 58, scale: 0.78 },
]

// isCenter = 主选目标（完整准星）；isAffected = 在群攻范围内（次要高亮）
const CombatUnit = ({ unit, pos, side, isCenter, isAffected, onClick }) => {
  const isEnemy   = side === 'enemy'
  const isBoss      = unit.isWorldBoss  ?? false
  const isFieldBoss = unit.isFieldBoss  ?? false
  const isBaby      = unit.isBabyMonster ?? false
  const baseW = isBoss ? 110 : 96
  const baseH = isBoss ? 146 : 128
  const w = baseW * pos.scale
  const h = baseH * pos.scale
  const dead = unit.hp <= 0

  const borderColor = isCenter
    ? 'var(--vermilion)'
    : isAffected
      ? 'var(--gold)'
      : isBoss       ? 'var(--vermilion)'
      : isFieldBoss  ? '#c8860a'
      : isBaby       ? '#3a8040'
      : isEnemy      ? 'var(--vermilion-2)'
      : 'var(--ink-2)'
  const boxShadow = isCenter
    ? '0 0 0 2px var(--vermilion), 0 0 12px rgba(163,55,58,0.4)'
    : isAffected
      ? '0 0 0 2px var(--gold), 0 0 8px rgba(184,142,68,0.35)'
      : isBoss
        ? '0 0 0 2px var(--vermilion), 0 4px 12px rgba(163,55,58,0.25)'
        : isFieldBoss
          ? '0 0 0 2px #c8860a, 0 4px 12px rgba(200,134,10,0.25)'
          : isBaby
            ? '0 0 0 2px #3a8040, 0 4px 8px rgba(58,128,64,0.20)'
            : '0 2px 6px rgba(40,30,20,0.25)'

  return (
    <div
      onClick={!dead && isEnemy && onClick ? onClick : undefined}
      style={{
        position: 'absolute',
        left: `calc(${pos.x}% - ${w / 2}px)`,
        top: `calc(${pos.y}% - ${h}px)`,
        width: w, height: h + 28,
        zIndex: isBoss ? 2 : 1,
        opacity: dead ? 0.25 : 1,
        transition: 'opacity 0.4s',
        cursor: isEnemy && !dead ? 'crosshair' : 'default',
      }}
    >
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-brush)',
        fontSize: (13 * pos.scale + 3),
        color: isEnemy
          ? isBoss      ? 'var(--vermilion)'
          : isFieldBoss ? '#c8860a'
          : isBaby      ? '#3a8040'
          : 'var(--ink)'
          : 'var(--vermilion)',
        marginBottom: 3,
        textShadow: '0 1px 0 var(--paper)',
        letterSpacing: isBoss ? '0.1em' : 0,
      }}>
        {unit.name}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 4 }}>
          Lv{unit.level}
        </span>
        {isBoss && (
          <span style={{ marginLeft: 4, fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--vermilion)', padding: '1px 4px', background: 'var(--paper)', border: '1px solid var(--vermilion)' }}>BOSS</span>
        )}
        {isFieldBoss && (
          <span style={{ marginLeft: 4, fontFamily: 'var(--font-display)', fontSize: 10, color: '#c8860a', padding: '1px 4px', background: 'var(--paper)', border: '1px solid #c8860a' }}>首领</span>
        )}
        {isBaby && (
          <span style={{ marginLeft: 4, fontFamily: 'var(--font-display)', fontSize: 10, color: '#3a8040', padding: '1px 4px', background: 'var(--paper)', border: '1px solid #3a8040' }}>宝宝</span>
        )}
      </div>
      <div style={{ width: w, height: h, position: 'relative' }}>
        <Placeholder
          label={unit.affinity ?? (isEnemy ? '?' : '修')}
          sub={isEnemy ? 'FOE' : 'ALLY'}
          style={{
            position: 'absolute', inset: 0,
            transform: isEnemy ? 'scaleX(-1)' : 'none',
            borderColor,
            borderWidth: (isCenter || isAffected) ? 2 : 1.5,
            boxShadow,
          }}
        />
        {unit.affinity && (
          <div style={{ position: 'absolute', top: 3, [isEnemy ? 'right' : 'left']: 3 }}>
            <Seal size={20} round school={unit.affinity}>{unit.affinity}</Seal>
          </div>
        )}
        {unit.kind === 'pet' && !isEnemy && (
          <div style={{
            position: 'absolute', bottom: 3, right: 3,
            fontFamily: 'var(--font-mono)', fontSize: 8,
            background: 'rgba(26,74,42,0.85)', color: '#7ecf4a',
            border: '1px solid #3a8040', borderRadius: 2,
            padding: '0 3px', lineHeight: '14px',
          }}>
            宠
          </div>
        )}
        {/* 主目标：完整准星 */}
        {isCenter && (
          <svg viewBox="0 0 60 60" style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: w + 14, height: w + 14,
            color: 'var(--vermilion)', pointerEvents: 'none',
          }}>
            <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="30" y1="2"  x2="30" y2="14" stroke="currentColor" strokeWidth="2" />
            <line x1="30" y1="46" x2="30" y2="58" stroke="currentColor" strokeWidth="2" />
            <line x1="2"  y1="30" x2="14" y2="30" stroke="currentColor" strokeWidth="2" />
            <line x1="46" y1="30" x2="58" y2="30" stroke="currentColor" strokeWidth="2" />
          </svg>
        )}
        {/* 次要目标：菱形标记 */}
        {isAffected && !isCenter && (
          <svg viewBox="0 0 40 40" style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            width: w * 0.6, height: w * 0.6,
            color: 'var(--gold)', pointerEvents: 'none',
          }}>
            <polygon points="20,4 36,20 20,36 4,20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          </svg>
        )}
      </div>
      <div style={{ marginTop: 3, paddingInline: 3 }}>
        <Bar value={unit.hp} max={unit.maxHp} type="hp" height={isBoss ? 7 : 5} showText={false} />
        {isEnemy && !dead && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            fontFamily: 'var(--font-mono)', marginTop: 2, paddingInline: 1,
            fontSize: isBoss ? 10 : 9,
          }}>
            <span style={{ color: hpColor(unit.hp, unit.maxHp), fontWeight: 600 }}>
              {unit.hp.toLocaleString()}
            </span>
            <span style={{ color: 'var(--ink-4)' }}>
              /{unit.maxHp.toLocaleString()}
            </span>
          </div>
        )}
        <StatusBadges statusEffects={unit.statusEffects} small />
      </div>
    </div>
  )
}

function hpColor(hp, maxHp) {
  const r = maxHp > 0 ? hp / maxHp : 0
  if (r > 0.6) return 'var(--bamboo)'
  if (r > 0.3) return 'var(--gold-2)'
  return 'var(--vermilion)'
}

const STATUS_STYLE = {
  poison:  { background: '#1e4a10', color: '#7ecf4a', border: '1px solid #3a8020' },
  freeze:  { background: '#0a2e4a', color: '#7dd8f7', border: '1px solid #1a6080' },
  sleep:   { background: '#2e1650', color: '#c8a8f8', border: '1px solid #6040a0' },
  confuse: { background: '#4a2800', color: '#f0b040', border: '1px solid #906010' },
  forget:  { background: '#303030', color: '#b0b0b0', border: '1px solid #606060' },
}

const StatusBadges = ({ statusEffects, small = false }) => {
  if (!statusEffects?.length) return null
  return (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
      {statusEffects.map(eff => (
        <span key={eff.type} style={{
          fontFamily: 'var(--font-mono)',
          fontSize: small ? 7 : 9,
          padding: small ? '0 2px' : '1px 4px',
          borderRadius: 2,
          lineHeight: 1.4,
          ...(STATUS_STYLE[eff.type] ?? { background: '#333', color: '#fff' }),
        }}>
          {STATUS_LABELS[eff.type] ?? eff.type}{eff.duration > 0 ? `·${eff.duration}` : ''}
        </span>
      ))}
    </div>
  )
}

const RowGuide = ({ y, label, side }) => (
  <div style={{
    position: 'absolute', top: `calc(${y}% - 1px)`,
    [side === 'left' ? 'left' : 'right']: 0, width: '48%', height: 1,
    background: 'linear-gradient(90deg, ' + (side === 'left'
      ? 'transparent 0%, rgba(106,90,68,0.30) 30%, rgba(106,90,68,0.30) 90%, transparent 100%'
      : 'transparent 0%, rgba(106,90,68,0.30) 10%, rgba(106,90,68,0.30) 70%, transparent 100%'
    ) + ')', pointerEvents: 'none',
  }}>
    <div style={{
      position: 'absolute', top: -10, [side === 'left' ? 'left' : 'right']: 8,
      fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-4)',
      letterSpacing: 1.5, background: 'var(--paper)', padding: '0 4px',
    }}>{label}</div>
  </div>
)

const PartyCard = ({ unit, isActive }) => (
  <div style={{
    padding: '5px 8px',
    background: isActive
      ? 'linear-gradient(90deg, rgba(163,55,58,0.18) 0%, rgba(232,220,192,0.4) 100%)'
      : 'rgba(243,237,224,0.6)',
    border: '1px solid ' + (isActive ? 'var(--vermilion)' : 'var(--ink-4)'),
    borderRadius: 2, position: 'relative',
    opacity: unit.hp <= 0 ? 0.4 : 1,
  }}>
    {isActive && (
      <div style={{
        position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
        borderLeft: '7px solid var(--vermilion)',
      }} />
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 36, height: 36, position: 'relative' }}>
        <div className="portrait" style={{
          width: 36, height: 36, fontSize: unit.kind === 'pet' ? 11 : 14,
          background: unit.kind === 'pet' ? 'linear-gradient(135deg,#1a4a2a,#2d6040)' : undefined,
          border: unit.kind === 'pet' ? '1px solid #3a8040' : undefined,
        }}>
          {unit.kind === 'pet' ? '宠' : unit.name?.[0] ?? '人'}
        </div>
        {unit.affinity && (
          <div style={{ position: 'absolute', bottom: -3, right: -3 }}>
            <Seal size={14} round school={unit.affinity}>{unit.affinity}</Seal>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <span className="brush" style={{ fontSize: 13 }}>{unit.name}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
            Lv{unit.level}{unit.affinity ? ` · ${unit.kind === 'pet' ? '宠' : '法'}${unit.affinity}` : ''}
          </span>
        </div>
        <Bar value={unit.hp} max={unit.maxHp} type="hp" height={6} />
        <div style={{ marginTop: 2 }}>
          <Bar value={unit.mp} max={unit.maxMp} type="mp" height={4} showText={false} />
        </div>
        <StatusBadges statusEffects={unit.statusEffects} />
      </div>
    </div>
  </div>
)

const SkillCard = ({ sk, skillLevel = 0, selected, disabled, forgotten, onClick }) => (
  <div
    className={'slot' + (selected ? ' q-rare' : '')}
    onClick={disabled ? undefined : onClick}
    style={{
      aspectRatio: 'auto', padding: '4px 5px',
      flexDirection: 'column', gap: 1, fontSize: 11,
      background: selected ? '#fff8ea' : forgotten ? 'rgba(48,48,48,0.08)' : undefined,
      borderColor: selected ? 'var(--vermilion)' : forgotten ? '#606060' : undefined,
      boxShadow: selected ? '0 0 0 2px rgba(163,55,58,0.2)' : undefined,
      opacity: disabled ? 0.45 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
      <span className="brush" style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.1 }}>{sk.name}</span>
      {skillLevel > 0 && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 7, lineHeight: 1,
          color: 'var(--paper)', background: skillLevel >= 80 ? 'var(--vermilion)' : skillLevel >= 40 ? 'var(--gold-2)' : 'var(--ink-3)',
          borderRadius: 2, padding: '1px 3px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
        }}>
          {skillLevel}
        </span>
      )}
    </div>
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--ink-3)' }}>{sk.desc}</span>
    {sk.mpCost > 0 && (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3a5a8a' }}>{sk.mpCost} 灵力</span>
    )}
  </div>
)

const ItemPanel = ({ char, actor, onUseItem }) => {
  const bag = char.bag ?? []
  const consumables = bag
    .map(entry => {
      const def = getConsumable(entry.itemId)
      if (!def) return null
      return { itemId: entry.itemId, qty: entry.qty, def }
    })
    .filter(Boolean)

  if (consumables.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--ink-4)', fontSize: 13, fontFamily: 'var(--font-brush)' }}>
          囊中无药
        </span>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
      <SubHead title="道具" sub="ITEMS · USE ON SELF" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', flex: 1 }}>
        {consumables.map(({ itemId, qty, def }) => {
          const isHp = def.kind === 'hp'
          const alreadyFull = actor ? (isHp ? actor.hp >= actor.maxHp : actor.mp >= actor.maxMp) : true
          const disabled = !actor || alreadyFull
          return (
            <button
              key={itemId}
              className="btn-ink"
              disabled={disabled}
              onClick={() => !disabled && onUseItem(itemId)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 10px', fontSize: 11, opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <span className="brush" style={{ fontSize: 13 }}>{def.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isHp ? 'var(--vermilion)' : '#3a5a8a' }}>
                {isHp ? '气血' : '法力'} ×{qty}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const ActionPanel = ({ actor, selectedSkillId, onSelectSkill, mode, onMode, plannedCount = 0, totalPlanners = 1 }) => {
  const modes = [
    { k: 'skill',   n: '技能', t: '技' },
    { k: 'catch',   n: '捕捉', t: '捕' },
    { k: 'item',    n: '道具', t: '丹' },
    { k: 'defend',  n: '防御', t: '御' },
    { k: 'flee',    n: '逃跑', t: '逃' },
  ]

  // 使用技能等级缩放后的实际法力消耗
  const skills = actor
    ? actor.skillPool.map(id => getSkill(id, actor.skillLevels?.[id] ?? 0))
    : []
  const hasForget = actor?.statusEffects?.some(e => e.type === 'forget')

  return (
    <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SubHead
        title="行动"
        sub={totalPlanners > 1 ? `PLAN · ${plannedCount + 1}/${totalPlanners}` : 'COMMAND'}
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
            {actor ? `${actor.name} · MP ${actor.mp}/${actor.maxMp}` : '等待中…'}
          </span>
        }
      />
      <div style={{ display: 'flex', gap: 5 }}>
        {modes.map((m) => (
          <button
            key={m.k}
            className={'btn-ink' + (mode === m.k ? ' btn-ink-primary' : '')}
            onClick={() => onMode(m.k)}
            style={{ flexDirection: 'column', flex: 1, padding: '5px 0', gap: 1, fontSize: 11 }}
          >
            <span className="brush" style={{ fontSize: 18, lineHeight: 1, color: mode === m.k ? 'var(--paper)' : 'var(--ink)' }}>{m.t}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-display)' }}>{m.n}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 5, flex: 1 }}>
        {skills.map((sk) => {
          const lv = actor?.skillLevels?.[sk.id] ?? 0
          return (
            <SkillCard
              key={sk.id}
              sk={sk}
              skillLevel={lv}
              selected={sk.id === selectedSkillId}
              disabled={!actor || sk.mpCost > actor.mp || (hasForget && sk.mpCost > 0)}
              forgotten={hasForget && sk.mpCost > 0}
              onClick={() => onSelectSkill(sk.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

const TargetPanel = ({ foes, selectedTargetId, affectedTargetIds, onSelectTarget, onAction, onCapture, mode, canAct, targetCount, autoCombat, onToggleAutoCombat, isLastPlanner }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <SubHead
      title="选 敌"
      sub="TARGET"
      right={targetCount > 1 && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-2)', letterSpacing: 1 }}>
          群攻 · {Math.min(targetCount, foes.filter(f => f.hp > 0).length)} 目标
        </span>
      )}
    />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
      {foes.map((foe) => {
        const dead = foe.hp <= 0
        const isCenter = foe.id === selectedTargetId
        const isAffected = affectedTargetIds.includes(foe.id)
        const bgColor = isCenter
          ? 'linear-gradient(180deg, var(--vermilion) 0%, var(--vermilion-2) 100%)'
          : isAffected
            ? 'linear-gradient(180deg, rgba(184,142,68,0.7) 0%, rgba(140,108,67,0.5) 100%)'
            : undefined
        const textColor = (isCenter || isAffected) ? 'var(--paper)' : 'var(--ink)'
        return (
          <button
            key={foe.id}
            className="btn-ink"
            onClick={() => !dead && onSelectTarget(foe.id)}
            style={{
              flexDirection: 'column', padding: '4px 2px', gap: 1, fontSize: 11,
              background: bgColor,
              color: (isCenter || isAffected) ? 'var(--paper)' : undefined,
              borderColor: isCenter ? 'var(--vermilion-2)' : isAffected ? 'var(--gold-2)' : undefined,
              opacity: dead ? 0.3 : 1,
              cursor: dead ? 'not-allowed' : 'pointer',
              minHeight: 36,
            }}
          >
            <span className="brush" style={{ fontSize: 12, lineHeight: 1, color: textColor }}>
              {foe.name}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: (isCenter || isAffected) ? 'rgba(243,237,224,0.75)' : 'var(--ink-3)' }}>
              {dead ? '阵亡' : `Lv${foe.level}`}
              {foe.isWorldBoss ? ' ·BOSS' : ''}
            </span>
            {!dead && (
              <div style={{ width: '100%', marginTop: 2 }}>
                <Bar value={foe.hp} max={foe.maxHp} type="hp" height={3} showText={false} />
              </div>
            )}
          </button>
        )
      })}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
      {mode === 'catch' ? (
        <button
          className="btn-ink btn-ink-primary"
          onClick={onCapture}
          disabled={!canAct}
          style={{ flex: 1, fontSize: 14, padding: '8px 0', opacity: canAct ? 1 : 0.5 }}
        >
          捕 捉
        </button>
      ) : (
        <>
          <button
            className={'btn-ink' + (autoCombat ? ' btn-ink-primary' : '')}
            onClick={onToggleAutoCombat}
            style={{ flex: 1, fontSize: 11, flexDirection: 'column', gap: 1 }}
          >
            <span>自动</span>
            <span style={{ fontSize: 8, opacity: 0.8 }}>{autoCombat ? '●开' : '○关'}</span>
          </button>
          <button
            className="btn-ink btn-ink-primary"
            onClick={onAction}
            disabled={!canAct || autoCombat}
            style={{ flex: 2, fontSize: 14, padding: '8px 0', opacity: (canAct && !autoCombat) ? 1 : 0.5 }}
          >
            {isLastPlanner ? '出 手' : '确 认'}
          </button>
        </>
      )}
    </div>
  </div>
)

export default function CombatScreen() {
  const [battle, setBattle] = useState(makeNewBattle)
  const [selectedSkillId, setSelectedSkillId] = useState('normal_attack')
  const [selectedTargetId, setSelectedTargetId] = useState(null)
  const [mode, setMode] = useState('skill')
  const [floats, setFloats] = useState([])
  const [autoCombat, setAutoCombat] = useState(false)  // 自动战斗：记忆行动自动出手
  const [autoStart, setAutoStart]   = useState(false)  // 自动开战：胜利后自动重新开战
  const [babyAlert, setBabyAlert]   = useState(false)  // 发现宝宝时的暂停提示
  const prevUnitsRef = useRef(null)
  const lastActionKindRef = useRef(null)
  const pendingComboKindRef = useRef(null)
  const lastSkillByActorRef = useRef({})
  const autoCombatRef = useRef(false)  // ref 供异步回调读取最新值
  const autoStartRef  = useRef(false)
  useEffect(() => { autoCombatRef.current = autoCombat }, [autoCombat])
  useEffect(() => { autoStartRef.current  = autoStart  }, [autoStart])
  const char = useSyncExternalStore(charSubscribe, charSnapshot)

  const allies = battle.units.filter((u) => u.side === 'ally')
  const foes = battle.units.filter((u) => u.side === 'foe')
  const livingFoes = foes.filter((u) => u.hp > 0)
  const actor = battle.awaitingActorId ? getActor(battle, battle.awaitingActorId) : null

  // 当前技能的目标数
  const selectedSkillDef = actor && selectedSkillId ? getSkill(selectedSkillId) : null
  const targetCount = selectedSkillDef?.maxTargets ?? 1

  // 以主选目标为中心，按距离补充最近的敌人至 targetCount 个
  const affectedTargetIds = useMemo(() => {
    if (!selectedTargetId) return []
    if (targetCount <= 1) return [selectedTargetId]
    const centerIdx = foes.findIndex((f) => f.id === selectedTargetId)
    if (centerIdx < 0) return [selectedTargetId]
    const centerPos = enemyPos[Math.min(centerIdx, 9)]
    const others = livingFoes
      .filter((f) => f.id !== selectedTargetId)
      .map((f) => {
        const idx = foes.findIndex((x) => x.id === f.id)
        const p = enemyPos[Math.min(idx, 9)]
        const dx = p.x - centerPos.x
        const dy = p.y - centerPos.y
        return { id: f.id, dist: Math.sqrt(dx * dx + dy * dy) }
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, targetCount - 1)
      .map((x) => x.id)
    return [selectedTargetId, ...others]
  }, [selectedTargetId, targetCount, foes.map((f) => f.id + f.hp).join()])

  // 挂载时从 DB 恢复行动记忆
  useEffect(() => {
    dbReady.then(() => {
      const memory = loadSkillMemory()
      if (Object.keys(memory).length > 0) lastSkillByActorRef.current = memory
    })
  }, [])

  // actor 切换时恢复上次为该 actor 选择的技能
  useEffect(() => {
    if (!actor) return
    const remembered = lastSkillByActorRef.current[actor.templateKey]
    if (remembered && actor.skillPool.includes(remembered)) {
      setSelectedSkillId(remembered)
    } else {
      setSelectedSkillId('normal_attack')
    }
  }, [actor?.id])

  // Auto-select first living foe when needed
  useEffect(() => {
    const stillValid = livingFoes.find((f) => f.id === selectedTargetId)
    if (!stillValid && livingFoes.length > 0) {
      setSelectedTargetId(livingFoes[0].id)
    }
  }, [battle])

  // 战斗胜利 → 落账经验 / 宠物经验 / 银两 / 持久化剩余HP/MP
  useEffect(() => {
    if (!battle.victoryLootNonce || !battle.victoryRewards) return

    const snap = charSnapshot()
    const activePetIds = allies
      .filter(u => u.kind === 'pet')
      .map(u => snap.petRoster?.find(p => `petunit_${p.id}` === u.id)?.id)
      .filter(Boolean)

    // 所有角色单位按 charId 建立 HP/MP 映射
    const charUnitsInBattle = allies.filter(u => u.kind !== 'pet')
    const charHpMpMap = {}
    for (const u of charUnitsInBattle) {
      if (u.charId) charHpMpMap[u.charId] = { hp: u.hp, mp: u.mp }
    }

    // 出战角色：经验 + 掉落 + HP/MP
    const activeUnit = charUnitsInBattle.find(u => u.charId === snap.activeCharId) ?? charUnitsInBattle[0]
    applyBattleRewardsAction(
      battle.victoryRewards, activePetIds,
      battle.lastVictoryLoot ?? [], battle.lastEquipDrops ?? [],
      activeUnit?.hp ?? null, activeUnit?.mp ?? null,
    )

    // 非出战角色：同步经验 + HP/MP
    applyExpToOtherCharsAction(battle.victoryRewards?.exp ?? 0, charHpMpMap)

    if (battle.mapId) progressBattleQuestAction(battle.mapId)
    dbReady.then(() => recordBattle({
      outcome:       'victory',
      mapName:       battle.log[0]?.match(/【(.+?)】/)?.[1] ?? '',
      foeCount:      foes.length,
      rounds:        Math.max(0, battle.roundIndex),
      expGained:     battle.victoryRewards?.exp ?? 0,
      petExpGained:  battle.victoryRewards?.petExp ?? 0,
      goldGained:    battle.victoryRewards?.gold ?? 0,
      loot:          battle.lastVictoryLoot ?? [],
    })).catch(() => {})
  }, [battle.victoryLootNonce])

  // Damage floats: diff HP between renders
  useEffect(() => {
    const prev = prevUnitsRef.current
    prevUnitsRef.current = battle.units
    if (!prev) return

    // 消费连击触发信号（只在玩家主动出手后有值）
    const comboKind = pendingComboKindRef.current
    pendingComboKindRef.current = null

    const newFloats = []
    let firstFoeHitPos = null  // 连击标签落在第一个受伤敌方单位上方

    for (const u of battle.units) {
      const p = prev.find((x) => x.id === u.id)
      if (!p) continue
      const dmg = p.hp - u.hp
      if (dmg <= 0) continue
      const isAlly = u.side === 'ally'
      const arr = isAlly ? allies : foes
      const idx = arr.findIndex((x) => x.id === u.id)
      const pos = isAlly ? allyPos[idx] : enemyPos[Math.min(idx, 9)]
      if (!pos) continue

      const drift = Math.round((Math.random() - 0.5) * 52)
      // 伤害 ≥ 30% maxHp 视为大伤害
      const isBigHit = dmg >= u.maxHp * 0.30

      newFloats.push({
        id: Math.random().toString(36).slice(2),
        x: pos.x + (Math.random() - 0.5) * 3,
        y: pos.y - 14,
        text: `－${dmg.toLocaleString()}`,
        kind: isBigHit ? 'crit' : 'normal',
        drift,
      })

      if (!isAlly && !firstFoeHitPos) firstFoeHitPos = pos
    }

    // 连击标签：悬浮在第一个受伤敌方头顶，独立于伤害数字
    if (comboKind && firstFoeHitPos) {
      const label = comboKind === 'magic' ? '法术连击！' : '物理连击！'
      newFloats.push({
        id: Math.random().toString(36).slice(2),
        x: firstFoeHitPos.x,
        y: firstFoeHitPos.y - 30,
        text: label,
        kind: 'combo',
        drift: (Math.random() - 0.5) * 20,
      })
    }

    if (newFloats.length > 0) {
      setFloats((f) => [...f, ...newFloats])
      const ids = new Set(newFloats.map((f) => f.id))
      setTimeout(() => setFloats((f) => f.filter((x) => !ids.has(x.id))), 2000)
    }
  }, [battle])

  function handleSelectSkill(skillId) {
    setSelectedSkillId(skillId)
    if (actor) {
      lastSkillByActorRef.current[actor.templateKey] = skillId
      saveSkillEntry(actor.templateKey, skillId).catch(() => {})
    }
  }

  function handleAction() {
    if (!actor || !selectedSkillId || !selectedTargetId || battle.phase === 'end') return
    const skillDef = getSkill(selectedSkillId)
    const kind = skillDef.kind  // 'physical' | 'magic'
    // 与上次同类型 → 触发连击标签
    pendingComboKindRef.current = lastActionKindRef.current === kind ? kind : null
    lastActionKindRef.current = kind
    const next = submitPlayerAction(battle, {
      actorId: actor.id,
      skillId: selectedSkillId,
      targetIds: affectedTargetIds,
    })
    setBattle(next)
  }

  function handleCapture() {
    if (!actor || !selectedTargetId || battle.phase === 'end') return
    lastActionKindRef.current = null  // 捕捉不计入连击链
    const { state, pet } = submitCapture(battle, { actorId: actor.id, foeId: selectedTargetId })
    setBattle(state)
    if (pet) addCapturedPetAction(pet)
  }

  function handleUseItem(itemId) {
    if (!actor || battle.phase === 'end') return
    const result = submitUseConsumable(battle, { actorId: actor.id, targetId: actor.id, itemId })
    if (!result.ok) return
    setBattle(result.state)
    deductBagItemAction(itemId)
    setMode('skill')
  }

  function handleNewBattle(preBattle = null) {
    setBattle(preBattle ?? makeNewBattle())
    setSelectedSkillId('normal_attack')
    setSelectedTargetId(null)
    setMode('skill')
    setFloats([])
    prevUnitsRef.current = null
    lastActionKindRef.current = null
    pendingComboKindRef.current = null
    // lastSkillByActorRef 跨战斗保留，不清空
  }

  function handleShuadaoBattle(typeId) {
    const char = charSnapshot()
    const allCharData = [
      { ...char, id: char.activeCharId },
      ...(char.otherChars ?? []),
    ]
    const charUnits = allCharData.map(c => buildCharUnit(c, char))
    const activePets = (char.petRoster ?? []).filter(p => p.active).slice(0, 5)
    const petUnits = activePets.map(createPetAllyUnit)
    const partySize = charUnits.length + petUnits.length
    const foes = buildShuadaoFoes(typeId, char.level, partySize, Math.random)
    const openMsg = shuadaoOpeningMsg(typeId, foes)
    clearPendingShuadaoAction()
    handleNewBattle(createBattle({
      allyUnits:        [...charUnits, ...petUnits],
      customFoes:       foes,
      customOpeningMsg: openMsg,
      charDaoYears:     char.daoYears ?? 1,
    }))
  }

  // 战斗败北 → 记录历史 + 持久化状态（HP=1 作为败北惩罚）
  useEffect(() => {
    if (!battle.defeatNonce) return
    saveBattleEndAction(1, 0)
    saveOtherCharsDefeatAction()
    // 败北时停止自动模式
    setAutoCombat(false)
    setAutoStart(false)
    dbReady.then(() => recordBattle({
      outcome:      'defeat',
      mapName:      battle.log[0]?.match(/【(.+?)】/)?.[1] ?? '',
      foeCount:     foes.length,
      rounds:       Math.max(0, battle.roundIndex),
      expGained:    0,
      petExpGained: 0,
      goldGained:   0,
      loot:         [],
    })).catch(() => {})
  }, [battle.defeatNonce])

  // 自动开战：胜利后延迟 1.5s 发起新战斗（若遇宝宝则暂停并提示）
  useEffect(() => {
    if (!autoStart || battle.phase !== 'end' || battle.outcome !== 'victory') return
    const timer = setTimeout(() => {
      if (!autoStartRef.current) return
      const newBattle = makeNewBattle()
      const hasBaby = newBattle.units.some(u => u.side === 'foe' && u.isBabyMonster && u.hp > 0)
      if (hasBaby) {
        handleNewBattle(newBattle)
        setAutoStart(false)
        setAutoCombat(false)
        setBabyAlert(true)
      } else {
        handleNewBattle(newBattle)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [battle.victoryLootNonce, autoStart])

  // 自动战斗：轮到己方单位时，按记忆行动延迟出手
  useEffect(() => {
    if (!autoCombat || !actor || battle.phase === 'end') return
    const capturedBattle = battle
    const capturedActor  = actor
    const timer = setTimeout(() => {
      if (!autoCombatRef.current) return
      const lFoes = capturedBattle.units.filter(u => u.side === 'foe' && u.hp > 0)
      if (!lFoes.length) return
      const skillId  = lastSkillByActorRef.current[capturedActor.templateKey] ?? 'normal_attack'
      const skillDef = getSkill(skillId, capturedActor.skillLevels?.[skillId] ?? 0)
      const maxTgts  = skillDef?.maxTargets ?? 1
      const targetIds = maxTgts <= 1 ? [lFoes[0].id] : lFoes.slice(0, maxTgts).map(f => f.id)
      const next = submitPlayerAction(capturedBattle, {
        actorId: capturedActor.id, skillId, targetIds,
      })
      setBattle(next)
      setSelectedTargetId(lFoes[0].id)
      lastActionKindRef.current = skillDef?.kind ?? null
    }, 650)
    return () => clearTimeout(timer)
  }, [actor?.id, battle.roundNum, autoCombat])

  // 执行阶段：每隔 500ms 推进一个单位的行动，产生逐步出手的节奏
  useEffect(() => {
    if (battle.phase !== 'executing') return
    const timer = setTimeout(() => {
      setBattle(prev => prev.phase === 'executing' ? executeNextStep(prev) : prev)
    }, 500)
    return () => clearTimeout(timer)
  }, [battle.phase, battle.executionIndex])

  // 行动顺序：按速度排列的全部存活单位（规划阶段显示本回合预期执行顺序）
  const turnQueue = battle.roundOrder
    .map(id => battle.units.find(u => u.id === id))
    .filter(u => u && u.hp > 0)
    .slice(0, 7)

  const canAct = !!actor && battle.phase !== 'end'
  const mapName = battle.log[0]?.match(/【(.+?)】/)?.[1] ?? '遭遇战'
  const roundNum = battle.roundNum ?? 1
  const plannedCount  = Object.keys(battle.pendingAllyActions ?? {}).length
  const totalPlanners = (battle.planningQueue ?? []).length
  const remainingPlanners = (battle.planningQueue ?? []).filter(id => !(battle.pendingAllyActions ?? {})[id])
  const isLastPlanner = remainingPlanners.length <= 1

  return (
    <div className="paper-bg ink-wash-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)', color: 'var(--ink)' }}>

      {/* Top info bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 56,
        display: 'flex', alignItems: 'center', padding: '0 24px',
        background: 'linear-gradient(180deg, rgba(232,220,192,0.95) 0%, rgba(232,220,192,0) 100%)',
        borderBottom: '1px solid rgba(140,108,67,0.4)', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Seal size={34}>战</Seal>
          <div>
            <div className="brush" style={{ fontSize: 22, lineHeight: 1 }}>{mapName}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, fontFamily: 'var(--font-mono)', letterSpacing: 1.5 }}>
              ROUND {String(roundNum).padStart(2, '0')} · PARTY {allies.filter(u => u.hp > 0).length}/{allies.length} · FOE {livingFoes.length}/{foes.length}
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--ink-2)', letterSpacing: 1 }}>
          <span>阶段 · <span style={{ color: battle.phase === 'end' ? 'var(--vermilion)' : 'var(--bamboo)' }}>
            {battle.phase === 'end'
              ? (battle.outcome === 'victory' ? '胜利' : '落败')
              : battle.phase === 'executing'
                ? '出手中'
                : (actor ? `规划·${actor.name}` : '出手中')}
          </span></span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>五行 · 木旺</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <button
            className={'btn-ink btn-ink-sm' + (autoCombat ? ' btn-ink-primary' : '')}
            onClick={() => setAutoCombat(v => !v)}
            style={{ fontSize: 10, padding: '3px 8px', letterSpacing: 0.5 }}
          >
            {autoCombat ? '自动战斗 ●' : '自动战斗 ○'}
          </button>
          <button
            className={'btn-ink btn-ink-sm' + (autoStart ? ' btn-ink-primary' : '')}
            onClick={() => setAutoStart(v => !v)}
            style={{ fontSize: 10, padding: '3px 8px', letterSpacing: 0.5 }}
          >
            {autoStart ? '自动开战 ●' : '自动开战 ○'}
          </button>
          <button
            className={'btn-ink btn-ink-sm' + (char.autoRestore ? ' btn-ink-primary' : '')}
            onClick={toggleAutoRestoreAction}
            style={{ fontSize: 10, padding: '3px 8px', letterSpacing: 0.5 }}
          >
            {char.autoRestore ? '自动回满 ●' : '自动回满 ○'}
          </button>
        </div>
      </div>

      {/* Battlefield */}
      <div style={{ position: 'absolute', top: 56, left: 0, right: 0, height: 500, overflow: 'hidden' }}>
        <InkMountain />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 700px 200px at 50% 100%, rgba(60,40,20,0.18), transparent 70%)' }} />
        <div className="vertical" style={{ position: 'absolute', left: 20, top: 20, fontSize: 14, color: 'var(--vermilion)', fontFamily: 'var(--font-brush)', letterSpacing: '0.3em' }}>
          我方 {allies.length}
        </div>
        <div className="vertical" style={{ position: 'absolute', right: 20, top: 20, fontSize: 14, color: 'var(--ink-2)', fontFamily: 'var(--font-brush)', letterSpacing: '0.3em' }}>
          敌方 {foes.length}
        </div>
        <RowGuide y={84} label="前排 · FRONT" side="left" />
        <RowGuide y={60} label="中排 · MID" side="left" />
        <RowGuide y={46} label="后排 · BACK" side="left" />
        <RowGuide y={82} label="前排 · FRONT" side="right" />
        <RowGuide y={58} label="后排 · BACK" side="right" />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 360, background: 'linear-gradient(180deg, transparent, var(--ink-3) 20%, var(--ink-3) 80%, transparent)', opacity: 0.25 }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', opacity: 0.7 }}>
          <Taiji size={48} />
        </div>

        {/* Allies */}
        {allies.map((a, i) => (
          <CombatUnit key={a.id} unit={a} pos={allyPos[i] ?? allyPos[0]} side="ally" />
        ))}

        {/* Foes */}
        {foes.map((e, i) => (
          <CombatUnit
            key={e.id}
            unit={e}
            pos={enemyPos[Math.min(i, 9)]}
            side="enemy"
            isCenter={e.id === selectedTargetId}
            isAffected={affectedTargetIds.includes(e.id) && e.id !== selectedTargetId}
            onClick={() => e.hp > 0 && setSelectedTargetId(e.id)}
          />
        ))}

        {/* Active actor ring */}
        {actor && (() => {
          const idx = allies.findIndex((a) => a.id === actor.id)
          if (idx < 0) return null
          const pos = allyPos[idx]
          const w = 96 * pos.scale
          const h = 128 * pos.scale
          return (
            <div style={{
              position: 'absolute',
              left: `calc(${pos.x}% - ${w / 2 + 5}px)`,
              top: `calc(${pos.y}% - ${h + 5}px)`,
              width: w + 10, height: h + 10,
              borderRadius: '50%',
              border: '1.5px solid var(--vermilion)',
              boxShadow: '0 0 0 4px rgba(163,55,58,0.15), inset 0 0 0 4px var(--paper)',
              pointerEvents: 'none',
              animation: 'pulse 1.6s ease-in-out infinite',
              zIndex: 4,
            }} />
          )
        })()}

        {/* 飘字占位（不在此处渲染，见下方独立 overlay） */}
      </div>

      {/* 飘雪 overlay — 独立于战场 overflow:hidden，z-index 高于所有面板 */}
      <div style={{
        position: 'absolute', top: 56, left: 0, right: 0, height: 500,
        pointerEvents: 'none', zIndex: 30,
      }}>
        {floats.map((f) => (
          <div
            key={f.id}
            className={`damage-float${f.kind === 'crit' ? ' damage-crit' : f.kind === 'combo' ? ' damage-combo' : ''}`}
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              '--fd': `${f.drift}px`,
            }}
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* Bottom action panel */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 344,
        background: 'linear-gradient(180deg, rgba(232,220,192,0) 0%, rgba(232,220,192,0.94) 24%, rgba(224,210,179,0.98) 100%)',
        borderTop: '1px solid var(--gold-2)',
        display: 'flex', padding: '16px 20px 18px', gap: 14, zIndex: 5,
      }}>
        {/* Party list */}
        <div style={{ width: 268, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SubHead
            title="同心阵"
            sub={`PARTY · ${allies.filter(u => u.hp > 0).length}/${allies.length}`}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1 }}>
            {allies.map((a) => (
              <PartyCard key={a.id} unit={a} isActive={a.id === battle.awaitingActorId} />
            ))}
          </div>
        </div>

        {battle.phase === 'end' ? (
          /* ── 结算卡（内嵌，不遮挡战场） ── */
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 32, paddingLeft: 12 }}>
            {/* 胜负大字 */}
            <div className="brush" style={{
              fontSize: 52, lineHeight: 1, flexShrink: 0,
              color: battle.outcome === 'victory' ? 'var(--gold)' : 'var(--vermilion)',
              textShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}>
              {battle.outcome === 'victory' ? '胜 利' : '落 败'}
            </div>
            {/* 奖励数值 */}
            {battle.outcome === 'victory' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {!battle.isShuadao && (
                    <span style={{ color: 'var(--bamboo)' }}>
                      经验 <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        +{(battle.victoryRewards?.exp ?? 0).toLocaleString()}
                      </span>
                    </span>
                  )}
                  {battle.isShuadao && (
                    <span style={{ color: 'var(--gold-2)' }}>
                      道行 <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                        +{battle.victoryRewards?.daoDays ?? 0}天
                      </span>
                    </span>
                  )}
                  <span style={{ color: 'var(--bamboo)' }}>
                    银两 <span style={{ color: 'var(--gold-2)', fontWeight: 600 }}>
                      +{(battle.victoryRewards?.gold ?? 0).toLocaleString()}
                    </span>
                  </span>
                </div>
                {battle.lastVictoryLoot?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {battle.lastVictoryLoot.map((l, i) => {
                      const name = l.name ?? l.itemId
                      return (
                        <span key={i} style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11,
                          padding: '2px 7px', borderRadius: 2,
                          background: 'rgba(140,108,67,0.12)', border: '1px solid var(--gold-2)',
                          color: 'var(--ink-2)',
                        }}>
                          {name} ×{l.qty}
                        </span>
                      )
                    })}
                  </div>
                )}
                {battle.lastEquipDrops?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {battle.lastEquipDrops.map((e, i) => {
                      const it = getEquipByCode(e.baseCode)
                      const q = QUALITY[e.quality]
                      return (
                        <span key={i} style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11,
                          padding: '2px 7px', borderRadius: 2,
                          background: 'rgba(58,91,161,0.10)',
                          border: `1px solid ${q?.borderColor ?? '#3a5ba1'}`,
                          color: q?.color ?? 'var(--ink)',
                        }}>
                          {it?.item_name ?? '?'} Lv{it?.item_level}
                          {e.quality !== 'white' && <span style={{ opacity: 0.7 }}> [{q?.label}]</span>}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignItems: 'center' }}>
              {char.pendingShuadao && (
                <button
                  className="btn-ink btn-ink-primary"
                  onClick={() => handleShuadaoBattle(char.pendingShuadao)}
                  style={{
                    fontSize: 13, padding: '8px 20px',
                    borderColor: SHUADAO_TYPES[char.pendingShuadao]?.color,
                    color: SHUADAO_TYPES[char.pendingShuadao]?.color,
                  }}
                >
                  刷道出战 · {SHUADAO_TYPES[char.pendingShuadao]?.label}
                </button>
              )}
              <button
                className="btn-ink btn-ink-primary"
                onClick={() => handleNewBattle()}
                style={{ fontSize: 15, padding: '10px 28px' }}
              >
                再 战
              </button>
              <button
                className={'btn-ink btn-ink-sm' + (autoStart ? ' btn-ink-primary' : '')}
                onClick={() => setAutoStart(v => !v)}
                style={{ fontSize: 10, padding: '3px 12px' }}
              >
                {autoStart ? '自动开战 ●' : '自动开战 ○'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <ActionPanel
              actor={actor}
              selectedSkillId={selectedSkillId}
              onSelectSkill={handleSelectSkill}
              mode={mode}
              onMode={setMode}
              plannedCount={plannedCount}
              totalPlanners={totalPlanners}
            />
            {mode === 'item' ? (
              <ItemPanel char={char} actor={actor} onUseItem={handleUseItem} />
            ) : (
              <TargetPanel
                foes={foes}
                selectedTargetId={selectedTargetId}
                affectedTargetIds={affectedTargetIds}
                targetCount={targetCount}
                onSelectTarget={setSelectedTargetId}
                onAction={handleAction}
                onCapture={handleCapture}
                mode={mode}
                canAct={canAct && (mode === 'catch' ? !!selectedTargetId : !!(selectedSkillId && selectedTargetId))}
                autoCombat={autoCombat}
                onToggleAutoCombat={() => setAutoCombat(v => !v)}
                isLastPlanner={isLastPlanner}
              />
            )}
          </>
        )}
      </div>

      {/* Battle log */}
      <div style={{
        position: 'absolute', right: 22, top: 78, width: 280,
        maxHeight: battle.phase === 'end' ? 420 : 320,
        background: 'rgba(243,237,224,0.85)', border: '1px solid var(--ink-3)',
        backdropFilter: 'blur(2px)', padding: '10px 12px',
        fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.55,
        color: 'var(--ink-2)', zIndex: 6, overflowY: 'auto',
        transition: 'max-height 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, borderBottom: '1px dashed var(--ink-4)', marginBottom: 6 }}>
          <span className="brush" style={{ fontSize: 14, color: 'var(--vermilion)' }}>战 报</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: 1 }}>BATTLE LOG</span>
        </div>
        {[...battle.log].reverse().map((line, i) => {
          const isVictory = line.startsWith('战斗胜利')
          const isDefeat  = line.startsWith('我方溃败')
          const isReward  = /^(经验|获得)/.test(line)
          const isDivider = line.startsWith('— —')
          const isSys = line.startsWith('【') || line.startsWith('战斗') || line.startsWith('我方') || isDivider
          const color = isVictory ? 'var(--gold)'
            : isDefeat ? 'var(--vermilion)'
            : isReward ? 'var(--bamboo)'
            : isDivider ? 'var(--ink-4)'
            : isSys ? 'var(--bamboo)'
            : 'var(--ink-2)'
          return (
            <div key={i} style={{ marginBottom: 4, opacity: Math.max(0.25, 1 - i * 0.06), fontSize: 11, lineHeight: 1.5 }}>
              <span style={{ color, fontWeight: (isVictory || isDefeat) ? 600 : 'normal' }}>{line}</span>
            </div>
          )
        })}
      </div>

      {/* Turn order */}
      <div style={{ position: 'absolute', right: 24, bottom: 360, display: 'flex', alignItems: 'center', gap: 8, zIndex: 6 }}>
        <div className="brush" style={{ fontSize: 13, color: 'var(--ink-3)' }}>行动顺序</div>
        {turnQueue.map((u, i) => (
          <div key={u.id + i} style={{
            width: i === 0 ? 38 : 30,
            height: i === 0 ? 38 : 30,
            borderRadius: '50%',
            background: i === 0 ? 'var(--vermilion)' : 'var(--paper)',
            border: '1px solid ' + (i === 0 ? 'var(--vermilion-2)' : 'var(--ink-3)'),
            color: i === 0 ? 'var(--paper)' : 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-brush)', fontSize: i === 0 ? 13 : 10,
            boxShadow: i === 0 ? '0 0 0 3px rgba(163,55,58,0.2)' : 'none',
            flexShrink: 0,
          }}>
            {u.name.slice(0, 2)}
          </div>
        ))}
      </div>

      {/* 自动开战倒计时提示（胜利且 autoStart 开启时显示） */}
      {autoStart && battle.phase === 'end' && battle.outcome === 'victory' && (
        <div style={{
          position: 'absolute', bottom: 360, left: 24, zIndex: 20,
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--bamboo)',
          background: 'rgba(243,237,224,0.88)', padding: '4px 10px',
          border: '1px solid var(--bamboo)',
        }}>
          ⟳ 1.5 秒后自动开战…
        </div>
      )}

      {/* 宝宝刷新提示遮罩 */}
      {babyAlert && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: 'rgba(30,22,10,0.70)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--paper)',
            border: '2px solid var(--gold-2)',
            padding: '32px 40px',
            maxWidth: 380, textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          }}>
            <div className="brush" style={{ fontSize: 28, color: 'var(--gold-2)', marginBottom: 10, letterSpacing: '0.12em' }}>
              ☆ 发现宝宝
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)', marginBottom: 24, lineHeight: 1.8 }}>
              当前战场出现宝宝宠物。<br />
              自动战斗已暂停，请选择操作。
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn-ink btn-ink-primary"
                style={{ padding: '8px 18px' }}
                onClick={() => { setBabyAlert(false); setMode('catch') }}
              >
                留守捕捉
              </button>
              <button
                className="btn-ink"
                style={{ padding: '8px 18px' }}
                onClick={() => {
                  setBabyAlert(false)
                  setAutoCombat(true)
                  setAutoStart(true)
                  handleNewBattle()
                }}
              >
                跳过·继续自动
              </button>
              <button
                className="btn-ink"
                style={{ padding: '8px 18px' }}
                onClick={() => setBabyAlert(false)}
              >
                手动继续
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
