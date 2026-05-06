import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AFFINITY_CAP_PER_ELEMENT,
  autoAllocateVitInt,
  clampAffinity,
  clampFourStats,
  computeHeroDerived,
  formatNumber,
  getFixedStatFloor,
  getAffinityPointBudget,
  getAttributePointBudget,
  sumAffinity,
  sumFour,
} from '../game/playerSheet.js'
import { expBarCapacity } from '../game/characterLevelConfig.js'

function SectionTitle({ children, guofeng }) {
  return (
    <div
      className={
        guofeng
          ? 'border-b border-[#d4b886] bg-gradient-to-r from-[#fdfaf3] to-[#f3eee3] px-2 py-1.5 text-[13px] font-bold tracking-wide text-[#8b5a2b]'
          : 'border-b border-amber-900/40 bg-slate-950/90 px-2 py-1 text-[13px] font-medium tracking-wide text-amber-200/95'
      }
    >
      {children}
    </div>
  )
}

function CellGrid({ children, cols = 5, guofeng }) {
  return (
    <div
      className={
        guofeng
          ? 'grid gap-0 border-2 border-[#d4b886] bg-[#fdfaf3]'
          : 'grid gap-0 border border-slate-700/80 bg-slate-950/40'
      }
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  )
}

function StatCell({ label, value, guofeng }) {
  return (
    <div
      className={
        guofeng
          ? 'border border-[#e0d0b8] px-1.5 py-1.5 text-[12px] leading-tight text-[#3a3a38] whitespace-nowrap'
          : 'border border-slate-800/90 px-1.5 py-1.5 text-[12px] leading-tight text-slate-300 whitespace-nowrap'
      }
    >
      <span className={guofeng ? 'text-[#6b5344]' : 'text-slate-500'}>{label}</span>
      <span className={`ml-1 font-mono ${guofeng ? 'text-[#2a2418]' : 'text-slate-100'}`}>{value}</span>
    </div>
  )
}

/**
 * @param {{
 *   level: number,
 *   expIntoLevel: number,
 *   sheet: import('../game/playerSheet.js').HeroSheet,
 *   onCommit: (next: import('../game/playerSheet.js').HeroSheet) => void,
 *   guofeng?: boolean,
 * }} props
 */
