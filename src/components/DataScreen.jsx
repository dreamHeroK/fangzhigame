import React, { useState, useEffect, useCallback } from 'react'
import { PanelHead, SubHead } from './common.jsx'
import { dbReady, exportDbFile, importDbFile, execSql } from '../game/db/sqliteDb.js'
import {
  listSaves, createSave, loadSaveData, setCurrentSave,
  deleteSave, getCurrentSaveId, getBattleHistory, getBattleStats,
} from '../game/db/saveManager.js'
import { getSnapshot, loadFromObject } from '../game/characterStore.js'

// ── 通用工具 ─────────────────────────────────────────────────────────────────

function fmt(n) { return (n ?? 0).toLocaleString() }
function fmtDate(ms) {
  if (!ms) return '—'
  const d = new Date(Number(ms))
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

function Chip({ children, color = 'var(--ink-3)' }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 6px',
      border: `1px solid ${color}`, borderRadius: 2, color,
      background: 'rgba(243,237,224,0.6)',
    }}>
      {children}
    </span>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      flex: 1, padding: '10px 14px',
      background: 'rgba(243,237,224,0.7)', border: '1px solid var(--ink-4)',
      borderRadius: 3, textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: color ?? 'var(--ink)' }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', marginTop: 3, letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  )
}

// ── 存档管理 Tab ──────────────────────────────────────────────────────────────

function SavesTab({ onReload }) {
  const [saves, setSaves]   = useState([])
  const [curId, setCurId]   = useState(null)
  const [newName, setNewName] = useState('')
  const [busy, setBusy]     = useState(false)
  const [msg, setMsg]       = useState('')

  const refresh = useCallback(() => {
    setSaves(listSaves())
    setCurId(getCurrentSaveId())
  }, [])

  useEffect(() => { refresh() }, [])

  function toast(m) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function handleCreate() {
    const name = newName.trim() || `存档 ${saves.length + 1}`
    setBusy(true)
    await createSave(name, getSnapshot())
    setNewName('')
    refresh()
    setBusy(false)
    toast(`已创建「${name}」`)
  }

  async function handleLoad(saveId) {
    const data = loadSaveData(saveId)
    if (!data) { toast('读档失败'); return }
    await setCurrentSave(saveId)
    loadFromObject(data)
    refresh()
    onReload?.()
    toast('读档成功')
  }

  async function handleDelete(saveId) {
    if (!confirm('确认删除此存档？')) return
    await deleteSave(saveId)
    if (curId === saveId) setCurId(null)
    refresh()
    toast('已删除')
  }

  function handleExport() { exportDbFile('wendao_save.db') }

  function handleImportClick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.db'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      setBusy(true)
      try {
        const buf = await file.arrayBuffer()
        await importDbFile(buf)
        refresh()
        toast('导入成功')
      } catch { toast('导入失败，文件可能损坏') }
      setBusy(false)
    }
    input.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="存档名称（留空自动命名）"
          style={{
            flex: 1, fontFamily: 'var(--font-body)', fontSize: 12,
            padding: '5px 10px', border: '1px solid var(--ink-3)', borderRadius: 2,
            background: 'rgba(243,237,224,0.8)', color: 'var(--ink)',
          }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
        />
        <button className="btn-ink btn-ink-primary btn-ink-sm" onClick={handleCreate} disabled={busy}>
          新建存档
        </button>
        <button className="btn-ink btn-ink-sm" onClick={handleExport}>导出 .db</button>
        <button className="btn-ink btn-ink-sm" onClick={handleImportClick} disabled={busy}>导入 .db</button>
      </div>
      {msg && (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--bamboo)', padding: '4px 8px', background: 'rgba(60,120,60,0.08)', border: '1px solid var(--bamboo)', borderRadius: 2 }}>
          {msg}
        </div>
      )}

      {/* 存档列表 */}
      {saves.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-4)', textAlign: 'center', padding: '32px 0' }}>
          暂无存档 — 点击「新建存档」创建第一个
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {saves.map(sv => {
            const isCur = sv.id === curId
            return (
              <div key={sv.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 3,
                background: isCur ? 'rgba(163,55,58,0.08)' : 'rgba(243,237,224,0.6)',
                border: `1px solid ${isCur ? 'var(--vermilion)' : 'var(--ink-4)'}`,
              }}>
                {isCur && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--vermilion)', letterSpacing: 1 }}>当前</span>
                )}
                <div style={{ flex: 1 }}>
                  <span className="brush" style={{ fontSize: 14, color: 'var(--ink)' }}>{sv.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginLeft: 10 }}>
                    {sv.char_name} · Lv{sv.char_level} · {sv.char_school}系
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                  {fmtDate(sv.updated_at)}
                </span>
                <button className="btn-ink btn-ink-sm" onClick={() => handleLoad(sv.id)}>读档</button>
                <button
                  className="btn-ink btn-ink-sm"
                  onClick={() => handleDelete(sv.id)}
                  style={{ color: 'var(--vermilion)', borderColor: 'var(--vermilion)' }}
                >
                  删除
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── 战斗记录 Tab ──────────────────────────────────────────────────────────────

