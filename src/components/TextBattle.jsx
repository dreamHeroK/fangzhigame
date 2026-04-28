import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createBattle,
  getActor,
  getLegalTargets,
  submitCapture,
  submitPlayerAction,
  submitUseConsumable,
} from '../game/battle/battleEngine.js'
import { innateName } from '../game/battle/monsterProfiles.js'
import { computeCaptureProbability, createMonsterBaby } from '../game/battle/pets.js'
import { DEFAULT_MAP_ID, WENDAO_MAPS, WENDAO_WORLD_BOSSES, listMapSummaries } from '../game/battle/monsters.js'
import { getSkill } from '../game/battle/skills.js'
import { expBarCapacity } from '../game/characterLevelConfig.js'
import { addLootStacks, createStarterInventory, getQty, listInventoryStacks, tryConsumeOne } from '../game/inventory.js'
import { getSkillsBySchool } from '../game/battle/schoolSkills.js'
import {
  allyPatchFromHeroSheet,
  clampAffinity,
  clampFourStats,
  createDefaultHeroSheet,
} from '../game/playerSheet.js'
import { CharacterAttributePanel } from './CharacterAttributePanel.jsx'
import { Modal } from './Modal.jsx'

const HERO_SHEET_KEY = 'wendao_hero_sheet'

function loadHeroSheetFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(HERO_SHEET_KEY) ?? 'null')
    if (raw && typeof raw.vit === 'number') return raw
  } catch {
    /* ignore */
  }
  return null
}

let _initialBattleHero = null
function getInitialBattleHero() {
  if (_initialBattleHero) return _initialBattleHero
  const raw = loadHeroSheetFromStorage()
  let b = createBattle({ partySize: 2, mapId: DEFAULT_MAP_ID })
  const i = b.units.findIndex((u) => u.side === 'ally')
  const lv = i >= 0 ? b.units[i].level ?? 12 : 12
  let s = raw ?? createDefaultHeroSheet(lv)
  s = clampFourStats(clampAffinity(s, lv), lv)
  if (i >= 0) {
    const units = [...b.units]
    units[i] = allyPatchFromHeroSheet(b.units[i], s)
    b = { ...b, units }
  }
  _initialBattleHero = { battle: b, heroSheet: s }
  return _initialBattleHero
}

const SPLIT_LOG_H_KEY = 'wendao_split_log_h'
const LOG_H_MIN = 72
const LOG_H_DEFAULT = 140
const BATTLE_MIN = 96

