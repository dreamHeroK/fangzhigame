import React, { useSyncExternalStore, useState, useEffect } from 'react'
import { Seal, Placeholder, CornerDeco, PanelHead, SubHead, Tag, useLongPress } from './common.jsx'
import { subscribe, getSnapshot, setPetActiveAction, addPetAttrAction, resetPetAttrAction, equipPetTianShuAction, removePetTianShuAction } from '../game/characterStore.js'
import { getPetByKey, INNATE_NAMES, INNATE_DESC } from '../game/petCatalog.js'
import { computeStatsFromGrowth, getPetFreeAttrTotal, sumPetAllocAttr, getPetAttrRates } from '../game/battle/petGrowthTable.js'
import { petExpRequiredToNextLevel } from '../game/characterLevelConfig.js'
import { TIANSHU_DEFS, TIANSHU_BY_ID, TIANSHU_QUALITY, TIANSHU_MAX_SLOTS, TIANSHU_SPIRIT_PER_BOOK, TIANSHU_SPIRIT_MAX } from '../game/battle/tianShu.js'

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

/** 兼容旧字段名 growth 和新捕捉宠物的 growthDetail */
function petGrowth(pet) {
  return pet.growth ?? pet.growthDetail
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

const StatBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', width: 24, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 12, background: 'var(--paper-3)', border: '1px solid var(--ink-4)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: pct + '%', height: '100%', background: color, backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(0,0,0,0.1))' }} />
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontFamily: 'var(--font-mono)',
          color: pct > 55 ? 'rgba(255,255,255,0.92)' : 'var(--ink-2)',
          pointerEvents: 'none', letterSpacing: 0.3,
        }}>
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', width: 28, textAlign: 'right', flexShrink: 0 }}>
        {pct}%
      </span>
    </div>
  )
}

