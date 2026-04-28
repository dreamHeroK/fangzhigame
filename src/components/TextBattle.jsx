import { useCallback, useMemo, useState } from 'react'
import {
  createBattle,
  getActor,
  getLegalTargets,
  submitCapture,
  submitPlayerAction,
} from '../game/battle/battleEngine.js'
import { innateName } from '../game/battle/monsterProfiles.js'
import { computeCaptureProbability, createMonsterBaby } from '../game/battle/pets.js'
import { DEFAULT_MAP_ID, WENDAO_MAPS, WENDAO_WORLD_BOSSES, listMapSummaries } from '../game/battle/monsters.js'
import { getSkill } from '../game/battle/skills.js'
import {
  expBarCapacity,
} from '../game/characterLevelConfig.js'
import {
  SCHOOLS,
  SCHOOL_THEME,
  SKILL_LEVEL_CAP_MULT,
  SKILL_MILESTONES,
  getSkillById,
  getSkillsBySchool,
  maxSkillLevelForChar,
  prereqSkillId,
} from '../game/battle/schoolSkills.js'

function Bar({ label, current, max, color }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  return (
    <div className="text-xs text-slate-400">
      <div className="flex justify-between gap-2">
        <span>{label}</span>
        <span>
          {current}/{max}
        </span>
      </div>
      <div className="mt-0.5 h-1.5 rounded bg-slate-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const MAPS = listMapSummaries()
const DEFAULT_BOSS_KEY = WENDAO_WORLD_BOSSES[0]?.key ?? 'yangtouguai'
const ALL_SPAWN_KEYS = WENDAO_MAPS.flatMap((m) => m.spawns.map((s) => s.key))

export function TextBattle() {
  const [partySize, setPartySize] = useState(2)
  const [mapId, setMapId] = useState(DEFAULT_MAP_ID)
  const [encounterMode, setEncounterMode] = useState('wild')
  const [worldBossKey, setWorldBossKey] = useState(DEFAULT_BOSS_KEY)
  const [battle, setBattle] = useState(() => createBattle({ partySize: 2, mapId: DEFAULT_MAP_ID }))
  const [skillId, setSkillId] = useState('normal_attack')
  const [targetId, setTargetId] = useState(null)
  const [actionMode, setActionMode] = useState('fight')
  const [pets, setPets] = useState([])

  const actor = battle.awaitingActorId ? getActor(battle, battle.awaitingActorId) : null
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

  const restart = useCallback(() => {
    const b = createBattle({
      partySize,
      mapId,
      encounter: encounterMode === 'boss' ? 'world_boss' : 'wild',
      worldBossKey: encounterMode === 'boss' ? worldBossKey : undefined,
    })
    setBattle(b)
    setSkillId('normal_attack')
    setActionMode('fight')
    const firstFoe = b.units.find((u) => u.side === 'foe' && u.hp > 0)
    setTargetId(firstFoe?.id ?? null)
  }, [partySize, mapId, encounterMode, worldBossKey])

  const onConfirm = useCallback(() => {
    if (!actor || !resolvedTargetId || battle.phase === 'end') return
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
  }, [actor, resolvedTargetId, skillId, battle.phase, actionMode])

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

  const logLines = battle.log.slice(-24)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-amber-100/95 tracking-tight">问道风 · 文字回合战</h1>
        <p className="text-sm text-slate-500">
          野怪战斗中不使用天生技能（含被动）；捕捉后写入宠物，可在栏内勾选「启用」以备后续出战接入。捕捉成功率随目标血量降低而升高，HP≤30%
          时达到上限（约 55%）；世界 BOSS 不可捕捉。
        </p>
      </header>

      <details className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-400">
        <summary className="cursor-pointer select-none font-medium text-amber-200/90">
          五系门派技能（攻击 / 障碍 / 辅助）与解锁条件
        </summary>
        <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
          <p>
            技能等级上限 ≈ 人物等级 × {SKILL_LEVEL_CAP_MULT}（例：100 级 → {maxSkillLevelForChar(100)} 级技能上限）。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {SKILL_MILESTONES.map((m) => (
              <li key={m.level}>
                <span className="text-slate-300">{m.level} 级 · {m.title}</span>：{m.desc}
              </li>
            ))}
          </ul>
          <div className="space-y-1">
            <p className="text-slate-500">五系特色（障碍 / 辅助）</p>
            <ul className="list-disc space-y-0.5 pl-5 text-slate-500">
              {SCHOOLS.map((s) => (
                <li key={s}>
                  <span className="text-slate-300">{s}</span>：{SCHOOL_THEME[s].obstacle}；{SCHOOL_THEME[s].assist}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-600">
            下表以金系为例；木水火土技能名见配置 <code className="text-slate-500">schoolSkills.js</code>，解锁等级与前置逻辑对称。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-500">
                  <th className="py-1 pr-2">分支</th>
                  <th className="py-1 pr-2">阶</th>
                  <th className="py-1 pr-2">技能名</th>
                  <th className="py-1 pr-2">人物等级</th>
                  <th className="py-1">前置</th>
                </tr>
              </thead>
              <tbody>
                {getSkillsBySchool('金').map((sk) => (
                  <tr key={sk.id} className="border-b border-slate-800/80">
                    <td className="py-1 pr-2 text-slate-500">{sk.branch === 'B' ? '攻击' : sk.branch === 'C' ? '障碍' : '辅助'}</td>
                    <td className="py-1 pr-2">{sk.tier}</td>
                    <td className="py-1 pr-2 text-slate-300">{sk.name}</td>
                    <td className="py-1 pr-2">≥{sk.learnCharLevel}</td>
                    <td className="py-1 text-slate-500">
                      {!sk.prereq
                        ? '—'
                        : `${getSkillById(prereqSkillId(sk))?.name ?? '?'} ≥${sk.prereq.minSkillLevel}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-400">
            队伍人数
            <select
              className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
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
          <fieldset className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span className="text-slate-500">遭遇</span>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="enc"
                checked={encounterMode === 'wild'}
                onChange={() => setEncounterMode('wild')}
              />
              地图野怪
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="enc"
                checked={encounterMode === 'boss'}
                onChange={() => setEncounterMode('boss')}
              />
              世界 BOSS
            </label>
          </fieldset>
          {encounterMode === 'wild' && (
            <label className="text-sm text-slate-400">
              地图
              <select
                className="ml-2 max-w-[min(100%,18rem)] rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
                value={mapId}
                onChange={(e) => setMapId(e.target.value)}
              >
                {MAPS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}（{m.levelRange[0]}-{m.levelRange[1]}级 · {m.spawnCount}种）
                  </option>
                ))}
              </select>
            </label>
          )}
          {encounterMode === 'boss' && (
            <label className="text-sm text-slate-400">
              BOSS
              <select
                className="ml-2 max-w-[min(100%,20rem)] rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
                value={worldBossKey}
                onChange={(e) => setWorldBossKey(e.target.value)}
              >
                {WENDAO_WORLD_BOSSES.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.name} Lv{b.level} · {b.mapName}（建议≥{b.partyMin}人）
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className="rounded bg-amber-700/90 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-600"
            onClick={restart}
          >
            进入战斗 / 重置
          </button>
          <button
            type="button"
            className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
            onClick={addRandomBaby}
          >
            演示：随机宝宝
          </button>
          {battle.phase === 'end' && (
            <span className="text-sm text-amber-200/90">
              {battle.outcome === 'victory' ? '胜' : '败'}
            </span>
          )}
        </div>
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4 space-y-3">
        <h2 className="text-sm font-medium text-teal-200/90">宠物栏（野生 / 宝宝）</h2>
        {pets.length === 0 ? (
          <p className="text-xs text-slate-500">暂无宠物。捕捉成功或点击「随机宝宝」。</p>
        ) : (
          <ul className="space-y-3 max-h-56 overflow-y-auto">
            {pets.map((pet) => (
              <li key={pet.id} className="rounded border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm">
                <div className="font-medium text-slate-100">
                  {pet.displayName}{' '}
                  <span className="text-slate-500 font-normal">
                    {pet.kind === 'baby' ? '宝宝' : '野生'} · Lv{pet.level}
                    {pet.kind === 'baby' && pet.babyPotential != null && (
                      <span> · 潜力系数 {pet.babyPotential}</span>
                    )}
                  </span>
                </div>
                {pet.growthDetail && (
                  <div className="mt-1 text-xs text-slate-500 font-mono leading-relaxed">
                    资质 血{pet.growthDetail.hp} 法{pet.growthDetail.mp} 速{pet.growthDetail.spd} 物攻
                    {pet.growthDetail.pAtk} 法攻{pet.growthDetail.mAtk} · 五项和 {pet.growthSum}
                    {pet.growthBand && (
                      <span>
                        {' '}
                        （表总成长 {pet.growthBand[0]}~{pet.growthBand[1]}）
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-1 text-xs text-slate-500">
                  HP {pet.maxHp} · MP {pet.maxMp} · 物攻 {pet.atk} · 法攻 {pet.mAtk ?? '-'} · 防 {pet.def} · 速{' '}
                  {pet.speed}
                  {pet.affinity && ` · 相性 ${pet.affinity}`}
                </div>
                {pet.innateSkillIds?.length > 0 ? (
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <span className="text-slate-500">天生（勾选为启用，仅宠物有效）：</span>
                    <div className="flex flex-wrap gap-2">
                      {pet.innateSkillIds.map((id) => (
                        <label key={id} className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(pet.innateEnabledIds ?? []).includes(id)}
                            onChange={() => togglePetInnate(pet.id, id)}
                          />
                          {innateName(id)}
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-slate-600">无天生技能池</p>
                )}
                {pet.notes && <p className="mt-1 text-xs text-slate-600">{pet.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <h2 className="text-sm font-medium text-sky-200/90">我方</h2>
          <ul className="space-y-3">
            {battle.units
              .filter((u) => u.side === 'ally')
              .map((u) => (
                <li
                  key={u.id}
                  className={`rounded border px-3 py-2 text-sm ${
                    u.id === battle.awaitingActorId
                      ? 'border-amber-500/60 bg-amber-950/30'
                      : 'border-slate-800 bg-slate-950/40'
                  }`}
                >
                  <div className="font-medium text-slate-100">
                    {u.name}
                    <span className="ml-2 font-normal text-slate-500">Lv{u.level ?? 1}</span>
                    {u.hp <= 0 && <span className="ml-2 text-rose-400">阵亡</span>}
                  </div>
                  <div className="mt-2 space-y-1">
                    <Bar label="HP" current={u.hp} max={u.maxHp} color="bg-emerald-600/90" />
                    <Bar label="MP" current={u.mp} max={u.maxMp} color="bg-sky-600/90" />
                    {(() => {
                      const cap = expBarCapacity(u.level ?? 1)
                      if (cap <= 0) {
                        return (
                          <div className="text-xs text-slate-500">
                            经验 <span className="text-slate-400">已满级</span>
                          </div>
                        )
                      }
                      const cur = Math.min(cap, Math.max(0, u.expIntoLevel ?? 0))
                      return (
                        <Bar
                          label="经验"
                          current={cur}
                          max={cap}
                          color="bg-amber-600/75"
                        />
                      )
                    })()}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    攻 {u.atk} · 防 {u.def} · 速 {u.speed}
                  </div>
                </li>
              ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <h2 className="text-sm font-medium text-rose-200/90">敌方</h2>
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {battle.units
              .filter((u) => u.side === 'foe')
              .map((u) => (
                <li key={u.id} className="rounded border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
                  <div className="font-medium text-slate-100">
                    {u.name}
                    <span className="ml-2 text-slate-500 font-normal">Lv{u.level}</span>
                    {u.isWorldBoss && (
                      <span className="ml-2 rounded bg-amber-900/50 px-1.5 py-0.5 text-xs text-amber-200">
                        世界BOSS
                      </span>
                    )}
                    {u.hp <= 0 && <span className="ml-2 text-slate-600">已击倒</span>}
                  </div>
                  {u.mapName && (
                    <div className="text-xs text-slate-600 mt-0.5">出没：{u.mapName}</div>
                  )}
                  <div className="text-xs text-slate-600 mt-0.5">相性：{u.affinity ?? '无'} · 野生无天生战效</div>
                  <div className="mt-2 space-y-1">
                    <Bar label="HP" current={u.hp} max={u.maxHp} color="bg-rose-700/85" />
                    <Bar label="MP" current={u.mp} max={u.maxMp} color="bg-violet-700/70" />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    攻 {u.atk} · 防 {u.def} · 速 {u.speed} · 技能池{' '}
                    {u.skillPool.map((id) => getSkill(id).name).join('、')}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </section>

      {actor && battle.phase !== 'end' && (
        <section className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 space-y-3">
          <h2 className="text-sm font-medium text-amber-100">当前行动：{actor.name}</h2>
          <fieldset className="flex flex-wrap gap-4 text-sm text-slate-400">
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="act"
                checked={actionMode === 'fight'}
                onChange={() => setActionMode('fight')}
              />
              战斗技能
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="act"
                checked={actionMode === 'capture'}
                onChange={() => setActionMode('capture')}
              />
              捕捉
            </label>
          </fieldset>
          <div className="flex flex-wrap gap-3">
            {actionMode === 'fight' && (
              <label className="text-sm text-slate-400">
                技能
                <select
                  className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                >
                  {actor.skillPool.map((id) => {
                    const s = getSkill(id)
                    return (
                      <option key={id} value={id} disabled={actor.mp < s.mpCost}>
                        {s.name} {s.mpCost > 0 ? `(MP ${s.mpCost})` : ''}
                      </option>
                    )
                  })}
                </select>
              </label>
            )}
            <label className="text-sm text-slate-400">
              目标
              <select
                className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
                value={resolvedTargetId ?? ''}
                onChange={(e) => setTargetId(e.target.value)}
              >
                {foes.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} HP {f.hp}
                  </option>
                ))}
              </select>
            </label>
            {actionMode === 'capture' && captureTarget && (
              <span className="self-center text-xs text-amber-200/90">
                当次成功率约 {capturePct}%（HP 越低越高，≤30% 血达上限）
              </span>
            )}
            <button
              type="button"
              disabled={
                !resolvedTargetId ||
                (actionMode === 'fight' && getSkill(skillId).mpCost > actor.mp)
              }
              className="self-end rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 disabled:opacity-40"
              onClick={onConfirm}
            >
              {actionMode === 'capture' ? '尝试捕捉' : '确认出手'}
            </button>
          </div>
          {actionMode === 'fight' && <p className="text-xs text-slate-500">{getSkill(skillId).desc}</p>}
        </section>
      )}

      <section className="rounded-lg border border-slate-800 bg-black/25 p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-300">战报</h2>
        <ol className="space-y-1 font-mono text-xs text-slate-400 max-h-64 overflow-y-auto">
          {logLines.map((line, i) => (
            <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
          ))}
        </ol>
      </section>
    </div>
  )
}
