import React, { useSyncExternalStore } from 'react'
import { Seal, Placeholder, CornerDeco, PanelHead, SubHead, Cell, Tag } from './common.jsx'
import { subscribe, getSnapshot, addStatAction, addAffinityAction, autoAllocateAction, resetAllocAction } from '../game/characterStore.js'
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

const equipSlots = [
  { id: 'head',     label: '头盔', n: '紫府金冠',    q: 'epic',   refine: 9,  side: 'left' },
  { id: 'robe',     label: '衣服', n: '蜀山·云锦袍', q: 'legend', refine: 12, side: 'left' },
  { id: 'necklace', label: '项链', n: '苍璃玉佩',    q: 'rare',   refine: 8,  side: 'left' },
  { id: 'belt',     label: '腰带', n: '紫电流苏',    q: 'rare',   refine: 7,  side: 'left' },
  { id: 'weapon',   label: '武器', n: '诛仙·寒锋',   q: 'legend', refine: 12, side: 'right' },
  { id: 'shoes',    label: '靴履', n: '踏云履',      q: 'rare',   refine: 8,  side: 'right' },
  { id: 'amulet',   label: '暗器', n: '—',          q: 'common', empty: true, side: 'right' },
]

const EquipSlot = ({ s }) => (
  <div className={'slot q-' + s.q + (s.empty ? ' slot-empty' : '')} style={{ aspectRatio: 'auto', height: 64, padding: 4, flexDirection: 'column', gap: 1 }}>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>{s.label}</div>
    <div className="brush" style={{ fontSize: 11, color: s.empty ? 'var(--ink-4)' : 'var(--ink)', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
      {s.empty ? '未配' : s.n}
    </div>
    {!s.empty && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold-2)' }}>+{s.refine}</span>}
  </div>
)

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

const PlusBtn = ({ onClick, disabled }) => (
  <button
    className="cell-plus"
    onClick={onClick}
    disabled={disabled}
    style={{ opacity: disabled ? 0.35 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
  >
    ＋
  </button>
)

const AllocCell = ({ label, value, sub, accent, onAdd, canAdd }) => (
  <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="cell-k">{label}</span>
      <span className="cell-v" style={accent ? { color: accent } : null}>{value}</span>
      <PlusBtn onClick={onAdd} disabled={!canAdd} />
    </div>
    <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', lineHeight: 1.35 }}>{sub}</span>
  </div>
)

export default function CharacterScreen() {
  const s = useSyncExternalStore(subscribe, getSnapshot)

  const level = s.level
  const budget4 = getAttributePointBudget(level)
  const usedFour = sumFour(s)
  const rem4 = budget4 - usedFour

  const budgetAff = getAffinityPointBudget(level)
  const usedAff = sumAffinity(s)
  const remAff = budgetAff - usedAff

  const d = computeHeroDerived(level, s)
  const r = d.rates ?? getEffectiveAttributeRates(s)

  const expMax = expRequiredToNextLevel(level)
  const expPct = expMax > 0 ? Math.min(100, (s.expCur / expMax) * 100) : 0

  const canAddStat = rem4 > 0
  const affData = [
    { k: '金相性', key: 'Metal', v: s.affMetal ?? 0, school: '金' },
    { k: '木相性', key: 'Wood',  v: s.affWood  ?? 0, school: '木' },
    { k: '水相性', key: 'Water', v: s.affWater  ?? 0, school: '水' },
    { k: '火相性', key: 'Fire',  v: s.affFire   ?? 0, school: '火' },
    { k: '土相性', key: 'Earth', v: s.affEarth  ?? 0, school: '土' },
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
          <div style={{ textAlign: 'center' }}>
            <div className="brush" style={{ fontSize: 26, color: 'var(--ink)', letterSpacing: '0.16em', lineHeight: 1 }}>{s.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: 1.5 }}>
              蜀山 · 法{s.school} · LV {level} · 大乘期
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 5 }}>
              <Tag tone="vermilion">白衣卿相</Tag>
              <Tag tone="gold">降魔大将</Tag>
            </div>
          </div>

          {/* 经验条 */}
          <div style={{ padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginBottom: 2 }}>
              <span>经验</span>
              <span>{s.expCur.toLocaleString()} / {expMax.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, background: 'var(--paper-3)', border: '1px solid var(--ink-3)', overflow: 'hidden' }}>
              <div style={{ width: expPct + '%', height: '100%', background: 'var(--bamboo)', backgroundImage: 'linear-gradient(90deg, var(--bamboo), var(--gold-2))' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 72 }}>
              {equipSlots.filter((s) => s.side === 'left').map((sl) => <EquipSlot key={sl.id} s={sl} />)}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Placeholder label="CHARACTER 3D" sub="角色立绘 / 360°" style={{ position: 'absolute', inset: 0, borderStyle: 'solid' }} />
              <svg viewBox="0 0 200 60" style={{ position: 'absolute', bottom: 4, left: 4, right: 4, width: 'calc(100% - 8px)', height: 50, opacity: 0.4 }}>
                <ellipse cx="100" cy="30" rx="90" ry="13" fill="none" stroke="var(--ink-2)" />
                <ellipse cx="100" cy="30" rx="68" ry="10" fill="none" stroke="var(--ink-3)" strokeDasharray="3 2" />
              </svg>
              <div style={{ position: 'absolute', top: 6, right: 6 }}>
                <Seal size={32} round school={s.school}>{s.school}</Seal>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 72 }}>
              {equipSlots.filter((sl) => sl.side === 'right').map((sl) => <EquipSlot key={sl.id} s={sl} />)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'var(--paper)', border: '1px solid var(--ink-3)' }}>
            <Seal size={32}>战</Seal>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 1.5 }}>战力 COMBAT</div>
              <div className="brush" style={{ fontSize: 22, color: 'var(--vermilion)', lineHeight: 1 }}>
                {Math.round(d.maxHp * 0.5 + d.magDmg * 2.5 + d.def * 1.5 + d.speed * 0.8).toLocaleString()}
              </div>
            </div>
            <span style={{ flex: 1 }} />
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
              <div>道行 {s.daoYears}年{s.daoDays}天</div>
              <div style={{ color: 'var(--bamboo)', marginTop: 2 }}>战绩 {s.meritRecord}</div>
            </div>
          </div>
        </div>

        {/* 右：属性区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'auto' }}>
          <SectionBox title="基础状态" sub="DERIVED · 衍生战力">
            <Grid5>
              <Cell label="气血" value={d.maxHp.toLocaleString()} accent="var(--vermilion)" />
              <Cell label="法力" value={d.maxMp.toLocaleString()} accent="#3a5a8a" />
              <Cell label="物伤" value={d.phyDmg} />
              <Cell label="法伤" value={d.magDmg.toLocaleString()} accent="var(--gold-2)" />
              <Cell label="防御" value={d.def} />
              <Cell label="速度" value={d.speed} />
              <Cell label="准确" value={d.acc} />
              <Cell label="躲闪" value={d.dodgePct + '%'} />
              <Cell label="必杀" value={d.critPct + '%'} />
              <Cell label="连击" value={d.comboPct + '%'} />
              <Cell label="反震" value={d.reflectPct + '%'} />
              <Cell label="反击" value={d.counterPct + '%'} />
              <Cell label="强克金" value={Math.round(d.strongMetal * 10) / 10 + '%'} />
              <Cell label="强克木" value={Math.round(d.strongWood * 10) / 10 + '%'} accent="var(--bamboo)" />
              <Cell label="强克水" value={Math.round(d.strongWater * 10) / 10 + '%'} />
              <Cell label="强克火" value={Math.round(d.strongFire * 10) / 10 + '%'} />
              <Cell label="强克土" value={Math.round(d.strongEarth * 10) / 10 + '%'} />
            </Grid5>
          </SectionBox>

          <SectionBox title="核心状态" sub="CORE">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', padding: '4px 4px', fontSize: 12 }}>
              <span><span style={{ color: 'var(--ink-3)' }}>道行</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{s.daoYears}年{s.daoDays}天</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>潜能</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-2)', fontWeight: 600 }}>{s.potential.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>声望</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{s.fame.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>体力</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{s.staminaCur.toLocaleString()}/{s.staminaMax.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>银两</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{s.tael.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>战绩</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{s.meritRecord}</span></span>
            </div>
          </SectionBox>

          <SectionBox title="自由属性点" sub={`ALLOCATION · 已用 ${usedFour} / ${budget4} · 剩余 ${rem4}`}>
            <Grid5>
              <AllocCell
                label="体质" value={s.vit}
                sub={`体质→气血 ${r.hpPerVit.toFixed(2)}，防御 ${r.defPerVit.toFixed(2)}`}
                onAdd={() => addStatAction('vit')} canAdd={canAddStat}
              />
              <AllocCell
                label="灵力" value={s.int}
                sub={`灵力→法伤 ${r.magPerInt.toFixed(2)}，法力 ${r.mpPerInt.toFixed(2)}`}
                accent="var(--gold-2)"
                onAdd={() => addStatAction('int')} canAdd={canAddStat}
              />
              <AllocCell
                label="力量" value={s.str}
                sub={`力量→物伤 ${r.phyPerStr.toFixed(2)}，命中 ${r.accPerStr}`}
                onAdd={() => addStatAction('str')} canAdd={canAddStat}
              />
              <AllocCell
                label="敏捷" value={s.agi}
                sub={`敏捷→速度 ${r.spdPerAgi.toFixed(2)}`}
                onAdd={() => addStatAction('agi')} canAdd={canAddStat}
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
                    ? <PlusBtn onClick={() => addAffinityAction(a.key)} disabled={remAff <= 0} />
                    : <span style={{ marginLeft: 4, fontFamily: 'var(--font-brush)', fontSize: 11, color: 'var(--gold-2)' }}>满</span>}
                </div>
              ))}
              <Cell label="金·法伤/灵" value={r.magPerInt.toFixed(2)} />
              <Cell label="木·气血/体" value={r.hpPerVit.toFixed(2)} />
              <Cell label="水·防御/体" value={r.defPerVit.toFixed(2)} />
              <Cell label="火·速度/敏" value={r.spdPerAgi.toFixed(2)} />
              <Cell label="土·物伤/力" value={r.phyPerStr.toFixed(2)} />
              <Cell label="木·法力/灵" value={r.mpPerInt.toFixed(2)} />
              <Cell label="命中/力" value={r.accPerStr} />
            </Grid5>
          </SectionBox>

          <div style={{ display: 'flex', gap: 10 }}>
            <SectionBox title="五系法术抗性" sub="MAGIC RESISTANCE" style={{ flex: 1 }}>
              <Grid5>
                <Cell label="抗金" value={Math.round(d.resJin * 10) / 10 + '%'} />
                <Cell label="抗木" value={Math.round(d.resMu * 10) / 10 + '%'} accent="var(--bamboo)" />
                <Cell label="抗水" value={Math.round(d.resShui * 10) / 10 + '%'} />
                <Cell label="抗火" value={Math.round(d.resHuo * 10) / 10 + '%'} accent="var(--vermilion)" />
                <Cell label="抗土" value={Math.round(d.resTu * 10) / 10 + '%'} />
              </Grid5>
            </SectionBox>
            <SectionBox title="障碍抗性" sub="STATUS RESISTANCE" style={{ flex: 1 }}>
              <Grid5>
                <Cell label="抗遗忘" value={Math.round(d.resYi * 10) / 10 + '%'} accent="var(--gold-2)" />
                <Cell label="抗冰冻" value={Math.round(d.resBing * 10) / 10 + '%'} />
                <Cell label="抗中毒" value={Math.round(d.resDu * 10) / 10 + '%'} />
                <Cell label="抗昏睡" value={Math.round(d.resShuiMian * 10) / 10 + '%'} />
                <Cell label="抗混乱" value={Math.round(d.resHunLuan * 10) / 10 + '%'} />
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
        <button className="btn-ink btn-ink-sm" onClick={autoAllocateAction} disabled={rem4 <= 0} style={{ opacity: rem4 > 0 ? 1 : 0.45 }}>
          [1] 自动分配 · 3体2灵
        </button>
        <button className="btn-ink btn-ink-sm btn-ink-primary" disabled={rem4 <= 0} style={{ opacity: rem4 > 0 ? 1 : 0.45 }}>
          [2] 手动加点
        </button>
        <button className="btn-ink btn-ink-sm" onClick={resetAllocAction}>
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