const PetCard = ({ pet, isSelected, onClick }) => {
  const catalog = getPetByKey(pet.spawnKey)
  const total = sumGrowth(petGrowth(pet))
  const [lo, hi] = petGrowth(pet).totalBand
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

const ATTR_LABELS = { vit: '体质', int: '灵力', str: '力量', agi: '敏捷' }
const ATTR_COLORS = { vit: 'var(--vermilion)', int: '#3a5a8a', str: 'var(--rust)', agi: 'var(--bamboo)' }
// 每维对应的六维加成（rate key → 实际 stats key → 显示名）
const ATTR_RATE_LABELS = {
  vit: [{ key: 'hp', statKey: 'maxHp', label: '气血' }, { key: 'def', statKey: 'def', label: '防御' }],
  int: [{ key: 'mp', statKey: 'maxMp', label: '法力' }, { key: 'mAtk', statKey: 'mAtk', label: '法攻' }],
  str: [{ key: 'atk', statKey: 'atk', label: '物攻' }],
  agi: [{ key: 'speed', statKey: 'speed', label: '速度' }],
}

const PetAddBtn = ({ attrKey, disabled, onAdd }) => {
  const handlers = useLongPress((n) => onAdd(attrKey, n), { disabled })
  return (
    <button
      {...handlers}
      disabled={disabled}
      style={{
        fontSize: 11, padding: '1px 10px', flexShrink: 0,
        background: disabled ? 'var(--ink-2)' : ATTR_COLORS[attrKey],
        color: disabled ? 'var(--ink-4)' : '#fff',
        border: 'none', borderRadius: 2,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      +1
    </button>
  )
}

const TRIGGER_COLOR = {
  on_physical_hit: 'var(--rust)',
  on_magic_hit:    '#3a5a8a',
  on_hit_taken:    'var(--bamboo)',
  passive:         '#8a6a2a',
}
const QUALITY_LABEL = { white: '白', blue: '蓝', gold: '金' }

const TianShuPanel = ({ pet, bag }) => {
  const [msg, setMsg] = useState(null)
  const tianShu = pet.tianShu ?? []
  const spiritMax = Math.min(TIANSHU_SPIRIT_MAX, tianShu.length * TIANSHU_SPIRIT_PER_BOOK)

  function flash(res) {
    if (res.ok && res.instance) {
      const def = TIANSHU_BY_ID[res.instance.type]
      const q   = TIANSHU_QUALITY[res.instance.quality]
      setMsg({ text: `开书成功：【${q?.name}色】${def?.name ?? ''}天书`, ok: true })
    } else {
      setMsg({ text: res.ok ? '操作成功' : (res.reason ?? '操作失败'), ok: res.ok })
    }
    setTimeout(() => setMsg(null), 3000)
  }

  const equippedTypes = new Set(tianShu.map(t => t.type))

  // 背包中可装备的天书（包括超级天书）
  const bagBooks = [
    ...TIANSHU_DEFS
      .filter(def => (bag.find(e => e.itemId === def.id)?.qty ?? 0) > 0 && !equippedTypes.has(def.id))
      .map(def => ({ itemId: def.id, name: def.name + '天书', qty: bag.find(e => e.itemId === def.id).qty })),
    ...(bag.find(e => e.itemId === 'tianshu_super')?.qty > 0
      ? [{ itemId: 'tianshu_super', name: '超级天书', qty: bag.find(e => e.itemId === 'tianshu_super').qty }]
      : []),
  ]

  return (
    <div className="paper-bg scroll-frame" style={{ padding: 12, position: 'relative' }}>
      <CornerDeco />
      <SubHead
        title="天书"
        sub={`TIANSHU · ${tianShu.length}/${TIANSHU_MAX_SLOTS} 槽 · 灵气 ${spiritMax.toLocaleString()}`}
      />
      {msg && (
        <div style={{
          padding: '3px 8px', marginBottom: 6,
          background: msg.ok ? 'rgba(45,138,45,0.12)' : 'rgba(163,55,58,0.12)',
          border: `1px solid ${msg.ok ? 'var(--bamboo)' : 'var(--vermilion)'}`,
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: msg.ok ? 'var(--bamboo)' : 'var(--vermilion)',
        }}>{msg.text}</div>
      )}

      {/* 灵气进度条 */}
      {spiritMax > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', flexShrink: 0, width: 24 }}>灵气</span>
          <div style={{ flex: 1, height: 8, background: 'var(--paper-3)', border: '1px solid var(--ink-4)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #9a6aaa, #c8a020)', backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(0,0,0,0.1))' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-2)', flexShrink: 0 }}>{spiritMax.toLocaleString()}</span>
        </div>
      )}

      {/* 已装备天书 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 }}>
        {tianShu.map((ts, idx) => {
          const def = TIANSHU_BY_ID[ts.type]
          if (!def) return null
          const q = TIANSHU_QUALITY[ts.quality]
          const trigColor = TRIGGER_COLOR[def.trigger] ?? 'var(--ink-2)'
          const qColor    = ts.quality === 'gold' ? 'var(--gold-2)' : ts.quality === 'blue' ? '#4a88cc' : '#888'
          return (
            <div key={idx} style={{
              padding: '6px 8px', background: 'rgba(243,237,224,0.8)',
              border: `1px solid ${qColor}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: ts.baseStats?.length ? 4 : 0 }}>
                <Seal size={22} round style={{ background: trigColor, flexShrink: 0 }}>{def.glyph}</Seal>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span className="brush" style={{ fontSize: 13 }}>{def.name}天书</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: qColor, border: `1px solid ${qColor}`, padding: '0 3px' }}>{QUALITY_LABEL[ts.quality] ?? ts.quality}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: trigColor, border: `1px solid ${trigColor}`, padding: '0 3px' }}>{def.triggerDesc}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginTop: 1 }}>{def.desc}</div>
                </div>
                <button
                  className="btn-ink btn-ink-sm"
                  style={{ fontSize: 9, color: 'var(--vermilion)', flexShrink: 0 }}
                  onClick={() => { if (window.confirm(`确认卸除【${def.name}天书】？卸除后不返还。`)) flash(removePetTianShuAction(pet.id, idx)) }}
                >卸除</button>
              </div>
              {/* 基础属性（蓝/金品质） */}
              {ts.baseStats?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 30 }}>
                  {ts.baseStats.map((attr, i) => (
                    <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: qColor, background: 'rgba(243,237,224,0.6)', border: `1px solid ${qColor}`, padding: '0 5px' }}>
                      {attr.label}+{attr.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {Array.from({ length: TIANSHU_MAX_SLOTS - tianShu.length }).map((_, i) => (
          <div key={'empty' + i} style={{
            padding: '5px 8px', border: '1px dashed var(--ink-4)',
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)',
          }}>— 空槽 {tianShu.length + i + 1}/{TIANSHU_MAX_SLOTS} —</div>
        ))}
      </div>

      {/* 背包中可装备的天书 */}
      {tianShu.length < TIANSHU_MAX_SLOTS ? (
        bagBooks.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
            背包无可装备天书 — 前往商城购买
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 4 }}>背包可装备：</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {bagBooks.map(b => (
                <button key={b.itemId} className="btn-ink"
                  style={{ fontSize: 11, padding: '3px 10px' }}
                  onClick={() => flash(equipPetTianShuAction(pet.id, b.itemId))}>
                  装备 {b.name}（×{b.qty}）
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>天书槽已满</div>
      )}
    </div>
  )
}

const PetDetail = ({ pet, bag, onToggleActive, onAddAttr, onResetAttr }) => {
  const catalog = getPetByKey(pet.spawnKey)
  const g = petGrowth(pet)
  const alloc = pet.allocatedAttr ?? { vit: 0, int: 0, str: 0, agi: 0 }
  const stats = computeStatsFromGrowth(pet.level, g, { baby: pet.kind === '宝宝', allocatedAttr: alloc })
  const rates = getPetAttrRates(g, pet.level)
  const totalAttr = getPetFreeAttrTotal(pet.level)
  const usedAttr  = sumPetAllocAttr(alloc)
  const freeAttr  = totalAttr - usedAttr
  const total = sumGrowth(g)
  const [tlo, thi] = g.totalBand
  const tGrade = totalGrade(total, tlo, thi)

  const hpRange  = catalog ? [catalog.growth.hp_min,   catalog.growth.hp_max]   : [0, 100]
  const mpRange  = catalog ? [catalog.growth.mp_min,   catalog.growth.mp_max]   : [0, 100]
  const spdRange = catalog ? [catalog.growth.spd_min,  catalog.growth.spd_max]  : [0, 100]
  const pAtkRange= catalog ? [catalog.growth.patk_min, catalog.growth.patk_max] : [0, 100]
  const mAtkRange= catalog ? [catalog.growth.matk_min, catalog.growth.matk_max] : [0, 100]

  const affinity = catalog?.affinity ?? null
  const expNeed   = petExpRequiredToNextLevel(pet.level)
  const physDmg   = stats.atk
  const magDmg    = Math.round(stats.mAtk * 0.55 + 18)
  const comboRate = Math.min(35, Math.floor(stats.speed / 12))
  const critRate  = Math.min(25, Math.floor(stats.atk / 20))

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <StatBar label="气血" value={stats.maxHp} max={stats.maxHp} color="var(--vermilion)" />
          <StatBar label="法力" value={stats.maxMp} max={stats.maxMp} color="#3a5a8a" />
          <StatBar label="经验" value={pet.expIntoLevel ?? 0} max={expNeed} color="var(--gold-2)" />
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

        <div>
          <SubHead title="战斗" sub="DERIVED · 基于当前属性估算" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            <KV k="物伤" v={physDmg} c="var(--rust)" />
            <KV k="法伤" v={magDmg} c="var(--gold-2)" />
            <KV k="连击率" v={comboRate + '%'} c="var(--bamboo)" />
            <KV k="必杀率" v={critRate + '%'} c="var(--vermilion)" />
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

        {/* attr allocation */}
        <div className="paper-bg scroll-frame" style={{ padding: 12, position: 'relative' }}>
          <CornerDeco />
          <SubHead
            title="属性加点"
            sub={`ATTR POINTS · 每级 5 点`}
            right={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: freeAttr > 0 ? 'var(--gold-2)' : 'var(--ink-4)' }}>
                  剩余 <b>{freeAttr}</b> / {totalAttr}
                </span>
                <button
                  className="btn-ink btn-ink-sm"
                  style={{ fontSize: 10, padding: '1px 8px' }}
                  onClick={onResetAttr}
                  disabled={usedAttr === 0}
                >
                  重置
                </button>
              </span>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
            {Object.keys(ATTR_LABELS).map(key => {
              const pts = alloc[key] ?? 0
              const dimRates = rates[key]
              const subStats = ATTR_RATE_LABELS[key]
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* 维度名 + 已分配点数 */}
                  <span className="brush" style={{ fontSize: 14, width: 32, color: ATTR_COLORS[key], flexShrink: 0 }}>
                    {ATTR_LABELS[key]}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: pts > 0 ? 'var(--gold-2)' : 'var(--ink-4)', minWidth: 32, flexShrink: 0 }}>
                    {pts > 0 ? `+${pts}` : '—'}
                  </span>
                  {/* 当前属性值 + 每点收益（rate=0 的属性不显示） */}
                  <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {subStats.filter(({ key: rk }) => dimRates[rk] > 0).map(({ key: rk, statKey, label }) => (
                      <span key={rk} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                        {label}
                        <span style={{ color: 'var(--ink)', fontWeight: 600, marginLeft: 2 }}>
                          {stats[statKey]?.toLocaleString?.() ?? stats[statKey]}
                        </span>
                        <span style={{ color: 'var(--bamboo)', fontSize: 9, marginLeft: 2 }}>
                          (+{dimRates[rk]}/点)
                        </span>
                      </span>
                    ))}
                    {subStats.every(({ key: rk }) => dimRates[rk] === 0) && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)' }}>
                        此宠成长不匹配
                      </span>
                    )}
                  </div>
                  <PetAddBtn attrKey={key} disabled={freeAttr <= 0} onAdd={onAddAttr} />
                </div>
              )
            })}
          </div>
          {totalAttr === 0 && (
            <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--ink-4)' }}>
              升至 2 级后解锁属性加点（每升一级 +5 点）
            </p>
          )}
        </div>

        {/* school skills */}
        <div className="paper-bg scroll-frame" style={{ padding: 12, position: 'relative' }}>
          <CornerDeco />
          <SubHead title="修炼技能" sub={affinity ? `SCHOOL SKILLS · ${affinity}系` : 'SCHOOL SKILLS'} />
          <SchoolSkillsPanel affinity={affinity} />
        </div>

        {/* tianshu */}
        <TianShuPanel pet={pet} bag={bag} />

        {/* actions */}
        <div className="paper-bg scroll-frame" style={{ padding: 10, position: 'relative' }}>
          <CornerDeco />
          <SubHead title="修炼 · 炼妖" sub="ACTIONS" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            <button
              className={'btn-ink' + (pet.active ? '' : ' btn-ink-primary')}
              onClick={onToggleActive}
            >
              {pet.active ? '休 息' : '出 战'}
            </button>
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
  const activePets = roster.filter((p) => p.active)
  const vault      = roster.filter((p) => !p.active)

  const [tab, setTab]           = useState(0) // 0=上阵 1=仓库
  const [selectedId, setSelectedId] = useState(roster[0]?.id ?? null)
  const [msg, setMsg]           = useState(null) // { text, ok }

  const selected = roster.find((p) => p.id === selectedId) ?? roster[0]

  // 提示条 2 秒后自动消失
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2000)
    return () => clearTimeout(t)
  }, [msg])

  function handleToggle(pet) {
    if (!pet) return
    const res = setPetActiveAction(pet.id, !pet.active)
    setMsg({ text: res.reason ?? (pet.active ? `「${pet.displayName}」已下阵休息` : `「${pet.displayName}」已上阵出战`), ok: res.ok })
  }

  function handleAddAttr(pet, attr, count = 1) {
    if (!pet) return
    const res = addPetAttrAction(pet.id, attr, count)
    if (!res.ok) setMsg({ text: res.reason, ok: false })
  }

  function handleResetAttr(pet) {
    if (!pet) return
    resetPetAttrAction(pet.id)
    setMsg({ text: `「${pet.displayName}」属性点已重置`, ok: true })
  }

  const listPets = tab === 0 ? activePets : vault

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead
        title="灵 兽 · 宠 物"
        sub="BEASTS & PETS"
        right={
          <span style={{ display: 'inline-flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            <span>携带 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>{activePets.length}</span> / 5</span>
            <span>仓库 <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{vault.length}</span> / 30</span>
          </span>
        }
      />

      {/* 提示条 */}
      {msg && (
        <div style={{
          position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, padding: '5px 18px',
          background: msg.ok ? 'rgba(60,100,60,0.92)' : 'rgba(140,40,40,0.92)',
          color: '#f0e8d0', fontSize: 12, fontFamily: 'var(--font-main)',
          borderRadius: 3, whiteSpace: 'nowrap', pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', gap: 14 }}>
        {/* left: roster list */}
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="tab-list">
            {[`上阵 ${activePets.length}`, `仓库 ${vault.length}`].map((t, i) => (
              <div
                key={t}
                className={'tab' + (tab === i ? ' active' : '')}
                style={{ padding: '4px 12px', fontSize: 11, cursor: 'pointer' }}
                onClick={() => setTab(i)}
              >
                {t}
              </div>
            ))}
          </div>
          <div className="paper-bg" style={{ padding: 8, border: '1px solid var(--ink-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: 5, overflow: 'auto' }}>
            {listPets.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {tab === 0 ? '暂无上阵宠物' : '仓库为空'}
              </div>
            ) : listPets.map((p) => (
              <PetCard key={p.id} pet={p} isSelected={p.id === selected?.id} onClick={() => setSelectedId(p.id)} />
            ))}
          </div>
          {/* 底部快捷按钮：针对当前选中宠物 */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className={'btn-ink btn-ink-sm' + (selected?.active ? '' : ' btn-ink-primary')}
              style={{ flex: 2 }}
              onClick={() => handleToggle(selected)}
              disabled={!selected}
            >
              {selected?.active ? '下 阵' : '上 阵'}
            </button>
            <button className="btn-ink btn-ink-sm" style={{ flex: 1 }}>合宠</button>
            <button className="btn-ink btn-ink-sm" style={{ flex: 1 }}>放生</button>
          </div>
        </div>

        {/* right: detail */}
        {selected ? (
          <PetDetail
            pet={selected}
            bag={char.bag ?? []}
            onToggleActive={() => handleToggle(selected)}
            onAddAttr={(attr, n) => handleAddAttr(selected, attr, n)}
            onResetAttr={() => handleResetAttr(selected)}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
            选择一只灵兽查看详情
          </div>
        )}
      </div>
    </div>
  )
}
