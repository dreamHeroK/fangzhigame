import React, { useState } from 'react'
import { Seal, Taiji, InkMountain, CornerDeco } from './common.jsx'
import { hasSaveData, newGameAction } from '../game/characterStore.js'

const SCHOOLS = ['金', '木', '水', '火', '土']

const SCHOOL_DESC = {
  金: '金系法师　以灵力为根，精通魔法攻击，群攻强力',
  木: '木系法师　生机盎然，治愈与辅助见长，气血上乘',
  水: '水系法师　以守为攻，防御坚韧，法力充沛',
  火: '火系法师　速度极快，爆发惊人，善于先发制人',
  土: '土系法师　力量与物理兼修，近战厚实无比',
}

const SCHOOL_COLOR = { 金: 'var(--gold-2)', 木: 'var(--bamboo)', 水: '#4a90d9', 火: 'var(--vermilion)', 土: '#a87540' }

function CharCard({ char, index, onChange, onRemove, canRemove }) {
  return (
    <div style={{
      background: 'var(--paper)', border: '1px solid var(--ink-3)',
      padding: '14px 16px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <CornerDeco />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Seal size={32} round school={char.school}>{char.school}</Seal>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          角色 {index + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-4)', fontSize: 16, lineHeight: 1, padding: '0 4px',
            }}
            title="移除角色"
          >×</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
          道号
        </label>
        <input
          value={char.name}
          onChange={e => onChange({ ...char, name: e.target.value })}
          maxLength={10}
          placeholder="请输入道号（最多10字）"
          style={{
            flex: 1, padding: '4px 8px', fontSize: 12,
            fontFamily: 'var(--font-body)', background: 'var(--paper-dark)',
            border: '1px solid var(--ink-3)', color: 'var(--ink)', outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
          五行
        </span>
        {SCHOOLS.map(sch => (
          <button
            key={sch}
            onClick={() => onChange({ ...char, school: sch })}
            style={{
              width: 36, height: 36, border: '1px solid',
              borderColor: char.school === sch ? SCHOOL_COLOR[sch] : 'var(--ink-3)',
              background: char.school === sch ? 'rgba(0,0,0,0.06)' : 'var(--paper)',
              color: char.school === sch ? SCHOOL_COLOR[sch] : 'var(--ink-4)',
              cursor: 'pointer', fontFamily: 'var(--font-brush)', fontSize: 16,
              fontWeight: char.school === sch ? 700 : 400,
              transition: 'all 0.15s',
            }}
          >{sch}</button>
        ))}
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)',
        lineHeight: 1.5, padding: '4px 8px', background: 'var(--paper-dark)',
        border: '1px solid var(--ink-3)',
      }}>
        {SCHOOL_DESC[char.school]}
      </div>
    </div>
  )
}

// ── 创建队伍界面 ─────────────────────────────────────────────────────────────

function PartyCreator({ onStart, onBack, warnOverwrite = false }) {
  const [party, setParty] = useState([{ name: '', school: '金' }])
  const [error, setError] = useState('')

  const addMember = () => {
    if (party.length >= 5) return
    setParty(p => [...p, { name: '', school: '金' }])
  }

  const updateMember = (i, updated) => {
    setParty(p => p.map((c, idx) => idx === i ? updated : c))
  }

  const removeMember = (i) => {
    setParty(p => p.filter((_, idx) => idx !== i))
  }

  const handleStart = () => {
    const valid = party.filter(c => c.name.trim().length > 0)
    if (valid.length === 0) { setError('请至少为一位角色填写道号'); return }
    const blank = party.findIndex(c => c.name.trim().length === 0)
    if (blank >= 0) { setError(`第 ${blank + 1} 位角色道号未填写`); return }
    if (warnOverwrite && !window.confirm('此操作将清除现有存档，无法恢复。\n确认重新开始？')) return
    setError('')
    onStart(party.map(c => ({ ...c, name: c.name.trim() })))
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 20,
      width: '100%', maxWidth: 520, margin: '0 auto',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="brush" style={{ fontSize: 20, color: 'var(--ink)', letterSpacing: '0.2em' }}>
          组建队伍
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginTop: 4, letterSpacing: 2 }}>
          FORM YOUR PARTY · 最多5位道友同行
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {party.map((c, i) => (
          <CharCard
            key={i}
            char={c}
            index={i}
            onChange={updated => updateMember(i, updated)}
            onRemove={() => removeMember(i)}
            canRemove={party.length > 1}
          />
        ))}
      </div>

      {party.length < 5 && (
        <button
          onClick={addMember}
          style={{
            padding: '8px 0', background: 'var(--paper)', border: '1px dashed var(--ink-3)',
            color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11,
            letterSpacing: 2,
          }}
        >
          ＋ 添加道友（{party.length}/5）
        </button>
      )}

      {error && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--vermilion)', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn-ink btn-ink-sm" onClick={onBack}>← 返回</button>
        <button
          className="btn-ink btn-ink-sm btn-ink-primary"
          onClick={handleStart}
          style={{ padding: '6px 28px', fontSize: 13 }}
        >
          踏上修仙之路
        </button>
      </div>
    </div>
  )
}