function BattleLogTab() {
  const [history, setHistory]   = useState([])
  const [stats, setStats]       = useState(null)
  const [filter, setFilter]     = useState('all')

  useEffect(() => {
    const saveId = getCurrentSaveId()
    if (!saveId) return
    setHistory(getBattleHistory(saveId, 200))
    setStats(getBattleStats(saveId))
  }, [])

  const filtered = filter === 'all' ? history
    : history.filter(r => r.outcome === filter)

  const winRate = stats?.total > 0
    ? Math.round((stats.victories / stats.total) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 统计摘要 */}
      <div style={{ display: 'flex', gap: 8 }}>
        <StatCard label="总战斗" value={fmt(stats?.total)} />
        <StatCard label="胜利" value={fmt(stats?.victories)} color="var(--gold)" />
        <StatCard label="败北" value={fmt(stats?.defeats)} color="var(--vermilion)" />
        <StatCard label="胜率" value={`${winRate}%`} color="var(--bamboo)" />
        <StatCard label="累计经验" value={fmt(stats?.total_exp)} color="var(--bamboo)" />
        <StatCard label="累计银两" value={fmt(stats?.total_gold)} color="var(--gold-2)" />
      </div>

      {/* 过滤器 */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['all', 'victory', 'defeat'].map(f => (
          <button
            key={f}
            className={'btn-ink btn-ink-sm' + (filter === f ? ' btn-ink-primary' : '')}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? '全部' : f === 'victory' ? '胜利' : '败北'}
          </button>
        ))}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)', marginLeft: 6, alignSelf: 'center' }}>
          {filtered.length} 条记录
        </span>
      </div>

      {/* 记录表格 */}
      {filtered.length === 0 ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-4)', textAlign: 'center', padding: '32px 0' }}>
          暂无战斗记录
        </div>
      ) : (
        <div style={{ overflowY: 'auto', maxHeight: 420 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ink-3)', color: 'var(--ink-3)', textAlign: 'left' }}>
                {['时间', '结果', '地图', '敌数', '轮次', '经验', '宠物经验', '银两', '掉落'].map(h => (
                  <th key={h} style={{ padding: '5px 8px', fontWeight: 'normal', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const loot = (() => { try { return JSON.parse(r.loot_json ?? '[]') } catch { return [] } })()
                const isVic = r.outcome === 'victory'
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--ink-4)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                    <td style={{ padding: '4px 8px', color: 'var(--ink-4)' }}>{fmtDate(r.fought_at)}</td>
                    <td style={{ padding: '4px 8px', color: isVic ? 'var(--gold)' : 'var(--vermilion)', fontWeight: 600 }}>
                      {isVic ? '胜' : '败'}
                    </td>
                    <td style={{ padding: '4px 8px', color: 'var(--ink-2)' }}>{r.map_name || '—'}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--ink-2)', textAlign: 'right' }}>{r.foe_count}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--ink-2)', textAlign: 'right' }}>{r.rounds}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--bamboo)', textAlign: 'right' }}>+{fmt(r.exp_gained)}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--bamboo)', textAlign: 'right' }}>+{fmt(r.pet_exp_gained)}</td>
                    <td style={{ padding: '4px 8px', color: 'var(--gold-2)', textAlign: 'right' }}>+{fmt(r.gold_gained)}</td>
                    <td style={{ padding: '4px 8px' }}>
                      {loot.length > 0
                        ? loot.map(l => `${l.name ?? l.itemId}×${l.qty}`).join(' ')
                        : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── 调试 Tab ─────────────────────────────────────────────────────────────────

function DebugTab() {
  const [sql, setSql]       = useState('SELECT * FROM saves')
  const [result, setResult] = useState(null)
  const [error, setError]   = useState('')

  function runQuery() {
    setError('')
    try {
      const res = execSql(sql)
      setResult(res)
    } catch (e) {
      setError(e.message)
      setResult(null)
    }
  }

  const char = getSnapshot()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 当前角色快照 */}
      <div>
        <SubHead title="当前角色" sub="CHARACTER SNAPSHOT" />
        <div style={{
          marginTop: 8, padding: '10px 14px', borderRadius: 3,
          background: 'rgba(0,0,0,0.03)', border: '1px solid var(--ink-4)',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 16px',
          fontFamily: 'var(--font-mono)', fontSize: 11,
        }}>
          {[
            ['角色', char.name], ['门派', char.school + '系'],
            ['等级', char.level], ['经验', fmt(char.expIntoLevel)],
            ['体力', char.vit], ['灵力', char.int],
            ['力量', char.str], ['敏捷', char.agi],
            ['银两', fmt(char.tael)], ['潜能', fmt(char.potential)],
            ['宠物', (char.petRoster?.length ?? 0) + '只'],
            ['已装技能', char.equippedSkills?.length ?? 0],
          ].map(([k, v]) => (
            <div key={k}>
              <span style={{ color: 'var(--ink-4)' }}>{k}: </span>
              <span style={{ color: 'var(--ink)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SQL 控制台 */}
      <div>
        <SubHead title="SQL 控制台" sub="QUERY CONSOLE" />
        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
          <textarea
            value={sql}
            onChange={e => setSql(e.target.value)}
            rows={3}
            style={{
              flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12,
              padding: '6px 10px', border: '1px solid var(--ink-3)', borderRadius: 2,
              background: 'rgba(243,237,224,0.8)', color: 'var(--ink)',
              resize: 'vertical',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runQuery() }}
          />
          <button className="btn-ink btn-ink-primary" onClick={runQuery} style={{ alignSelf: 'flex-start', padding: '6px 16px' }}>
            执行<br /><span style={{ fontSize: 9, opacity: 0.7 }}>Ctrl+↵</span>
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--vermilion)', padding: '4px 8px', background: 'rgba(163,55,58,0.06)', border: '1px solid rgba(163,55,58,0.3)', borderRadius: 2 }}>
            {error}
          </div>
        )}
        {result && (
          <div style={{ marginTop: 8, overflowX: 'auto', overflowY: 'auto', maxHeight: 260 }}>
            {result.rows.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', padding: '8px 0' }}>
                查询完成，0 行
              </div>
            ) : (
              <table style={{ width: 'max-content', minWidth: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'rgba(140,108,67,0.1)' }}>
                    {result.columns.map(c => (
                      <th key={c} style={{ padding: '4px 10px', textAlign: 'left', color: 'var(--ink-3)', fontWeight: 'normal', borderBottom: '1px solid var(--ink-3)', whiteSpace: 'nowrap' }}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ink-4)' }}>
                      {row.map((cell, j) => (
                        <td key={j} style={{ padding: '3px 10px', color: 'var(--ink-2)', whiteSpace: 'nowrap', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cell === null ? <span style={{ color: 'var(--ink-4)' }}>NULL</span> : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', marginTop: 4 }}>
              {result.rows.length} 行 · {result.columns.length} 列
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 主屏幕 ────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'saves',  label: '存档管理' },
  { id: 'battle', label: '战斗记录' },
  { id: 'debug',  label: '数据调试' },
]

export default function DataScreen() {
  const [ready, setReady]     = useState(false)
  const [activeTab, setTab]   = useState('saves')
  const [refreshKey, setKey]  = useState(0)

  useEffect(() => {
    dbReady.then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="paper-bg" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', color: 'var(--ink-3)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brush" style={{ fontSize: 28, marginBottom: 12 }}>初始化数据库…</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>加载 SQLite WASM</div>
        </div>
      </div>
    )
  }

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead
        title="数 据 管 理"
        sub="LOCAL DATABASE · SQLite"
        right={
          <Chip color="var(--bamboo)">sql.js · IndexedDB</Chip>
        }
      />

      <div style={{ position: 'absolute', inset: '60px 18px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Tabs */}
        <div className="tab-list" style={{ flexShrink: 0 }}>
          {TABS.map(t => (
            <div
              key={t.id}
              className={'tab' + (activeTab === t.id ? ' active' : '')}
              onClick={() => setTab(t.id)}
              style={{ padding: '4px 16px', fontSize: 12, cursor: 'pointer' }}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {activeTab === 'saves'  && <SavesTab key={refreshKey} onReload={() => setKey(k => k + 1)} />}
          {activeTab === 'battle' && <BattleLogTab key={refreshKey} />}
          {activeTab === 'debug'  && <DebugTab />}
        </div>
      </div>
    </div>
  )
}