export function CharacterAttributePanel({ level, expIntoLevel, sheet, onCommit, guofeng = false }) {
  const [focus, setFocus] = useState('stats')

  const budget = getAttributePointBudget(level)
  const affBudget = getAffinityPointBudget(level)
  const usedFour = sumFour(sheet)
  const usedAff = sumAffinity(sheet)
  const remFour = budget - usedFour
  const remAff = affBudget - usedAff

  const d = useMemo(() => computeHeroDerived(level, sheet), [level, sheet])

  const commit = useCallback(
    (next) => {
      let s = clampFourStats(next, level)
      s = clampAffinity(s, level)
      onCommit(s)
    },
    [level, onCommit]
  )

  const addFour = useCallback(
    (key) => {
      if (remFour <= 0) return
      commit({ ...sheet, [key]: (sheet[key] ?? 0) + 1 })
    },
    [commit, remFour, sheet]
  )

  const addAff = useCallback(
    (key) => {
      if (remAff <= 0) return
      const cur = sheet[key] ?? 0
      if (cur >= AFFINITY_CAP_PER_ELEMENT) return
      commit({ ...sheet, [key]: cur + 1 })
    },
    [commit, remAff, sheet]
  )

  const onAuto = useCallback(() => {
    commit(autoAllocateVitInt(sheet, level))
  }, [commit, sheet, level])

  const onReset = useCallback(() => {
    const floor = getFixedStatFloor(level)
    commit({
      ...sheet,
      vit: floor,
      int: floor,
      str: floor,
      agi: floor,
      affMetal: 0,
      affWood: 0,
      affWater: 0,
      affFire: 0,
      affEarth: 0,
    })
  }, [commit, sheet, level])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '1') {
        e.preventDefault()
        onAuto()
      }
      if (e.key === '2') {
        e.preventDefault()
        setFocus('stats')
      }
      if (e.key === '3') {
        e.preventDefault()
        setFocus('affinity')
      }
      if (e.key === '4') {
        e.preventDefault()
        onReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onAuto, onReset])

  const expMax = expBarCapacity(level)
  const expCur = Math.min(expMax, Math.max(0, expIntoLevel ?? 0))

  const addBtn = (onClick, disabled) => (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        guofeng
          ? 'ml-1 rounded border border-[#b98950] bg-[#fbe9c7] px-1.5 py-0.5 text-[11px] font-bold text-[#5c3a19] hover:bg-[#f9d79a] disabled:opacity-25'
          : 'ml-1 rounded border border-amber-800/50 px-1 text-[11px] text-amber-200/90 hover:bg-amber-950/50 disabled:opacity-25'
      }
    >
      +
    </button>
  )

  const rowCell = guofeng
    ? 'border border-[#e0d0b8] px-1.5 py-1.5 text-[12px] whitespace-nowrap text-[#3a3a38]'
    : 'border border-slate-800/90 px-1.5 py-1.5 text-[12px] whitespace-nowrap'
  const rowMuted = guofeng ? 'text-[#6b5344]' : 'text-slate-500'
  const rowMono = guofeng ? 'font-mono text-[#2a2418]' : 'font-mono text-slate-100'
  const rowSub = guofeng ? 'text-[11px] text-[#6b5f52]' : 'text-[11px] text-slate-600'
  const affRow = guofeng
    ? 'border border-[#e0d0b8] px-1.5 py-1.5 text-[12px] leading-tight whitespace-nowrap text-[#3a3a38]'
    : 'border border-slate-800/90 px-1.5 py-1.5 text-[12px] leading-tight text-slate-300 whitespace-nowrap'

  return (
    <div
      className={
        guofeng
          ? 'space-y-0 rounded border-2 border-[#d4b886] bg-[#fffcf7] font-sans text-[#3a3a38]'
          : 'space-y-0 rounded border border-slate-700/90 bg-slate-900/80 font-sans text-slate-300'
      }
    >
      <SectionTitle guofeng={guofeng}>基础状态</SectionTitle>
      <CellGrid cols={5} guofeng={guofeng}>
        <StatCell guofeng={guofeng} label="气血:" value={`${formatNumber(d.maxHp)}/${formatNumber(d.maxHp)}`} />
        <StatCell guofeng={guofeng} label="法力:" value={`${formatNumber(d.maxMp)}/${formatNumber(d.maxMp)}`} />
        <StatCell guofeng={guofeng} label="物伤:" value={formatNumber(d.phyDmg)} />
        <StatCell guofeng={guofeng} label="法伤:" value={formatNumber(d.magDmg)} />
        <StatCell guofeng={guofeng} label="防御:" value={formatNumber(d.def)} />
        <StatCell guofeng={guofeng} label="速度:" value={formatNumber(d.speed)} />
        <StatCell guofeng={guofeng} label="准确:" value={formatNumber(d.acc)} />
        <StatCell guofeng={guofeng} label="躲闪:" value={`${d.dodgePct}%`} />
        <StatCell guofeng={guofeng} label="必杀:" value={`${d.critPct}%`} />
        <StatCell guofeng={guofeng} label="连击:" value={`${d.comboPct}%`} />
        <StatCell guofeng={guofeng} label="反震:" value={`${d.reflectPct}%`} />
        <StatCell guofeng={guofeng} label="反击:" value={`${d.counterPct}%`} />
        <StatCell guofeng={guofeng} label="强力克金:" value={`${d.strongMetal}%`} />
        <StatCell guofeng={guofeng} label="强力克木:" value={`${d.strongWood}%`} />
        <StatCell guofeng={guofeng} label="强力克水:" value={`${d.strongWater}%`} />
        <StatCell guofeng={guofeng} label="强力克火:" value={`${d.strongFire}%`} />
        <StatCell guofeng={guofeng} label="强力克土:" value={`${d.strongEarth}%`} />
        <div className={guofeng ? 'border border-[#e0d0b8]' : 'border border-slate-800/90'} />
        <div className={guofeng ? 'border border-[#e0d0b8]' : 'border border-slate-800/90'} />
        <div className={guofeng ? 'border border-[#e0d0b8]' : 'border border-slate-800/90'} />
      </CellGrid>

      <SectionTitle guofeng={guofeng}>核心属性</SectionTitle>
      <div
        className={
          guofeng
            ? 'border-b border-[#e8dcc8] px-2 py-2 text-[12px] leading-relaxed text-[#3a3a38]'
            : 'border-b border-slate-800 px-2 py-2 text-[12px] leading-relaxed text-slate-300'
        }
      >
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>道行: {sheet.daoYears}年{sheet.daoDays}天</span>
          <span>潜能: {formatNumber(sheet.potential)}</span>
          <span>声望: {formatNumber(sheet.fame)}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            经验:{' '}
            {expMax <= 0 ? '已满级' : `${formatNumber(expCur)}/${formatNumber(expMax)}`}
          </span>
          <span>
            体力: {sheet.staminaCur}/{sheet.staminaMax}
          </span>
          <span>战绩: {formatNumber(sheet.meritRecord)}</span>
        </div>
      </div>

      <SectionTitle guofeng={guofeng}>自由属性点</SectionTitle>
      <CellGrid cols={5} guofeng={guofeng}>
        <div className={rowCell}>
          <span className={rowMuted}>体质:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.vit}</span>
          {focus === 'stats' ? addBtn(() => addFour('vit'), remFour <= 0) : null}
          <div className={rowSub}>
            每点≈{d.rates.hpPerVit.toFixed(2)}气血 · {d.rates.defPerVit.toFixed(2)}防御
          </div>
        </div>
        <div className={rowCell}>
          <span className={rowMuted}>灵力:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.int}</span>
          {focus === 'stats' ? addBtn(() => addFour('int'), remFour <= 0) : null}
          <div className={rowSub}>
            每点≈{d.rates.magPerInt.toFixed(2)}法伤 · {d.rates.mpPerInt.toFixed(2)}法力
          </div>
        </div>
        <div className={rowCell}>
          <span className={rowMuted}>力量:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.str}</span>
          {focus === 'stats' ? addBtn(() => addFour('str'), remFour <= 0) : null}
          <div className={rowSub}>
            每点≈{d.rates.phyPerStr.toFixed(2)}物伤 · {d.rates.accPerStr}命中
          </div>
        </div>
        <div className={rowCell}>
          <span className={rowMuted}>敏捷:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.agi}</span>
          {focus === 'stats' ? addBtn(() => addFour('agi'), remFour <= 0) : null}
          <div className={rowSub}>每点≈{d.rates.spdPerAgi.toFixed(2)}速度</div>
        </div>
        <div className={rowCell}>
          <span className={rowMuted}>剩余点数:</span>
          <span className={`ml-1 font-mono ${guofeng ? 'text-[#b86b12]' : 'text-amber-200/90'}`}>{remFour}</span>
          <div className={rowSub}>相性点: {remAff}</div>
        </div>
      </CellGrid>

      <SectionTitle guofeng={guofeng}>相性加成</SectionTitle>
      <CellGrid cols={5} guofeng={guofeng}>
        <div className={affRow}>
          <span className={rowMuted}>金相性:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.affMetal}/{AFFINITY_CAP_PER_ELEMENT}</span>
          {focus === 'affinity'
            ? addBtn(() => addAff('affMetal'), remAff <= 0 || sheet.affMetal >= AFFINITY_CAP_PER_ELEMENT)
            : null}
        </div>
        <div className={affRow}>
          <span className={rowMuted}>木相性:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.affWood}/{AFFINITY_CAP_PER_ELEMENT}</span>
          {focus === 'affinity'
            ? addBtn(() => addAff('affWood'), remAff <= 0 || sheet.affWood >= AFFINITY_CAP_PER_ELEMENT)
            : null}
        </div>
        <div className={affRow}>
          <span className={rowMuted}>水相性:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.affWater}/{AFFINITY_CAP_PER_ELEMENT}</span>
          {focus === 'affinity'
            ? addBtn(() => addAff('affWater'), remAff <= 0 || sheet.affWater >= AFFINITY_CAP_PER_ELEMENT)
            : null}
        </div>
        <div className={affRow}>
          <span className={rowMuted}>火相性:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.affFire}/{AFFINITY_CAP_PER_ELEMENT}</span>
          {focus === 'affinity'
            ? addBtn(() => addAff('affFire'), remAff <= 0 || sheet.affFire >= AFFINITY_CAP_PER_ELEMENT)
            : null}
        </div>
        <div className={affRow}>
          <span className={rowMuted}>土相性:</span>
          <span className={`ml-1 ${rowMono}`}>{sheet.affEarth}/{AFFINITY_CAP_PER_ELEMENT}</span>
          {focus === 'affinity'
            ? addBtn(() => addAff('affEarth'), remAff <= 0 || sheet.affEarth >= AFFINITY_CAP_PER_ELEMENT)
            : null}
        </div>
        <StatCell guofeng={guofeng} label="金·法伤/灵:" value={d.rates.magPerInt.toFixed(2)} />
        <StatCell guofeng={guofeng} label="木·气血/体:" value={d.rates.hpPerVit.toFixed(2)} />
        <StatCell guofeng={guofeng} label="水·防御/体:" value={d.rates.defPerVit.toFixed(2)} />
        <StatCell guofeng={guofeng} label="火·速度/敏:" value={d.rates.spdPerAgi.toFixed(2)} />
        <StatCell guofeng={guofeng} label="土·物伤/力:" value={d.rates.phyPerStr.toFixed(2)} />
        <StatCell guofeng={guofeng} label="木·法力/灵:" value={d.rates.mpPerInt.toFixed(2)} />
        <StatCell guofeng={guofeng} label="力·命中/力:" value={String(d.rates.accPerStr)} />
        <div className={guofeng ? 'border border-[#e0d0b8]' : 'border border-slate-800/90'} />
        <div className={guofeng ? 'border border-[#e0d0b8]' : 'border border-slate-800/90'} />
        <div className={guofeng ? 'border border-[#e0d0b8]' : 'border border-slate-800/90'} />
      </CellGrid>
      <SectionTitle guofeng={guofeng}>五系法术抗性</SectionTitle>
      <CellGrid cols={5} guofeng={guofeng}>
        <StatCell guofeng={guofeng} label="抗金:" value={`${d.resJin}%`} />
        <StatCell guofeng={guofeng} label="抗木:" value={`${d.resMu}%`} />
        <StatCell guofeng={guofeng} label="抗水:" value={`${d.resShui}%`} />
        <StatCell guofeng={guofeng} label="抗火:" value={`${d.resHuo}%`} />
        <StatCell guofeng={guofeng} label="抗土:" value={`${d.resTu}%`} />
      </CellGrid>
      <SectionTitle guofeng={guofeng}>障碍抗性</SectionTitle>
      <CellGrid cols={5} guofeng={guofeng}>
        <StatCell guofeng={guofeng} label="抗遗忘:" value={`${d.resYi}%`} />
        <StatCell guofeng={guofeng} label="抗冰冻:" value={`${d.resBing}%`} />
        <StatCell guofeng={guofeng} label="抗中毒:" value={`${d.resDu}%`} />
        <StatCell guofeng={guofeng} label="抗昏睡:" value={`${d.resShuiMian}%`} />
        <StatCell guofeng={guofeng} label="抗混乱:" value={`${d.resHunLuan}%`} />
      </CellGrid>

      <div
        className={
          guofeng
            ? 'flex flex-wrap items-center gap-2 border-t border-[#d4b886] bg-[#fdf8ed] px-2 py-2 text-[12px] text-[#5a4a38]'
            : 'flex flex-wrap items-center gap-2 border-t border-slate-800 bg-slate-950/60 px-2 py-2 text-[12px] text-slate-400'
        }
      >
        <button
          type="button"
          className={guofeng ? 'wendao-btn text-sm' : 'rounded border border-amber-900/50 px-2 py-1 text-amber-200/90 hover:bg-amber-950/40'}
          onClick={onAuto}
        >
          [1] 自动分配(3体2灵)
        </button>
        <button
          type="button"
          className={
            guofeng
              ? `wendao-btn text-sm ${focus === 'stats' ? 'ring-2 ring-[#d48f26]/60' : ''}`
              : `rounded border px-2 py-1 ${focus === 'stats' ? 'border-amber-600/60 bg-amber-950/30 text-amber-100' : 'border-slate-700 hover:bg-slate-800'}`
          }
          onClick={() => setFocus('stats')}
        >
          [2] 手动加点
        </button>
        <button
          type="button"
          className={
            guofeng
              ? `wendao-btn text-sm ${focus === 'affinity' ? 'ring-2 ring-[#d48f26]/60' : ''}`
              : `rounded border px-2 py-1 ${focus === 'affinity' ? 'border-amber-600/60 bg-amber-950/30 text-amber-100' : 'border-slate-700 hover:bg-slate-800'}`
          }
          onClick={() => setFocus('affinity')}
        >
          [3] 相性加点
        </button>
        <button
          type="button"
          className={guofeng ? 'wendao-btn text-sm' : 'rounded border border-slate-600 px-2 py-1 hover:bg-slate-800'}
          onClick={onReset}
        >
          [4] 重置加点
        </button>
        <span className={guofeng ? 'text-[#8a7a68]' : 'text-slate-600'}>[ESC] 关闭</span>
      </div>
    </div>
  )
}
