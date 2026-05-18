import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Seal, Placeholder, Bar, Taiji, InkMountain, SubHead } from './common.jsx'
import {
  createBattle,
  submitPlayerAction,
  submitCapture,
  getActor,
  STATUS_LABELS,
} from '../game/battle/battleEngine.js'
import { getSkill } from '../game/battle/skills.js'
import { suggestMapIdForLevel } from '../game/battle/wendaoMapsConfig.js'
import { getSnapshot as charSnapshot, applyBattleRewardsAction } from '../game/characterStore.js'
import { dbReady } from '../game/db/sqliteDb.js'
import { recordBattle } from '../game/db/saveManager.js'
import { computeHeroDerived } from '../game/playerSheet.js'
import { createAllyUnit } from '../game/battle/monsters.js'
import { createPetAllyUnit } from '../game/battle/pets.js'

function makeNewBattle() {
  const char = charSnapshot()
  const d = computeHeroDerived(char.level, char)
  const mapId = suggestMapIdForLevel(char.level)
  const learnedEquipped = char.equippedSkills.filter((id) => (char.skillLevels[id] ?? 0) > 0)
  const skillPool = ['normal_attack', ...learnedEquipped]

  const playerUnit = createAllyUnit(char.name, {
    level:       char.level,
    maxHp:       d.maxHp,
    maxMp:       d.maxMp,
    atk:         d.phyDmg,
    mAtk:        d.magDmg,
    def:         d.def,
    speed:       d.speed,
    skillLevels: char.skillLevels,
  }, skillPool)

  // 最多携带 9 只宠物（含玩家共 10 格位）
  const activePets = (char.petRoster ?? []).filter(p => p.active).slice(0, 9)
  const petUnits = activePets.map(createPetAllyUnit)

  return createBattle({ allyUnits: [playerUnit, ...petUnits], mapId })
}

const allyPos = [
  // 0: 玩家 - 最后排
  { x: 8,  y: 46, scale: 0.75 },
  // 1-5: 宠物前排
  { x: 5,  y: 82, scale: 0.85 },
  { x: 14, y: 82, scale: 0.85 },
  { x: 23, y: 82, scale: 0.85 },
  { x: 32, y: 82, scale: 0.85 },
  { x: 41, y: 82, scale: 0.85 },
  // 6-9: 宠物次排
  { x: 9,  y: 60, scale: 0.78 },
  { x: 18, y: 60, scale: 0.78 },
  { x: 27, y: 60, scale: 0.78 },
  { x: 36, y: 60, scale: 0.78 },
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
          <span style={{ marginLeft: 4, fontFamily: 'var(--font-display)', fontSize: 10, color: '#3a8040', padding: '1px 4px', background: 'var(--paper)', border: '1px solid #3a8040' }}>幼崽</span>
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
          {unit.kind === 'pet' ? '宠' : unit.name[0]}
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

const ActionPanel = ({ actor, selectedSkillId, onSelectSkill, mode, onMode }) => {
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
        sub="COMMAND · YOUR TURN"
        right={
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
            {actor ? `当前 · ${actor.name} · MP ${actor.mp}/${actor.maxMp}` : '等待中…'}
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

const TargetPanel = ({ foes, selectedTargetId, affectedTargetIds, onSelectTarget, onAction, onCapture, mode, canAct, targetCount }) => (
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
          <button className="btn-ink" style={{ flex: 1, fontSize: 12 }}>自 动</button>
          <button
            className="btn-ink btn-ink-primary"
            onClick={onAction}
            disabled={!canAct}
            style={{ flex: 2, fontSize: 14, padding: '8px 0', opacity: canAct ? 1 : 0.5 }}
          >
            出 手
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
  const prevUnitsRef = useRef(null)
  const lastActionKindRef = useRef(null)   // 上一次玩家出手的技能类型
  const pendingComboKindRef = useRef(null) // 本次出手是否触发连击（在 useEffect 里消费）
  const lastSkillByActorRef = useRef({})   // 每个 actor 上次选择的技能

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

  // 战斗胜利 → 落账经验 / 宠物经验 / 银两
  useEffect(() => {
    if (!battle.victoryLootNonce || !battle.victoryRewards) return
    const activePetIds = allies
      .filter(u => u.kind === 'pet')
      .map(u => {
        // petunit_<petId> → 取 petRoster 对应 id
        const char = charSnapshot()
        return char.petRoster.find(p => `petunit_${p.id}` === u.id)?.id
      })
      .filter(Boolean)
    applyBattleRewardsAction(battle.victoryRewards, activePetIds, battle.lastVictoryLoot ?? [])
    // 战斗历史写入 DB（DB 已就绪时才记录）
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
    if (actor) lastSkillByActorRef.current[actor.templateKey] = skillId
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
    const { state } = submitCapture(battle, { actorId: actor.id, foeId: selectedTargetId })
    setBattle(state)
  }

  function handleNewBattle() {
    setBattle(makeNewBattle())
    setSelectedSkillId('normal_attack')
    setSelectedTargetId(null)
    setMode('skill')
    setFloats([])
    prevUnitsRef.current = null
    lastActionKindRef.current = null
    pendingComboKindRef.current = null
    // lastSkillByActorRef 跨战斗保留，不清空
  }

  // 战斗败北 → 记录历史
  useEffect(() => {
    if (!battle.defeatNonce) return
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

  // Turn queue: next 7 actors (skip dead)
  const queueIds = [
    ...battle.roundOrder.slice(battle.roundIndex),
    ...battle.roundOrder.slice(0, battle.roundIndex),
  ]
  const turnQueue = queueIds
    .map((id) => battle.units.find((u) => u.id === id))
    .filter((u) => u && u.hp > 0)
    .slice(0, 7)

  const canAct = !!actor && battle.phase === 'running'
  const mapName = battle.log[0]?.match(/【(.+?)】/)?.[1] ?? '遭遇战'
  const roundNum = Math.floor(battle.roundOrder.length > 0 ? battle.roundIndex / Math.max(1, battle.roundOrder.length) : 0) + 1

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
            {battle.phase === 'end' ? (battle.outcome === 'victory' ? '胜利' : '落败') : (actor ? `${actor.name}出手` : '运转中')}
          </span></span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>五行 · 木旺</span>
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
                  <span style={{ color: 'var(--bamboo)' }}>
                    经验 <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                      +{(battle.victoryRewards?.exp ?? 0).toLocaleString()}
                    </span>
                  </span>
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
              </div>
            )}
            <button
              className="btn-ink btn-ink-primary"
              onClick={handleNewBattle}
              style={{ fontSize: 15, padding: '10px 28px', flexShrink: 0 }}
            >
              再 战
            </button>
          </div>
        ) : (
          <>
            <ActionPanel
              actor={actor}
              selectedSkillId={selectedSkillId}
              onSelectSkill={handleSelectSkill}
              mode={mode}
              onMode={setMode}
            />
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
            />
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
    </div>
  )
}