// ── 主入口界面 ───────────────────────────────────────────────────────────────

export default function StartScreen({ onEnterGame }) {
  const [phase, setPhase] = useState('landing')  // 'landing' | 'create'
  const hasSave = hasSaveData()

  const handleLoadSave = () => {
    onEnterGame('load')
  }

  const handleNewGame = (party) => {
    newGameAction(party)
    onEnterGame('new')
  }

  if (phase === 'create') {
    return (
      <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <InkMountain />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560 }}>
          <PartyCreator onStart={handleNewGame} onBack={() => setPhase('landing')} warnOverwrite={hasSave} />
        </div>
      </div>
    )
  }

  // ── Landing ──
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <InkMountain />

      {/* 装饰线 */}
      <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 1, background: 'linear-gradient(90deg, transparent, var(--ink-3), transparent)' }} />
      <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28, height: 1, background: 'linear-gradient(90deg, transparent, var(--ink-3), transparent)' }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* 太极 + 标题 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Taiji size={72} />
          <div style={{ textAlign: 'center' }}>
            <div className="brush" style={{ fontSize: 52, color: 'var(--ink)', letterSpacing: '0.3em', lineHeight: 1 }}>
              问道风
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', letterSpacing: 4, marginTop: 8 }}>
              WENDAO · CULTIVATION RPG
            </div>
          </div>
        </div>

        {/* 分割 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 280 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--ink-3)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: 2 }}>蜀山派</span>
          <div style={{ flex: 1, height: 1, background: 'var(--ink-3)' }} />
        </div>

        {/* 按钮区 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: 240 }}>
          {hasSave && (
            <button
              onClick={handleLoadSave}
              className="btn-ink"
              style={{
                width: '100%', padding: '12px 0', fontSize: 15,
                letterSpacing: '0.25em', fontFamily: 'var(--font-brush)',
              }}
            >
              继续修炼
            </button>
          )}
          <button
            onClick={() => setPhase('create')}
            className={`btn-ink${hasSave ? ' btn-ink-sm' : ''}`}
            style={{
              width: '100%',
              padding: hasSave ? '8px 0' : '12px 0',
              fontSize: hasSave ? 13 : 15,
              letterSpacing: '0.25em',
              fontFamily: 'var(--font-brush)',
              color: hasSave ? 'var(--ink-3)' : undefined,
            }}
          >
            {hasSave ? '重新开始' : '踏入修仙'}
          </button>
        </div>

        {/* 五行印鉴 */}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {SCHOOLS.map(sch => (
            <Seal key={sch} size={28} round school={sch} style={{ opacity: 0.55 }}>
              {sch}
            </Seal>
          ))}
        </div>
      </div>

      {/* 底部 */}
      <div style={{
        position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', letterSpacing: 2,
      }}>
        WENDAO WIND · TEXT GAME ENGINE
      </div>
    </div>
  )
}
