import React, { useSyncExternalStore, useState } from 'react'
import { Seal, Placeholder, CornerDeco, PanelHead, SubHead, Tag } from './common.jsx'
import { subscribe, getSnapshot } from '../game/characterStore.js'
import { getPetByKey, INNATE_NAMES, INNATE_DESC } from '../game/petCatalog.js'
import { computeStatsFromGrowth } from '../game/battle/petGrowthTable.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function gradeColor(grade) {
  if (grade === '极') return 'var(--vermilion)'
  if (grade === '优') return 'var(--gold-2)'
  if (grade === '良') return 'var(--bamboo)'
  if (grade === '中') return 'var(--ink-2)'
  return 'var(--ink-4)'
}

function growthGrade(val, lo, hi) {
  const range = hi - lo || 1
  const pct = (val - lo) / range
  if (pct >= 0.90) return '极'
  if (pct >= 0.70) return '优'
  if (pct >= 0.45) return '良'
  if (pct >= 0.20) return '中'
  return '下'
}

function totalGrade(total, lo, hi) {
  return growthGrade(total, lo, hi)
}

function sumGrowth(g) {
  return g.hp + g.mp + g.spd + g.pAtk + g.mAtk
}

// ── sub-components ────────────────────────────────────────────────────────────

const KV = ({ k, v, c }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', padding: '4px 8px',
    background: 'rgba(243,237,224,0.5)', border: '1px solid var(--ink-4)',
  }}>
    <span style={{ color: 'var(--ink-3)' }}>{k}</span>
    <span style={{ color: c || 'var(--ink)', fontWeight: 600 }}>{v}</span>
  </div>
)

const AptRow = ({ label, val, lo, hi, color }) => {
  const clampedVal = Math.max(lo, Math.min(hi, val))
  const range = hi - lo || 1
  const pct = Math.max(0, Math.min(100, ((clampedVal - lo) / range) * 100))
  const grade = growthGrade(val, lo, hi)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="brush" style={{ fontSize: 13, width: 32, color }}>{label}</span>
      <div style={{ flex: 1, height: 9, background: 'var(--paper-3)', border: '1px solid var(--ink-3)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(0,0,0,0.15))' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)', width: 32, textAlign: 'right' }}>{val}</span>
      <span className="brush" style={{ fontSize: 13, color: gradeColor(grade), width: 12 }}>{grade}</span>
    </div>
  )
}

const PetCard = ({ pet, isSelected, onClick }) => {
  const catalog = getPetByKey(pet.spawnKey)
  const total = sumGrowth(pet.growth)
  const [lo, hi] = pet.growth.totalBand
  const grade = totalGrade(total, lo, hi)
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 7, padding: '5px 7px', cursor: 'pointer',
        background: isSelected
          ? 'linear-gradient(90deg, rgba(163,55,58,0.16) 0%, rgba(232,220,192,0.4) 100%)'
          : 'rgba(243,237,224,0.5)',
        border: '1px solid ' + (isSelected ? 'var(--vermilion)' : 'var(--ink-4)'),
        alignItems: 'center', position: 'relative',
        opacity: pet.active ? 1 : 0.75,
      }}
    >
      {isSelected && (
        <div style={{
          position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
          borderLeft: '7px solid var(--vermilion)',
        }} />
      )}
      <div style={{ width: 38, height: 38, position: 'relative', flexShrink: 0 }}>
        <Placeholder label={catalog?.affinity || '无'} style={{ position: 'absolute', inset: 0, padding: 0 }} />
        {catalog?.affinity && (
          <div style={{ position: 'absolute', bottom: -3, right: -3 }}>
            <Seal size={13} round school={catalog.affinity} style={{ fontSize: 8 }}>{catalog.affinity}</Seal>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="brush" style={{ fontSize: 13 }}>{pet.displayName}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>Lv{pet.level}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)',
        }}>
          <span>{pet.kind} · 主 {pet.master || '—'}</span>
          <span style={{ color: gradeColor(grade) }}>总成长 {total} · {grade}</span>
        </div>
      </div>
    </div>
  )
}

