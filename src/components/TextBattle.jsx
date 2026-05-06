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
import {
  addLootStacks,
  consumeInventoryRow,
  createStarterInventory,
  listInventoryStacks,
  migrateInventory,
  normalizeOrbArray,
  parseInventoryRowKey,
} from '../game/inventory.js'
import { buildInventoryRowTooltip, buildItemTooltipParts } from '../game/items/itemTooltip.js'
import { ItemTooltipLayer } from './ItemTooltipLayer.jsx'
import { getConsumable, isQuotaOrb } from '../game/items/catalog.js'
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
/** 背包每页 6×4 格 */
const BAG_SLOTS_PER_PAGE = 24

/** @param {{ label: string, current: number, max: number, kind?: 'hp' | 'mp' | 'exp' }} props */
function Bar({ label, current, max, kind = 'hp' }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  const fill = kind === 'mp' ? 'wd-mp-fill' : kind === 'exp' ? 'wd-exp-fill' : 'wd-hp-fill'
  return (
    <div>
      <div className="wd-bar-text">
        <span>{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="wd-bar-box">
        <div className={`wd-bar-fill ${fill}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
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
  /** 道具行：叠放为 itemId，玲珑为 itemId#orbIndex */
  const [useItemRowKey, setUseItemRowKey] = useState('zhixuecao')
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

  const invStacks = useMemo(() => listInventoryStacks(inventory), [inventory])
  const [bagPage, setBagPage] = useState(0)
  const prevModalForBagRef = useRef(/** @type {typeof modal} */ (null))

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
    if (invStacks.length && !invStacks.some((s) => s.rowKey === useItemRowKey)) setUseItemRowKey(invStacks[0].rowKey)
  }, [invStacks, useItemRowKey])

  const selectedInvRow = useMemo(() => invStacks.find((s) => s.rowKey === useItemRowKey), [invStacks, useItemRowKey])
  const itemHintText = useMemo(
    () => (selectedInvRow ? buildInventoryRowTooltip(selectedInvRow) : ''),
    [selectedInvRow]
  )

  const [itemHoverTip, setItemHoverTip] = useState(/** @type {null | { left: number, top: number, name: string, type: string, desc: string, num: string }} */ (null))

  const clampTipClient = useCallback((e) => {
    const ox = 14
    const oy = 14
    const margin = 8
    const estW = 300
    const estH = 220
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600
    return {
      left: Math.max(margin, Math.min(e.clientX + ox, vw - estW)),
      top: Math.max(margin, Math.min(e.clientY + oy, vh - estH)),
    }
  }, [])

  const showItemHoverTip = useCallback(
    (e, row) => {
      const p = buildItemTooltipParts(row)
      if (!p) return
      setItemHoverTip({ ...clampTipClient(e), ...p })
    },
    [clampTipClient]
  )

  const moveItemHoverTip = useCallback(
    (e) => {
      setItemHoverTip((t) => (t ? { ...t, ...clampTipClient(e) } : null))
    },
    [clampTipClient]
  )

  const hideItemHoverTip = useCallback(() => setItemHoverTip(null), [])

  useEffect(() => {
    if (modal != null) hideItemHoverTip()
  }, [modal, hideItemHoverTip])

  useEffect(() => {
    if (actionMode !== 'item') hideItemHoverTip()
  }, [actionMode, hideItemHoverTip])

  useEffect(() => {
    if (modal === 'bag' && prevModalForBagRef.current !== 'bag') setBagPage(0)
    prevModalForBagRef.current = modal
  }, [modal])

  useEffect(() => {
    if (modal !== 'bag') return
    const tp = Math.max(1, Math.ceil(invStacks.length / BAG_SLOTS_PER_PAGE))
    setBagPage((p) => Math.min(p, tp - 1))
  }, [modal, invStacks.length])

  const bagTotalPages = Math.max(1, Math.ceil(invStacks.length / BAG_SLOTS_PER_PAGE))
  const bagPageSlots = useMemo(() => {
    const start = bagPage * BAG_SLOTS_PER_PAGE
    return Array.from({ length: BAG_SLOTS_PER_PAGE }, (_, i) => invStacks[start + i] ?? null)
  }, [bagPage, invStacks])

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
    const parsed = parseInventoryRowKey(useItemRowKey)
    const def = getConsumable(parsed.itemId)
    if (!def) return
    const tid = itemHealTargetId && livingAllies.some((a) => a.id === itemHealTargetId) ? itemHealTargetId : actor.id
    const target = getActor(battle, tid)
    if (!target) return

    let restoreHp = /** @type {number | undefined} */ (undefined)
    let restoreMp = /** @type {number | undefined} */ (undefined)

    if (isQuotaOrb(def)) {
      const m = migrateInventory(inventory)
      const arr = normalizeOrbArray(m[parsed.itemId])
      const orb = parsed.orbIndex != null ? arr[parsed.orbIndex] : null
      if (!orb || orb.remaining <= 0) return
      if (def.kind === 'hp') {
        const room = Math.max(0, target.maxHp - target.hp)
        const hp = Math.min(room, orb.remaining)
        if (hp <= 0) return
        restoreHp = hp
      } else {
        const room = Math.max(0, target.maxMp - target.mp)
        const mp = Math.min(room, orb.remaining)
        if (mp <= 0) return
        restoreMp = mp
      }
    }

    const { state: next, ok, hpDelta = 0, mpDelta = 0 } = submitUseConsumable(battle, {
      actorId: actor.id,
      targetId: tid,
      itemId: parsed.itemId,
      restoreHp,
      restoreMp,
    })
    if (!ok) return
    const inv2 = consumeInventoryRow(inventory, parsed, { hpRestored: hpDelta, mpRestored: mpDelta })
    if (!inv2) return
    setBattle(next)
    setInventory(inv2)
  }, [actor, battle, inventory, useItemRowKey, itemHealTargetId, livingAllies])

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

  const panelBtn = 'wendao-btn text-sm py-1.5 px-3'

  const leaderAlly = battle.units.find((u) => u.side === 'ally')

  return (
    <>
    <div className="wendao-battle flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden">
      <header className="wendao-navbar shrink-0">
        <span className="wendao-brand">问道风</span>
        <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold text-[#8b5a2b]" aria-label="面包屑">
          <span>主页</span>
          <span className="font-normal text-[#cbb896]">/</span>
          <span>{encounterMode === 'boss' ? '世界 BOSS' : '野外'}</span>
          <span className="font-normal text-[#cbb896]">/</span>
          <span className="font-normal text-[#a08055]">{mapName}</span>
        </nav>
        <label className="wendao-label text-sm">
          人数
          <select
            className="wendao-select ml-1 max-w-[4rem] py-1 text-sm"
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
        <fieldset className="flex flex-wrap items-center gap-1 border-0 p-0">
          <label className="wendao-label">
            <input type="radio" name="enc" checked={encounterMode === 'wild'} onChange={() => setEncounterMode('wild')} />
            野怪
          </label>
          <label className="wendao-label">
            <input type="radio" name="enc" checked={encounterMode === 'boss'} onChange={() => setEncounterMode('boss')} />
            BOSS
          </label>
        </fieldset>
        {encounterMode === 'wild' && (
          <select className="wendao-select max-w-[10rem] text-sm" value={mapId} onChange={(e) => setMapId(e.target.value)}>
            {MAPS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        {encounterMode === 'boss' && (
          <select
            className="wendao-select max-w-[12rem] text-sm"
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
        <button type="button" className="wendao-btn wendao-btn-main text-sm" onClick={restart}>
          开战 / 重置
        </button>
        {battle.phase === 'end' && (
          <span className="text-sm font-bold text-[#b86b12]">{battle.outcome === 'victory' ? '胜' : '败'}</span>
        )}
        <div className="flex w-full flex-wrap gap-2 min-[768px]:ml-auto min-[768px]:w-auto min-[768px]:justify-end">
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

      <div ref={splitColRef} className="flex min-h-0 flex-1 flex-col overflow-hidden px-2.5 pb-2">
        <div className="wendao-battle-panels min-h-0 flex-1">
          <section className="wendao-panel">
            <h2 className="wendao-panel-title">我方队伍</h2>
            <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto">
              {battle.units
                .filter((u) => u.side === 'ally')
                .map((u) => (
                  <li
                    key={u.id}
                    className={`wendao-char ${u.id === battle.awaitingActorId ? 'wendao-char--active' : ''}`}
                  >
                    <div className="wendao-char-name">
                      {u.name}{' '}
                      <span className="font-normal text-[#6b5344]">Lv{u.level ?? 1}</span>
                      {u.hp <= 0 && <span className="text-[#c04040]"> 阵亡</span>}
                    </div>
                    <Bar label="HP" current={u.hp} max={u.maxHp} kind="hp" />
                    <Bar label="MP" current={u.mp} max={u.maxMp} kind="mp" />
                    {expBarCapacity(u.level ?? 1) > 0 ? (
                      <Bar
                        label="经验"
                        current={Math.min(expBarCapacity(u.level ?? 1), Math.max(0, u.expIntoLevel ?? 0))}
                        max={expBarCapacity(u.level ?? 1)}
                        kind="exp"
                      />
                    ) : null}
                  </li>
                ))}
            </ul>
          </section>
          <section className="wendao-panel wendao-panel--enemy">
            <h2 className="wendao-panel-title">敌方怪物</h2>
            <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto pr-0.5">
              {battle.units
                .filter((u) => u.side === 'foe')
                .map((u) => (
                  <li key={u.id} className="wendao-char">
                    <div className="wendao-char-name">
                      {u.name}{' '}
                      <span className="font-normal text-[#6b5344]">Lv{u.level}</span>
                      {u.isWorldBoss && (
                        <span className="ml-1 rounded bg-[#fbe9c7] px-1 text-xs font-bold text-[#8b5a2b] ring-1 ring-[#d4b886]">
                          BOSS
                        </span>
                      )}
                    </div>
                    <Bar label="HP" current={u.hp} max={u.maxHp} kind="hp" />
                    <Bar label="MP" current={u.mp} max={u.maxMp} kind="mp" />
                  </li>
                ))}
            </ul>
          </section>
        </div>

        {actor && battle.phase !== 'end' && (
          <div className="wendao-action-box mt-3 shrink-0">
            <div className="wendao-action-title">当前行动：{actor.name}</div>
            <fieldset className="mb-3 flex flex-wrap gap-2 border-0 p-0">
              <label className="wendao-label">
                <input type="radio" name="act" checked={actionMode === 'fight'} onChange={() => setActionMode('fight')} />
                技能
              </label>
              <label className="wendao-label">
                <input type="radio" name="act" checked={actionMode === 'capture'} onChange={() => setActionMode('capture')} />
                捕捉
              </label>
              <label className="wendao-label">
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
              {actionMode === 'item' && invStacks.length > 0 && (
                <>
                  <label
                    className="wendao-label text-sm"
                    onMouseEnter={(e) => {
                      if (selectedInvRow) showItemHoverTip(e, selectedInvRow)
                    }}
                    onMouseMove={moveItemHoverTip}
                    onMouseLeave={hideItemHoverTip}
                  >
                    药
                    <select
                      className="wendao-select ml-1 max-w-[11rem] text-sm"
                      value={useItemRowKey}
                      onChange={(e) => setUseItemRowKey(e.target.value)}
                    >
                      {invStacks.map((s) => (
                        <option key={s.rowKey} value={s.rowKey}>
                          {s.stackable ? `${s.def.name}×${s.qty}` : s.def.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wendao-label text-sm">
                    目标
                    <select
                      className="wendao-select ml-1 max-w-[8rem] text-sm"
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
              {actionMode === 'item' && itemHintText && (
                <p className="mt-1 max-w-full whitespace-pre-line text-xs leading-snug text-[#6b5f52]">{itemHintText}</p>
              )}
              {actionMode === 'fight' && (
                <label className="wendao-label text-sm">
                  技
                  <select
                    className="wendao-select ml-1 max-w-[9rem] text-sm"
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
              <label className="wendao-label text-sm">
                敌
                <select
                  className="wendao-select ml-1 max-w-[8rem] text-sm"
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
                      : !selectedInvRow ||
                          (selectedInvRow.stackable
                            ? selectedInvRow.qty < 1
                            : (selectedInvRow.remaining ?? 0) < 1) ||
                          livingAllies.length === 0
                }
                className="wendao-btn wendao-btn-main text-sm disabled:opacity-40"
                onClick={onConfirm}
              >
                {actionMode === 'capture' ? '捕捉' : actionMode === 'item' ? '用药' : '出手'}
              </button>
            </div>
            {actionMode === 'capture' && captureTarget && (
              <p className="mt-2 text-sm text-[#8b5a2b]">成功率约 {capturePct}%</p>
            )}
          </div>
        )}

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="上下拖拽调整战报高度，双击恢复默认"
          className="wendao-split group relative z-10 my-1 flex h-3 shrink-0 cursor-ns-resize items-center justify-center rounded border-y border-transparent"
          onPointerDown={onSplitPointerDown}
          onDoubleClick={resetLogSplit}
        >
          <span className="wendao-split-bar pointer-events-none h-0.5 w-10 rounded-full" />
        </div>

        <section className="wendao-log shrink-0" style={{ height: logPanePx }}>
          <div className="wendao-log-head">
            <span className="wendao-log-title">战报</span>
            <span className="wendao-log-hint">拖拽条调节 · 双击条复位</span>
          </div>
          <ol className="wendao-log-list">
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
        guofeng
        panelClassName="max-w-[96vw]"
      >
        <CharacterAttributePanel
          level={leaderAlly?.level ?? 12}
          expIntoLevel={leaderAlly?.expIntoLevel ?? 0}
          sheet={heroSheet}
          guofeng
          onCommit={syncHeroToBattle}
        />
      </Modal>

      <Modal title="宠物管理" open={modal === 'pets'} onClose={() => setModal(null)} guofeng>
        <div className="mb-3 flex justify-end">
          <button type="button" className="wendao-btn text-sm" onClick={addRandomBaby}>
            + 随机宝宝（演示）
          </button>
        </div>
        {pets.length === 0 ? (
          <p className="text-sm text-[#6b5f52]">暂无宠物。战斗中捕捉成功或点击上方按钮添加。</p>
        ) : (
          <ul className="space-y-3">
            {pets.map((pet) => (
              <li
                key={pet.id}
                className="rounded-lg border-2 border-[#d4b886] bg-[#fdfaf3] p-3 text-sm text-[#3a3a38]"
              >
                <div className="font-bold text-[#4a3520]">
                  {pet.displayName}{' '}
                  <span className="font-normal text-[#6b5344]">
                    {pet.kind === 'baby' ? '宝宝' : '野生'} · Lv{pet.level}
                  </span>
                </div>
                {pet.growthDetail && (
                  <div className="mt-1 font-mono text-xs text-[#6b5f52]">
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
                <div className="mt-1 text-xs text-[#6b5f52]">
                  HP {pet.maxHp} · MP {pet.maxMp} · 物攻 {pet.atk} · 法攻 {pet.mAtk ?? '-'} · 防 {pet.def} · 速 {pet.speed}
                  {pet.affinity && ` · 相性 ${pet.affinity}`}
                </div>
                {pet.innateSkillIds?.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#5a4a38]">
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
                  <p className="mt-2 text-xs text-[#8a7a68]">无天生技能池</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        title="背包"
        open={modal === 'bag'}
        onClose={() => setModal(null)}
        guofeng
        hideHeader
        bodyClassName="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 text-sm text-[#3a3a38]"
        panelClassName="wendao-bag-dialog max-w-[520px]"
      >
        <div className="bag-popup">
          <div className="bag-head">
            <h2 id="modal-title" className="bag-title">
              背包
            </h2>
            <button type="button" className="bag-close" onClick={() => setModal(null)} aria-label="关闭">
              ×
            </button>
          </div>
          <p className="bag-hint">战斗胜利自动入包；战斗中「道具」消耗药品。点击格子可选中该物品为战斗用药。</p>
          <div className="bag-grid" role="list">
            {bagPageSlots.map((s, idx) => (
              <div
                key={`${bagPage}-${idx}`}
                role="listitem"
                className={`bag-item ${s ? 'has-goods' : 'bag-item--empty'}`}
                onMouseEnter={(e) => {
                  if (s) showItemHoverTip(e, s)
                  else hideItemHoverTip()
                }}
                onMouseMove={s ? moveItemHoverTip : undefined}
                onMouseLeave={hideItemHoverTip}
                onClick={() => {
                  if (s) setUseItemRowKey(s.rowKey)
                }}
              >
                {s ? (
                  <>
                    <span className="bag-item-name">{s.def.name}</span>
                    {s.stackable ? <span className="bag-item-qty">×{s.qty}</span> : null}
                  </>
                ) : (
                  <span className="text-[#bbb]">空</span>
                )}
              </div>
            ))}
          </div>
          <div className="bag-footer">
            <button
              type="button"
              className="wendao-btn text-sm"
              disabled={bagPage <= 0}
              onClick={() => setBagPage((p) => Math.max(0, p - 1))}
            >
              上一页
            </button>
            <span className="bag-page-info">
              {bagPage + 1} / {bagTotalPages}
            </span>
            <button
              type="button"
              className="wendao-btn text-sm"
              disabled={bagPage >= bagTotalPages - 1}
              onClick={() => setBagPage((p) => Math.min(bagTotalPages - 1, p + 1))}
            >
              下一页
            </button>
          </div>
        </div>
      </Modal>

      <Modal title="任务" open={modal === 'quest'} onClose={() => setModal(null)} wide guofeng>
        <ul className="mb-4 list-inside list-disc space-y-2 text-sm text-[#5a4a38]">
          <li>师门：完成一场战斗（{battle.phase === 'end' && battle.outcome === 'victory' ? '已完成' : '未完成'}）</li>
          <li>修山：组队击败世界 BOSS（占位）</li>
          <li>日常：捕捉 1 只野生宠（占位）</li>
        </ul>
        <details className="rounded-lg border-2 border-[#d4b886] bg-[#fdfaf3] p-2 text-xs text-[#6b5f52]">
          <summary className="cursor-pointer font-bold text-[#8b5a2b]">门派技能表（金系）</summary>
          <table className="mt-2 w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#d4b886] text-left text-[#6b5344]">
                <th className="py-1 pr-2">分支</th>
                <th className="py-1 pr-2">阶</th>
                <th className="py-1 pr-2">技能</th>
                <th className="py-1">等级</th>
              </tr>
            </thead>
            <tbody>
              {getSkillsBySchool('金').map((sk) => (
                <tr key={sk.id} className="border-b border-[#e8dcc8]">
                  <td className="py-1 text-[#6b5344]">{sk.branch === 'B' ? '攻' : sk.branch === 'C' ? '障' : '辅'}</td>
                  <td className="py-1 text-[#3a3a38]">{sk.tier}</td>
                  <td className="py-1 text-[#3a3a38]">{sk.name}</td>
                  <td className="py-1 text-[#6b5344]">≥{sk.learnCharLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Modal>

      <Modal title="商城" open={modal === 'shop'} onClose={() => setModal(null)} guofeng>
        <p className="mb-3 text-sm font-semibold text-[#8b5a2b]">银两：{tael}</p>
        <ul className="space-y-2">
          {SHOP_ROWS.map((row) => {
            const def = getConsumable(row.itemId)
            const shopTipRow = def
              ? { itemId: row.itemId, qty: row.qty, def, stackable: true, rowKey: `shop-${row.key}` }
              : null
            return (
            <li
              key={row.key}
              className="flex items-center justify-between gap-2 rounded-lg border-2 border-[#d4b886] bg-[#fdfaf3] px-3 py-2"
              onMouseEnter={(e) => shopTipRow && showItemHoverTip(e, shopTipRow)}
              onMouseMove={moveItemHoverTip}
              onMouseLeave={hideItemHoverTip}
            >
              <span className="font-medium text-[#4a3520]">{row.label}</span>
              <button
                type="button"
                disabled={tael < row.price}
                className="wendao-btn text-sm disabled:opacity-40"
                onClick={() => buyShop(row)}
              >
                {row.price} 银两
              </button>
            </li>
            )
          })}
        </ul>
      </Modal>

      <Modal title="签到" open={modal === 'sign'} onClose={() => setModal(null)} guofeng>
        <p className="mb-2 text-sm text-[#6b5f52]">连续签到 {signedStreak} 天（演示累计）</p>
        <button
          type="button"
          disabled={lastSignDay === todayStr}
          className="wendao-btn wendao-btn-main w-full py-2.5 text-base disabled:opacity-40"
          onClick={onDailySign}
        >
          {lastSignDay === todayStr ? '今日已签到' : '每日签到'}
        </button>
        <p className="mt-3 text-xs text-[#6b5f52]">奖励：银两 +88、止血草×2、白果×1（演示）</p>
      </Modal>
    </div>
    <ItemTooltipLayer tip={itemHoverTip} />
    </>
  )
}
