import React from 'react'
import { Seal, Placeholder, CornerDeco, CloudDivider, PanelHead, SubHead, Cell, Tag } from './common.jsx'

const sheet = {
  displayName: '天行健', school: '金', level: 50,
  daoYears: 12, daoDays: 86, potential: 4820, fame: 1260,
  expCur: 12840, expMax: 28000, staminaCur: 4520, staminaMax: 5000, meritRecord: 28,
  vit: 30, int: 150, str: 10, agi: 80, rem4: 5,
  affMetal: 30, affWood: 10, affWater: 0, affFire: 20, affEarth: 0, remAff: 4,
  derived: {
    maxHp: 4860, maxMp: 2160, phyDmg: 380, magDmg: 2480, def: 320,
    speed: 280, acc: 84, dodgePct: 4, critPct: 8, comboPct: 6,
    reflectPct: 2, counterPct: 3,
    strongMetal: 0, strongWood: 24, strongWater: 0, strongFire: 12, strongEarth: 0,
    resJin: 6, resMu: 18, resShui: 4, resHuo: 22, resTu: 2,
    resYi: 18, resBing: 0, resDu: 8, resShuiMian: 4, resHunLuan: 0,
  },
  rates: {
    hpPerVit: 5.00, defPerVit: 1.50, magPerInt: 10.00, mpPerInt: 8.75,
    phyPerStr: 5.00, accPerStr: 1, spdPerAgi: 2.95,
  },
}