function Bar({ label, current, max, color }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  return (
    <div className="text-[10px] text-slate-400 leading-tight">
      <div className="flex justify-between gap-1">
        <span>{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="mt-0.5 h-1 rounded bg-slate-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Panel({ title, children, className = '' }) {
  return (
    <section
      className={`rounded-md border border-slate-800/90 bg-slate-900/55 flex flex-col min-h-0 overflow-hidden ${className}`}
    >
      <h3 className="shrink-0 px-2 py-1 text-[11px] font-medium tracking-wide text-amber-200/90 border-b border-slate-800 bg-slate-950/40">
        {title}
      </h3>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden p-2 text-[11px] leading-snug text-slate-300">
        {children}
      </div>
    </section>
  )
}

const MAPS = listMapSummaries()
const DEFAULT_BOSS_KEY = WENDAO_WORLD_BOSSES[0]?.key ?? 'yangtouguai'
const ALL_SPAWN_KEYS = WENDAO_MAPS.flatMap((m) => m.spawns.map((s) => s.key))

const SHOP_ROWS = [
  { key: 's1', itemId: 'zhixuecao', label: '止血草 ×5', price: 120, qty: 5 },
  { key: 's2', itemId: 'baiguo', label: '白果 ×5', price: 100, qty: 5 },
  { key: 's3', itemId: 'qiyelian', label: '七叶莲 ×3', price: 800, qty: 3 },
]

export function TextBattle() {
  const [partySize, setPartySize] = useState(2)
  const [mapId, setMapId] = useState(DEFAULT_MAP_ID)
  const [encounterMode, setEncounterMode] = useState('wild')
  const [worldBossKey, setWorldBossKey] = useState(DEFAULT_BOSS_KEY)
  const [battle, setBattle] = useState(() => getInitialBattleHero().battle)
  const [skillId, setSkillId] = useState('normal_attack')
  const [targetId, setTargetId] = useState(null)
  const [actionMode, setActionMode] = useState('fight')
  const [pets, setPets] = useState([])
  const [inventory, setInventory] = useState(createStarterInventory)
  const [useItemId, setUseItemId] = useState('zhixuecao')
  const [itemHealTargetId, setItemHealTargetId] = useState(null)
  const victoryLootNonceRef = useRef(null)
  const [tael, setTael] = useState(8888)
  const [signedStreak, setSignedStreak] = useState(0)
  const [lastSignDay, setLastSignDay] = useState(() => {
    try {
      return localStorage.getItem('wendao_sign_day') ?? ''
    } catch {
      return ''
    }
  })
  /** @type {null | 'character' | 'pets' | 'bag' | 'quest' | 'shop' | 'sign'} */
  const [modal, setModal] = useState(null)
  const splitColRef = useRef(null)
  const [logPanePx, setLogPanePx] = useState(() => {
    try {
      const v = parseInt(localStorage.getItem(SPLIT_LOG_H_KEY) ?? '', 10)
      return Number.isFinite(v) && v >= LOG_H_MIN ? v : LOG_H_DEFAULT
    } catch {
      return LOG_H_DEFAULT
    }
  })

  const [heroSheet, setHeroSheet] = useState(() => getInitialBattleHero().heroSheet)

  const actor = battle.awaitingActorId ? getActor(battle, battle.awaitingActorId) : null

  useEffect(() => {
    try {
      localStorage.setItem(HERO_SHEET_KEY, JSON.stringify(heroSheet))
    } catch {
      /* ignore */
    }
  }, [heroSheet])

  const syncHeroToBattle = useCallback((s) => {
    setHeroSheet(s)
    setBattle((b) => {
      const i = b.units.findIndex((u) => u.side === 'ally')
      if (i < 0) return b
      const units = [...b.units]
      units[i] = allyPatchFromHeroSheet(b.units[i], s)
      return { ...b, units }
    })
  }, [])

  const livingAllies = useMemo(
    () => battle.units.filter((u) => u.side === 'ally' && u.hp > 0),
    [battle.units]
  )

  useEffect(() => {
    if (battle.phase !== 'end' || battle.outcome !== 'victory') return
    const n = battle.victoryLootNonce
    if (n == null || victoryLootNonceRef.current === n) return
    victoryLootNonceRef.current = n
    if (battle.lastVictoryLoot?.length) {
      setInventory((inv) => addLootStacks(inv, battle.lastVictoryLoot))
    }
  }, [battle.phase, battle.outcome, battle.victoryLootNonce, battle.lastVictoryLoot])

  useEffect(() => {
    if (!actor) return
    if (itemHealTargetId && livingAllies.some((a) => a.id === itemHealTargetId)) return
    setItemHealTargetId(actor.id)
  }, [actor, itemHealTargetId, livingAllies])

  useEffect(() => {
    const stacks = listInventoryStacks(inventory)
    if (stacks.length && !stacks.some((s) => s.itemId === useItemId)) setUseItemId(stacks[0].itemId)
  }, [inventory, useItemId])

  const foes = useMemo(() => getLegalTargets(battle, 'foe'), [battle])
  const resolvedTargetId = useMemo(() => {
    if (foes.some((f) => f.id === targetId)) return targetId
    return foes[0]?.id ?? null
  }, [foes, targetId])

  const captureTarget = useMemo(
    () => foes.find((f) => f.id === resolvedTargetId) ?? null,
    [foes, resolvedTargetId]
  )
  const capturePct = useMemo(
    () => (captureTarget ? Math.round(computeCaptureProbability(captureTarget) * 100) : 0),
    [captureTarget]
  )

  const todayStr = useMemo(() => new Date().toDateString(), [])

  const clampLogHeight = useCallback((h) => {
    const min = LOG_H_MIN
    const outer = splitColRef.current?.getBoundingClientRect().height ?? 520
    const titleRow = 30
    const resizer = 10
    const max = Math.max(min + 48, outer - BATTLE_MIN - titleRow - resizer)
    return Math.round(Math.max(min, Math.min(max, h)))
  }, [])

  useEffect(() => {
    const onResize = () => setLogPanePx((prev) => clampLogHeight(prev))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampLogHeight])

  const onSplitPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return
      e.preventDefault()
      const startY = e.clientY
      const startH = logPanePx
      const onMove = (ev) => {
        const d = ev.clientY - startY
        setLogPanePx(clampLogHeight(startH + d))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        setLogPanePx((h) => {
          const c = clampLogHeight(h)
          try {
            localStorage.setItem(SPLIT_LOG_H_KEY, String(c))
          } catch {
            /* ignore */
          }
          return c
        })
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp, { once: true })
    },
    [logPanePx, clampLogHeight]
  )

  const resetLogSplit = useCallback(() => {
    setLogPanePx(() => {
      const c = clampLogHeight(LOG_H_DEFAULT)
      try {
        localStorage.setItem(SPLIT_LOG_H_KEY, String(c))
      } catch {
        /* ignore */
      }
      return c
    })
  }, [clampLogHeight])

  const restart = useCallback(() => {
    const b = createBattle({
      partySize,
      mapId,
      encounter: encounterMode === 'boss' ? 'world_boss' : 'wild',
      worldBossKey: encounterMode === 'boss' ? worldBossKey : undefined,
    })
    const i = b.units.findIndex((u) => u.side === 'ally')
    const lv = i >= 0 ? b.units[i].level ?? 12 : 12
    const sheet = clampFourStats(clampAffinity(heroSheet, lv), lv)
    const units =
      i < 0
        ? b.units
        : (() => {
            const u = [...b.units]
            u[i] = allyPatchFromHeroSheet(b.units[i], sheet)
            return u
          })()
    setBattle({ ...b, units })
    setHeroSheet(sheet)
    setSkillId('normal_attack')
    setActionMode('fight')
    const firstFoe = b.units.find((u) => u.side === 'foe' && u.hp > 0)
    setTargetId(firstFoe?.id ?? null)
  }, [partySize, mapId, encounterMode, worldBossKey, heroSheet])

  const onUseConsumable = useCallback(() => {
    if (!actor || battle.phase === 'end') return
    if (getQty(inventory, useItemId) < 1) return
    const tid = itemHealTargetId && livingAllies.some((a) => a.id === itemHealTargetId) ? itemHealTargetId : actor.id
    const { state: next, ok } = submitUseConsumable(battle, {
      actorId: actor.id,
      targetId: tid,
      itemId: useItemId,
    })
    if (!ok) return
    const inv2 = tryConsumeOne(inventory, useItemId)
    if (!inv2) return
    setBattle(next)
    setInventory(inv2)
  }, [actor, battle, inventory, useItemId, itemHealTargetId, livingAllies])

  const onConfirm = useCallback(() => {
    if (!actor || !resolvedTargetId || battle.phase === 'end') return
    if (actionMode === 'item') {
      onUseConsumable()
      return
    }
    if (actionMode === 'capture') {
      setBattle((prev) => {
        const { state, pet } = submitCapture(prev, { actorId: actor.id, foeId: resolvedTargetId })
        if (pet) {
          setPets((old) => (old.some((x) => x.id === pet.id) ? old : [...old, pet]))
        }
        return state
      })
      return
    }
    setBattle((prev) =>
      submitPlayerAction(prev, { actorId: actor.id, skillId, targetId: resolvedTargetId })
    )
  }, [actor, resolvedTargetId, skillId, battle.phase, actionMode, onUseConsumable])

  const addRandomBaby = useCallback(() => {
    const key = ALL_SPAWN_KEYS[Math.floor(Math.random() * ALL_SPAWN_KEYS.length)] ?? 'qingwa'
    setPets((p) => [...p, createMonsterBaby(key)])
  }, [])

  const togglePetInnate = useCallback((petId, innateId) => {
    setPets((prev) =>
      prev.map((pet) => {
        if (pet.id !== petId) return pet
        const cur = new Set(pet.innateEnabledIds ?? [])
        if (cur.has(innateId)) cur.delete(innateId)
        else cur.add(innateId)
        return { ...pet, innateEnabledIds: [...cur] }
      })
    )
  }, [])

  const buyShop = useCallback((row) => {
    if (tael < row.price) return
    setTael((t) => t - row.price)
    setInventory((inv) => addLootStacks(inv, [{ itemId: row.itemId, qty: row.qty }]))
  }, [tael])

  const onDailySign = useCallback(() => {
    if (lastSignDay === todayStr) return
    setLastSignDay(todayStr)
    try {
      localStorage.setItem('wendao_sign_day', todayStr)
    } catch {
      /* ignore */
    }
    setSignedStreak((n) => n + 1)
    setInventory((inv) => addLootStacks(inv, [{ itemId: 'zhixuecao', qty: 2 }, { itemId: 'baiguo', qty: 1 }]))
    setTael((t) => t + 88)
  }, [lastSignDay, todayStr])

  const logLines = battle.log.slice(-24)
  const mapName = MAPS.find((m) => m.id === mapId)?.name ?? '地图'

  const panelBtn =
    'rounded border border-slate-600/80 bg-slate-800/60 px-2 py-1 text-[10px] text-slate-200 hover:border-amber-700/50 hover:bg-slate-800'

  const leaderAlly = battle.units.find((u) => u.side === 'ally')

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[#0c1016] text-slate-200">
      <header className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-800/90 bg-slate-950/90 px-2 py-1.5">
        <h1 className="text-xs font-semibold text-amber-100/95">问道风</h1>
        <nav className="flex items-center gap-1 text-[10px] text-slate-500" aria-label="面包屑">
          <span className="text-slate-400">主页</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">{encounterMode === 'boss' ? '世界 BOSS' : '野外'}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{mapName}</span>
        </nav>
        <div className="mx-0.5 h-4 w-px bg-slate-700" />
        <label className="flex items-center gap-1 text-[10px] text-slate-400">
          人数
          <select
            className="max-w-[3.5rem] rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[10px]"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex items-center gap-2 text-[10px] text-slate-400">
          <label className="inline-flex cursor-pointer items-center gap-0.5">
            <input
              type="radio"
              name="enc"
              checked={encounterMode === 'wild'}
              onChange={() => setEncounterMode('wild')}
            />
            野怪
          </label>
          <label className="inline-flex cursor-pointer items-center gap-0.5">
            <input
              type="radio"
              name="enc"
              checked={encounterMode === 'boss'}
              onChange={() => setEncounterMode('boss')}
            />
            BOSS
          </label>
        </fieldset>
        {encounterMode === 'wild' && (
          <select
            className="max-w-[8rem] rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[10px]"
            value={mapId}
            onChange={(e) => setMapId(e.target.value)}
          >
            {MAPS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        {encounterMode === 'boss' && (
          <select
            className="max-w-[10rem] rounded border border-slate-700 bg-slate-900 px-1 py-0.5 text-[10px]"
            value={worldBossKey}
            onChange={(e) => setWorldBossKey(e.target.value)}
          >
            {WENDAO_WORLD_BOSSES.map((b) => (
              <option key={b.key} value={b.key}>
                {b.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="rounded bg-amber-800/90 px-2 py-0.5 text-[10px] font-medium text-amber-50 hover:bg-amber-700"
          onClick={restart}
        >
          开战 / 重置
        </button>
        {battle.phase === 'end' && (
          <span className="text-[10px] text-amber-300">{battle.outcome === 'victory' ? '胜' : '败'}</span>
        )}
        <div className="w-full shrink-0 border-t border-slate-800/80 pt-1 min-[640px]:ml-auto min-[640px]:w-auto min-[640px]:border-0 min-[640px]:pt-0" />
        <div className="flex w-full flex-wrap gap-1 min-[640px]:w-auto">
          <button type="button" className={panelBtn} onClick={() => setModal('character')}>
            人物属性
          </button>
          <button type="button" className={panelBtn} onClick={() => setModal('pets')}>
            宠物管理
          </button>
          <button type="button" className={panelBtn} onClick={() => setModal('bag')}>
            背包
          </button>
          <button type="button" className={panelBtn} onClick={() => setModal('quest')}>
            任务
          </button>
          <button type="button" className={panelBtn} onClick={() => setModal('shop')}>
            商城
          </button>
          <button type="button" className={panelBtn} onClick={() => setModal('sign')}>
            签到
          </button>
        </div>
      </header>

      <div ref={splitColRef} className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
        <Panel title="战斗" className="min-h-0 flex-1">
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
            <div className="flex min-h-0 min-w-0 flex-col">
              <div className="mb-1 shrink-0 text-[10px] font-medium text-sky-200/90">我方</div>
              <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                  {battle.units
                    .filter((u) => u.side === 'ally')
                    .map((u) => (
                      <li
                        key={u.id}
                        className={`rounded border px-1.5 py-1 ${
                          u.id === battle.awaitingActorId
                            ? 'border-amber-500/50 bg-amber-950/25'
                            : 'border-slate-800 bg-slate-950/40'
                        }`}
                      >
                        <div className="text-[10px] font-medium text-slate-100">
                          {u.name} <span className="font-normal text-slate-500">Lv{u.level ?? 1}</span>
                          {u.hp <= 0 && <span className="text-rose-400"> 阵亡</span>}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <Bar label="HP" current={u.hp} max={u.maxHp} color="bg-emerald-600/85" />
                          <Bar label="MP" current={u.mp} max={u.maxMp} color="bg-sky-600/75" />
                          {expBarCapacity(u.level ?? 1) > 0 ? (
                            <Bar
                              label="经"
                              current={Math.min(expBarCapacity(u.level ?? 1), Math.max(0, u.expIntoLevel ?? 0))}
                              max={expBarCapacity(u.level ?? 1)}
                              color="bg-amber-600/65"
                            />
                          ) : null}
                        </div>
                      </li>
                    ))}
              </ul>
            </div>
            <div className="flex min-h-0 min-w-0 flex-col">
              <div className="mb-1 shrink-0 text-[10px] font-medium text-rose-200/90">敌方</div>
              <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
                  {battle.units
                    .filter((u) => u.side === 'foe')
                    .map((u) => (
                      <li key={u.id} className="rounded border border-slate-800 bg-slate-950/35 px-1.5 py-1">
                        <div className="text-[10px] font-medium text-slate-100">
                          {u.name}{' '}
                          <span className="font-normal text-slate-500">Lv{u.level}</span>
                          {u.isWorldBoss && (
                            <span className="ml-0.5 rounded bg-amber-900/40 px-0.5 text-[9px] text-amber-200">BOSS</span>
                          )}
                        </div>
                        <div className="mt-0.5 space-y-0.5">
                          <Bar label="HP" current={u.hp} max={u.maxHp} color="bg-rose-700/80" />
                          <Bar label="MP" current={u.mp} max={u.maxMp} color="bg-violet-700/65" />
                        </div>
                      </li>
                    ))}
              </ul>
            </div>
          </div>

          {actor && battle.phase !== 'end' && (
            <div className="mt-2 shrink-0 border-t border-slate-800 pt-2">
                <div className="mb-1 text-[10px] text-amber-200/90">行动：{actor.name}</div>
                <fieldset className="mb-1 flex flex-wrap gap-2 text-[10px] text-slate-400">
                  <label className="inline-flex cursor-pointer items-center gap-0.5">
                    <input type="radio" name="act" checked={actionMode === 'fight'} onChange={() => setActionMode('fight')} />
                    技能
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-0.5">
                    <input type="radio" name="act" checked={actionMode === 'capture'} onChange={() => setActionMode('capture')} />
                    捕捉
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-0.5">
                    <input
                      type="radio"
                      name="act"
                      checked={actionMode === 'item'}
                      onChange={() => {
                        setActionMode('item')
                        if (actor) setItemHealTargetId(actor.id)
                      }}
                    />
                    道具
                  </label>
                </fieldset>
                <div className="flex flex-wrap items-end gap-2">
                  {actionMode === 'item' && listInventoryStacks(inventory).length > 0 && (
                    <>
                      <label className="text-[10px] text-slate-400">
                        药
                        <select
                          className="ml-0.5 max-w-[6.5rem] rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px]"
                          value={useItemId}
                          onChange={(e) => setUseItemId(e.target.value)}
                        >
                          {listInventoryStacks(inventory).map((s) => (
                            <option key={s.itemId} value={s.itemId}>
                              {s.def.name}×{s.qty}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-[10px] text-slate-400">
                        目标
                        <select
                          className="ml-0.5 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px]"
                          value={itemHealTargetId ?? actor.id}
                          onChange={(e) => setItemHealTargetId(e.target.value)}
                        >
                          {livingAllies.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  {actionMode === 'fight' && (
                    <label className="text-[10px] text-slate-400">
                      技
                      <select
                        className="ml-0.5 max-w-[7rem] rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px]"
                        value={skillId}
                        onChange={(e) => setSkillId(e.target.value)}
                      >
                        {actor.skillPool.map((id) => {
                          const s = getSkill(id)
                          return (
                            <option key={id} value={id} disabled={actor.mp < s.mpCost}>
                              {s.name}
                            </option>
                          )
                        })}
                      </select>
                    </label>
                  )}
                  <label className="text-[10px] text-slate-400">
                    敌
                    <select
                      className="ml-0.5 max-w-[6rem] rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-[10px]"
                      value={resolvedTargetId ?? ''}
                      onChange={(e) => setTargetId(e.target.value)}
                    >
                      {foes.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={
                      actionMode === 'capture'
                        ? !resolvedTargetId
                        : actionMode === 'fight'
                          ? !resolvedTargetId || getSkill(skillId).mpCost > actor.mp
                          : getQty(inventory, useItemId) < 1 || livingAllies.length === 0
                    }
                    className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-900 disabled:opacity-40"
                    onClick={onConfirm}
                  >
                    {actionMode === 'capture' ? '捕捉' : actionMode === 'item' ? '用药' : '出手'}
                  </button>
                </div>
                {actionMode === 'capture' && captureTarget && (
                  <p className="mt-1 text-[9px] text-amber-200/80">成功率约 {capturePct}%</p>
                )}
            </div>
          )}
        </Panel>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="上下拖拽调整战报高度，双击恢复默认"
          className="group relative z-10 my-0.5 flex h-3 shrink-0 cursor-ns-resize items-center justify-center rounded border-y border-transparent hover:border-amber-800/40 hover:bg-amber-950/30"
          onPointerDown={onSplitPointerDown}
          onDoubleClick={resetLogSplit}
        >
          <span className="pointer-events-none h-0.5 w-10 rounded-full bg-slate-600 group-hover:bg-amber-600/70" />
        </div>

        <section
          className="flex shrink-0 flex-col overflow-hidden rounded-md border border-slate-800/90 bg-slate-950/70"
          style={{ height: logPanePx }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-2 py-1">
            <h3 className="text-[11px] font-medium tracking-wide text-amber-200/90">战报</h3>
            <span className="text-[9px] text-slate-600">拖拽条调节 · 双击条复位</span>
          </div>
          <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 font-mono text-[10px] leading-tight text-slate-400">
            {logLines.map((line, i) => (
              <li key={`${i}-${line.slice(0, 10)}`}>{line}</li>
            ))}
          </ol>
        </section>
      </div>

      <Modal
        title={`【人物属性】${heroSheet.displayName} (Lv.${leaderAlly?.level ?? 1} ${heroSheet.school})`}
        open={modal === 'character'}
        onClose={() => setModal(null)}
        panelClassName="max-w-5xl"
      >
        <CharacterAttributePanel
          level={leaderAlly?.level ?? 12}
          expIntoLevel={leaderAlly?.expIntoLevel ?? 0}
          sheet={heroSheet}
          onCommit={syncHeroToBattle}
        />
      </Modal>

      <Modal title="宠物管理" open={modal === 'pets'} onClose={() => setModal(null)}>
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            onClick={addRandomBaby}
          >
            + 随机宝宝（演示）
          </button>
        </div>
        {pets.length === 0 ? (
          <p className="text-slate-500">暂无宠物。战斗中捕捉成功或点击上方按钮添加。</p>
        ) : (
          <ul className="space-y-3">
            {pets.map((pet) => (
              <li key={pet.id} className="rounded border border-slate-800 bg-slate-950/50 p-3 text-sm">
                <div className="font-medium text-slate-100">
                  {pet.displayName}{' '}
                  <span className="font-normal text-slate-500">
                    {pet.kind === 'baby' ? '宝宝' : '野生'} · Lv{pet.level}
                  </span>
                </div>
                {pet.growthDetail && (
                  <div className="mt-1 text-xs text-slate-500 font-mono">
                    资质 血{pet.growthDetail.hp} 法{pet.growthDetail.mp} 速{pet.growthDetail.spd} 物攻
                    {pet.growthDetail.pAtk} 法攻{pet.growthDetail.mAtk}
                    {pet.growthBand && (
                      <span>
                        {' '}
                        （总成长 {pet.growthBand[0]}~{pet.growthBand[1]}）
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-1 text-xs text-slate-500">
                  HP {pet.maxHp} · MP {pet.maxMp} · 物攻 {pet.atk} · 法攻 {pet.mAtk ?? '-'} · 防 {pet.def} · 速 {pet.speed}
                  {pet.affinity && ` · 相性 ${pet.affinity}`}
                </div>
                {pet.innateSkillIds?.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {pet.innateSkillIds.map((id) => (
                      <label key={id} className="inline-flex cursor-pointer items-center gap-1">
                        <input
                          type="checkbox"
                          checked={(pet.innateEnabledIds ?? []).includes(id)}
                          onChange={() => togglePetInnate(pet.id, id)}
                        />
                        {innateName(id)}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-600">无天生技能池</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal title="背包" open={modal === 'bag'} onClose={() => setModal(null)}>
        <p className="mb-2 text-xs text-slate-500">战斗胜利自动入包；战斗中可用「道具」消耗药品。</p>
        {listInventoryStacks(inventory).length === 0 ? (
          <p className="text-slate-500">背包为空。</p>
        ) : (
          <ul className="space-y-1">
            {listInventoryStacks(inventory).map((s) => (
              <li
                key={s.itemId}
                className="flex justify-between rounded border border-slate-800 px-2 py-1.5 text-sm"
              >
                <span className="text-slate-200">{s.def.name}</span>
                <span className="text-slate-500">×{s.qty}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal title="任务" open={modal === 'quest'} onClose={() => setModal(null)} wide>
        <ul className="mb-4 list-inside list-disc space-y-2 text-slate-400">
          <li>师门：完成一场战斗（{battle.phase === 'end' && battle.outcome === 'victory' ? '已完成' : '未完成'}）</li>
          <li>修山：组队击败世界 BOSS（占位）</li>
          <li>日常：捕捉 1 只野生宠（占位）</li>
        </ul>
        <details className="rounded border border-slate-800 p-2 text-xs text-slate-500">
          <summary className="cursor-pointer font-medium text-amber-200/90">门派技能表（金系）</summary>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-500">
                <th className="py-1 pr-2">分支</th>
                <th className="py-1 pr-2">阶</th>
                <th className="py-1 pr-2">技能</th>
                <th className="py-1">等级</th>
              </tr>
            </thead>
            <tbody>
              {getSkillsBySchool('金').map((sk) => (
                <tr key={sk.id} className="border-b border-slate-800/80">
                  <td className="py-1 text-slate-500">{sk.branch === 'B' ? '攻' : sk.branch === 'C' ? '障' : '辅'}</td>
                  <td className="py-1">{sk.tier}</td>
                  <td className="py-1 text-slate-300">{sk.name}</td>
                  <td className="py-1 text-slate-500">≥{sk.learnCharLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Modal>

      <Modal title="商城" open={modal === 'shop'} onClose={() => setModal(null)}>
        <p className="mb-3 text-sm text-slate-500">银两：{tael}</p>
        <ul className="space-y-2">
          {SHOP_ROWS.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-2 rounded border border-slate-800 px-3 py-2">
              <span className="text-slate-200">{row.label}</span>
              <button
                type="button"
                disabled={tael < row.price}
                className="rounded border border-amber-800/60 px-2 py-1 text-sm text-amber-200/90 disabled:opacity-40"
                onClick={() => buyShop(row)}
              >
                {row.price} 银两
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal title="签到" open={modal === 'sign'} onClose={() => setModal(null)}>
        <p className="mb-2 text-sm text-slate-500">连续签到 {signedStreak} 天（演示累计）</p>
        <button
          type="button"
          disabled={lastSignDay === todayStr}
          className="w-full rounded bg-teal-900/70 py-2 text-sm font-medium text-teal-100 disabled:opacity-40"
          onClick={onDailySign}
        >
          {lastSignDay === todayStr ? '今日已签到' : '每日签到'}
        </button>
        <p className="mt-3 text-xs text-slate-600">奖励：银两 +88、止血草×2、白果×1（演示）</p>
      </Modal>
    </div>
  )
}
