import React, { useState, useSyncExternalStore } from 'react'
import { Seal, PanelHead, SubHead, Tag, CornerDeco } from './common.jsx'
import { subscribe, getSnapshot, buyShopItemAction } from '../game/characterStore.js'

// ───── 任务 ─────
const tasks = [
  { tag: '师门', title: '完成一场战斗', done: true, reward: '银两 +320 · 潜能 +60', desc: '击败任意野怪一次。', progress: '1/1' },
  { tag: '修山', title: '组队击败世界 BOSS', done: false, reward: '银两 +2,400 · 道行 +1天', desc: '需 ≥3 人组队挑战 羊头怪 / 牛头怪 / 百年黑熊精 等。', progress: '0/1' },
  { tag: '日常', title: '捕捉 1 只野生宠', done: false, reward: '银两 +800 · 潜能 +120', desc: '在 桃柳林 / 轩辕庙 / 五龙窟 捕捉，血量 ≤30% 概率最高。', progress: '0/1' },
  { tag: '日常', title: '使用药品 10 次（解锁仙法疗伤）', done: false, reward: '解锁 仙法疗伤', desc: '战斗中累计使用消耗品。', progress: '4/10' },
  { tag: '师门', title: '百战淬炼：击败 50 只野怪', done: false, reward: '解锁 力破千钧', desc: '累计击败野怪进度计算。', progress: '32/50' },
  { tag: '活动', title: '中秋·夜话灯谜', done: false, reward: '仙玉 +20 · 月饼礼盒', desc: '活动期间每日 19:00 开启。', progress: '0/5', event: true },
]