const equipSlots = [
  { id: 'head',     label: '头盔', n: '紫府金冠',    q: 'epic',   refine: 9,  side: 'left' },
  { id: 'robe',     label: '衣服', n: '蜀山·云锦袍',  q: 'legend', refine: 12, side: 'left' },
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
    {!s.empty ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold-2)' }}>+{s.refine}</span> : null}
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

const AllocCell = ({ label, value, sub, accent }) => (
  <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span className="cell-k">{label}</span>
      <span className="cell-v" style={accent ? { color: accent } : null}>{value}</span>
      <button className="cell-plus">＋</button>
    </div>
    <span style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', lineHeight: 1.35 }}>{sub}</span>
  </div>
)

export default function CharacterScreen() {
  const d = sheet.derived
  const r = sheet.rates

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead
        title="角 色 · 属 性"
        sub="CHARACTER · ATTRIBUTES"
        right={`【${sheet.displayName}】Lv.${sheet.level} · 法${sheet.school}`}
      />

      <div style={{ position: 'absolute', inset: '58px 20px 56px 20px', display: 'flex', gap: 12 }}>
        {/* 左：立绘 + 装备 */}
        <div className="paper-dark scroll-frame" style={{ width: 360, padding: 18, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CornerDeco />
          <div style={{ textAlign: 'center' }}>
            <div className="brush" style={{ fontSize: 26, color: 'var(--ink)', letterSpacing: '0.16em', lineHeight: 1 }}>{sheet.displayName}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4, letterSpacing: 1.5 }}>
              蜀山 · 法{sheet.school} · LV {sheet.level} · 大乘期
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 5 }}>
              <Tag tone="vermilion">白衣卿相</Tag>
              <Tag tone="gold">降魔大将</Tag>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 72 }}>
              {equipSlots.filter((s) => s.side === 'left').map((s) => <EquipSlot key={s.id} s={s} />)}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <Placeholder label="CHARACTER 3D" sub="角色立绘 / 360°" style={{ position: 'absolute', inset: 0, borderStyle: 'solid' }} />
              <svg viewBox="0 0 200 60" style={{ position: 'absolute', bottom: 4, left: 4, right: 4, width: 'calc(100% - 8px)', height: 50, opacity: 0.4 }}>
                <ellipse cx="100" cy="30" rx="90" ry="13" fill="none" stroke="var(--ink-2)" />
                <ellipse cx="100" cy="30" rx="68" ry="10" fill="none" stroke="var(--ink-3)" strokeDasharray="3 2" />
              </svg>
              <div style={{ position: 'absolute', top: 6, right: 6 }}>
                <Seal size={32} round school={sheet.school}>{sheet.school}</Seal>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 72 }}>
              {equipSlots.filter((s) => s.side === 'right').map((s) => <EquipSlot key={s.id} s={s} />)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 12px', background: 'var(--paper)', border: '1px solid var(--ink-3)' }}>
            <Seal size={32}>战</Seal>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 1.5 }}>战力 COMBAT</div>
              <div className="brush" style={{ fontSize: 22, color: 'var(--vermilion)', lineHeight: 1 }}>148,260</div>
            </div>
            <span style={{ flex: 1 }} />
            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)' }}>
              <div>本服 #42</div>
              <div style={{ color: 'var(--bamboo)', marginTop: 2 }}>↑ 24 / 七日</div>
            </div>
          </div>
        </div>

        {/* 右：属性区 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, overflow: 'auto' }}>
          <SectionBox title="基础状态" sub="DERIVED · 衍生战力">
            <Grid5>
              <Cell label="气血" value={`${d.maxHp.toLocaleString()}/${d.maxHp.toLocaleString()}`} accent="var(--vermilion)" />
              <Cell label="法力" value={`${d.maxMp.toLocaleString()}/${d.maxMp.toLocaleString()}`} accent="#3a5a8a" />
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
              <Cell label="强力克金" value={d.strongMetal + '%'} />
              <Cell label="强力克木" value={d.strongWood + '%'} accent="var(--bamboo)" />
              <Cell label="强力克水" value={d.strongWater + '%'} />
              <Cell label="强力克火" value={d.strongFire + '%'} />
              <Cell label="强力克土" value={d.strongEarth + '%'} />
            </Grid5>
          </SectionBox>

          <SectionBox title="核心属性" sub="CORE">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 22px', padding: '4px 4px', fontSize: 12 }}>
              <span><span style={{ color: 'var(--ink-3)' }}>道行</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{sheet.daoYears}年{sheet.daoDays}天</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>潜能</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-2)', fontWeight: 600 }}>{sheet.potential.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>声望</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{sheet.fame.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>经验</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{sheet.expCur.toLocaleString()}/{sheet.expMax.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>体力</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{sheet.staminaCur.toLocaleString()}/{sheet.staminaMax.toLocaleString()}</span></span>
              <span><span style={{ color: 'var(--ink-3)' }}>战绩</span> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)', fontWeight: 600 }}>{sheet.meritRecord}</span></span>
            </div>
          </SectionBox>

          <SectionBox title="自由属性点" sub={`ALLOCATION · 剩余 ${sheet.rem4}`}>
            <Grid5>
              <AllocCell label="体质" value={sheet.vit} sub={`每点≈${r.hpPerVit.toFixed(2)}气血·${r.defPerVit.toFixed(2)}防御`} />
              <AllocCell label="灵力" value={sheet.int} sub={`每点≈${r.magPerInt.toFixed(2)}法伤·${r.mpPerInt.toFixed(2)}法力`} accent="var(--gold-2)" />
              <AllocCell label="力量" value={sheet.str} sub={`每点≈${r.phyPerStr.toFixed(2)}物伤·${r.accPerStr}命中`} />
              <AllocCell label="敏捷" value={sheet.agi} sub={`每点≈${r.spdPerAgi.toFixed(2)}速度`} />
              <div className="cell" style={{ flexDirection: 'column', alignItems: 'stretch', background: 'linear-gradient(180deg, var(--paper) 0%, #fff8ea 100%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="cell-k">剩余点数</span>
                  <span className="brush" style={{ fontSize: 22, color: 'var(--vermilion)', lineHeight: 1 }}>{sheet.rem4}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  相性 {sheet.remAff} · 升级即可获得
                </div>
              </div>
            </Grid5>
          </SectionBox>

          <SectionBox title="相性加成" sub={`AFFINITY · 剩余 ${sheet.remAff} · 上限 30 / 系`}>
            <Grid5>
              {[{ k: '金相性', v: sheet.affMetal, school: '金' }, { k: '木相性', v: sheet.affWood, school: '木' }, { k: '水相性', v: sheet.affWater, school: '水' }, { k: '火相性', v: sheet.affFire, school: '火' }, { k: '土相性', v: sheet.affEarth, school: '土' }].map((a) => (
                <div key={a.k} className="cell" style={{ alignItems: 'center' }}>
                  <Seal size={18} round school={a.school}>{a.school}</Seal>
                  <span className="cell-k" style={{ marginLeft: 6 }}>{a.k}</span>
                  <span className="cell-v" style={{ color: a.v >= 30 ? 'var(--gold-2)' : 'var(--ink)' }}>{a.v}/30</span>
                  {a.v < 30 ? <button className="cell-plus" style={{ marginLeft: 4 }}>＋</button> : <span style={{ marginLeft: 4, fontFamily: 'var(--font-brush)', fontSize: 11, color: 'var(--gold-2)' }}>满</span>}
                </div>
              ))}
              <Cell label="金·法伤/灵" value={r.magPerInt.toFixed(2)} />
              <Cell label="木·气血/体" value={r.hpPerVit.toFixed(2)} />
              <Cell label="水·防御/体" value={r.defPerVit.toFixed(2)} />
              <Cell label="火·速度/敏" value={r.spdPerAgi.toFixed(2)} />
              <Cell label="土·物伤/力" value={r.phyPerStr.toFixed(2)} />
              <Cell label="木·法力/灵" value={r.mpPerInt.toFixed(2)} />
              <Cell label="力·命中/力" value={r.accPerStr} />
            </Grid5>
          </SectionBox>

          <div style={{ display: 'flex', gap: 10 }}>
            <SectionBox title="五系法术抗性" sub="MAGIC RES" style={{ flex: 1 }}>
              <Grid5>
                <Cell label="抗金" value={d.resJin + '%'} />
                <Cell label="抗木" value={d.resMu + '%'} accent="var(--bamboo)" />
                <Cell label="抗水" value={d.resShui + '%'} />
                <Cell label="抗火" value={d.resHuo + '%'} accent="var(--vermilion)" />
                <Cell label="抗土" value={d.resTu + '%'} />
              </Grid5>
            </SectionBox>
            <SectionBox title="障碍抗性" sub="STATUS RES" style={{ flex: 1 }}>
              <Grid5>
                <Cell label="抗遗忘" value={d.resYi + '%'} accent="var(--gold-2)" />
                <Cell label="抗冰冻" value={d.resBing + '%'} />
                <Cell label="抗中毒" value={d.resDu + '%'} />
                <Cell label="抗昏睡" value={d.resShuiMian + '%'} />
                <Cell label="抗混乱" value={d.resHunLuan + '%'} />
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
        <button className="btn-ink btn-ink-sm">[1] 自动分配 · 3 体 2 灵</button>
        <button className="btn-ink btn-ink-sm btn-ink-primary">[2] 手动加点</button>
        <button className="btn-ink btn-ink-sm">[3] 相性加点</button>
        <button className="btn-ink btn-ink-sm">[4] 重置加点</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          剩余四维 <span style={{ color: 'var(--vermilion)', fontWeight: 700 }}>{sheet.rem4}</span> · 相性 <span style={{ color: 'var(--vermilion)', fontWeight: 700 }}>{sheet.remAff}</span>
        </span>
        <button className="btn-ink btn-ink-sm">[ESC] 关闭</button>
      </div>
    </div>
  )
}