const SchoolSkillsPanel = ({ affinity }) => {
  if (!affinity) return (
    <div style={{ fontSize: 11, color: 'var(--ink-4)', padding: '6px 0' }}>无相性 · 不习得修炼技能</div>
  )
  const SCHOOL_SKILLS = {
    金: { B: ['金光乍现','金戈纵横','万箭穿心','霸道横推','逆天残刃'], C: '遗忘', D: '提高物攻' },
    木: { B: ['摘叶飞花','枝繁叶茂','落叶归根','百草缠身','鬼舞枯藤'], C: '中毒', D: '回复气血' },
    水: { B: ['滴水穿石','寒冰锥刺','冰雪飞舞','冰封千里','搅海翻江'], C: '冰冻', D: '提高防御' },
    火: { B: ['举火焚天','烈焰灼身','火龙缠绕','赤焰燃空','炼狱火海'], C: '昏睡', D: '提高速度' },
    土: { B: ['落土飞岩','岩石重压','黄沙蔽日','山崩地裂','石破天惊'], C: '混乱', D: '提高躲闪' },
  }
  const ss = SCHOOL_SKILLS[affinity]
  if (!ss) return null
  const bColors = ['#aaa','#888','#666','#444','#a33']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {ss.B.map((name, i) => (
          <div key={name} style={{
            padding: '3px 8px', border: '1px solid var(--ink-3)',
            background: `rgba(163,55,58,${0.04 + i * 0.04})`,
            fontFamily: 'var(--font-brush)', fontSize: 12,
          }}>
            <span style={{ color: 'var(--ink-4)', fontSize: 9, marginRight: 4 }}>B{i + 1}</span>
            <span style={{ color: bColors[i] }}>{name}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <div style={{ padding: '3px 8px', border: '1px solid var(--gold-2)', fontFamily: 'var(--font-brush)', fontSize: 12 }}>
          <span style={{ color: 'var(--ink-4)', fontSize: 9, marginRight: 4 }}>C</span>
          <span style={{ color: 'var(--gold-2)' }}>{ss.C}</span>
        </div>
        <div style={{ padding: '3px 8px', border: '1px solid var(--bamboo)', fontFamily: 'var(--font-brush)', fontSize: 12 }}>
          <span style={{ color: 'var(--ink-4)', fontSize: 9, marginRight: 4 }}>D</span>
          <span style={{ color: 'var(--bamboo)' }}>{ss.D}</span>
        </div>
      </div>
    </div>
  )
}

const PetDetail = ({ pet }) => {
  const catalog = getPetByKey(pet.spawnKey)
  const g = pet.growth
  const stats = computeStatsFromGrowth(pet.level, g, { baby: pet.kind === '宝宝' })
  const total = sumGrowth(g)
  const [tlo, thi] = g.totalBand
  const tGrade = totalGrade(total, tlo, thi)

  const hpRange  = catalog ? [catalog.growth.hp_min,   catalog.growth.hp_max]   : [0, 100]
  const mpRange  = catalog ? [catalog.growth.mp_min,   catalog.growth.mp_max]   : [0, 100]
  const spdRange = catalog ? [catalog.growth.spd_min,  catalog.growth.spd_max]  : [0, 100]
  const pAtkRange= catalog ? [catalog.growth.patk_min, catalog.growth.patk_max] : [0, 100]
  const mAtkRange= catalog ? [catalog.growth.matk_min, catalog.growth.matk_max] : [0, 100]

  const affinity = catalog?.affinity ?? null

  return (
    <div style={{ flex: 1, display: 'flex', gap: 12, minWidth: 0 }}>
      {/* left column: portrait + stats */}
      <div className="paper-dark scroll-frame" style={{ width: 400, padding: 16, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <CornerDeco />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Seal size={36} school={affinity}>{affinity || '无'}</Seal>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="brush" style={{ fontSize: 22 }}>{pet.displayName}</span>
              <Tag tone={pet.kind === '宝宝' ? 'vermilion' : 'gold'}>{pet.kind}</Tag>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
              {catalog?.name || pet.spawnKey} · Lv {pet.level}{affinity ? ' · 相性 ' + affinity : ''}{pet.master ? ' · 主 ' + pet.master : ''}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, position: 'relative', minHeight: 180 }}>
          <Placeholder label="PET" sub={catalog?.name || pet.spawnKey} style={{ position: 'absolute', inset: 0, borderStyle: 'solid' }} />
          <div style={{
            position: 'absolute', top: 10, right: 10, background: 'var(--vermilion)',
            color: 'var(--paper)', padding: '4px 10px',
            fontFamily: 'var(--font-brush)', fontSize: 15, letterSpacing: 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}>
            总成长 {total} · <span style={{ color: gradeColor(tGrade) }}>{tGrade}</span>
          </div>
          {catalog && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8,
              background: 'rgba(31,24,18,0.8)', color: 'var(--paper)',
              padding: '3px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.6,
            }}>
              出没 {catalog.spawn_map} · Lv {catalog.spawn_level}
            </div>
          )}
        </div>

        <div>
          <SubHead title="六维" sub="COMBAT STATS · 由等级与成长计算" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <KV k="气血" v={stats.maxHp.toLocaleString()} c="var(--vermilion)" />
            <KV k="法力" v={stats.maxMp.toLocaleString()} c="#3a5a8a" />
            <KV k="速度" v={stats.speed} />
            <KV k="物攻" v={stats.atk} />
            <KV k="法攻" v={stats.mAtk} c="var(--gold-2)" />
            <KV k="防御" v={stats.def} />
          </div>
        </div>
      </div>

      {/* right column: growth + innate + school skills */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        {/* growth */}
        <div className="paper-bg scroll-frame" style={{ padding: 12, position: 'relative' }}>
          <CornerDeco />
          <SubHead
            title="资质 · 成长档"
            sub={`GROWTH · 区间 ${tlo}~${thi}`}
            right={<Tag tone={tGrade === '极' ? 'vermilion' : tGrade === '优' ? 'gold' : 'ghost'}>总成长 {total} · {tGrade}</Tag>}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <AptRow label="血" val={g.hp}   lo={hpRange[0]}   hi={hpRange[1]}   color="var(--vermilion)" />
            <AptRow label="法" val={g.mp}   lo={mpRange[0]}   hi={mpRange[1]}   color="#3a5a8a" />
            <AptRow label="速" val={g.spd}  lo={spdRange[0]}  hi={spdRange[1]}  color="var(--bamboo)" />
            <AptRow label="物攻" val={g.pAtk} lo={pAtkRange[0]} hi={pAtkRange[1]} color="var(--rust)" />
            <AptRow label="法攻" val={g.mAtk} lo={mAtkRange[0]} hi={mAtkRange[1]} color="var(--gold-2)" />
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.6 }}>
            {pet.kind === '宝宝'
              ? '宝宝按 1 级初始档计算，升级后随成长累积属性。'
              : '野生宠按当前等级与成长档换算当前属性。'}
          </p>
        </div>

        {/* innate */}
        <div className="paper-bg scroll-frame" style={{ padding: 12, position: 'relative' }}>
          <CornerDeco />
          <SubHead
            title="天生神通"
            sub={`INNATE · ${pet.innateIds.length} 个`}
            right={<button className="btn-ink btn-ink-sm">洗练</button>}
          />
          {pet.innateIds.length === 0 ? (
            <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>无天生神通</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pet.innateIds.map((id) => {
                const name = INNATE_NAMES[id] || id
                const desc = INNATE_DESC[id] || ''
                return (
                  <div key={id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{
                      padding: '3px 10px', border: '1px solid var(--vermilion)',
                      background: 'rgba(163,55,58,0.10)', fontFamily: 'var(--font-brush)',
                      fontSize: 13, color: 'var(--vermilion)', flexShrink: 0,
                    }}>
                      {name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.6, paddingTop: 4 }}>
                      {desc}
                    </div>
                  </div>
                )
              })}
              {/* empty slots up to 5 */}
              {Array.from({ length: Math.max(0, 5 - pet.innateIds.length) }).map((_, i) => (
                <span key={'slot' + i} style={{
                  padding: '3px 10px', border: '1px dashed var(--ink-4)',
                  color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 11,
                  display: 'inline-block', width: 60,
                }}>— 空 —</span>
              ))}
            </div>
          )}
        </div>

        {/* school skills */}
        <div className="paper-bg scroll-frame" style={{ padding: 12, position: 'relative' }}>
          <CornerDeco />
          <SubHead title="修炼技能" sub={affinity ? `SCHOOL SKILLS · ${affinity}系` : 'SCHOOL SKILLS'} />
          <SchoolSkillsPanel affinity={affinity} />
        </div>

        {/* actions */}
        <div className="paper-bg scroll-frame" style={{ padding: 10, position: 'relative' }}>
          <CornerDeco />
          <SubHead title="修炼 · 炼妖" sub="ACTIONS" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            <button className="btn-ink btn-ink-primary">出 战</button>
            <button className="btn-ink">修 炼</button>
            <button className="btn-ink">洗 髓</button>
            <button className="btn-ink">炼 妖</button>
            <button className="btn-ink">打 书</button>
            <button className="btn-ink">喂 食</button>
            <button className="btn-ink">改 名</button>
            <button className="btn-ink">合 宠</button>
          </div>
        </div>

        {/* capture hint */}
        <div style={{
          padding: '10px 12px', background: 'var(--paper-2)',
          border: '1px solid var(--vermilion)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.6,
        }}>
          <Seal size={28}>捕</Seal>
          <div style={{ flex: 1 }}>
            <span className="brush" style={{ fontSize: 12, color: 'var(--vermilion)' }}>提示</span>
            ：野怪血量 ≤ 30% 时，捕捉成功率达上限 55%。世界 BOSS 不可捕捉。
          </div>
        </div>
      </div>
    </div>
  )
}