const QuestRow = ({ t }) => {
  const tone = { 师门: 'vermilion', 修山: 'ink', 日常: 'rust', 活动: 'bamboo' }[t.tag] || 'ink'
  return (
    <div style={{
      padding: 10,
      background: t.done ? 'rgba(106,138,122,0.08)' : 'rgba(243,237,224,0.65)',
      border: '1px solid ' + (t.done ? 'var(--bamboo)' : 'var(--ink-4)'),
      opacity: t.done ? 0.85 : 1,
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <Tag tone={tone} style={{ fontSize: 11, padding: '2px 8px', marginTop: 2 }}>{t.tag}</Tag>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="brush" style={{ fontSize: 15, color: t.done ? 'var(--ink-3)' : 'var(--ink)', textDecoration: t.done ? 'line-through' : 'none' }}>
            {t.title}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{t.progress}</span>
          {t.event ? <Seal size={16} round style={{ fontSize: 9, background: 'var(--rust)', boxShadow: 'inset 0 0 0 2px var(--paper), inset 0 0 0 3px var(--rust)' }}>庆</Seal> : null}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.6 }}>{t.desc}</p>
        <div style={{ marginTop: 3, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold-2)' }}>奖 · {t.reward}</div>
      </div>
      <button className="btn-ink btn-ink-sm" disabled={!t.done && t.tag !== '活动'} style={{ flexShrink: 0 }}>
        {t.done ? '领取' : '前往'}
      </button>
    </div>
  )
}

export function QuestScreen() {
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="任 务 簿" sub="QUEST JOURNAL"
        right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>今日 5 / 12 · 待领 3</span>}
      />
      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="tab-list" style={{ flexWrap: 'wrap' }}>
          {['全部 6', '师门 2', '修山 1', '日常 2', '活动 1'].map((t, i) => (
            <div key={t} className={'tab' + (i === 0 ? ' active' : '')} style={{ padding: '4px 14px' }}>{t}</div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflow: 'auto' }}>
          {tasks.map((t, i) => <QuestRow key={i} t={t} />)}
        </div>
        <div className="paper-bg" style={{ marginTop: 'auto', padding: 12, border: '1px solid var(--vermilion)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Seal size={32}>急</Seal>
          <div style={{ flex: 1 }}>
            <span className="brush" style={{ fontSize: 14, color: 'var(--vermilion)' }}>当前·指引</span>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
              师妹素衣最后出现于「五龙窟·西麓·古道驿」附近，建议沿河岸向北行十里。
            </div>
          </div>
          <button className="btn-ink btn-ink-primary">前 往</button>
        </div>
      </div>
    </div>
  )
}

// ───── 商城 ─────
const SHOP_ROWS = [
  { id: 'xiao_huanhun',  n: '小还魂丹',  qty: 10, price: 120,    k: 'T1 · HP +300',                   glyph: '还', special: false },
  { id: 'xiao_juling',   n: '小聚灵丹',  qty: 10, price: 100,    k: 'T1 · MP +200',                   glyph: '聚', special: false },
  { id: 'zhong_huanhun', n: '中还魂丹',  qty: 5,  price: 800,    k: 'T2 · HP +1500',                  glyph: '中', special: false },
  { id: 'zhong_juling',  n: '中聚灵丹',  qty: 5,  price: 700,    k: 'T2 · MP +1000',                  glyph: '中', special: false },
  { id: 'da_huanhun',    n: '大还魂丹',  qty: 3,  price: 2500,   k: 'T3 · HP +6000',                  glyph: '大', special: false },
  { id: 'da_juling',     n: '大聚灵丹',  qty: 3,  price: 2200,   k: 'T3 · MP +4000',                  glyph: '大', special: false },
  { id: 'qianghuashi',   n: '强化石',    qty: 5,  price: 3000,   k: '装备强化材料 · 每次强化消耗 1 颗', glyph: '石', special: false },
  { id: 'heishuijing',   n: '黑水晶',    qty: 1,  price: 999999, k: '吸取装备一条随机额外属性',         glyph: '黑', special: true },
]

export function ShopScreen() {
  const char = useSyncExternalStore(subscribe, getSnapshot)
  const [msg, setMsg] = useState(null)

  function handleBuy(row) {
    const res = buyShopItemAction(row.id, row.qty)
    setMsg({ text: res.ok ? `购买成功：${row.n} ×${row.qty}` : (res.reason ?? '购买失败'), ok: res.ok })
    setTimeout(() => setMsg(null), 2500)
  }

  const tael = char.tael ?? 0

  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="商 城" sub="SHOP · 银两专卖"
        right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>银两 <span style={{ color: 'var(--gold-2)', fontWeight: 700 }}>{tael.toLocaleString()}</span></span>}
      />
      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 银两栏 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--paper-2)', border: '1px solid var(--gold-2)', flexShrink: 0 }}>
          <Seal size={34} style={{ background: 'var(--gold-2)', boxShadow: 'inset 0 0 0 2px var(--paper), inset 0 0 0 3px var(--gold-2)' }}>银</Seal>
          <div>
            <div className="brush" style={{ fontSize: 20, color: 'var(--gold-2)', lineHeight: 1 }}>{tael.toLocaleString()} 银两</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 2 }}>TAEL · 战斗 + 出售装备获得</div>
          </div>
          <span style={{ flex: 1 }} />
          <button className="btn-ink btn-ink-sm">仙玉商城</button>
        </div>

        {/* 消息提示 */}
        {msg && (
          <div style={{
            flexShrink: 0, padding: '5px 12px',
            background: msg.ok ? 'rgba(45,138,45,0.12)' : 'rgba(163,55,58,0.12)',
            border: `1px solid ${msg.ok ? 'var(--bamboo)' : 'var(--vermilion)'}`,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: msg.ok ? 'var(--bamboo)' : 'var(--vermilion)',
          }}>
            {msg.text}
          </div>
        )}

        {/* 商品列表 */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SHOP_ROWS.map((r) => {
            const canAfford = tael >= r.price * r.qty
            return (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 8,
                background: r.special ? 'rgba(106,61,138,0.07)' : 'rgba(243,237,224,0.7)',
                border: `1px solid ${r.special ? '#6a3d8a' : 'var(--ink-4)'}`,
              }}>
                <div className="slot q-common" style={{ width: 46, height: 46, flex: '0 0 46px', borderColor: r.special ? '#6a3d8a' : undefined }}>
                  <Seal size={22} round style={r.special ? { background: '#6a3d8a' } : {}}>{r.glyph}</Seal>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="brush" style={{ fontSize: 15, color: r.special ? '#6a3d8a' : 'var(--ink)' }}>{r.n} ×{r.qty}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>{r.k}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <button
                    className="btn-ink btn-ink-primary"
                    disabled={!canAfford}
                    style={r.special ? { background: '#6a3d8a', borderColor: '#6a3d8a' } : {}}
                    onClick={() => handleBuy(r)}
                  >
                    {(r.price * r.qty).toLocaleString()} 银两 · 购买
                  </button>
                  {!canAfford && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--vermilion)', marginTop: 2 }}>银两不足</div>}
                </div>
              </div>
            )
          })}
        </div>

        <p style={{ margin: 0, fontSize: 10, color: 'var(--ink-3)', lineHeight: 1.6, flexShrink: 0 }}>
          黑水晶：在背包选中后可吸取任意装备（包括已装备）的一条额外属性，永久转化为角色加成。
        </p>
      </div>
    </div>
  )
}

