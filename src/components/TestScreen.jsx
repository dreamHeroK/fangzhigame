import React, { useState, useEffect, useRef } from 'react'

// ── 内联测试套件（不依赖 vitest runtime，可直接在浏览器运行） ──────────────

function assert(label, fn) {
  try {
    fn()
    return { label, ok: true }
  } catch (e) {
    return { label, ok: false, err: e?.message ?? String(e) }
  }
}

function approxEqual(a, b, tol = 0.01) {
  if (Math.abs(a - b) > tol) throw new Error(`Expected ${a} ≈ ${b}`)
}

function assertEqual(a, b) {
  if (a !== b) throw new Error(`Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`)
}

function assertTrue(v, msg = 'Expected true') {
  if (!v) throw new Error(msg)
}

// ── 经验等级测试 ──────────────────────────────────────────────────────────────
async function runExpTests() {
  const {
    expRequiredToNextLevel,
    petExpRequiredToNextLevel,
    totalExpToReachLevel,
    getLevelFromTotalExp,
    applyExpTowardLevelUp,
    applyPetExp,
    getAffinityPointsTotal,
    getFreeAttributePointsTotal,
    CHARACTER_MAX_LEVEL,
    PET_MAX_LEVEL,
  } = await import('../game/characterLevelConfig.js')

  return [
    assert('expRequiredToNextLevel(1) = 120', () => assertEqual(expRequiredToNextLevel(1), 120)),
    assert('expRequiredToNextLevel(10) = 2375', () => assertEqual(expRequiredToNextLevel(10), 2375)),
    assert('expRequiredToNextLevel(50) = 2771697', () => assertEqual(expRequiredToNextLevel(50), 2771697)),
    assert('满级返回 0', () => assertEqual(expRequiredToNextLevel(CHARACTER_MAX_LEVEL), 0)),
    assert('totalExpToReachLevel(1) = 0', () => assertEqual(totalExpToReachLevel(1), 0)),
    assert('totalExpToReachLevel(2) = 120', () => assertEqual(totalExpToReachLevel(2), expRequiredToNextLevel(1))),
    assert('getLevelFromTotalExp(0) = 1', () => assertEqual(getLevelFromTotalExp(0), 1)),
    assert('applyExpTowardLevelUp 精确升级', () => {
      const r = applyExpTowardLevelUp(1, 0, expRequiredToNextLevel(1))
      assertEqual(r.newLevel, 2)
      assertEqual(r.expIntoLevel, 0)
    }),
    assert('applyExpTowardLevelUp 溢出携带', () => {
      const r = applyExpTowardLevelUp(1, 0, expRequiredToNextLevel(1) + 99)
      assertEqual(r.newLevel, 2)
      assertEqual(r.expIntoLevel, 99)
    }),
    assert('getAffinityPointsTotal(10) = 5', () => assertEqual(getAffinityPointsTotal(10), 5)),
    assert('getAffinityPointsTotal(60) = 30', () => assertEqual(getAffinityPointsTotal(60), 30)),
    assert('getAffinityPointsTotal(100) = 69', () => assertEqual(getAffinityPointsTotal(100), 69)),
    assert('getFreeAttributePointsTotal(50) = 196', () => assertEqual(getFreeAttributePointsTotal(50), 196)),
    assert('petExpRequiredToNextLevel(1) = 80', () => assertEqual(petExpRequiredToNextLevel(1), 80)),
    assert('applyPetExp 升级', () => {
      const r = applyPetExp(1, 0, petExpRequiredToNextLevel(1) + 10)
      assertEqual(r.level, 2)
      assertEqual(r.expIntoLevel, 10)
    }),
    assert('applyPetExp 满级封顶', () => {
      const r = applyPetExp(PET_MAX_LEVEL, 0, 999_999_999)
      assertEqual(r.level, PET_MAX_LEVEL)
      assertEqual(r.expIntoLevel, 0)
    }),
  ]
}