// ── main screen ───────────────────────────────────────────────────────────────

export default function PetsScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const roster = char.petRoster ?? []
  const active = roster.filter((p) => p.active)
  const vault  = roster.filter((p) => !p.active)

  const [selectedId, setSelectedId] = useState(roster[0]?.id ?? null)
  const selected = roster.find((p) => p.id === selectedId) ?? roster[0]

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead
        title="灵 兽 · 宠 物"
        sub="BEASTS & PETS"
        right={
          <span style={{ display: 'inline-flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            <span>携带 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>{active.length}</span> / 5</span>
            <span>仓库 <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{vault.length}</span> / 30</span>
          </span>
        }
      />
      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', gap: 14 }}>
        {/* left: roster list */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="tab-list">
            {[`上阵 ${active.length}`, `仓库 ${vault.length}`, '宠物书'].map((t, i) => (
              <div key={t} className={'tab' + (i === 0 ? ' active' : '')} style={{ padding: '4px 12px', fontSize: 11 }}>{t}</div>
            ))}
          </div>
          <div className="paper-bg" style={{ padding: 8, border: '1px solid var(--ink-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflow: 'auto' }}>
            {active.map((p) => (
              <PetCard key={p.id} pet={p} isSelected={p.id === selected?.id} onClick={() => setSelectedId(p.id)} />
            ))}
            {vault.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--ink-4)' }}>
                  <span className="brush" style={{ fontSize: 12, color: 'var(--vermilion)' }}>仙府仓</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>VAULT</span>
                </div>
                {vault.map((p) => (
                  <PetCard key={p.id} pet={p} isSelected={p.id === selected?.id} onClick={() => setSelectedId(p.id)} />
                ))}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn-ink btn-ink-sm" style={{ flex: 1 }}>上阵</button>
            <button className="btn-ink btn-ink-sm" style={{ flex: 1 }}>合宠</button>
            <button className="btn-ink btn-ink-sm" style={{ flex: 1 }}>放生</button>
          </div>
        </div>

        {/* right: detail */}
        {selected ? <PetDetail pet={selected} /> : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            选择一只灵兽查看详情
          </div>
        )}
      </div>
    </div>
  )
}