// ───── 签到 ─────
export function SignScreen() {
  const days = [
    { d: 1, r: '止血草×2', q: 'common', got: true },
    { d: 2, r: '白果×1', q: 'common', got: true },
    { d: 3, r: '银两+88', q: 'common', got: true },
    { d: 4, r: '七叶莲×1', q: 'rare', got: true },
    { d: 5, r: '潜能+50', q: 'rare', got: true },
    { d: 6, r: '银两+200', q: 'rare', got: true },
    { d: 7, r: '金创药×1', q: 'epic', today: true },
  ]
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="签 到" sub="DAILY"
        right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>连签 <span style={{ color: 'var(--vermilion)', fontWeight: 700 }}>7</span> 天</span>}
      />
      <div style={{ position: 'absolute', inset: '60px 22px 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map((s) => (
            <div key={s.d} style={{
              position: 'relative', padding: '10px 4px',
              background: s.today ? 'linear-gradient(180deg, #fff8ea 0%, var(--paper-2) 100%)' : 'var(--paper-3)',
              border: '1px solid ' + (s.today ? 'var(--vermilion)' : (s.got ? 'var(--bamboo)' : 'var(--ink-4)')),
              opacity: s.got && !s.today ? 0.7 : 1, textAlign: 'center',
              boxShadow: s.today ? '0 0 0 2px rgba(163,55,58,0.18)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', letterSpacing: 1 }}>DAY {s.d}</div>
              <div style={{ marginTop: 8 }}>
                <Seal size={28} round>{s.r[0]}</Seal>
              </div>
              <div className="brush" style={{ fontSize: 11, color: 'var(--ink)', marginTop: 4, lineHeight: 1.2 }}>{s.r}</div>
              {s.got && !s.today ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bamboo)', fontSize: 36, fontWeight: 700, textShadow: '0 0 6px rgba(106,138,122,0.5)' }}>✓</div>
              ) : null}
              {s.today ? (
                <div style={{ position: 'absolute', bottom: 3, right: 4 }}>
                  <Tag tone="vermilion" style={{ fontSize: 9, padding: '1px 5px' }}>今日</Tag>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <button className="btn-ink btn-ink-primary" style={{ padding: '12px 0', fontSize: 16, letterSpacing: '0.2em' }}>
          每 日 签 到 · 领第 7 日奖励
        </button>
        <div style={{ padding: 12, background: 'var(--paper-2)', border: '1px solid var(--ink-4)', fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.7 }}>
          <span className="brush" style={{ fontSize: 12, color: 'var(--vermilion)' }}>奖赏说明</span>：
          银两 +88 · 止血草 ×2 · 白果 ×1。连续 7 天可额外领取金创药 ×1。
        </div>
      </div>
    </div>
  )
}

// ───── 世界地图 ─────
const cities = [
  { x: 18, y: 32, name: '揽仙镇外', lv: '1-20', type: '新手', current: false },
  { x: 12, y: 58, name: '卧龙坡', lv: '1-20', type: '野外', current: false },
  { x: 26, y: 78, name: '桃柳林', lv: '1-20', type: '野外', current: false },
  { x: 38, y: 26, name: '轩辕庙', lv: '21-40', type: '副本' },
  { x: 50, y: 56, name: '十里坡', lv: '21-40', type: '野外' },
  { x: 64, y: 32, name: '五派山头', lv: '21-40', type: '门派' },
  { x: 56, y: 78, name: '五龙窟', lv: '41-60', type: '副本', current: true, hot: true },
  { x: 78, y: 50, name: '蓬莱岛', lv: '41-60', type: '野外' },
  { x: 72, y: 14, name: '百花谷', lv: '61-80', type: '副本' },
  { x: 88, y: 72, name: '绝人阵', lv: '61-100', type: '禁地' },
]

