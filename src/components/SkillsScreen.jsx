import React, { useState, useSyncExternalStore } from 'react'
import { Seal, CornerDeco, CloudDivider, PanelHead, SubHead, Tag } from './common.jsx'
import {
  SCHOOLS, SCHOOL_THEME,
  getAllSchoolSkills, getSkillsBySchool,
  canLearnSkill, maxSkillLevelForChar, prereqSkillId, getSkillById,
} from '../game/battle/schoolSkills.js'
import { subscribe, getSnapshot, learnSkillAction, equipSkillAction } from '../game/characterStore.js'

const SCHOOL_NAMES = { 金: '金锋诀', 木: '木灵诀', 水: '水月诀', 火: '炎阳诀', 土: '厚土诀' }
const BRANCH_LABEL = { B: 'B · 攻击线', C: 'C · 障碍线', D: 'D · 辅助线' }
const BRANCH_SUB   = {
  B: 'ATTACK',
  C: (s) => `OBSTACLE · ${SCHOOL_THEME[s]?.obstacle ?? ''}`,
  D: (s) => `ASSIST · ${SCHOOL_THEME[s]?.assist ?? ''}`,
}
const BRANCH_TONE  = { B: 'vermilion', C: 'ink', D: 'bamboo' }
const TIER_GOLD = [480, 560, 720, 880, 1080]
const TIER_POT  = [180, 220, 320, 420, 560]
const B_MP  = [36,  56,  80, 112, 160]
const C_MP  = [30,  42,  65,  88, 130]
const D_MP  = [28,  40,  60,  80, 120]

function mpCostOf(sk) {
  const t = sk.tier - 1
  if (sk.branch === 'B') return B_MP[t]
  if (sk.branch === 'C') return C_MP[t]
  return D_MP[t]
}

const questSkills = [
  { id: 'lipojun', n: '力破千钧', unlockLv: 25, lv: 28, desc: '以千钧之力猛击单体，造成强力物理伤害。' },
  { id: 'baibu',   n: '百步穿云', unlockLv: 35, lv: 18, desc: '凌空发剑，势如破竹，单体重击。' },
  { id: 'xianfa',  n: '仙法疗伤', unlockLv: 20, lv: 32, desc: '以仙家法力回复单体气血。' },
  { id: 'miaoshou',n: '妙手回春', unlockLv: 30, lv: 0,  desc: '回复目标气血并解除异常状态。' },
]