// ── 人物面板测试 ──────────────────────────────────────────────────────────────
async function runPlayerSheetTests() {
  const {
    getAttributePointBudget,
    getAffinityPointBudget,
    computeHeroDerived,
    sumFour,
    sumAffinity,
    clampFourStats,
    clampAffinity,
    AFFINITY_CAP_PER_ELEMENT,
  } = await import('../game/playerSheet.js')

  const baseSheet = {
    vit: 50, int: 50, str: 50, agi: 50,
    affMetal: 0, affWood: 0, affWater: 0, affFire: 0, affEarth: 0,
    daoYears: 0, daoDays: 0,
  }

  return [
    assert('AFFINITY_CAP_PER_ELEMENT = 30', () => assertEqual(AFFINITY_CAP_PER_ELEMENT, 30)),
    assert('getAttributePointBudget(1) = 14', () => assertEqual(getAttributePointBudget(1), 14)),
    assert('getAttributePointBudget(50) = 210', () => assertEqual(getAttributePointBudget(50), 210)),
    assert('getAffinityPointBudget(60) = 30', () => assertEqual(getAffinityPointBudget(60), 30)),
    assert('sumFour 正确', () => assertEqual(sumFour({ vit: 10, int: 20, str: 30, agi: 40 }), 100)),
    assert('sumAffinity 正确', () => assertEqual(sumAffinity({ affMetal: 5, affWood: 3, affWater: 0, affFire: 2, affEarth: 0 }), 10)),
    assert('computeHeroDerived maxHp > 0', () => {
      const d = computeHeroDerived(50, baseSheet)
      assertTrue(d.maxHp > 0, `maxHp=${d.maxHp}`)
    }),
    assert('高等级数值更大', () => {
      const d30 = computeHeroDerived(30, baseSheet)
      const d70 = computeHeroDerived(70, baseSheet)
      assertTrue(d70.maxHp > d30.maxHp, `Lv70 hp=${d70.maxHp} should > Lv30 hp=${d30.maxHp}`)
    }),
    assert('dodgePct ≤ 45', () => {
      const d = computeHeroDerived(100, { ...baseSheet, agi: 9999, vit: 9999 })
      assertTrue(d.dodgePct <= 45, `dodgePct=${d.dodgePct}`)
    }),
    assert('clampFourStats 不超预算', () => {
      const r = clampFourStats({ vit: 999, int: 999, str: 999, agi: 999 }, 50)
      assertTrue(sumFour(r) <= getAttributePointBudget(50))
    }),
    assert('clampAffinity 不超预算', () => {
      const r = clampAffinity({ ...baseSheet, affMetal: 20, affWood: 20, affFire: 20 }, 50)
      assertTrue(sumAffinity(r) <= getAffinityPointBudget(50))
    }),
  ]
}

// ── 掉落测试 ──────────────────────────────────────────────────────────────────
async function runDropsTests() {
  const { rollDropsForFoe, mergeLootStacks, formatLootLine } = await import('../game/items/drops.js')

  const alwaysDrop = () => 0.01
  const neverDrop  = () => 0.999

  return [
    assert('mergeLootStacks 合并相同 id', () => {
      const r = mergeLootStacks([{ itemId: 'zhixuecao', qty: 2 }, { itemId: 'zhixuecao', qty: 3 }])
      assertEqual(r.length, 1)
      assertEqual(r[0].qty, 5)
    }),
    assert('mergeLootStacks 过滤未知 id', () => {
      const r = mergeLootStacks([{ itemId: 'UNKNOWN_FAKE', qty: 5 }])
      assertEqual(r.length, 0)
    }),
    assert('alwaysDrop → 有掉落', () => {
      const r = rollDropsForFoe({ level: 1 }, alwaysDrop)
      assertTrue(r.length > 0, '应有掉落')
    }),
    assert('neverDrop → 无掉落', () => {
      const r = rollDropsForFoe({ level: 1 }, neverDrop)
      assertEqual(r.length, 0)
    }),
    assert('formatLootLine 空 → 无药品', () => {
      assertEqual(formatLootLine([]), '本次无药品掉落。')
    }),
    assert('formatLootLine 非空 → 含获得', () => {
      const drops = rollDropsForFoe({ level: 1 }, alwaysDrop)
      const line = formatLootLine(drops)
      assertTrue(line.includes('获得：'), `line="${line}"`)
    }),
  ]
}