const CityMarker = ({ city }) => {
  const isCurrent = city.current
  const typeColor = { 新手: 'var(--bamboo)', 野外: 'var(--gold-2)', 副本: 'var(--vermilion)', 门派: 'var(--ink-2)', 禁地: 'var(--ink)' }[city.type] || 'var(--ink)'
  return (
    <div style={{ position: 'absolute', left: city.x + '%', top: city.y + '%', transform: 'translate(-50%, -100%)', zIndex: isCurrent ? 5 : 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="brush" style={{ fontSize: isCurrent ? 16 : 13, color: typeColor, textShadow: '0 1px 0 var(--paper), 1px 1px 0 var(--paper)', whiteSpace: 'nowrap' }}>
          {city.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-3)', marginBottom: 4 }}>
          {city.type} · {city.lv}
        </div>
        <div style={{
          width: isCurrent ? 14 : 10, height: isCurrent ? 14 : 10,
          background: typeColor, border: '1.5px solid var(--paper)',
          boxShadow: '0 2px 3px rgba(0,0,0,0.3), 0 0 0 1px ' + typeColor,
          transform: 'rotate(45deg)', position: 'relative',
        }}>
          {isCurrent ? (
            <div style={{ position: 'absolute', inset: -10, border: '1.5px solid var(--vermilion)', animation: 'pulse2 1.6s ease-in-out infinite', borderRadius: 2 }} />
          ) : null}
        </div>
        {city.hot ? <div style={{ position: 'absolute', top: -6, right: -16 }}><Seal size={16} round style={{ fontSize: 8 }}>新</Seal></div> : null}
      </div>
    </div>
  )
}

export function WorldMapScreen() {
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'var(--font-body)' }}>
      <PanelHead title="行游天下" sub="WORLD · 地图"
        right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)' }}>已发现 <span style={{ color: 'var(--vermilion)', fontWeight: 700 }}>10</span> / 20</span>}
      />
      <div style={{ position: 'absolute', inset: '60px 20px 20px 20px', display: 'flex', gap: 14 }}>
        <div className="paper-dark scroll-frame" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <svg viewBox="0 0 1000 600" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}>
            <path d="M 80 80 Q 200 50 380 90 Q 540 130 700 100 Q 850 80 920 140 Q 970 250 920 380 Q 870 480 740 510 Q 540 540 380 520 Q 200 500 110 420 Q 70 310 80 200 Z" fill="none" stroke="#5a4a38" strokeWidth="1.4" strokeDasharray="2 3" opacity="0.6" />
            <g stroke="#3a2e22" strokeWidth="1.4" fill="none">
              <path d="M 200 200 L 240 160 L 280 200 L 320 170 L 360 210" />
              <path d="M 480 130 L 520 90 L 555 130 L 600 110" />
              <path d="M 700 280 L 740 240 L 780 280 L 820 260" />
              <path d="M 300 420 L 340 380 L 380 420 L 420 400" />
            </g>
            <path d="M 150 240 Q 280 320 420 300 Q 560 280 720 350 Q 840 400 880 420" fill="none" stroke="#7a8a9c" strokeWidth="2.5" opacity="0.5" />
          </svg>
          <div className="vertical brush" style={{ position: 'absolute', left: '8%', top: '6%', fontSize: 22, color: 'var(--ink-3)', letterSpacing: '0.35em' }}>中原</div>
          <div className="vertical brush" style={{ position: 'absolute', left: '48%', top: '8%', fontSize: 22, color: 'var(--ink-3)', letterSpacing: '0.35em' }}>西域</div>
          <div className="vertical brush" style={{ position: 'absolute', left: '82%', top: '10%', fontSize: 22, color: 'var(--ink-3)', letterSpacing: '0.35em' }}>东海</div>
          {cities.map((c, i) => <CityMarker key={i} city={c} />)}
        </div>
        <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="paper-bg scroll-frame" style={{ padding: 14, position: 'relative' }}>
            <CornerDeco />
            <SubHead title="当前位置" sub="LOCATION" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Seal size={32}>窟</Seal>
              <div>
                <div className="brush" style={{ fontSize: 18 }}>五龙窟（一层）</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-3)' }}>Lv 41-60 · 副本 · 核心练级区</div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.7 }}>
              五龙窟一至五层皆为五龙盘踞，出没五行属性各异之龙；中层时常有 BOSS「百年狂狮怪」现身。
            </div>
          </div>
          <div className="paper-bg scroll-frame" style={{ padding: 14, position: 'relative', flex: 1 }}>
            <CornerDeco />
            <SubHead title="本图出没" sub="SPAWNS · 共 10 种" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              {[
                { n: '乌龙', lv: 42, e: '水' }, { n: '花妖', lv: 42, e: '木' },
                { n: '炎龙', lv: 45, e: '火' }, { n: '鱼人', lv: 45, e: '水' },
                { n: '冰龙', lv: 48, e: '水' }, { n: '地裂兽', lv: 48, e: '土' },
                { n: '青龙', lv: 51, e: '木' }, { n: '金头陀', lv: 51, e: '金' },
                { n: '黄龙', lv: 54, e: '土' }, { n: '火鸦', lv: 54, e: '火' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px', borderBottom: i < 9 ? '1px dashed var(--ink-4)' : 'none' }}>
                  <Seal size={12} round school={s.e} style={{ fontSize: 7 }}>{s.e}</Seal>
                  <span style={{ fontFamily: 'var(--font-body)', color: 'var(--ink-2)', fontSize: 12 }}>{s.n}</span>
                  <span style={{ flex: 1 }} />
                  <span style={{ color: 'var(--ink-3)' }}>Lv {s.lv}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-ink" style={{ flex: 1 }}>切换地图</button>
            <button className="btn-ink btn-ink-primary" style={{ flex: 1 }}>立 即 开 战</button>
          </div>
        </div>
      </div>
    </div>
  )
}