export default function SkillsScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [viewSchool, setViewSchool] = useState(char.school)
  const [selectedId, setSelectedId] = useState('jin_B3')
  const [toast, setToast] = useState(null)

  const isMySchool = viewSchool === char.school
  const maxLv = maxSkillLevelForChar(char.level)

  const schoolSkills = getSkillsBySchool(viewSchool)
  const branches = ['B', 'C', 'D'].map((br) => ({
    branch: br,
    skills: schoolSkills.filter((s) => s.branch === br),
  }))

  const learnedCount = (school) =>
    getAllSchoolSkills().filter((s) => s.school === school && (char.skillLevels[s.id] ?? 0) > 0).length

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2200)
  }

  function handleLearn(e, skillId) {
    e.stopPropagation()
    const res = learnSkillAction(skillId)
    if (!res.ok) showToast(res.reason, false)
  }

  function handleEquip(e, skillId) {
    e && e.stopPropagation()
    const res = equipSkillAction(skillId)
    if (!res.ok) showToast(res.reason, false)
    else showToast(res.equipped ? '已装备到战斗槽' : '已从战斗槽卸除')
  }

  // Selected skill info
  const selDef = getAllSchoolSkills().find((s) => s.id === selectedId) ?? null
  const selLv  = selDef ? (char.skillLevels[selectedId] ?? 0) : 0
  const selEquipped = char.equippedSkills.includes(selectedId)
  const selCanResult = selDef && isMySchool
    ? canLearnSkill(char.level, char.skillLevels, selectedId)
    : { ok: false, reason: '非本系' }
  const selLocked  = !selCanResult.ok && selLv === 0
  const selIsD = selDef?.branch === 'D'

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead
        title="技 能"
        sub="SKILLS · 门派 B·C·D"
        right={
          <span style={{ display: 'inline-flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
            <span>银两 <span style={{ color: 'var(--gold-2)', fontWeight: 600 }}>{char.tael.toLocaleString()}</span></span>
            <span>潜能 <span style={{ color: '#3a5a8a', fontWeight: 600 }}>{char.potential.toLocaleString()}</span></span>
            <span>等级 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>Lv {char.level}</span></span>
            <span>技能上限 <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{maxLv}</span></span>
          </span>
        }
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? 'rgba(60,100,50,0.9)' : 'rgba(163,55,58,0.9)',
          color: 'var(--paper)', padding: '6px 18px', borderRadius: 3,
          fontFamily: 'var(--font-mono)', fontSize: 12, zIndex: 50,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', gap: 14 }}>

        {/* 左：五系选择 + 任务技能 */}
        <div style={{ width: 170, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SubHead title="五系" sub="ELEMENT" />
          {SCHOOLS.map((s) => {
            const isChar = s === char.school
            const isView = s === viewSchool
            return (
              <button
                key={s}
                className={'btn-ink' + (isView ? ' btn-ink-primary' : '')}
                onClick={() => setViewSchool(s)}
                style={{ justifyContent: 'flex-start', padding: '6px 10px', fontSize: 12 }}
              >
                <Seal size={20} round school={s} style={{ marginRight: 6 }}>{s}</Seal>
                {s} 系
                {isChar && <Tag tone="vermilion" style={{ marginLeft: 4, fontSize: 8, padding: '0 4px' }}>本系</Tag>}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: isView ? 'rgba(243,237,224,0.8)' : 'var(--ink-3)' }}>
                  {isChar ? `${learnedCount(s)}/15` : `${learnedCount(s)}/15`}
                </span>
              </button>
            )
          })}

          <div style={{ marginTop: 8 }}>
            <SubHead title="任务技能" sub="QUEST" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {questSkills.map((q) => (
                <div key={q.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 6px', background: 'rgba(243,237,224,0.7)',
                  border: '1px solid var(--ink-4)', fontSize: 11,
                }}>
                  <Tag tone={q.lv > 0 ? 'vermilion' : 'ghost'} style={{ fontSize: 9 }}>任</Tag>
                  <span className="brush" style={{ fontSize: 12 }}>{q.n}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: q.lv > 0 ? 'var(--ink)' : 'var(--ink-4)' }}>
                    {q.lv > 0 ? 'Lv ' + q.lv : '未学'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中：技能列表 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 6, borderBottom: '1px solid var(--gold-2)' }}>
            <Seal size={26} school={viewSchool}>{viewSchool}</Seal>
            <span className="brush" style={{ fontSize: 22, color: 'var(--ink)' }}>{SCHOOL_NAMES[viewSchool]}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: 1 }}>
              {viewSchool} · {isMySchool ? '本系' : '他系（只读）'}
            </span>
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>
              已学 <span style={{ color: 'var(--vermilion)', fontWeight: 600 }}>{learnedCount(viewSchool)}</span> / 15
            </span>
          </div>

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {branches.map(({ branch, skills }) => (
              <BranchBlock
                key={branch}
                branch={branch}
                label={BRANCH_LABEL[branch]}
                tone={BRANCH_TONE[branch]}
                subTitle={typeof BRANCH_SUB[branch] === 'function' ? BRANCH_SUB[branch](viewSchool) : BRANCH_SUB[branch]}
                skills={skills}
                char={char}
                isMySchool={isMySchool}
                maxLv={maxLv}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onLearn={handleLearn}
              />
            ))}
          </div>
        </div>

        {/* 右：详情 */}
        <div className="paper-bg scroll-frame" style={{ width: 300, padding: 16, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <CornerDeco />
          {selDef ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="portrait" style={{ width: 56, height: 56, fontSize: 22 }}>{viewSchool}</div>
                <div style={{ flex: 1 }}>
                  <div className="brush" style={{ fontSize: 22 }}>{selDef.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>
                    法{selDef.school} · {BRANCH_LABEL[selDef.branch]} · 阶 {selDef.tier}
                  </div>
                </div>
              </div>
              <CloudDivider />
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12, color: 'var(--ink-2)' }}>
                <span style={{ color: 'var(--ink-3)' }}>等级</span>
                <span>Lv {selLv} / {maxLv} {selLv >= maxLv && selLv > 0 ? '（已满）' : ''}</span>
                <span style={{ color: 'var(--ink-3)' }}>消耗</span>
                <span style={{ color: '#3a5a8a' }}>灵力 {mpCostOf(selDef)}</span>
                <span style={{ color: 'var(--ink-3)' }}>范围</span>
                <span>{selDef.targetNote}</span>
                <span style={{ color: 'var(--ink-3)' }}>升级费</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {TIER_GOLD[selDef.tier - 1].toLocaleString()} 银 · {TIER_POT[selDef.tier - 1]} 潜
                </span>
              </div>
              <CloudDivider />
              <div>
                <div className="brush" style={{ fontSize: 13, color: 'var(--vermilion)', marginBottom: 4 }}>诀云</div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: 'var(--ink-2)', textIndent: '2em' }}>
                  {selDef.branch === 'B' && `聚${selDef.school}气之力，${selDef.targetNote}，造成${selDef.school}系法术伤害。`}
                  {selDef.branch === 'C' && `${SCHOOL_THEME[selDef.school]?.obstacle ?? ''}，${selDef.targetNote}。`}
                  {selDef.branch === 'D' && `${SCHOOL_THEME[selDef.school]?.assist ?? ''}，${selDef.targetNote}。`}
                </p>
              </div>
              {selLocked && (
                <>
                  <CloudDivider />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                    {selCanResult.reason}
                    {selDef.prereq && (
                      <div style={{ marginTop: 4 }}>
                        前置：{getSkillById(prereqSkillId(selDef))?.name ?? prereqSkillId(selDef)} ≥ {selDef.prereq.minSkillLevel} 级
                      </div>
                    )}
                  </div>
                </>
              )}
              <div style={{ marginTop: 'auto', display: 'flex', gap: 6, flexDirection: 'column' }}>
                {isMySchool && !selLocked && (
                  <button
                    className="btn-ink btn-ink-primary"
                    onClick={(e) => handleLearn(e, selectedId)}
                    disabled={selLv >= maxLv}
                    style={{ opacity: selLv >= maxLv ? 0.5 : 1 }}
                  >
                    {selLv === 0 ? '习 得' : selLv >= maxLv ? '已 满' : '升 级'}
                  </button>
                )}
                {isMySchool && !selIsD && selLv > 0 && (
                  <button
                    className={'btn-ink' + (selEquipped ? ' btn-ink-primary' : '')}
                    onClick={(e) => handleEquip(e, selectedId)}
                  >
                    {selEquipped ? '卸 除（战斗槽）' : '装 备（战斗槽）'}
                  </button>
                )}
                {selIsD && selLv > 0 && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', padding: '6px 0' }}>
                    辅助技能 · 被动生效
                  </div>
                )}
              </div>
              {/* 战斗槽预览 */}
              <div style={{ borderTop: '1px dashed var(--ink-4)', paddingTop: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginBottom: 5 }}>
                  战斗技能槽 {char.equippedSkills.length}/6
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {char.equippedSkills.map((id) => {
                    const s = getSkillById(id)
                    return s ? (
                      <div
                        key={id}
                        onClick={(e) => handleEquip(e, id)}
                        style={{
                          padding: '2px 7px', background: 'rgba(163,55,58,0.1)',
                          border: '1px solid var(--vermilion)', borderRadius: 2,
                          fontFamily: 'var(--font-brush)', fontSize: 12,
                          color: 'var(--vermilion)', cursor: 'pointer',
                        }}
                        title="点击卸除"
                      >
                        {s.name}
                      </div>
                    ) : null
                  })}
                  {char.equippedSkills.length === 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>空（习得技能后点「装备」）</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              点击技能查看详情
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── 子组件 ───────────────────────────────────────────────────────────────────

function SkillCard({ sk, char, isMySchool, maxLv, selected, onSelect, onLearn }) {
  const lv = isMySchool ? (char.skillLevels[sk.id] ?? 0) : 0
  const { ok: canLearn } = isMySchool
    ? canLearnSkill(char.level, char.skillLevels, sk.id)
    : { ok: false }
  const isLocked   = !canLearn && lv === 0
  const isEquipped = char.equippedSkills.includes(sk.id)
  const pct = maxLv > 0 ? (lv / maxLv) * 100 : 0

  const actionLabel = lv === 0 ? '习得' : lv >= maxLv ? '已满' : '升级'

  return (
    <div
      className="paper-bg"
      onClick={() => onSelect(sk.id)}
      style={{
        border: '1px solid ' + (selected ? 'var(--vermilion)' : isLocked ? 'var(--ink-4)' : 'var(--ink-3)'),
        boxShadow: selected ? '0 0 0 2px rgba(163,55,58,0.18)' : 'none',
        padding: 7, opacity: isLocked ? 0.55 : 1,
        position: 'relative', minHeight: 90,
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      {isEquipped && (
        <span style={{ position: 'absolute', top: -8, right: 6 }}>
          <Seal size={20} round style={{ fontSize: 10 }}>用</Seal>
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="brush" style={{ fontSize: 14 }}>{sk.name}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)' }}>阶 {sk.tier}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
        {isLocked ? `需 Lv${sk.learnCharLevel}` : (lv === 0 ? '未习得' : `Lv ${lv}/${maxLv}`)}
      </div>
      <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--ink-2)', lineHeight: 1.4, minHeight: 28 }}>
        {sk.targetNote}
      </p>
      {!isLocked && lv > 0 && (
        <div className="bar" style={{ height: 4, marginTop: 4 }}>
          <div className="bar-fill" style={{ width: pct + '%', background: 'var(--vermilion)' }} />
        </div>
      )}
      <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isLocked ? 'var(--ink-4)' : 'var(--ink-3)' }}>
          {isLocked ? '未解锁' : `${TIER_GOLD[sk.tier - 1]}银`}
        </span>
        {!isLocked && isMySchool ? (
          <button
            className="btn-ink btn-ink-sm"
            style={{ fontSize: 10, padding: '2px 8px', opacity: lv >= maxLv ? 0.5 : 1 }}
            onClick={(e) => onLearn(e, sk.id)}
            disabled={lv >= maxLv}
          >
            {actionLabel}
          </button>
        ) : (
          <Tag tone="ghost" style={{ fontSize: 9 }}>{isLocked ? '锁' : '只读'}</Tag>
        )}
      </div>
    </div>
  )
}

function BranchBlock({ label, tone, subTitle, skills, char, isMySchool, maxLv, selectedId, onSelect, onLearn }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <Tag tone={tone}>{label}</Tag>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 1 }}>{subTitle}</span>
        <span style={{ flex: 1, height: 1, background: 'var(--ink-4)', opacity: 0.3 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
        {skills.map((sk) => (
          <SkillCard
            key={sk.id}
            sk={sk}
            char={char}
            isMySchool={isMySchool}
            maxLv={maxLv}
            selected={sk.id === selectedId}
            onSelect={onSelect}
            onLearn={onLearn}
          />
        ))}
      </div>
    </div>
  )
}