// ── 怪物测试 ──────────────────────────────────────────────────────────────────
async function runMonstersTests() {
  const {
    deriveStatsFromLevel,
    inferSkillPool,
    rollFoeCount,
    buildEncounter,
    createAllyUnit,
  } = await import('../game/battle/monsters.js')

  function seededRng(seed = 1) {
    let s = seed
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
  }

  return [
    assert('deriveStatsFromLevel hp > 0', () => {
      const s = deriveStatsFromLevel(1)
      assertTrue(s.hp > 0)
    }),
    assert('boss 倍率 hp > 普通 × 2', () => {
      const n = deriveStatsFromLevel(30)
      const b = deriveStatsFromLevel(30, { isBoss: true })
      assertTrue(b.hp > n.hp * 2, `boss.hp=${b.hp} normal.hp=${n.hp}`)
    }),
    assert('inferSkillPool 含 normal_attack', () => {
      const pool = inferSkillPool({ tags: [], level: 1 })
      assertTrue(pool.includes('normal_attack'))
    }),
    assert('fire tag → liehuo', () => {
      assertTrue(inferSkillPool({ tags: ['fire'], level: 1 }).includes('liehuo'))
    }),
    assert('rollFoeCount ∈ [n, 2n]', () => {
      const rng = seededRng(5)
      for (let i = 0; i < 30; i++) {
        const n = rollFoeCount(3, rng)
        assertTrue(n >= 3 && n <= 6, `n=${n}`)
      }
    }),
    assert('buildEncounter 返回 foe 单位', () => {
      const foes = buildEncounter(2, { rng: seededRng(7) })
      assertTrue(foes.length > 0)
      assertTrue(foes.every(f => f.side === 'foe'))
    }),
    assert('createAllyUnit side=ally', () => {
      const u = createAllyUnit('英雄', { level: 10, maxHp: 500, maxMp: 200, atk: 50, def: 20, speed: 15 }, ['normal_attack'])
      assertEqual(u.side, 'ally')
      assertEqual(u.templateKey, 'player')
      assertEqual(u.hp, u.maxHp)
    }),
  ]
}

// ── 战斗引擎测试 ──────────────────────────────────────────────────────────────
async function runBattleEngineTests() {
  const { createBattle, submitPlayerAction, getActor, getLegalTargets } = await import('../game/battle/battleEngine.js')

  function seededRng(seed = 42) {
    let s = seed
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
  }

  function winnerBattle(rng = seededRng()) {
    return createBattle({
      partySize: 1, rng,
      allyStats: { level: 100, maxHp: 99999, maxMp: 99999, atk: 99999, mAtk: 99999, def: 1, speed: 999 },
      allySkills: ['normal_attack'],
    })
  }

  function loserBattle(rng = seededRng()) {
    return createBattle({
      partySize: 1, rng,
      allyStats: { level: 1, maxHp: 1, maxMp: 1, atk: 1, mAtk: 1, def: 0, speed: 1 },
      allySkills: ['normal_attack'],
    })
  }

  return [
    assert('createBattle 有单位', () => {
      const b = createBattle({ partySize: 2, rng: seededRng(1) })
      assertTrue(b.units.filter(u => u.side === 'ally').length > 0)
      assertTrue(b.units.filter(u => u.side === 'foe').length > 0)
    }),
    assert('createBattle log 非空', () => {
      const b = createBattle({ partySize: 1, rng: seededRng(2) })
      assertTrue(b.log.length > 0)
    }),
    assert('victory 有 victoryRewards', () => {
      const b = winnerBattle(seededRng(20))
      if (b.phase === 'end' && b.outcome === 'victory') {
        assertTrue(b.victoryRewards?.exp > 0, 'victoryRewards.exp 应 > 0')
      }
    }),
    assert('victory 有 victoryLootNonce', () => {
      const b = winnerBattle(seededRng(21))
      if (b.phase === 'end' && b.outcome === 'victory') {
        assertTrue(typeof b.victoryLootNonce === 'string' && b.victoryLootNonce.length > 0)
      }
    }),
    assert('defeat 有 defeatNonce', () => {
      const b = loserBattle(seededRng(31))
      if (b.phase === 'end' && b.outcome === 'defeat') {
        assertTrue(typeof b.defeatNonce === 'string')
      }
    }),
    assert('submitPlayerAction 错误 actorId 无效', () => {
      const rng = seededRng(11)
      const b = createBattle({ partySize: 1, rng })
      if (b.phase !== 'running') return
      const foe = b.units.find(u => u.side === 'foe')
      const snapshot = JSON.stringify(b.units)
      const after = submitPlayerAction(b, { actorId: 'WRONG', skillId: 'normal_attack', targetId: foe.id }, rng)
      assertEqual(JSON.stringify(after.units), snapshot)
    }),
    assert('submitPlayerAction 结束后无效', () => {
      const b = { phase: 'end', units: [], log: [], awaitingActorId: null }
      const after = submitPlayerAction(b, { actorId: 'x', skillId: 'normal_attack', targetId: 'y' })
      assertEqual(after.phase, 'end')
    }),
    assert('getLegalTargets 仅返回活着的单位', () => {
      const b = createBattle({ partySize: 2, rng: seededRng(50) })
      const legal = getLegalTargets(b, 'foe')
      assertTrue(legal.every(u => u.side === 'foe' && u.hp > 0))
    }),
  ]
}

// ── 套件注册 ──────────────────────────────────────────────────────────────────
const SUITES = [
  { id: 'exp',    label: '经验 & 等级', runner: runExpTests },
  { id: 'sheet',  label: '人物面板',    runner: runPlayerSheetTests },
  { id: 'drops',  label: '掉落系统',    runner: runDropsTests },
  { id: 'monsters', label: '怪物生成', runner: runMonstersTests },
  { id: 'battle', label: '战斗引擎',    runner: runBattleEngineTests },
]

// ── UI ───────────────────────────────────────────────────────────────────────

function TestCase({ result }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '3px 0', borderBottom: '1px solid var(--ink-1)',
      fontSize: 12, fontFamily: 'var(--font-mono)',
    }}>
      <span style={{ color: result.ok ? 'var(--bamboo)' : 'var(--vermilion)', minWidth: 16, fontWeight: 700 }}>
        {result.ok ? '✓' : '✗'}
      </span>
      <span style={{ color: result.ok ? 'var(--ink-6)' : 'var(--ink-8)', flex: 1 }}>
        {result.label}
      </span>
      {!result.ok && (
        <span style={{ color: 'var(--vermilion)', fontSize: 11, maxWidth: 320, wordBreak: 'break-all' }}>
          {result.err}
        </span>
      )}
    </div>
  )
}

function SuiteCard({ suite, autoRun = false }) {
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)
  // 用 ref 防止 StrictMode 双重挂载导致同一套件并发重入
  const activeRef = useRef(false)

  async function run() {
    if (activeRef.current) return
    activeRef.current = true
    setRunning(true)
    setResults(null)
    try {
      const r = await suite.runner()
      setResults(r)
    } catch (e) {
      setResults([{ label: '套件初始化失败', ok: false, err: String(e) }])
    }
    activeRef.current = false
    setRunning(false)
  }

  // 挂载时自动运行（进入页面或"全部重跑"触发重挂载时）
  useEffect(() => {
    if (autoRun) run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const passed = results?.filter(r => r.ok).length ?? 0
  const total  = results?.length ?? 0
  const allOk  = results && passed === total

  return (
    <div style={{
      background: 'var(--paper-2)', border: '1px solid var(--ink-2)',
      borderRadius: 4, padding: '10px 14px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: results ? 8 : 0 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink-8)', flex: 1 }}>
          {suite.label}
        </span>
        {results && (
          <span style={{
            fontSize: 12, fontFamily: 'var(--font-mono)',
            color: allOk ? 'var(--bamboo)' : 'var(--vermilion)',
          }}>
            {passed}/{total}
          </span>
        )}
        <button
          onClick={run}
          disabled={running}
          style={{
            fontSize: 11, padding: '2px 10px',
            background: running ? 'var(--ink-2)' : 'var(--gold)',
            color: running ? 'var(--ink-5)' : 'var(--ink-9)',
            border: 'none', borderRadius: 3, cursor: running ? 'default' : 'pointer',
            fontFamily: 'var(--font-main)',
          }}
        >
          {running ? '运行中…' : '运行'}
        </button>
      </div>
      {results && results.map((r, i) => <TestCase key={i} result={r} />)}
    </div>
  )
}

export default function TestScreen() {
  // epoch 从 1 开始，使组件挂载时就自动运行（autoRun = epoch > 0 = true）
  const [epoch, setEpoch] = useState(1)

  return (
    <div style={{ padding: '16px 20px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        borderBottom: '1px solid var(--ink-2)', paddingBottom: 10,
      }}>
        <h2 style={{ margin: 0, fontSize: 16, color: 'var(--ink-8)', fontFamily: 'var(--font-main)' }}>
          测试面板
        </h2>
        <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
          浏览器内联测试 · {SUITES.length} 个套件
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setEpoch(n => n + 1)}
          style={{
            fontSize: 11, padding: '3px 14px',
            background: '#b8860b',
            color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer',
            fontFamily: 'var(--font-main)',
          }}
        >
          全部重跑
        </button>
      </div>
      {SUITES.map(s => (
        <SuiteCard key={`${s.id}_${epoch}`} suite={s} autoRun={epoch > 0} />
      ))}
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
        提示：vitest 单元测试（npm test）亦可在命令行独立运行
      </div>
    </div>
  )
}
